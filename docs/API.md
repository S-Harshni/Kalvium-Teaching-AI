# Kalvium Teaching AI - REST API

Base URL: `http://localhost:8000/api`. Interactive docs (Swagger UI): `http://localhost:8000/docs`.
All bodies are JSON. Errors return `{"detail": "message"}` or, for field validation,
`{"detail": {"message": "...", "fields": {"title": "..."}}}`.

## Status

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Active LLM / search / book / video providers, demo samples, 45-minute limit |

## Lessons

| Method | Path | Description |
|---|---|---|
| GET | `/lessons` | Lesson summaries (scores, status, minutes) |
| POST | `/lessons` | Create a lesson and start the 7-step workflow in the background. Body: `{title, objective, settings?, demo?}`. `422` on empty/too-short inputs |
| GET | `/lessons/{id}` | Full lesson: content, research sources (evidence summarised), both QC reports, pipeline step states, `running` |
| PATCH | `/lessons/{id}` | `{status: "review" \| "finalized"}` or `{title}` |
| DELETE | `/lessons/{id}` | Delete lesson, versions and logs (`409` while a step runs) |
| PUT | `/lessons/{id}/content` | Autosave target. Body `{content, base_revision}`. Validated against the lesson schema; `409` if `base_revision` is stale (changed in another tab or by an applied QC fix); returns new `revision` |
| GET | `/lessons/{id}/versions` | Version history (snapshots taken before regeneration, QC fixes, restores, manual saves) |
| POST | `/lessons/{id}/versions` | Save a manual version `{reason}` |
| POST | `/lessons/{id}/versions/{vid}/restore` | Restore a version (current content is snapshotted first) |
| GET | `/lessons/{id}/events` | Step log (info + errors with tracebacks) |

## Workflow control

| Method | Path | Description |
|---|---|---|
| POST | `/lessons/{id}/retry` | Re-run every step that is not `done` (failed or interrupted), keeping earlier outputs |
| POST | `/lessons/{id}/steps/{key}/run` | Run one step: `analyze`, `research`, `analyze_research`, `generate` (also re-runs both QC layers), `qc_factual`, `qc_instructional`. QC never modifies lesson content |

Step keys and labels: `analyze` Understanding learning objective · `research` Researching trusted
resources · `analyze_research` Analyzing research materials · `generate` Generating lesson content ·
`qc_factual` Running factual accuracy QC · `qc_instructional` Running instructional quality QC ·
`finalize` Preparing final lesson. Each has `status` (`pending|running|done|failed`), `detail`,
`error`, `started_at`, `finished_at`.

## QC recommendations

| Method | Path | Description |
|---|---|---|
| POST | `/lessons/{id}/qc/{factual\|instructional}/issues/{issue_id}/apply` | Replace the issue's exact `original_text` with `suggested_text` (or append an addition). Returns `{issue, lesson}`; issue status `applied`, or `conflict` if the passage was edited since the QC run |
| POST | `.../reject` | Mark as rejected |
| POST | `.../reopen` | Reopen a rejected issue |

## Exports

`GET /lessons/{id}/export/{kind}?format=md|pdf|json`

| kind | Content |
|---|---|
| `lesson` | Lesson with videos and references |
| `references` | Research reference list with reliability and verification notes |
| `qc-factual` | Research & Factual Accuracy Report |
| `qc-instructional` | Instructional Quality Report |
| `project` | All of the above in one document |
| `data` | Complete lesson data as JSON |

## Resources

| Method | Path | Description |
|---|---|---|
| GET | `/resources` | All researched sources across lessons |
