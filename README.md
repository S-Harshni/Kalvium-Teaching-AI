# Learnora AI

**Learn Smarter. Teach Better. Create with Intelligence.**

An AI-powered lesson creation tool. Give it a **lesson title** and a **learning objective**; it
researches books, websites and YouTube videos, writes a structured lesson that fits in **45
minutes or less**, and audits it with **two independent quality-control layers**: research &
factual accuracy, and instructional quality. Instructors then review, edit (with autosave), apply or
reject QC recommendations, preview the student view, and export everything as PDF, Markdown or JSON.

---

## Quick start

Requirements: **Python 3.11+** and **Node.js 18+**.

```bash
# 1. Backend (FastAPI, port 8000)
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

```bash
# 2. Frontend (Vite + React, port 5173), in a second terminal
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Configure AI and research (optional)

```bash
cp .env.example .env     # then edit .env
```

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API for generation and both QC layers, plus Claude's server-side web search |
| *(no key, Claude Code installed)* | `LLM_PROVIDER=auto` falls back to the local `claude` CLI (your Claude Code login) for generation and web search |
| `TAVILY_API_KEY` | Preferred web search provider |
| `YOUTUBE_API_KEY` | YouTube Data API v3 (otherwise: the public results page, every video confirmed via oEmbed) |
| `GOOGLE_BOOKS_API_KEY` | Google Books (otherwise: Open Library, no key needed) |
| `LLM_PROVIDER=demo` | Force demo mode |

With **no keys and no Claude CLI** the app runs in **demo mode**: the two sample lessons replay
recordings of real live runs (research, lesson, both QC reports), and every screen and export is
labelled "Demo · sample output". Other topics get an obvious placeholder outline. Nothing pretends
that live research happened.

### Single-port mode

`cd frontend && npm run build` - the backend then also serves the built UI at http://localhost:8000.

### Tests

```bash
cd backend
python -m pytest            # 23 tests: unit + API (demo mode, no network or API keys)
```

---

## How it works

```
 Title + objective
        │
 1  Understanding learning objective   LLM → key concepts, objective parts, expected facts, search plan
 2  Researching trusted resources      web search · Wikipedia · Open Library/Google Books · YouTube
 3  Analyzing research materials       fetch & verify every page · rule-based reliability · relevance
                                       scoring · evidence passages (chunked, BM25-indexed)
 4  Generating lesson content          LLM writes from the top evidence passages, citing [S#]
                                       → 45-minute limit enforced in code
 5  QC 1 · Research & factual accuracy claims extracted → evidence retrieved per claim → verified
 6  QC 2 · Instructional quality       independent rubric review + deterministic structure/timing checks
 7  Preparing final lesson             saved for instructor review
```

Each step's status, detail and error are **persisted**; the progress UI shows exactly that state.
A failed step can be retried on its own, and its predecessors' outputs are reused.

### Architecture

```
learnora-ai/
├── backend/                     FastAPI + SQLite
│   ├── app/
│   │   ├── main.py              REST API (see docs/API.md, or /docs when running)
│   │   ├── config.py            env-based settings, provider auto-selection
│   │   ├── models.py            Pydantic schemas (lesson, sources, QC reports, pipeline)
│   │   ├── db.py                SQLite persistence, versions, event log
│   │   ├── llm/                 provider abstraction: Anthropic API · Claude Code CLI · (demo)
│   │   │   └── json_utils.py    JSON extraction + schema validation + one repair turn
│   │   ├── research/            search providers, page fetch/verification, reliability rules, BM25
│   │   ├── prompts/             separate prompts: analysis, generation, QC 1, QC 2
│   │   ├── services/            pipeline orchestration, QC engines, apply-fix, timing guard
│   │   ├── export/              Markdown / PDF / JSON exporters
│   │   └── demo/fixtures/       recorded live runs replayed in demo mode
│   ├── scripts/record_fixture.py
│   └── tests/
├── frontend/                    React 18 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/               Landing, Dashboard, Create (studio), Lessons, LessonWorkspace,
│       │                        Resources, Reports, Settings, Learn (student view)
│       ├── components/          PipelineProgress, SourceCard, QCReportView, LessonEditor,
│       │                        LessonPreview, ExportPanel, ui primitives
│       └── lib/                 typed API client, polling hook
├── docs/API.md
└── .env.example
```

### Technology choices

| Area | Choice | Why |
|---|---|---|
| Backend | **FastAPI**, Pydantic v2 | Typed request/response schemas double as LLM output validators |
| Storage | **SQLite** (WAL) | Zero-setup local persistence; JSON columns for evolving lesson shape |
| LLM | **Claude** via Anthropic SDK (default `claude-opus-5-5`), or the Claude Code CLI | Provider interface is one method (`complete`), so another model is a ~40-line class |
| Research | Tavily / Claude web search / DuckDuckGo, Wikipedia API, Open Library / Google Books, YouTube Data API or results page + **oEmbed** | Keyless fallbacks for every category, so the tool works without paid keys |
| Retrieval | Paragraph chunking + **BM25** (pure Python) | Evidence retrieval per claim without an embedding service |
| PDF | Markdown → HTML → **fpdf2** | Pure Python, works on Windows/macOS/Linux without system libraries |
| Frontend | **React + TypeScript + Vite**, **Tailwind**, Lucide, Framer Motion, Recharts, react-markdown | Fast dev loop; UI primitives follow shadcn/ui's API but are hand-written to keep dependencies small |

