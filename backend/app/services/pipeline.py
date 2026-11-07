"""The 7-step lesson workflow, run in a background thread with every step's status persisted.

Progress shown in the UI is exactly this persisted state - a step turns "done" only after its output
has been saved. Each step reads its inputs from the database, so a failed step can be retried on its
own without redoing (or losing) the steps before it.

Failure policy
- analyze / research / generate failures stop the run (later steps need their output).
- A QC failure does not block the other QC layer or finalisation: the lesson stays editable and the
  failed layer can be retried independently.
- Nothing already saved is ever deleted by a failed step.
"""
from __future__ import annotations

import logging
import threading
import time
import traceback
from typing import Callable

from .. import db
from ..demo import fixtures as demo
from ..llm.base import LLMError
from ..llm.factory import get_provider
from ..llm.json_utils import generate_json
from ..models import (LessonContent, ObjectiveAnalysis, PipelineState, PipelineStep, ResearchBundle)
from ..prompts import analysis as analysis_prompt
from ..prompts import generation as generation_prompt
from ..research import service as research
from . import qc_factual, qc_instructional
from .timing import enforce_limit

log = logging.getLogger("learnora.pipeline")

STEPS = [
    ("analyze", "Understanding learning objective"),
    ("research", "Researching trusted resources"),
    ("analyze_research", "Analyzing research materials"),
    ("generate", "Generating lesson content"),
    ("qc_factual", "Running factual accuracy QC"),
    ("qc_instructional", "Running instructional quality QC"),
    ("finalize", "Preparing final lesson"),
]
BLOCKING = {"analyze", "research", "analyze_research", "generate"}

_running: set[str] = set()
_running_lock = threading.Lock()


def new_pipeline() -> dict:
    return PipelineState(status="idle", steps=[PipelineStep(key=k, label=l) for k, l in STEPS]).model_dump()


def is_running(lesson_id: str) -> bool:
    return lesson_id in _running


def _set_step(lesson_id: str, key: str, **changes) -> None:
    lesson = db.get_lesson(lesson_id)
    state = PipelineState(**lesson["pipeline"])
    for s in state.steps:
        if s.key == key:
            for k, v in changes.items():
                setattr(s, k, v)
    db.update_fields(lesson_id, pipeline=state)


def _set_status(lesson_id: str, status: str) -> None:
    lesson = db.get_lesson(lesson_id)
    state = PipelineState(**lesson["pipeline"])
    state.status = status
    db.update_fields(lesson_id, pipeline=state)


# --------------------------------------------------------------------------- step implementations
def _step_analyze(lesson: dict, progress: Callable[[str], None]) -> str:
    if lesson["demo"]:
        a = demo.load(lesson["title"], lesson["objective"])["analysis"]
        db.update_fields(lesson["id"], analysis=a)
        return "Loaded sample objective analysis (demo mode)"
    a = generate_json(get_provider(), analysis_prompt.SYSTEM,
                      analysis_prompt.user(lesson["title"], lesson["objective"], lesson["settings"]),
                      ObjectiveAnalysis, max_tokens=8000)
    db.update_fields(lesson["id"], analysis=a)
    return f"{len(a.key_concepts)} key concepts, {len(a.objective_parts)} objective parts, {len(a.search_queries)} search queries"


def _step_research(lesson: dict, progress) -> str:
    if lesson["demo"]:
        return "Skipped live search - demo mode uses recorded sample research"
    a = ObjectiveAnalysis(**lesson["analysis"])
    raw = research.collect_candidates(lesson["title"], lesson["objective"], a, progress)
    db.update_fields(lesson["id"], research={"raw": raw})
    detail = f"{len(raw['web'])} web, {len(raw['books'])} book and {len(raw['videos'])} video candidates"
    return detail + (f" ({len(raw['notes'])} provider warnings)" if raw["notes"] else "")


def _step_analyze_research(lesson: dict, progress) -> str:
    if lesson["demo"]:
        bundle = ResearchBundle(**demo.load(lesson["title"], lesson["objective"])["research"])
        bundle.demo = True
    else:
        raw = (lesson.get("research") or {}).get("raw")
        if not raw:
            raise RuntimeError("No research candidates saved - retry the research step first.")
        bundle = research.analyze_candidates(lesson["title"], lesson["objective"],
                                             ObjectiveAnalysis(**lesson["analysis"]), raw, progress)
        if not bundle.sources:
            raise RuntimeError("Research produced no usable sources. " + "; ".join(bundle.notes[:3]))
    db.update_fields(lesson["id"], research=bundle)
    kinds = {}
    for s in bundle.sources:
        kinds[s.source_type] = kinds.get(s.source_type, 0) + 1
    verified = sum(1 for s in bundle.sources if s.status == "verified")
    return (f"{len(bundle.sources)} sources ({verified} verified): "
            + ", ".join(f"{v} {k}" for k, v in kinds.items()) + f"; {len(bundle.evidence)} evidence passages")


def _step_generate(lesson: dict, progress) -> str:
    if lesson.get("content"):
        db.snapshot(lesson["id"], "Before regeneration")
    if lesson["demo"]:
        content = LessonContent(**demo.load(lesson["title"], lesson["objective"])["content"])
        note = "Loaded sample lesson (demo mode)"
    else:
        a = ObjectiveAnalysis(**lesson["analysis"])
        bundle = ResearchBundle(**lesson["research"])
        pack = research.evidence_pack(bundle, " ".join([lesson["objective"]] + a.key_concepts + a.expected_facts),
                                      per_source=5, max_total=40)
        progress(f"Writing lesson from {len(pack)} evidence passages")
        content = generate_json(get_provider(), generation_prompt.SYSTEM, generation_prompt.user(
            lesson["title"], lesson["objective"], lesson["settings"], a, bundle.sources, pack), LessonContent)
        content.objective = lesson["objective"]
        note = ""
    content, timing_note = enforce_limit(content)
    db.update_fields(lesson["id"], content=content, revision=lesson["revision"] + 1, edited_by_instructor=0)
    db.snapshot(lesson["id"], "Generated by AI")
    return " ".join(x for x in [note, f"{len(content.sections)} sections, {len(content.knowledge_checks)} questions, "
                                f"{content.total_minutes} minutes.", timing_note] if x)


