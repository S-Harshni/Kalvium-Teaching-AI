"""QC Layer 2 - Instructional Quality.

Independent of Layer 1: separate prompt, separate LLM call, no access to research evidence or to the
factual report. The model scores a 10-criterion rubric (0-10 each); code then overrides the
"45-minute time compliance" criterion when the arithmetic fails, and adds deterministic structure checks.

  score = sum of the 10 rubric scores (0-100)

Verdict: needs revision if any critical issue, any objective part "missing", the time limit is
exceeded, or score < 70; passed if score >= 85 with no high-severity issue; otherwise passed with
recommendations.
"""
from __future__ import annotations

from pydantic import BaseModel

from ..db import now
from ..llm.base import LLMProvider
from ..llm.json_utils import generate_json
from ..models import (InstructionalReport, LessonContent, MAX_LESSON_MINUTES, ObjectiveAnalysis,
                      ObjectiveCoverage, QCIssue, RubricItem, ScoreLine, TimingAnalysis)
from ..prompts import qc_instructional as prompts
from ..research.text import tokens
from .lesson_text import to_markdown

REQUIRED_KINDS = {
    "introduction": "Introduction and motivation", "prerequisites": "Prerequisite knowledge",
    "concepts": "Concept explanations", "examples": "Step-by-step examples", "activity": "Practical activity",
    "knowledge_check": "Knowledge check", "summary": "Summary and key takeaways",
}

METHODOLOGY = (
    "Score = sum of ten rubric criteria scored 0-10 by an independent instructional-design review: "
    + ", ".join(prompts.CRITERIA) + ". The time-compliance criterion is forced to 0 by code when section "
    "minutes exceed 45. Deterministic checks add issues for missing required sections, fewer than 4 knowledge "
    "checks, or objective parts with no knowledge check. Verdict: 'Needs revision' if any critical issue, any "
    "objective part not covered, the 45-minute limit is exceeded, or score < 70; 'Passed' if score >= 85 and no "
    "high-severity issue; otherwise 'Passed with recommendations'."
)


class _IssueOut(BaseModel):
    severity: str
    category: str = "clarity"
    section_id: str | None = None
    location: str = ""
    problem: str
    why: str = ""
    original_text: str = ""
    suggested_text: str = ""


class _Out(BaseModel):
    rubric: list[RubricItem]
    objective_coverage: list[ObjectiveCoverage] = []
    clarity: str = ""
    example_quality: str = ""
    activity_quality: str = ""
    assessment_quality: str = ""
    missing_concepts: list[str] = []
    restructuring: list[str] = []
    issues: list[_IssueOut] = []
    summary: str = ""


def _sev(s: str) -> str:
    s = (s or "").lower()
    return s if s in ("critical", "high", "medium", "low") else "medium"


def run(provider: LLMProvider, content: LessonContent, analysis: ObjectiveAnalysis | None,
        revision: int) -> InstructionalReport:
    total = content.total_minutes
    timing_lines = "\n".join(f"- {s.title} [{s.kind}]: {s.minutes} min" for s in content.sections)
    timing_lines += f"\nTOTAL: {total} min (limit {MAX_LESSON_MINUTES})"
    parts = analysis.objective_parts if analysis else []

    out = generate_json(provider, prompts.SYSTEM, prompts.user(
        content.objective, parts, content.audience, to_markdown(content, for_review=True), timing_lines), _Out)

    # Normalise rubric to the 10 fixed criteria in order (missing ones score 0 with a note).
    given = {r.criterion.strip().lower(): r for r in out.rubric}
    rubric = []
    for crit in prompts.CRITERIA:
        r = given.get(crit.lower()) or next((x for k, x in given.items() if crit.lower()[:12] in k), None)
        rubric.append(RubricItem(criterion=crit, score=r.score if r else 0,
                                 note=r.note if r else "Reviewer did not score this criterion."))

    compliant = total <= MAX_LESSON_MINUTES
    issues = [QCIssue(id=f"I{i}", severity=_sev(x.severity), category=x.category, section_id=x.section_id,
                      location=x.location, problem=x.problem, why=x.why, original_text=x.original_text,
                      suggested_text=x.suggested_text) for i, x in enumerate(out.issues, 1)]
    n = len(issues)

    def add(severity, category, problem, why, section_id=None, location=""):
        nonlocal n
        n += 1
        issues.append(QCIssue(id=f"I{n}", severity=severity, category=category, section_id=section_id,
                              location=location, problem=problem, why=why, evidence="Automated check"))

    if not compliant:
        rubric[-1] = RubricItem(criterion=rubric[-1].criterion, score=0,
                                note=f"Section minutes total {total}, above the {MAX_LESSON_MINUTES}-minute limit.")
        add("critical", "timing", f"Lesson totals {total} minutes; the limit is {MAX_LESSON_MINUTES}.",
            "The lesson must be completable in one 45-minute session.", location="Section timings")
    kinds = {s.kind for s in content.sections}
    for kind, label in REQUIRED_KINDS.items():
        if kind not in kinds:
            add("high", "completeness", f"Required section missing: {label}.",
                "The lesson template requires this section for a complete learning sequence.")
    if len(content.knowledge_checks) < 4:
        add("high", "assessment", f"Only {len(content.knowledge_checks)} knowledge-check questions (minimum 4).",
            "Too few questions to assess every part of the objective.", "knowledge_checks", "Knowledge check")
    if parts and content.knowledge_checks:
        assessed = set(tokens(" ".join(f"{q.objective_part} {q.question}" for q in content.knowledge_checks)))
        for p in parts:
            pt = set(tokens(p))
            if pt and len(pt & assessed) / len(pt) < 0.34:
                add("low", "assessment", f"No knowledge check is explicitly mapped to objective part: '{p}'.",
                    "Each objective part should be assessed at least once (mapping is based on question labels).",
                    "knowledge_checks", "Knowledge check")

    score = sum(r.score for r in rubric)
    missing = [c for c in out.objective_coverage if c.coverage == "missing"]
    has_critical = any(i.severity == "critical" for i in issues)
    has_high = any(i.severity == "high" for i in issues)
    if has_critical or missing or not compliant or score < 70:
        verdict = "needs_revision"
    elif score >= 85 and not has_high:
        verdict = "passed"
    else:
        verdict = "passed_with_recommendations"

    return InstructionalReport(
        score=score, verdict=verdict, summary=out.summary, methodology=METHODOLOGY, rubric=rubric,
        objective_coverage=out.objective_coverage, clarity=out.clarity, example_quality=out.example_quality,
        activity_quality=out.activity_quality, assessment_quality=out.assessment_quality,
        missing_concepts=out.missing_concepts, restructuring=out.restructuring,
        timing=TimingAnalysis(
            total_minutes=total, compliant=compliant,
            per_section=[ScoreLine(label=s.title, value=s.minutes) for s in content.sections],
            note=rubric[-1].note),
        issues=issues, generated_at=now(), lesson_revision=revision, provider=provider.describe())
