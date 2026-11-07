"""Deterministic 45-minute guard.

The model is asked to budget <= 45 minutes, but we never trust that: after generation (and on every
save) the section minutes are checked in code. Generation output over the limit is scaled down
proportionally; instructor edits over the limit are allowed to be saved but are flagged by QC Layer 2
and blocked from export as "final" until fixed.
"""
from __future__ import annotations

import math

from ..models import LessonContent, MAX_LESSON_MINUTES


def enforce_limit(content: LessonContent, limit: int = MAX_LESSON_MINUTES) -> tuple[LessonContent, str]:
    total = content.total_minutes
    if total <= limit:
        return content, ""
    factor = limit / total
    for s in content.sections:
        if s.minutes:
            s.minutes = max(1, math.floor(s.minutes * factor))
    # Floor rounding can only undershoot; give spare minutes back to the largest sections.
    spare = limit - content.total_minutes
    for s in sorted(content.sections, key=lambda s: -s.minutes):
        if spare <= 0:
            break
        s.minutes += 1
        spare -= 1
    return content, f"Model budgeted {total} min; scaled section timings down to {content.total_minutes} min."
