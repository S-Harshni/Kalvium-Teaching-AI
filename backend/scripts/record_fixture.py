"""Record a lesson from the local database as a demo-mode fixture.

Usage (from backend/):  python -m scripts.record_fixture <lesson_id>

The fixture is a verbatim copy of a real live run (objective analysis, research with evidence, lesson
content and both QC reports). Demo mode replays it and labels it as recorded sample output.
"""
from __future__ import annotations

import json
import sys
from datetime import date

from app import db
from app.demo.fixtures import FIXTURE_DIR, _slug


def main(lesson_id: str) -> None:
    db.init_db()
    lesson = db.get_lesson(lesson_id)
    if not lesson or not lesson.get("content"):
        sys.exit(f"Lesson {lesson_id} not found or not generated.")
    data = {
        "title": lesson["title"],
        "objective": lesson["objective"],
        "recorded_at": date.today().isoformat(),
        "recorded_from": "live run of this application (see README: Sample test runs)",
        "analysis": lesson["analysis"],
        "research": lesson["research"],
        "content": lesson["content"],
        "qc_factual": lesson["qc_factual"],
        "qc_instructional": lesson["qc_instructional"],
    }
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    path = FIXTURE_DIR / f"{_slug(lesson['title'])}.json"
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1])
