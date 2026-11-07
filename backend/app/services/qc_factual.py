"""QC Layer 1 - Research & Factual Accuracy.

Combines LLM judgement (claim verification against retrieved evidence) with deterministic checks
(source reliability, citation validity, citation coverage). The score is computed in code from those
measurements, never asked from the model, so it is reproducible and explainable:

  score = 0.5 * ClaimSupport + 0.3 * SourceQuality + 0.2 * CitationCoverage - IssuePenalty

  ClaimSupport      % of extracted claims supported by retrieved evidence (partial = half credit)
  SourceQuality     mean reliability of the verified sources the lesson actually cites
                    (high = 100, medium = 60, low = 25)
  CitationCoverage  % of teaching sections that cite at least one valid source
  IssuePenalty      critical 15, high 8, medium 3, low 1 per open issue (capped at 40)

Verdict: needs revision if any critical issue, any contradicted claim, or score < 70;
passed if score >= 85 with no high-severity issue; otherwise passed with recommendations.
"""
from __future__ import annotations

from pydantic import BaseModel

from ..db import now
from ..llm.base import LLMProvider
from ..llm.json_utils import generate_json
from ..models import (ClaimCheck, FactualReport, LessonContent, ObjectiveAnalysis, QCIssue,
                      ResearchBundle, ScoreLine, SourceAssessment)
from ..prompts import qc_factual as prompts
from ..research.reliability import TIER_SCORE
from ..research.text import BM25
from .lesson_text import cited_ids, to_markdown

PENALTY = {"critical": 15, "high": 8, "medium": 3, "low": 1}
TEACHING_KINDS = {"introduction", "concepts", "examples", "applications"}

METHODOLOGY = (
    "Score = 0.5 x Claim support + 0.3 x Source quality + 0.2 x Citation coverage - Issue penalty. "
    "Claim support: share of extracted factual claims backed by evidence retrieved from verified sources "
    "(partially supported = half credit). Source quality: mean reliability of verified sources cited in the "
    "lesson (high 100 / medium 60 / low 25, rule-based by publisher). Citation coverage: share of teaching "
    "sections with at least one valid citation. Issue penalty: critical 15, high 8, medium 3, low 1 per open "
    "issue, capped at 40. Verdict: 'Needs revision' if any critical issue, any contradicted claim, or score < 70; "
    "'Passed' if score >= 85 and no high-severity issue; otherwise 'Passed with recommendations'."
)


class _Claim(BaseModel):
    id: str
    claim: str
    section_id: str | None = None
    quote: str = ""


class _ClaimsOut(BaseModel):
    claims: list[_Claim]


class _VerifiedClaim(BaseModel):
    id: str
    verdict: str
    evidence_quote: str = ""
    source_ids: list[str] = []
    note: str = ""


class _IssueOut(BaseModel):
    severity: str
    category: str = "factual_error"
    section_id: str | None = None
    location: str = ""
    problem: str
    why: str = ""
    evidence: str = ""
    source_ids: list[str] = []
    original_text: str = ""
    suggested_text: str = ""


class _VerifyOut(BaseModel):
    claims: list[_VerifiedClaim]
    issues: list[_IssueOut] = []
    research_gaps: list[str] = []
    summary: str = ""


def _sev(s: str) -> str:
    s = (s or "").lower()
    return s if s in PENALTY else "medium"