---

## Key engineering decisions

**Research honesty.** Source metadata only comes from provider responses or the fetched page.
A web page is `verified` only if we downloaded readable content, and only verified pages contribute
evidence the generator and QC can cite. URLs that pass through model text (LLM-suggested canonical
docs, CLI web search) are dropped if they cannot be fetched. Books are catalog records: the record is
verified, the book is not read, so books are offered as further reading and never used as evidence.
Videos are confirmed to exist through YouTube oEmbed. Reliability tiers come from a fixed,
documented publisher rule set (`research/reliability.py`), not from the model. If DuckDuckGo
rate-limits automated queries, the tool records a note and stops; it does not try to evade the block.

**Two genuinely independent QC layers.**

| | QC 1 · Research & factual accuracy | QC 2 · Instructional quality |
|---|---|---|
| Question | Is it correct and supported? | Does it teach the objective in 45 min? |
| Inputs | lesson + retrieved evidence + source list | lesson + objective parts + timing only (no evidence, no QC 1 output) |
| Method | 1) LLM extracts 15-25 atomic claims with verbatim quotes → 2) code retrieves top-3 evidence passages per claim (BM25) → 3) LLM judges each claim strictly against its evidence; plus deterministic citation checks | LLM scores a fixed 10-criterion rubric with justification; code overrides time compliance and checks required sections, question count and objective-part coverage |
| Score | `0.5·ClaimSupport + 0.3·SourceQuality + 0.2·CitationCoverage − IssuePenalty`, computed in code | Sum of 10 rubric scores (0-100) |
| Verdict | Passed / Passed with recommendations / Needs revision (thresholds in each report's methodology) | same |

Scores are never combined. Each report lists its methodology in the UI and exports.

**Instructor edits are never overwritten.** Writers update only the columns they own: the pipeline
writes research/QC/pipeline state, the editor writes content. QC reads the lesson and never changes
it. Applying a recommendation replaces only that issue's exact `original_text` (whitespace-tolerant);
if the instructor already changed that passage, the fix is reported as a **conflict** instead of being
guessed into place. Every regeneration, applied fix and restore snapshots the previous content into
version history. Autosave sends a `base_revision`, so edits from a stale tab get a 409 instead of
clobbering newer content, and unsaved text is kept in `localStorage` until the server confirms.

**45-minute guarantee.** The prompt budgets ≤ 45 minutes, and code enforces it after generation
(proportional scaling). Instructor edits over the limit are allowed but flagged in the editor, and
QC 2 marks them critical.

**Failure handling.** Empty/short inputs are rejected (client and server). Every LLM response is
schema-validated with one automatic repair attempt. Provider errors (auth, rate limit, network,
refusal, truncation) become readable step errors with a **Retry** button. A server restart marks
interrupted steps as failed so they can be retried. Exports that fail return a message, never a
broken file.

---

## Sample test runs

Both sample lessons were generated live (Claude via the Claude Code CLI, `sonnet`; Claude web
search; Open Library; YouTube) and are included as demo fixtures in
`backend/app/demo/fixtures/`. Full reports are in `docs/sample-runs/`.

See **[docs/TEST_RESULTS.md](docs/TEST_RESULTS.md)** for the results, the factual verification of
each lesson against the expected points, the QC issues found, and the improvements applied.

To re-run them: Create Lesson → "Try a sample" → Generate AI Lesson.

---

## Known limitations

- Live generation takes several minutes (5 LLM calls: analysis, generation, 2× QC 1, 1× QC 2).
- Without Tavily or an Anthropic key, web search goes through the Claude Code CLI; its result list
  passes through model text, which is why every URL is re-fetched and dropped if it does not resolve.
- YouTube without an API key relies on parsing the public results page, which can change; video
  content itself is not analysed (only title/channel/duration).
- Book content is not read; books are further reading only.
- Some pages need JavaScript to render text; those are listed as "not retrieved" instead of evidence.
- QC is model-based judgement grounded in retrieved evidence: it reduces errors but is not a proof.
  Instructors remain the final reviewers.
- Single-user local app: no authentication.

## Acknowledgements

Anthropic Claude (generation and QC), FastAPI, Pydantic, httpx, Beautiful Soup, fpdf2,
python-markdown, React, Vite, Tailwind CSS, Lucide icons, Framer Motion, Recharts, react-markdown.
Research data from DuckDuckGo, Wikipedia, Open Library (Internet Archive), Google Books and YouTube.
UI primitive API inspired by shadcn/ui. AI assistance (Claude Code) was used while building this
project.
