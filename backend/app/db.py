"""SQLite persistence.

Design notes
- One row per lesson; structured parts (content, research, QC reports, pipeline state) are JSON
  columns. That keeps the schema small while the lesson shape evolves.
- Writers update *only the columns they own* (`update_fields`). The background pipeline writes
  research/QC/pipeline columns; the editor writes `content`. A QC run can therefore never
  overwrite an instructor's edits.
- Every destructive change (regeneration, applying a QC fix, manual "save version") snapshots
  the previous content into `lesson_versions` first, so saved work is always recoverable.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from .config import settings

_lock = threading.RLock()
JSON_COLUMNS = ("settings", "content", "research", "qc_factual", "qc_instructional", "pipeline", "analysis")

SCHEMA = """
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    settings TEXT,
    status TEXT NOT NULL DEFAULT 'generating',
    demo INTEGER NOT NULL DEFAULT 0,
    analysis TEXT,
    research TEXT,
    content TEXT,
    qc_factual TEXT,
    qc_instructional TEXT,
    pipeline TEXT,
    revision INTEGER NOT NULL DEFAULT 0,
    edited_by_instructor INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    revision INTEGER NOT NULL,
    reason TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS event_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT,
    step TEXT,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _connect() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.database_path, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with _lock, _connect() as conn:
        conn.executescript(SCHEMA)


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    for col in JSON_COLUMNS:
        if d.get(col):
            d[col] = json.loads(d[col])
    d["demo"] = bool(d.get("demo"))
    d["edited_by_instructor"] = bool(d.get("edited_by_instructor"))
    return d


def create_lesson(title: str, objective: str, lesson_settings: dict, demo: bool, pipeline: dict) -> dict:
    lesson_id = uuid.uuid4().hex[:12]
    ts = now()
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO lessons (id, title, objective, settings, status, demo, pipeline, created_at, updated_at)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (lesson_id, title, objective, json.dumps(lesson_settings), "generating", int(demo),
             json.dumps(pipeline), ts, ts),
        )
    return get_lesson(lesson_id)


def get_lesson(lesson_id: str) -> Optional[dict]:
    with _lock, _connect() as conn:
        row = conn.execute("SELECT * FROM lessons WHERE id=?", (lesson_id,)).fetchone()
    return _row_to_dict(row) if row else None


def list_lessons() -> list[dict]:
    with _lock, _connect() as conn:
        rows = conn.execute("SELECT * FROM lessons ORDER BY updated_at DESC").fetchall()
    return [_row_to_dict(r) for r in rows]


def update_fields(lesson_id: str, **fields: Any) -> dict:
    """Update only the given columns. JSON columns accept dicts/lists (or pydantic models)."""
    if not fields:
        return get_lesson(lesson_id)
    cols, vals = [], []
    for k, v in fields.items():
        if k in JSON_COLUMNS and v is not None:
            if hasattr(v, "model_dump"):
                v = v.model_dump()
            v = json.dumps(v)
        cols.append(f"{k}=?")
        vals.append(v)
    cols.append("updated_at=?")
    vals.append(now())
    vals.append(lesson_id)
    with _lock, _connect() as conn:
        conn.execute(f"UPDATE lessons SET {', '.join(cols)} WHERE id=?", vals)
    return get_lesson(lesson_id)


def snapshot(lesson_id: str, reason: str) -> None:
    """Store the current content as a version before it is changed."""
    lesson = get_lesson(lesson_id)
    if not lesson or not lesson.get("content"):
        return
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO lesson_versions (lesson_id, revision, reason, content, created_at) VALUES (?,?,?,?,?)",
            (lesson_id, lesson["revision"], reason, json.dumps(lesson["content"]), now()),
        )


def list_versions(lesson_id: str) -> list[dict]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT id, revision, reason, created_at FROM lesson_versions WHERE lesson_id=? ORDER BY id DESC",
            (lesson_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_version(lesson_id: str, version_id: int) -> Optional[dict]:
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT * FROM lesson_versions WHERE lesson_id=? AND id=?", (lesson_id, version_id)
        ).fetchone()
    if not row:
        return None
    d = dict(row)
    d["content"] = json.loads(d["content"])
    return d


def delete_lesson(lesson_id: str) -> None:
    with _lock, _connect() as conn:
        conn.execute("DELETE FROM lessons WHERE id=?", (lesson_id,))
        conn.execute("DELETE FROM lesson_versions WHERE lesson_id=?", (lesson_id,))
        conn.execute("DELETE FROM event_log WHERE lesson_id=?", (lesson_id,))


def log_event(lesson_id: Optional[str], step: str, level: str, message: str) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO event_log (lesson_id, step, level, message, created_at) VALUES (?,?,?,?,?)",
            (lesson_id, step, level, message[:4000], now()),
        )


def list_events(lesson_id: str, limit: int = 100) -> list[dict]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT step, level, message, created_at FROM event_log WHERE lesson_id=? ORDER BY id DESC LIMIT ?",
            (lesson_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]
