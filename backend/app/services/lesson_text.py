"""Render lesson content to Markdown (for QC prompts and exports) and inspect citations."""
from __future__ import annotations

import re

from ..models import LessonContent, MAX_LESSON_MINUTES


def cited_ids(text: str) -> set[str]:
    ids = set()
    for m in re.finditer(r"\[(S\d+(?:\s*[,;]\s*S\d+)*)\]", text):
        ids.update(x.strip() for x in re.split(r"[,;]", m.group(1)))
    return ids


def all_text(c: LessonContent) -> str:
    parts = [c.overview, *c.learning_objectives, *(s.content for s in c.sections)]
    for q in c.knowledge_checks:
        parts += [q.question, *q.options, q.answer, q.explanation]
    return "\n".join(parts)


def to_markdown(c: LessonContent, for_review: bool = False, sources: list | None = None) -> str:
    """for_review=True wraps sections in <section id=...> tags so reviewers can point at them."""
    out = [f"# {c.title}", "", f"**Learning objective:** {c.objective}", "",
           f"**Estimated duration:** {c.total_minutes} minutes (limit {MAX_LESSON_MINUTES})", ""]
    if c.audience or c.difficulty:
        out += [f"**Audience:** {c.audience}  ·  **Difficulty:** {c.difficulty}", ""]
    out += ["## Overview", "", c.overview, "", "## Learning objectives", ""]
    out += [f"- {o}" for o in c.learning_objectives] + [""]
    for s in c.sections:
        if for_review:
            out.append(f'<section id="{s.id}" kind="{s.kind}" minutes="{s.minutes}">')
        out += [f"## {s.title} ({s.minutes} min)", "", s.content.strip(), ""]
        if s.kind == "knowledge_check" and c.knowledge_checks:
            out += _questions_md(c, for_review)
        if for_review:
            out += ["</section>", ""]
    if not any(s.kind == "knowledge_check" for s in c.sections) and c.knowledge_checks:
        if for_review:
            out.append('<section id="knowledge_checks">')
        out += ["## Knowledge check", ""] + _questions_md(c, for_review)
        if for_review:
            out += ["</section>", ""]
    if c.videos:
        out += ["## Supplementary videos", ""]
        out += [f"- [{v.title}]({v.url})" + (f" — {v.note}" if v.note else "") for v in c.videos] + [""]
    if c.references:
        out += ["## References", ""]
        for r in c.references:
            tag = f"[{r.source_id}] " if r.source_id else ""
            out.append(f"- {tag}[{r.title}]({r.url})" + (f" — {r.note}" if r.note else ""))
        out.append("")
    return "\n".join(out)


def _questions_md(c: LessonContent, for_review: bool) -> list[str]:
    out = []
    for i, q in enumerate(c.knowledge_checks, 1):
        out.append(f"**Q{i}. {q.question}**" + (f" _(id: {q.id})_" if for_review else ""))
        out.append("")
        out += [f"- {o}" for o in q.options]
        out += ["", f"<details><summary>Answer</summary>\n\n**{q.answer}** — {q.explanation}\n\n</details>", ""]
    return out
