"""Offline unit tests for the deterministic parts of the pipeline (no network, no LLM)."""
from __future__ import annotations

import json

import pytest

from app.llm.json_utils import extract_json
from app.models import LessonContent, QCIssue
from app.research.reliability import assess, classify_type
from app.research.text import BM25, chunk, overlap, tokens
from app.services.apply import apply_issue
from app.services.lesson_text import cited_ids, to_markdown
from app.services.timing import enforce_limit


def lesson(minutes=(4, 3, 15, 8, 7, 5, 3)) -> LessonContent:
    kinds = ["introduction", "prerequisites", "concepts", "examples", "activity", "knowledge_check", "summary"]
    return LessonContent(
        title="T", objective="Explain X", overview="Overview text.", learning_objectives=["Explain X"],
        sections=[{"id": k, "kind": k, "title": k.title(), "minutes": m,
                   "content": f"Content of {k}. GET is safe [S1]. POST is not idempotent [S2, S3]."}
                  for k, m in zip(kinds, minutes)],
        knowledge_checks=[{"id": "q1", "question": "Is GET safe?", "type": "true_false", "options": ["True", "False"],
                           "answer": "True", "explanation": "GET is defined as safe."}],
    )


def test_timing_within_limit_untouched():
    c, note = enforce_limit(lesson())
    assert c.total_minutes == 45 and note == ""


def test_timing_over_limit_scaled_to_45():
    c, note = enforce_limit(lesson((10, 5, 20, 15, 10, 8, 5)))
    assert c.total_minutes <= 45 and "scaled" in note
    assert all(s.minutes >= 1 for s in c.sections)


def test_apply_replaces_only_target_snippet():
    c = lesson()
    issue = QCIssue(id="F1", severity="high", category="x", section_id="concepts", problem="p",
                    original_text="POST is not idempotent [S2, S3].", suggested_text="POST is not idempotent by definition [S2].")
    new, status, _ = apply_issue(c, issue)
    assert status == "applied"
    assert "not idempotent by definition" in new.sections[2].content
    # every other section unchanged
    for a, b in zip(c.sections, new.sections):
        if a.id != "concepts":
            assert a.content == b.content


def test_apply_conflict_when_text_was_edited():
    c = lesson()
    issue = QCIssue(id="F1", severity="low", category="x", section_id="concepts", problem="p",
                    original_text="This sentence no longer exists.", suggested_text="New")
    new, status, note = apply_issue(c, issue)
    assert status == "conflict" and new == c and "not found" in note


def test_apply_tolerates_whitespace_reflow():
    c = lesson()
    issue = QCIssue(id="F1", severity="low", category="x", section_id="summary", problem="p",
                    original_text="GET   is\nsafe [S1].", suggested_text="GET is a safe method [S1].")
    new, status, _ = apply_issue(c, issue)
    assert status == "applied" and "safe method" in new.sections[-1].content


def test_apply_addition_appends_to_section():
    c = lesson()
    issue = QCIssue(id="I1", severity="low", category="x", section_id="activity", problem="p",
                    original_text="", suggested_text="**Extra step.**")
    new, status, _ = apply_issue(c, issue)
    assert status == "applied" and new.sections[4].content.endswith("**Extra step.**\n")


def test_apply_knowledge_check_field():
    c = lesson()
    issue = QCIssue(id="I2", severity="low", category="x", section_id="knowledge_checks", problem="p",
                    original_text="GET is defined as safe.", suggested_text="RFC 9110 defines GET as safe.")
    new, status, _ = apply_issue(c, issue)
    assert status == "applied" and new.knowledge_checks[0].explanation == "RFC 9110 defines GET as safe."


def test_cited_ids():
    assert cited_ids("a [S1] b [S2, S3] c [S10;S4] d [x]") == {"S1", "S2", "S3", "S4", "S10"}


def test_markdown_render_has_sections_and_questions():
    md = to_markdown(lesson(), for_review=True)
    assert '<section id="concepts"' in md and "Q1. Is GET safe?" in md and "45 minutes" in md


@pytest.mark.parametrize("url,tier", [
    ("https://www.rfc-editor.org/rfc/rfc9110.html", "high"),
    ("https://developer.mozilla.org/en-US/docs/Web/HTTP", "high"),
    ("https://docs.python.org/3/tutorial/controlflow.html", "high"),
    ("https://en.wikipedia.org/wiki/HTTP", "medium"),
    ("https://medium.com/@someone/http", "low"),
    ("https://random-blog.example.com/post", "low"),
    ("https://cs.stanford.edu/notes", "high"),
])
def test_reliability_rules(url, tier):
    assert assess(url)[0] == tier


def test_classify_type():
    assert classify_type("https://www.rfc-editor.org/rfc/rfc9110") == "standard"
    assert classify_type("https://docs.python.org/3/") == "documentation"
    assert classify_type("https://en.wikipedia.org/wiki/X") == "encyclopedia"


def test_text_tools():
    assert "get" in tokens("The GET method") and "the" not in tokens("The GET method")
    assert overlap({"get", "post"}, "GET requests retrieve data") == 0.5
    chunks = chunk("Para one is here. " * 30 + "\n\n" + "Second paragraph text. " * 30)
    assert len(chunks) >= 2 and all(len(c) <= 720 for c in chunks)
    bm = BM25(["GET is safe and idempotent", "POST submits data", "Status 404 means not found"])
    assert bm.top("404 not found", k=1)[0][0] == 2


def test_extract_json_variants():
    assert extract_json('{"a": 1}') == {"a": 1}
    assert extract_json('```json\n{"a": 2}\n```') == {"a": 2}
    assert extract_json('Sure! {"a": 3} hope this helps') == {"a": 3}
    with pytest.raises(json.JSONDecodeError):
        extract_json("no json here")