def run(provider: LLMProvider, content: LessonContent, research: ResearchBundle,
        analysis: ObjectiveAnalysis | None, revision: int) -> FactualReport:
    lesson_md = to_markdown(content, for_review=True)
    sources = {s.id: s for s in research.sources}

    # ---- 1. claim extraction (LLM)
    claims = generate_json(provider, prompts.CLAIMS_SYSTEM, prompts.claims_user(lesson_md), _ClaimsOut).claims[:25]

    # ---- 2. evidence retrieval per claim (deterministic BM25 over the research evidence store)
    # Global top-3 passages, plus the best passage from each source the sentence itself cites, so a
    # citation is always judged against that source's most relevant text (not only global winners).
    bm = BM25([e.text for e in research.evidence]) if research.evidence else None
    by_source: dict[str, list[int]] = {}
    for i, e in enumerate(research.evidence):
        by_source.setdefault(e.source_id, []).append(i)
    source_bm: dict[str, BM25] = {}
    blocks = []
    for c in claims:
        lines = [f'<claim id="{c.id}" section="{c.section_id}">{c.claim}</claim>']
        picked = [i for i, _ in bm.top(c.claim, k=3)] if bm else []
        for sid in sorted(cited_ids(c.quote) & set(by_source)):
            idx = by_source[sid]
            if sid not in source_bm:
                source_bm[sid] = BM25([research.evidence[i].text for i in idx])
            best = source_bm[sid].top(f"{c.claim} {c.quote}", k=1)
            if best and idx[best[0][0]] not in picked:
                picked.append(idx[best[0][0]])
        if not picked:
            lines.append("<evidence>(no relevant passage retrieved)</evidence>")
        for i in picked:
            e = research.evidence[i]
            lines.append(f'<evidence source="{e.source_id}">{e.text[:900]}</evidence>')
        blocks.append("\n".join(lines))
    source_lines = "\n".join(
        f"[{s.id}] {s.title} | {s.source_type} | reliability={s.reliability} | status={s.status} | {s.url}"
        for s in research.sources)

    # ---- 3. verification + issue audit (LLM)
    out = generate_json(provider, prompts.VERIFY_SYSTEM, prompts.verify_user(
        content.objective, analysis.expected_facts if analysis else [], lesson_md, "\n\n".join(blocks),
        source_lines), _VerifyOut)

    by_id = {v.id: v for v in out.claims}
    valid_verdicts = {"supported", "partially_supported", "unsupported", "contradicted"}
    checks: list[ClaimCheck] = []
    for c in claims:
        v = by_id.get(c.id)
        verdict = v.verdict if v and v.verdict in valid_verdicts else "unsupported"
        checks.append(ClaimCheck(
            id=c.id, claim=c.claim, section_id=c.section_id, verdict=verdict,
            evidence_quote=v.evidence_quote if v else "",
            source_ids=[s for s in (v.source_ids if v else []) if s in sources],
            note=v.note if v else "Verifier returned no verdict for this claim."))

    issues = [QCIssue(id=f"F{i}", severity=_sev(x.severity), category=x.category, section_id=x.section_id,
                      location=x.location, problem=x.problem, why=x.why, evidence=x.evidence,
                      source_ids=[s for s in x.source_ids if s in sources], original_text=x.original_text,
                      suggested_text=x.suggested_text)
              for i, x in enumerate(out.issues, 1)]

    # ---- 4. deterministic citation checks
    cited = set()
    for s in content.sections:
        cited |= cited_ids(s.content)
    for q in content.knowledge_checks:
        cited |= cited_ids(q.explanation)
    n = len(issues)
    for sid in sorted(cited - set(sources), key=lambda x: int(x[1:])):
        n += 1
        issues.append(QCIssue(
            id=f"F{n}", severity="high", category="wrong_citation", location="Citations",
            problem=f"Citation [{sid}] does not match any researched source.",
            why="Learners cannot follow a citation to a source that does not exist.",
            evidence="Automated check against the research source list."))
    for sid in sorted(cited & set(sources), key=lambda x: int(x[1:])):
        if sources[sid].status != "verified" or sources[sid].source_type in ("book", "video"):
            n += 1
            issues.append(QCIssue(
                id=f"F{n}", severity="low", category="wrong_citation", location="Citations",
                problem=f"[{sid}] '{sources[sid].title}' is cited as evidence but its content was not retrieved ({sources[sid].status}, {sources[sid].source_type}).",
                why="Claims should be backed by sources whose content was actually checked.",
                evidence=sources[sid].verification_note, source_ids=[sid]))
    teaching = [s for s in content.sections if s.kind in TEACHING_KINDS]
    uncited = [s for s in teaching if not (cited_ids(s.content) & set(sources))]
    for s in uncited:
        n += 1
        issues.append(QCIssue(
            id=f"F{n}", severity="medium", category="missing_citation", section_id=s.id, location=s.title,
            problem=f"Section '{s.title}' contains no citation to a researched source.",
            why="Uncited teaching content cannot be traced back to evidence.",
            evidence="Automated citation coverage check."))

    # ---- 5. score (deterministic)
    total = len(checks) or 1
    support = 100 * sum(1 if c.verdict == "supported" else 0.5 if c.verdict == "partially_supported" else 0
                        for c in checks) / total
    cited_verified = [sources[s] for s in cited & set(sources) if sources[s].status == "verified"]
    src_quality = 100 * sum(TIER_SCORE[s.reliability] for s in cited_verified) / len(cited_verified) if cited_verified else 0
    coverage = 100 * (len(teaching) - len(uncited)) / len(teaching) if teaching else 0
    penalty = min(40, sum(PENALTY[i.severity] for i in issues))
    score = round(max(0, min(100, 0.5 * support + 0.3 * src_quality + 0.2 * coverage - penalty)))

    counts = {v: sum(1 for c in checks if c.verdict == v) for v in valid_verdicts}
    has_critical = any(i.severity == "critical" for i in issues)
    has_high = any(i.severity == "high" for i in issues)
    if has_critical or counts["contradicted"] or score < 70:
        verdict = "needs_revision"
    elif score >= 85 and not has_high:
        verdict = "passed"
    else:
        verdict = "passed_with_recommendations"

    assessment = [SourceAssessment(
        source_id=s.id, title=s.title, reliability=s.reliability, relevance=s.relevance, status=s.status,
        cited_in_lesson=s.id in cited, note=s.reliability_note) for s in research.sources]

    return FactualReport(
        score=score, verdict=verdict, summary=out.summary, methodology=METHODOLOGY,
        score_breakdown=[
            ScoreLine(label="Claim support", value=round(support, 1), weight=0.5,
                      detail=f"{counts['supported']} supported, {counts['partially_supported']} partial, "
                             f"{counts['unsupported']} unsupported, {counts['contradicted']} contradicted of {len(checks)} claims"),
            ScoreLine(label="Source quality", value=round(src_quality, 1), weight=0.3,
                      detail=f"{len(cited_verified)} verified sources cited"),
            ScoreLine(label="Citation coverage", value=round(coverage, 1), weight=0.2,
                      detail=f"{len(teaching) - len(uncited)}/{len(teaching)} teaching sections cite a source"),
            ScoreLine(label="Issue penalty", value=-penalty, detail=f"{len(issues)} issues"),
        ],
        claims=checks, source_assessment=assessment, issues=issues, research_gaps=out.research_gaps,
        generated_at=now(), lesson_revision=revision, provider=provider.describe())
