"""FastAPI application: REST API for the Kalvium Teaching AI lesson workflow.

Interactive API docs are served at /docs (Swagger UI) - see also docs/API.md.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ValidationError

from . import db
from .config import settings
from .demo import fixtures as demo
from .export import exporters as ex
from .models import (CreateLessonRequest, FactualReport, InstructionalReport, LessonContent,
                     MAX_LESSON_MINUTES)
from .research.providers import web_search_provider
from .services import pipeline
from .services.apply import apply_issue

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("kalvium")

app = FastAPI(title="Kalvium Teaching AI API", version="1.0.0",
              description="Research-backed lesson generation with two independent QC layers.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup() -> None:
    db.init_db()
    pipeline.recover_interrupted()
    log.info("LLM provider: %s | web search: %s | DB: %s", settings.resolved_llm_provider(),
             web_search_provider(), settings.database_path)


@app.exception_handler(Exception)
async def unhandled(request, exc: Exception):
    log.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": f"Internal error: {type(exc).__name__}. Your saved work is unaffected."})


# --------------------------------------------------------------------------- helpers
def _get(lesson_id: str) -> dict:
    lesson = db.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found.")
    return lesson


def _public(lesson: dict) -> dict:
    """Lesson as sent to the browser: evidence passages are summarised (they can be large)."""
    out = dict(lesson)
    r = out.get("research") or {}
    if "raw" in r:  # research collected but not yet analysed
        out["research"] = {"sources": [], "evidence_count": 0, "notes": r["raw"].get("notes", []), "queries": r["raw"].get("queries", [])}
    elif r:
        out["research"] = {**{k: v for k, v in r.items() if k != "evidence"}, "evidence_count": len(r.get("evidence", []))}
    out["running"] = pipeline.is_running(lesson["id"])
    return out


def _summary(lesson: dict) -> dict:
    c = lesson.get("content") or {}
    return {
        "id": lesson["id"], "title": lesson["title"], "objective": lesson["objective"], "status": lesson["status"],
        "demo": lesson["demo"], "revision": lesson["revision"], "created_at": lesson["created_at"],
        "updated_at": lesson["updated_at"], "edited_by_instructor": lesson["edited_by_instructor"],
        "total_minutes": sum(s.get("minutes", 0) for s in c.get("sections", [])) if c else None,
        "pipeline_status": (lesson.get("pipeline") or {}).get("status"),
        "qc_factual": {k: lesson["qc_factual"].get(k) for k in ("score", "verdict", "lesson_revision")} if lesson.get("qc_factual") else None,
        "qc_instructional": {k: lesson["qc_instructional"].get(k) for k in ("score", "verdict", "lesson_revision")} if lesson.get("qc_instructional") else None,
        "source_count": len((lesson.get("research") or {}).get("sources", [])),
        "running": pipeline.is_running(lesson["id"]),
    }


# --------------------------------------------------------------------------- status
@app.get("/api/status")
def status():
    provider = settings.resolved_llm_provider()
    return {
        "llm_provider": provider,
        "llm_model": settings.anthropic_model if provider == "anthropic" else settings.claude_cli_model if provider == "claude_cli" else None,
        "web_search": web_search_provider() if provider != "demo" else None,
        "books": "google_books" if settings.google_books_api_key else "openlibrary",
        "videos": "youtube_data_api" if settings.youtube_api_key else "youtube_public_page + oEmbed verification",
        "demo_only": provider == "demo",
        "demo_samples": demo.available(),
        "max_lesson_minutes": MAX_LESSON_MINUTES,
    }


# --------------------------------------------------------------------------- lessons
@app.get("/api/lessons")
def list_lessons():
    return [_summary(l) for l in db.list_lessons()]


@app.post("/api/lessons", status_code=201)
def create_lesson(req: CreateLessonRequest):
    errors = {}
    if not req.title:
        errors["title"] = "Lesson title is required."
    elif len(req.title) < 3:
        errors["title"] = "Lesson title must be at least 3 characters."
    if not req.objective:
        errors["objective"] = "Learning objective is required."
    elif len(req.objective.split()) < 4:
        errors["objective"] = "Describe the learning objective in at least a few words (what should learners be able to do?)."
    if errors:
        raise HTTPException(422, {"message": "Please fix the highlighted fields.", "fields": errors})
    use_demo = req.demo or settings.resolved_llm_provider() == "demo"
    lesson = db.create_lesson(req.title, req.objective, req.settings.model_dump(), use_demo, pipeline.new_pipeline())
    pipeline.start(lesson["id"])
    return _public(db.get_lesson(lesson["id"]))


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: str):
    return _public(_get(lesson_id))


class LessonPatch(BaseModel):
    status: str | None = None
    title: str | None = None


@app.patch("/api/lessons/{lesson_id}")
def patch_lesson(lesson_id: str, patch: LessonPatch):
    _get(lesson_id)
    fields = {}
    if patch.status:
        if patch.status not in ("review", "finalized"):
            raise HTTPException(422, "Status must be 'review' or 'finalized'.")
        fields["status"] = patch.status
    if patch.title is not None:
        if len(patch.title.strip()) < 3:
            raise HTTPException(422, "Title must be at least 3 characters.")
        fields["title"] = patch.title.strip()
    return _public(db.update_fields(lesson_id, **fields))


@app.delete("/api/lessons/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: str):
    _get(lesson_id)
    if pipeline.is_running(lesson_id):
        raise HTTPException(409, "Wait for the running step to finish before deleting.")
    db.delete_lesson(lesson_id)
    return Response(status_code=204)


class ContentUpdate(BaseModel):
    content: dict
    base_revision: int | None = None


@app.put("/api/lessons/{lesson_id}/content")
def save_content(lesson_id: str, body: ContentUpdate):
    """Autosave target. Accepts the whole edited lesson; validated before anything is written."""
    lesson = _get(lesson_id)
    if pipeline.is_running(lesson_id) and any(
            s["status"] == "running" and s["key"] == "generate" for s in lesson["pipeline"]["steps"]):
        raise HTTPException(409, "The lesson is being generated - edits will be possible when it finishes.")
    if body.base_revision is not None and body.base_revision != lesson["revision"]:
        raise HTTPException(409, {"message": "The lesson changed elsewhere (another tab or an applied QC fix). "
                                             "Reload to get the latest version; your unsaved text is kept in the editor.",
                                  "revision": lesson["revision"]})
    try:
        content = LessonContent(**body.content)
    except ValidationError as e:
        raise HTTPException(422, f"Lesson content is invalid: {e.errors()[0]['msg']} at {'.'.join(map(str, e.errors()[0]['loc']))}")
    if not content.sections:
        raise HTTPException(422, "A lesson needs at least one section.")
    updated = db.update_fields(lesson_id, content=content, revision=lesson["revision"] + 1, edited_by_instructor=1)
    return {"revision": updated["revision"], "updated_at": updated["updated_at"], "total_minutes": content.total_minutes}


@app.get("/api/lessons/{lesson_id}/versions")
def versions(lesson_id: str):
    _get(lesson_id)
    return db.list_versions(lesson_id)


class VersionCreate(BaseModel):
    reason: str = "Manual save"


@app.post("/api/lessons/{lesson_id}/versions", status_code=201)
def save_version(lesson_id: str, body: VersionCreate):
    _get(lesson_id)
    db.snapshot(lesson_id, body.reason[:120] or "Manual save")
    return db.list_versions(lesson_id)[0]


@app.post("/api/lessons/{lesson_id}/versions/{version_id}/restore")
def restore_version(lesson_id: str, version_id: int):
    lesson = _get(lesson_id)
    v = db.get_version(lesson_id, version_id)
    if not v:
        raise HTTPException(404, "Version not found.")
    db.snapshot(lesson_id, f"Before restoring version #{version_id}")
    db.update_fields(lesson_id, content=v["content"], revision=lesson["revision"] + 1, edited_by_instructor=1)
    return _public(db.get_lesson(lesson_id))


# --------------------------------------------------------------------------- pipeline control
@app.post("/api/lessons/{lesson_id}/retry")
def retry(lesson_id: str):
    lesson = _get(lesson_id)
    keys = pipeline.resume_keys(lesson)
    if not keys or keys == ["finalize"]:
        raise HTTPException(409, "Nothing to retry - all steps completed.")
    if not pipeline.start(lesson_id, keys):
        raise HTTPException(409, "A step is already running for this lesson.")
    return _public(db.get_lesson(lesson_id))


RUNNABLE = {"analyze", "research", "analyze_research", "generate", "qc_factual", "qc_instructional"}


@app.post("/api/lessons/{lesson_id}/steps/{key}/run")
def run_step(lesson_id: str, key: str):
    """Run one step on demand: e.g. re-run a QC layer after editing, or regenerate the lesson.
    QC layers only read the lesson; they never modify instructor content."""
    lesson = _get(lesson_id)
    if key not in RUNNABLE:
        raise HTTPException(404, "Unknown step.")
    if key.startswith("qc_") and not lesson.get("content"):
        raise HTTPException(409, "Generate the lesson before running QC.")
    if key.startswith("qc_") and lesson["demo"] and lesson["edited_by_instructor"] and settings.resolved_llm_provider() == "demo":
        raise HTTPException(409, "Re-running QC on edited content needs a live AI provider (demo mode only replays recorded reports).")
    keys = [key]
    if key == "generate":  # regenerating invalidates both reports, so re-run them too
        keys += ["qc_factual", "qc_instructional"]
    if not pipeline.start(lesson_id, keys):
        raise HTTPException(409, "A step is already running for this lesson.")
    return _public(db.get_lesson(lesson_id))


@app.get("/api/lessons/{lesson_id}/events")
def events(lesson_id: str):
    _get(lesson_id)
    return db.list_events(lesson_id)


# --------------------------------------------------------------------------- QC recommendations
LAYERS = {"factual": ("qc_factual", FactualReport), "instructional": ("qc_instructional", InstructionalReport)}


class IssueAction(BaseModel):
    note: str = ""


@app.post("/api/lessons/{lesson_id}/qc/{layer}/issues/{issue_id}/{action}")
def issue_action(lesson_id: str, layer: str, issue_id: str, action: str, body: IssueAction | None = None):
    lesson = _get(lesson_id)
    if layer not in LAYERS or action not in ("apply", "reject", "reopen"):
        raise HTTPException(404, "Unknown layer or action.")
    col, model = LAYERS[layer]
    if not lesson.get(col):
        raise HTTPException(409, "This QC report has not been generated yet.")
    if pipeline.is_running(lesson_id):
        raise HTTPException(409, "Wait for the running step to finish.")
    report = model(**lesson[col])
    issue = next((i for i in report.issues if i.id == issue_id), None)
    if not issue:
        raise HTTPException(404, "Issue not found.")

    fields = {}
    if action == "apply":
        if issue.status == "applied":
            raise HTTPException(409, "Already applied.")
        content = LessonContent(**lesson["content"])
        new_content, status_, note = apply_issue(content, issue)
        issue.status, issue.status_note = status_, note
        if status_ == "applied":
            db.snapshot(lesson_id, f"Before applying {layer} QC fix {issue_id}")
            fields.update(content=new_content, revision=lesson["revision"] + 1, edited_by_instructor=1)
    elif action == "reject":
        issue.status, issue.status_note = "rejected", (body.note if body else "") or "Rejected by instructor."
    else:
        issue.status, issue.status_note = "open", ""
    fields[col] = report
    updated = db.update_fields(lesson_id, **fields)
    return {"issue": issue.model_dump(), "lesson": _public(updated)}


# --------------------------------------------------------------------------- exports
EXPORTS = {
    "lesson": ("lesson", ex.lesson_md),
    "references": ("references", ex.references_md),
    "qc-factual": ("qc-factual-report", ex.factual_md),
    "qc-instructional": ("qc-instructional-report", ex.instructional_md),
    "project": ("complete-report", ex.project_md),
}


@app.get("/api/lessons/{lesson_id}/export/{kind}")
def export(lesson_id: str, kind: str, format: str = "md"):
    lesson = _get(lesson_id)
    if not lesson.get("content"):
        raise HTTPException(409, "Nothing to export yet - the lesson has not been generated.")
    slug = re.sub(r"[^a-z0-9]+", "-", lesson["title"].lower()).strip("-")[:50]
    if kind == "data" or format == "json":
        return Response(ex.lesson_json(lesson), media_type="application/json",
                        headers={"Content-Disposition": f'attachment; filename="{slug}.json"'})
    if kind not in EXPORTS:
        raise HTTPException(404, "Unknown export.")
    if kind == "qc-factual" and not lesson.get("qc_factual") or kind == "qc-instructional" and not lesson.get("qc_instructional"):
        raise HTTPException(409, "Run this QC layer before exporting its report.")
    name, fn = EXPORTS[kind]
    try:
        text = fn(lesson)
        if format == "pdf":
            data = ex.to_pdf(text, lesson["title"])
            return Response(data, media_type="application/pdf",
                            headers={"Content-Disposition": f'attachment; filename="{slug}-{name}.pdf"'})
    except Exception as e:
        log.exception("Export failed")
        db.log_event(lesson_id, "export", "error", f"{kind}/{format}: {e}")
        raise HTTPException(500, f"Export failed ({type(e).__name__}). Try Markdown or JSON instead.")
    return Response(text, media_type="text/markdown; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{slug}-{name}.md"'})


# --------------------------------------------------------------------------- resources & reports
@app.get("/api/resources")
def resources():
    out = []
    for l in db.list_lessons():
        for s in (l.get("research") or {}).get("sources", []):
            out.append({**s, "lesson_id": l["id"], "lesson_title": l["title"], "demo": l["demo"]})
    return out


# --------------------------------------------------------------------------- frontend (production build)
DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        f = DIST / path
        return FileResponse(f if path and f.is_file() else DIST / "index.html")
