"""Pydantic schemas shared by the API, the pipeline and the LLM output validators.

Every LLM response is parsed into one of these models; a response that fails validation is
treated as a failed step (with one automatic repair attempt) instead of being stored.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

MAX_LESSON_MINUTES = 45

Severity = Literal["critical", "high", "medium", "low"]
Verdict = Literal["passed", "passed_with_recommendations", "needs_revision"]
IssueStatus = Literal["open", "applied", "rejected", "conflict"]


# --------------------------------------------------------------------------- inputs
class LessonSettings(BaseModel):
    audience: str = "Beginner learners"
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    teaching_style: Literal["balanced", "conversational", "socratic", "hands-on"] = "balanced"
    lesson_format: Literal["self-paced", "instructor-led"] = "self-paced"


class CreateLessonRequest(BaseModel):
    title: str = Field(default="", max_length=200)
    objective: str = Field(default="", max_length=1000)
    settings: LessonSettings = LessonSettings()
    demo: bool = False

    @field_validator("title", "objective")
    @classmethod
    def strip(cls, v: str) -> str:
        return (v or "").strip()


# --------------------------------------------------------------------------- research
SourceType = Literal["standard", "documentation", "website", "encyclopedia", "book", "video", "academic"]


class Source(BaseModel):
    id: str                                   # "S1", "S2", ... stable within a lesson
    title: str
    url: str
    source_type: SourceType
    author: Optional[str] = None
    publisher: Optional[str] = None
    published: Optional[str] = None
    description: str = ""
    relevance: float = 0.0                    # 0..1, computed from term overlap with the objective
    relevance_note: str = ""
    reliability: Literal["high", "medium", "low"] = "medium"
    reliability_note: str = ""
    # verified   = we fetched the page / got the record from an authoritative API
    # unverified = metadata came from a search snippet only; content not retrieved
    # failed     = URL could not be retrieved
    status: Literal["verified", "unverified", "failed"] = "unverified"
    verification_note: str = ""
    provider: str = ""                        # duckduckgo / tavily / openlibrary / youtube_api / ...
    # video-only
    video_id: Optional[str] = None
    channel: Optional[str] = None
    duration: Optional[str] = None
    thumbnail: Optional[str] = None
    # book-only
    isbn: Optional[str] = None


class EvidenceChunk(BaseModel):
    source_id: str
    text: str


class ResearchBundle(BaseModel):
    queries: list[str] = []
    sources: list[Source] = []
    evidence: list[EvidenceChunk] = []
    notes: list[str] = []                     # provider failures, offline mode, etc.
    demo: bool = False


# --------------------------------------------------------------------------- objective analysis
class ObjectiveAnalysis(BaseModel):
    topic_summary: str
    key_concepts: list[str]
    objective_parts: list[str] = Field(description="The objective split into individually assessable parts")
    bloom_verbs: list[str] = []
    expected_facts: list[str] = []
    search_queries: list[str]
    book_queries: list[str] = []
    video_queries: list[str] = []
    authoritative_urls: list[str] = Field(default=[], description="Canonical docs/specs to verify by fetching")


# --------------------------------------------------------------------------- lesson content
SectionKind = Literal[
    "introduction", "prerequisites", "concepts", "examples", "applications",
    "activity", "knowledge_check", "summary", "custom",
]


class Section(BaseModel):
    id: str
    kind: SectionKind = "custom"
    title: str
    minutes: int = Field(ge=0, le=MAX_LESSON_MINUTES)
    content: str = ""                         # Markdown


class KnowledgeCheck(BaseModel):
    id: str
    question: str
    type: Literal["mcq", "true_false", "short_answer"] = "mcq"
    options: list[str] = []
    answer: str
    explanation: str = ""
    objective_part: str = ""


class ResourceLink(BaseModel):
    title: str
    url: str
    note: str = ""
    source_id: Optional[str] = None


class LessonContent(BaseModel):
    title: str
    objective: str
    overview: str
    learning_objectives: list[str]
    audience: str = ""
    difficulty: str = ""
    sections: list[Section]
    knowledge_checks: list[KnowledgeCheck] = []
    videos: list[ResourceLink] = []
    references: list[ResourceLink] = []

    @property
    def total_minutes(self) -> int:
        return sum(s.minutes for s in self.sections)


# --------------------------------------------------------------------------- QC
class QCIssue(BaseModel):
    id: str
    severity: Severity
    category: str
    section_id: Optional[str] = None
    location: str = ""
    problem: str
    why: str = ""
    evidence: str = ""
    source_ids: list[str] = []
    original_text: str = ""                   # exact snippet to replace ("" = insertion)
    suggested_text: str = ""
    status: IssueStatus = "open"
    status_note: str = ""


class ClaimCheck(BaseModel):
    id: str
    claim: str
    section_id: Optional[str] = None
    verdict: Literal["supported", "partially_supported", "unsupported", "contradicted"]
    evidence_quote: str = ""
    source_ids: list[str] = []
    note: str = ""


class SourceAssessment(BaseModel):
    source_id: str
    title: str
    reliability: str
    relevance: float
    status: str
    cited_in_lesson: bool
    note: str = ""


class ScoreLine(BaseModel):
    label: str
    value: float
    weight: Optional[float] = None
    detail: str = ""


class FactualReport(BaseModel):
    layer: Literal["factual"] = "factual"
    score: int
    verdict: Verdict
    summary: str
    methodology: str
    score_breakdown: list[ScoreLine]
    claims: list[ClaimCheck]
    source_assessment: list[SourceAssessment]
    issues: list[QCIssue]
    research_gaps: list[str] = []
    generated_at: str = ""
    lesson_revision: int = 0
    provider: str = ""
    demo: bool = False


class RubricItem(BaseModel):
    criterion: str
    score: int = Field(ge=0, le=10)
    note: str = ""


class ObjectiveCoverage(BaseModel):
    objective_part: str
    coverage: Literal["full", "partial", "missing"]
    where: str = ""
    note: str = ""


class TimingAnalysis(BaseModel):
    total_minutes: int
    limit_minutes: int = MAX_LESSON_MINUTES
    compliant: bool
    per_section: list[ScoreLine] = []
    note: str = ""


class InstructionalReport(BaseModel):
    layer: Literal["instructional"] = "instructional"
    score: int
    verdict: Verdict
    summary: str
    methodology: str
    rubric: list[RubricItem]
    objective_coverage: list[ObjectiveCoverage]
    clarity: str = ""
    example_quality: str = ""
    activity_quality: str = ""
    assessment_quality: str = ""
    missing_concepts: list[str] = []
    restructuring: list[str] = []
    timing: TimingAnalysis
    issues: list[QCIssue]
    generated_at: str = ""
    lesson_revision: int = 0
    provider: str = ""
    demo: bool = False


# --------------------------------------------------------------------------- pipeline
StepStatus = Literal["pending", "running", "done", "failed", "skipped"]


class PipelineStep(BaseModel):
    key: str
    label: str
    status: StepStatus = "pending"
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    detail: str = ""
    error: str = ""


class PipelineState(BaseModel):
    status: Literal["idle", "running", "done", "failed"] = "idle"
    steps: list[PipelineStep] = []
