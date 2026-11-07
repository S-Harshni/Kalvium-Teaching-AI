"""Apply a single QC recommendation to the lesson without disturbing anything else.

A recommendation carries the exact `original_text` it wants to replace. We look for that snippet in
the *current* lesson (which may contain instructor edits made after the QC run):
  - found      -> replace only that snippet; every other character of the lesson is untouched
  - not found  -> the instructor has changed that passage since QC ran; report a conflict and let the
                  instructor copy the suggestion manually instead of guessing where it goes
  - empty original_text -> an addition, appended to the end of the target section
"""
from __future__ import annotations

import re

from ..models import LessonContent, QCIssue


def _find(haystack: str, needle: str) -> tuple[int, int] | None:
    i = haystack.find(needle)
    if i != -1:
        return i, i + len(needle)
    # Tolerate whitespace/line-wrap differences (models sometimes reflow text).
    parts = [re.escape(p) for p in needle.split()]
    if not parts:
        return None
    m = re.search(r"\s+".join(parts), haystack)
    return (m.start(), m.end()) if m else None


def apply_issue(content: LessonContent, issue: QCIssue) -> tuple[LessonContent, str, str]:
    """Return (new_content, status, note) where status is 'applied' or 'conflict'."""
    original, suggestion = issue.original_text.strip(), issue.suggested_text.strip()
    if not suggestion:
        return content, "conflict", "This recommendation has no suggested text to apply - edit the lesson manually."
    c = content.model_copy(deep=True)

    if not original:
        section = next((s for s in c.sections if s.id == issue.section_id), None)
        if not section:
            return content, "conflict", "Addition has no valid target section - copy the suggestion manually."
        section.content = section.content.rstrip() + "\n\n" + suggestion + "\n"
        return c, "applied", f"Added to the end of '{section.title}'."

    # Search the targeted section first, then the rest of the lesson.
    sections = sorted(c.sections, key=lambda s: s.id != issue.section_id)
    for s in sections:
        span = _find(s.content, original)
        if span:
            s.content = s.content[: span[0]] + suggestion + s.content[span[1]:]
            return c, "applied", f"Replaced text in '{s.title}'."

    for q in c.knowledge_checks:
        for field in ("question", "answer", "explanation"):
            val = getattr(q, field)
            span = _find(val, original)
            if span:
                setattr(q, field, val[: span[0]] + suggestion + val[span[1]:])
                return c, "applied", f"Updated knowledge check {q.id} ({field})."
        for i, opt in enumerate(q.options):
            span = _find(opt, original)
            if span:
                q.options[i] = opt[: span[0]] + suggestion + opt[span[1]:]
                return c, "applied", f"Updated an option in knowledge check {q.id}."

    span = _find(c.overview, original)
    if span:
        c.overview = c.overview[: span[0]] + suggestion + c.overview[span[1]:]
        return c, "applied", "Updated the overview."
    for i, o in enumerate(c.learning_objectives):
        span = _find(o, original)
        if span:
            c.learning_objectives[i] = o[: span[0]] + suggestion + o[span[1]:]
            return c, "applied", "Updated a learning objective."

    return content, "conflict", ("The original text was not found - it may have been edited since this QC run. "
                                 "Copy the suggested text manually, or re-run this QC layer.")
