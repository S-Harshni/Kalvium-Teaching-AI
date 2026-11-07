# Demo video: dry run and recording guide (Windows)

Target length: **4-5 minutes**. Everything below runs locally on your PC.

---

## 1. Start the app (every time)

Open **two** terminals (PowerShell or Windows Terminal) in the project folder.

**Terminal 1 - backend**
```powershell
cd backend
.venv\Scripts\activate
uvicorn app.main:app --port 8000
```
Wait for `Application startup complete` and a line starting `LLM provider: claude_cli` (or
`anthropic`). If it says `demo`, live generation is off: check that you are signed in to Claude Code
(`claude` works in a terminal) or that `ANTHROPIC_API_KEY` is set in `.env`.

**Terminal 2 - frontend**
```powershell
cd frontend
npm run dev
```
Open **http://localhost:5173** in Chrome or Edge. The sidebar should show a green
**Live AI & research** dot.

> First time on a new PC: run `python -m venv .venv` and `pip install -r requirements.txt` in
> `backend`, and `npm install` in `frontend` (see README).

---

## 2. Dry run (do this once, no recording)

The dry run uses **demo-mode copies**, so you can click Apply/Reject freely without touching the real
lessons you will record.

1. **Create Lesson** -> click **Try a sample: HTTP Requests and Responses** -> tick **Use demo mode**
   -> **Generate AI Lesson**. It finishes in about 5 seconds and is labelled *Demo · sample output*.
2. Walk through every tab in the order of the script below: Workflow, Research, QC 1, QC 2, Edit,
   Preview, Export. Say your lines out loud and time yourself.
3. In QC 1 / QC 2, practise **Accept & apply** on one issue and **Reject** on another.
4. In Edit lesson, change a section's minutes and watch **Saved just now** appear; open **History**.
5. In Export, download the **Complete project report** PDF and open it.
6. Delete the demo copy afterwards (trash icon at the top right of the lesson).
7. Also test the empty-input check: on Create Lesson, click **Generate AI Lesson** with empty fields.

If anything fails during the dry run, the red banner shows the reason and a **Retry** button.

---

## 3. Before you record

- Close other apps and notifications: **Settings > System > Notifications > Do not disturb**.
- Browser zoom **110-125%** so text is readable in the video (Ctrl + / Ctrl -). Use a full-screen
  browser window (F11) and hide bookmarks (Ctrl+Shift+B).
- Have these tabs ready: the landing page, the **HTTP** lesson, the **Python** lesson, and the
  **SQL JOINs** lesson.
- Start a **new live lesson** right before you press record (live generation takes 5-8 minutes);
  you will show its progress at the start and its finished result near the end.

## 4. Recording tools (pick one)

| Tool | How | Notes |
|---|---|---|
| **Snipping Tool** (built in, Windows 11) | Win + Shift + R -> select area/full screen -> Start | Simplest. Records microphone and system audio (toggle the mic icon). Saves MP4. |
| **Xbox Game Bar** (built in) | Win + Alt + R to start/stop | Records only the active window, not the desktop. Mic: Win + Alt + M. Files in Videos\Captures. |
| **OBS Studio** (free, obsproject.com) | Add *Display Capture* + *Audio Input Capture*, Settings > Output > MP4, Start Recording | Best quality and webcam overlay; takes 10 minutes to set up. |
| **Clipchamp** (built in) | Record & create > Screen and camera | Built-in editor to trim mistakes before export. |

Do a 10-second test recording first and check the audio. Speak a little slower than normal. If you
make a mistake, pause 2 seconds and repeat the sentence; trim it later in Clipchamp or Photos.

---

## 5. Script (about 4:30)

| Time | Screen | What to do and say |
|---|---|---|
| 0:00 | **Landing page** | "This is Kalvium Teaching AI. It turns a lesson title and a learning objective into a researched, quality-checked lesson that fits in 45 minutes. Frontend: React, TypeScript, Tailwind. Backend: Python FastAPI with SQLite. Claude does generation and both quality checks." Scroll once through the page. |
| 0:25 | **Create Lesson** | Click **Generate AI Lesson** with empty fields: "Inputs are validated." Pick a sample or type your own topic and click Generate. |
| 0:40 | **Workflow tab** of the new lesson | "Seven steps. Each one is saved in the database as it finishes, so this progress is real backend state. If a step fails, Retry resumes from that step without redoing earlier ones." Leave it running. |
| 1:00 | **HTTP lesson -> Research** | "Research uses web search, Wikipedia, Open Library and YouTube. Every web page is actually downloaded before it counts as verified, and only verified pages are used as evidence. Reliability comes from fixed publisher rules: RFC 9110 and MDN are rated high. Books are catalog records for further reading, and videos are confirmed to exist." Click the Videos filter to show thumbnails and durations. |
| 1:35 | **QC 1 · Factual** | "Layer 1 extracts 25 factual claims, finds the matching evidence for each one, and has Claude judge every claim against that evidence. The score is calculated in code from claim support, source quality and citation coverage." Click **Scoring methodology**, then the **partially supported** filter. |
| 2:00 | Same page, issue **F3** | "Here it found that the 2xx definition has no citation to the RFC." Click **Accept & apply**: "Only that exact passage changes. If I had already edited it, it would report a conflict instead of guessing." |
| 2:20 | **Python lesson -> Edit lesson -> History** | "Earlier, QC caught a real error in this lesson: it said passing too many arguments gives the same TypeError as too few. Python actually says 'takes 1 positional argument but 2 were given'. Every AI change saves a version, and here is the snapshot before that fix." |
| 2:45 | **Python -> QC 2 · Instructional** | "Layer 2 is independent: a different prompt, and it never sees the research or the factual report. It scores a 10-point rubric, checks every part of the objective is covered, and the 45-minute limit is checked in code." Show the rubric and timing chart. Open issue **I2** ("the activity puts a SyntaxError line in the same file as working code") and click **Accept & apply**. |
| 3:15 | **HTTP -> QC 2**, issue **I4** | "QC isn't always right. It suggests removing the inline citations, but they are deliberate, so I reject it. The instructor stays in control." Click **Reject**. |
| 3:30 | **Edit lesson** | Change a section's minutes and type a sentence: "Edits autosave with a revision check, and the 45-minute total is shown live." Point at **Saved just now**. |
| 3:45 | QC tab after editing | Show the yellow *lesson changed after this report* banner and click **Re-run this layer**: "Either layer can be re-run on its own, and QC never overwrites instructor edits." |
| 3:55 | **Student view** button | Scroll, answer one knowledge-check question: "This is what learners see: section navigation, progress, interactive questions, videos and references." |
| 4:15 | **Export** | Download **Complete project report (PDF)** and open it: "Lesson, references and both QC reports export as PDF, Markdown or JSON." |
| 4:30 | The **new live lesson** | Show it finished with its two QC scores: "And the lesson I started at the beginning has finished, with both reports. Thanks for watching." |

Tips: keep each tab on screen for at least 3 seconds; zoom the browser (Ctrl +) on dense tables; if
the live lesson isn't finished by 4:30, say "it's still running QC; here are the completed ones" and
show the SQL JOINs lesson instead.
