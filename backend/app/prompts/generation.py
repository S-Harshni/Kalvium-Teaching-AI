"""Prompt for step 4: synthesising the lesson from verified research evidence."""
from __future__ import annotations

import json

from ..models import EvidenceChunk, ObjectiveAnalysis, Source

SYSTEM = """You are a senior instructional designer and subject-matter expert writing a complete,
research-backed lesson that a learner can finish in 45 minutes or less (self-study or instructor-led).

Accuracy rules (most important):
- Base factual statements on the EVIDENCE passages provided. Cite them inline with the source id in
  square brackets, e.g. "GET is a safe method [S3]." Cite at least once in every teaching section.
- Only cite source ids that appear in the evidence or source list. Never invent sources, URLs,
  statistics, quotes, book titles or video titles.
- Prefer primary sources (standards, official documentation) when sources disagree, and use precise
  technical definitions (no oversimplifications that become false).
- If something is widely known but not in the evidence, state it carefully without a citation.

Instructional rules:
- Every part of the learning objective must be explicitly taught, practised and assessed.
- Beginner-friendly explanations, one helpful analogy where useful, concrete step-by-step worked
  examples, real-world applications, code blocks when relevant, and Markdown tables when comparing.
- No filler and no repetition. Use Markdown in section content (headings ###, lists, tables, code fences).
- Time budget: section minutes must add up to between 35 and 45 (never more than 45). Suggested split:
  introduction 4, prerequisites 3, core concepts 15, worked examples 8, real-world applications (part of
  concepts or 2-3 min), practical activity 7, knowledge check 5, summary 3 - adjust to the topic.

Return JSON with exactly this shape:
{
  "title": "lesson title",
  "objective": "the learning objective, verbatim",
  "overview": "3-4 sentence overview of what the learner will do and why it matters",
  "learning_objectives": ["3-5 specific, measurable objectives that together cover the stated objective"],
  "audience": "who it is for",
  "difficulty": "beginner | intermediate | advanced",
  "sections": [
    {"id": "intro", "kind": "introduction", "title": "...", "minutes": 4, "content": "markdown"},
    {"id": "prereq", "kind": "prerequisites", "title": "...", "minutes": 3, "content": "markdown"},
    {"id": "concepts", "kind": "concepts", "title": "...", "minutes": 15, "content": "markdown"},
    {"id": "examples", "kind": "examples", "title": "...", "minutes": 8, "content": "markdown"},
    {"id": "applications", "kind": "applications", "title": "...", "minutes": 2, "content": "markdown"},
    {"id": "activity", "kind": "activity", "title": "...", "minutes": 7, "content": "markdown with clear steps, expected outcome and a self-check"},
    {"id": "check", "kind": "knowledge_check", "title": "Knowledge check", "minutes": 4, "content": "one-line instruction"},
    {"id": "summary", "kind": "summary", "title": "...", "minutes": 2, "content": "markdown key takeaways"}
  ],
  "knowledge_checks": [
    {"id": "q1", "question": "...", "type": "mcq | true_false | short_answer", "options": ["A ...", "B ..."],
     "answer": "the correct option text or model answer", "explanation": "why, with citation if relevant",
     "objective_part": "which objective part this assesses"}
  ],
  "videos": [{"title": "exact video title from the source list", "url": "its url", "note": "what to watch it for", "source_id": "S#"}],
  "references": [{"title": "source title", "url": "source url", "note": "what it supports", "source_id": "S#"}]
}
You may split "concepts" into two sections (e.g. "concepts-1", "concepts-2") when the objective has two
distinct halves. Provide 5-6 knowledge checks that test understanding (not trivia), covering every
objective part. Choose 2-3 videos ONLY from the provided video sources. References must list every
source you cited, plus relevant books from the source list as further reading."""


def _source_line(s: Source) -> str:
    bits = [f"[{s.id}] {s.title}", s.source_type, f"reliability={s.reliability}", s.url]
    if s.author:
        bits.append(f"by {s.author}")
    if s.duration:
        bits.append(f"duration {s.duration}")
    if s.status != "verified":
        bits.append("UNVERIFIED (do not cite)")
    return " | ".join(bits)


def user(title: str, objective: str, settings: dict, analysis: ObjectiveAnalysis,
         sources: list[Source], evidence: list[EvidenceChunk]) -> str:
    ev = "\n\n".join(f"<evidence source=\"{e.source_id}\">\n{e.text}\n</evidence>" for e in evidence)
    src = "\n".join(_source_line(s) for s in sources)
    return f"""Lesson title: {title}
Learning objective: {objective}
Audience: {settings.get('audience')} | Difficulty: {settings.get('difficulty')} | Teaching style: {settings.get('teaching_style')} | Format: {settings.get('lesson_format')}

Objective analysis:
{json.dumps(analysis.model_dump(include={'key_concepts', 'objective_parts', 'expected_facts'}), indent=1)}

SOURCE LIST:
{src}

EVIDENCE PASSAGES (retrieved from the verified sources above):
{ev}"""
