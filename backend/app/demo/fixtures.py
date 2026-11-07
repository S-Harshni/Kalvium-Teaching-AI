"""Demo mode: replay clearly-labelled sample outputs when no live LLM is available.

The two sample lessons (HTTP; Python functions) are *recordings of real live runs* of this app,
saved as JSON in demo/fixtures/. Demo mode replays them without network or model calls and every
screen and export marks them "DEMO - recorded sample output". For any other topic, demo mode produces
an obvious placeholder outline (no invented facts or sources) and tells the user to configure a live
provider.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def available() -> list[dict]:
    out = []
    for p in sorted(FIXTURE_DIR.glob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        out.append({"slug": p.stem, "title": d["title"], "objective": d["objective"],
                    "recorded_at": d.get("recorded_at", "")})
    return out


def load(title: str, objective: str) -> dict:
    slug = _slug(title)
    for p in FIXTURE_DIR.glob("*.json"):
        if p.stem == slug or p.stem in slug or slug in p.stem:
            return json.loads(p.read_text(encoding="utf-8"))
    return placeholder(title, objective)


def placeholder(title: str, objective: str) -> dict:
    note = ("> **Demo placeholder.** No live AI provider is configured, so this outline contains no researched "
            "content. Configure `ANTHROPIC_API_KEY` (or sign in to Claude Code) and regenerate.")
    sections = [
        ("intro", "introduction", "Introduction", 4), ("prereq", "prerequisites", "Prerequisites", 3),
        ("concepts", "concepts", "Core concepts", 15), ("examples", "examples", "Worked examples", 8),
        ("activity", "activity", "Practical activity", 7), ("check", "knowledge_check", "Knowledge check", 5),
        ("summary", "summary", "Summary", 3),
    ]
    content = {
        "title": title, "objective": objective,
        "overview": f"Placeholder outline for '{title}'. Generate with a live provider for real content.",
        "learning_objectives": [objective], "audience": "", "difficulty": "",
        "sections": [{"id": i, "kind": k, "title": t, "minutes": m, "content": note} for i, k, t, m in sections],
        "knowledge_checks": [], "videos": [], "references": [],
    }
    empty_issue_note = "Demo placeholder - QC was not run because there is no live AI provider."
    return {
        "title": title, "objective": objective,
        "analysis": {"topic_summary": "", "key_concepts": [], "objective_parts": [objective],
                     "search_queries": [], "expected_facts": []},
        "research": {"queries": [], "sources": [], "evidence": [],
                     "notes": ["Demo mode: no research was performed for this topic."]},
        "content": content,
        "qc_factual": {"score": 0, "verdict": "needs_revision", "summary": empty_issue_note,
                       "methodology": empty_issue_note, "score_breakdown": [], "claims": [],
                       "source_assessment": [], "issues": [], "research_gaps": []},
        "qc_instructional": {"score": 0, "verdict": "needs_revision", "summary": empty_issue_note,
                             "methodology": empty_issue_note, "rubric": [], "objective_coverage": [],
                             "timing": {"total_minutes": 45, "compliant": True}, "issues": []},
    }
