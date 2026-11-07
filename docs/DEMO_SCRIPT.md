# Demo video script (about 4-5 minutes)

**Before recording:** backend and frontend running, both sample lessons already generated (live
generation takes several minutes, so start one at the beginning and cut back to it).

| Time | Screen | Say |
|---|---|---|
| 0:00 | Landing page | "Learnora AI turns a lesson title and learning objective into a researched, quality-checked 45-minute lesson. Stack: React + TypeScript + Tailwind on the front, FastAPI + SQLite on the back, Claude for generation and both QC layers." |
| 0:20 | Create Lesson → click the HTTP sample → **Generate** with empty fields first | "Inputs are validated on the client and the server." Fill the sample, click Generate AI Lesson. |
| 0:40 | Workflow tab | "Seven steps, each persisted. The progress you see is the saved backend state, not a timer. If a step fails, Retry resumes from that step without redoing earlier ones." |
| 1:00 | Switch to the finished HTTP lesson → **Research** tab | "Sources come from search, Wikipedia, Open Library and YouTube. Every page is fetched: only pages we actually downloaded are 'verified' and used as evidence. RFC 9110 and MDN are rated high by a fixed publisher rule set. Books are catalog records, videos are confirmed via oEmbed." |
| 1:40 | **QC 1 · Factual** | "Layer 1 extracts 25 factual claims, retrieves evidence passages for each claim with BM25, and has Claude judge each claim against that evidence. The score is computed in code: claim support, source quality, citation coverage, minus issue penalties." Show claims filter and an issue. |
| 2:10 | Python lesson → QC 1 issue F1 (applied) | "On the Python lesson it caught a real error: the lesson said calling with too many arguments gives the same 'missing argument' TypeError. In real Python it's 'takes 1 positional argument but 2 were given'. I accepted the fix: only that passage changed." |
| 2:35 | HTTP QC 1 → rejected F4 | "QC isn't infallible: here it called the 2xx wording 'legacy RFC 2616 phrasing', but RFC 9110 section 15.3 uses exactly those words, so I rejected it. The instructor stays in control." |
| 2:50 | **QC 2 · Instructional** | "Layer 2 is independent: different prompt, no evidence, no factual findings. It scores a 10-criterion rubric, checks objective coverage, and the 45-minute limit is checked in code. It flagged an under-budgeted activity and a risky 'try a wrong password' instruction." |
| 3:20 | **Edit lesson** → change a section's minutes, type in a section | "Edits autosave with a revision check; unsaved text is kept locally if the server is unreachable. History shows snapshots taken before every AI change, and any version can be restored." |
| 3:45 | Re-run QC 1 button; show 'stale report' banner | "Either layer can be re-run independently after editing. QC only reads the lesson; it never overwrites instructor edits." |
| 4:00 | **Preview** / Student view | "The student view: section navigation, progress, interactive knowledge checks, videos and references." |
| 4:20 | **Export** → download Complete report PDF, open it | "Exports: lesson, references, each QC report and a complete report, as PDF or Markdown, plus JSON data." |
| 4:40 | Settings | "Without keys it runs in a clearly labelled demo mode that replays these recorded runs. Thanks for watching." |
