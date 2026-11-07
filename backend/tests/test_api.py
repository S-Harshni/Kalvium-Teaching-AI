"""API tests in demo mode (no network / LLM): validation, workflow, editing, QC actions, exports."""
from __future__ import annotations

import os
import time

os.environ["LLM_PROVIDER"] = "demo"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    from app.config import settings
    settings.llm_provider = "demo"
    settings.database_path = tmp_path_factory.mktemp("db") / "test.db"
    from app.main import app
    with TestClient(app) as c:
        yield c


def wait_done(client, lesson_id, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        l = client.get(f"/api/lessons/{lesson_id}").json()
        if not l["running"] and l["pipeline"]["status"] in ("done", "failed"):
            return l
        time.sleep(0.3)
    raise AssertionError("pipeline did not finish")


def test_empty_inputs_rejected(client):
    r = client.post("/api/lessons", json={"title": "", "objective": "  "})
    assert r.status_code == 422
    fields = r.json()["detail"]["fields"]
    assert "title" in fields and "objective" in fields


def test_demo_workflow_edit_apply_export(client):
    r = client.post("/api/lessons", json={
        "title": "HTTP Requests and Responses",
        "objective": "Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories."})
    assert r.status_code == 201
    lid = r.json()["id"]
    l = wait_done(client, lid)
    assert l["demo"] is True
    assert all(s["status"] == "done" for s in l["pipeline"]["steps"])
    assert l["content"]["sections"] and l["qc_factual"]["score"] >= 0 and l["qc_instructional"]["score"] >= 0
    assert sum(s["minutes"] for s in l["content"]["sections"]) <= 45

    # edit + autosave with revision check
    content = l["content"]
    content["sections"][0]["content"] += "\n\nInstructor note."
    r = client.put(f"/api/lessons/{lid}/content", json={"content": content, "base_revision": l["revision"]})
    assert r.status_code == 200
    rev = r.json()["revision"]
    stale = client.put(f"/api/lessons/{lid}/content", json={"content": content, "base_revision": rev - 1})
    assert stale.status_code == 409

    # invalid content is rejected without touching saved work
    bad = client.put(f"/api/lessons/{lid}/content", json={"content": {"title": "x"}, "base_revision": rev})
    assert bad.status_code == 422
    assert "Instructor note." in client.get(f"/api/lessons/{lid}").json()["content"]["sections"][0]["content"]

    # reject an issue (always possible), keep the edit
    issues = l["qc_factual"]["issues"]
    if issues:
        r = client.post(f"/api/lessons/{lid}/qc/factual/issues/{issues[0]['id']}/reject", json={})
        assert r.json()["issue"]["status"] == "rejected"

    # exports
    for kind in ("lesson", "references", "qc-factual", "qc-instructional", "project"):
        r = client.get(f"/api/lessons/{lid}/export/{kind}?format=md")
        assert r.status_code == 200 and "DEMO MODE" in r.text
    assert client.get(f"/api/lessons/{lid}/export/data?format=json").json()["demo"] is True
    pdf = client.get(f"/api/lessons/{lid}/export/project?format=pdf")
    assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"

    # versions exist and can be restored
    versions = client.get(f"/api/lessons/{lid}/versions").json()
    assert versions
    r = client.post(f"/api/lessons/{lid}/versions/{versions[-1]['id']}/restore")
    assert r.status_code == 200


def test_failed_step_is_retryable_without_losing_work(client, monkeypatch):
    from app.llm.base import LLMError
    from app.services import pipeline

    real = pipeline.RUNNERS["qc_factual"]
    calls = {"n": 0}

    def flaky(lesson, progress):
        calls["n"] += 1
        if calls["n"] == 1:
            raise LLMError("Simulated AI outage")
        return real(lesson, progress)

    monkeypatch.setitem(pipeline.RUNNERS, "qc_factual", flaky)
    r = client.post("/api/lessons", json={
        "title": "Python Functions and Parameters",
        "objective": "Explain how to define and call Python functions and distinguish parameters from arguments."})
    lid = r.json()["id"]
    l = wait_done(client, lid)
    steps = {s["key"]: s for s in l["pipeline"]["steps"]}
    assert steps["qc_factual"]["status"] == "failed" and "Simulated AI outage" in steps["qc_factual"]["error"]
    assert steps["qc_instructional"]["status"] == "done"      # the other QC layer is independent
    assert l["content"] and l["status"] == "review"            # generated lesson kept
    generated_at = steps["generate"]["finished_at"]

    r = client.post(f"/api/lessons/{lid}/retry")
    assert r.status_code == 200
    l = wait_done(client, lid)
    steps = {s["key"]: s for s in l["pipeline"]["steps"]}
    assert steps["qc_factual"]["status"] == "done" and l["qc_factual"]
    assert steps["generate"]["finished_at"] == generated_at    # earlier steps were not re-run
    assert any(e["level"] == "error" for e in client.get(f"/api/lessons/{lid}/events").json())


def test_unknown_topic_demo_placeholder(client):
    r = client.post("/api/lessons", json={"title": "Photosynthesis Basics", "objective": "Describe the inputs and outputs of photosynthesis."})
    l = wait_done(client, r.json()["id"])
    assert "Demo placeholder" in l["content"]["sections"][0]["content"]
    assert l["research"]["sources"] == []