def _content_and_inputs(lesson: dict):
    if not lesson.get("content"):
        raise RuntimeError("No lesson content to review - generate the lesson first.")
    content = LessonContent(**lesson["content"])
    analysis = ObjectiveAnalysis(**lesson["analysis"]) if lesson.get("analysis") else None
    return content, analysis


def _step_qc_factual(lesson: dict, progress) -> str:
    if lesson["demo"] and not lesson["edited_by_instructor"]:
        report = demo.load(lesson["title"], lesson["objective"])["qc_factual"]
        report["demo"] = True
        report["lesson_revision"] = lesson["revision"]
        db.update_fields(lesson["id"], qc_factual=report)
        return f"Loaded sample factual report (demo mode): score {report['score']}"
    content, analysis = _content_and_inputs(lesson)
    bundle = ResearchBundle(**(lesson.get("research") or {}))
    report = qc_factual.run(get_provider(), content, bundle, analysis, lesson["revision"])
    db.update_fields(lesson["id"], qc_factual=report)
    return f"Score {report.score}/100, {len(report.claims)} claims checked, {len(report.issues)} issues"


def _step_qc_instructional(lesson: dict, progress) -> str:
    if lesson["demo"] and not lesson["edited_by_instructor"]:
        report = demo.load(lesson["title"], lesson["objective"])["qc_instructional"]
        report["demo"] = True
        report["lesson_revision"] = lesson["revision"]
        db.update_fields(lesson["id"], qc_instructional=report)
        return f"Loaded sample instructional report (demo mode): score {report['score']}"
    content, analysis = _content_and_inputs(lesson)
    report = qc_instructional.run(get_provider(), content, analysis, lesson["revision"])
    db.update_fields(lesson["id"], qc_instructional=report)
    return f"Score {report.score}/100, {len(report.issues)} issues"


def _step_finalize(lesson: dict, progress) -> str:
    db.update_fields(lesson["id"], status="review")
    return "Lesson saved and ready for instructor review"


RUNNERS = {
    "analyze": _step_analyze, "research": _step_research, "analyze_research": _step_analyze_research,
    "generate": _step_generate, "qc_factual": _step_qc_factual, "qc_instructional": _step_qc_instructional,
    "finalize": _step_finalize,
}


# --------------------------------------------------------------------------- orchestration
def _run_step(lesson_id: str, key: str) -> bool:
    _set_step(lesson_id, key, status="running", started_at=db.now(), finished_at=None, error="", detail="")

    def progress(msg: str) -> None:
        _set_step(lesson_id, key, detail=msg)

    try:
        lesson = db.get_lesson(lesson_id)
        if lesson["demo"]:
            time.sleep(0.5)  # demo mode only: keeps the clearly-labelled sample run visible in the UI
        detail = RUNNERS[key](lesson, progress)
        _set_step(lesson_id, key, status="done", finished_at=db.now(), detail=detail)
        db.log_event(lesson_id, key, "info", detail)
        return True
    except Exception as e:
        msg = str(e) if isinstance(e, (LLMError, RuntimeError)) else f"{type(e).__name__}: {e}"
        log.error("Step %s failed for %s: %s", key, lesson_id, msg)
        db.log_event(lesson_id, key, "error", f"{msg}\n{traceback.format_exc()[-1500:]}")
        _set_step(lesson_id, key, status="failed", finished_at=db.now(), error=msg[:600])
        return False


def _run(lesson_id: str, keys: list[str]) -> None:
    try:
        _set_status(lesson_id, "running")
        ok_all = True
        for key in keys:
            ok = _run_step(lesson_id, key)
            ok_all &= ok
            if not ok and key in BLOCKING:
                lesson = db.get_lesson(lesson_id)
                db.update_fields(lesson_id, status="review" if lesson.get("content") else "failed")
                break
        _set_status(lesson_id, "done" if ok_all else "failed")
    finally:
        with _running_lock:
            _running.discard(lesson_id)


def start(lesson_id: str, keys: list[str] | None = None) -> bool:
    """Start (or resume) steps in a background thread. Returns False if already running."""
    with _running_lock:
        if lesson_id in _running:
            return False
        _running.add(lesson_id)
    if keys is None:
        keys = [k for k, _ in STEPS]
    threading.Thread(target=_run, args=(lesson_id, keys), daemon=True).start()
    return True


def resume_keys(lesson: dict) -> list[str]:
    """Steps to run when retrying: the first non-done step onwards (QC layers re-run only if not done)."""
    steps = PipelineState(**lesson["pipeline"]).steps
    keys = [s.key for s in steps if s.status != "done"]
    if keys and keys[-1] != "finalize":
        keys.append("finalize")
    return keys


def recover_interrupted() -> None:
    """On server start, mark steps left 'running' by a previous crash as failed so they can be retried."""
    for lesson in db.list_lessons():
        state = PipelineState(**(lesson.get("pipeline") or new_pipeline()))
        changed = False
        for s in state.steps:
            if s.status == "running":
                s.status, s.error, changed = "failed", "Interrupted (server restarted) - retry this step.", True
        if changed:
            state.status = "failed"
            db.update_fields(lesson["id"], pipeline=state,
                             status="review" if lesson.get("content") else "failed")
