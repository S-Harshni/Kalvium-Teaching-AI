# Test results - both sample lessons

Run on 2026-11-07 on a Windows 11 laptop. Providers: **Claude (Claude Code CLI, `sonnet`)** for
analysis, generation and both QC layers; **Claude web search** (CLI) for web results; Wikipedia API;
**Open Library**; YouTube public results page + **oEmbed** verification. No result below was edited
by hand except where stated as an *instructor edit*.

Both runs are saved as demo fixtures (`backend/app/demo/fixtures/`), and their full exports
(lesson, references, both QC reports, complete PDF) are in `docs/sample-runs/`.

---

## Test case 1 - HTTP Requests and Responses

> *Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.*

**Workflow:** 7/7 steps completed. Research: 30 web, 5 book and 10 video candidates, reduced to
16 verified sources (RFC 9110, 8 MDN pages, Wikipedia, *HTTP: The Definitive Guide* catalog record,
5 YouTube videos) and 189 evidence passages. Generated lesson: 9 sections, 6 knowledge-check
questions, **44 minutes**.

### QC Layer 1 - Research & factual accuracy

| Run | Lesson revision | Score | Verdict | Notes |
|---|---|---|---|---|
| 1 | 1 (AI draft) | **94** | Passed | 24/25 claims supported, 1 partial; 3 issues |
| 2 | 4 (after 3 fixes) | 87 | Passed | 5 low/medium citation issues (one false positive, see below) |
| 3 | 7 | 95 | Passed | 1 low issue |
| 4 | 8 (after instructor edits) | 93 | Passed | 23 supported, 2 partial; 3 low/medium issues on the new sentences |
| 5 | 8 (citation-aware retrieval, final) | **92** | Passed | 22 supported, 3 partial; open: cite RFC 9110 for the 2xx wording, RFC 2616/9111 lineage unsourced, 204 use-case example unsourced |

Real issues it found and how they were handled:

| Issue | Action |
|---|---|
| Comparison-table row "Visible in browser history/URL" had no citation | **Applied** (citations added to that row only) |
| Caching rules attributed to RFC 9110 alone; caching is specified in RFC 9111 | **Applied** |
| A DevTools claim was cited to MDN "Sending form data", which never mentions DevTools | **Applied** |
| "2xx = received, understood, and accepted" called *outdated RFC 2616 phrasing* | **Rejected (false positive).** RFC 9110 §15 and §15.3 contain exactly this wording (checked against `rfc9110.txt`). The retriever had not surfaced that RFC passage, so the verifier lacked the evidence. |

### QC Layer 2 - Instructional quality

| Run | Lesson revision | Score | Verdict |
|---|---|---|---|
| 1 | 1 | **81** | Passed with recommendations (rubric 9,8,9,9,9,7,7,9,8,6) |
| 2 | 4 | 82 | Passed with recommendations |
| 3 | 8 | **78** | Passed with recommendations |

Applied: the activity relied on "any login form on a live site" (unreliable), so it was replaced with
a guaranteed practice endpoint (httpbin.org/forms/post). The re-run then caught that the replacement
still suggested **submitting a wrong password on a real site** (account-lockout risk), and that fix was
applied too. Also applied: an explicit link from GET/POST to the HTML `<form method>` attribute.
Still open (left for the instructor): the activity and the 8-minute status-code section are dense for
beginners (timing realism, 5/10).

### Manual factual verification (instructor review)

| Expected point | In lesson? | Correct? |
|---|---|---|
| GET retrieves a representation of a resource | Yes [S6] | ✔ (MDN / RFC 9110 §9.3.1) |
| POST requests resource-specific processing, not only creation | Partly: the draft said "often … such as creating a record" | Instructor edit added RFC 9110 §9.3.3 wording |
| GET is safe | Yes | ✔ |
| GET is idempotent | Yes | ✔ |
| POST is not inherently idempotent | Yes ("No, by default") | ✔ |
| 2xx success, 4xx client error, 5xx server error | Yes, with a 5-class table | ✔ (matches RFC 9110 §15 wording) |
| 200, 201, 400, 401, 403, 404, 500 | Yes | ✔ 401 = unauthenticated, 403 = identity known but no rights |
| 204 No Content | **Missing from the draft** | Instructor edit added it (RFC 9110 §15.3.5) |

Not caught by either QC layer and fixed by hand: an example message line `POST / HTTP/2.0`. HTTP/2
is binary and has no textual request line, so it was changed to `HTTP/1.1`. The missing 204 was not
flagged either, because it was not in the model's "expected facts" list. **Takeaway:** QC lowers the
error rate, and the instructor review is still needed.

---

## Test case 2 (own choice) - Python Functions and Parameters

> *Explain how to define and call Python functions, distinguish parameters from arguments, and demonstrate positional and keyword arguments.*

**Workflow:** 7/7 steps completed. 16 verified sources: docs.python.org tutorial, glossary and
language reference (high), University of Pittsburgh notes (high), Real Python ×3, Wikipedia,
GeeksforGeeks, W3Schools, *Automate the Boring Stuff with Python* catalog record, 5 YouTube videos.
314 evidence passages. Lesson: 8 sections, 6 questions, **45 minutes**.

### QC Layer 1 - Research & factual accuracy

| Run | Revision | Score | Verdict | Key finding |
|---|---|---|---|---|
| 1 | 1 | **80** | Passed with recommendations | **High: factual error.** The lesson said calling `greet("A", "B")` raises the same `missing 1 required positional argument` error as `greet()` |
| 2 | 4 | 80 | Passed with recommendations | Citation hygiene only |
| 3 | 5 | 64 | Needs revision | 7 citation issues, mostly *false*: "[S2] glossary does not define parameter" - see retrieval fix below |
| 4 | 5 (citation-aware retrieval, final) | **82** | Passed with recommendations | 23 supported, 1 partial, 1 unsupported; 3 open low/medium citation issues (error-message lines lack a citation) |

The F1 error was verified by running Python 3.12:

```
greet()          -> TypeError: greet() missing 1 required positional argument: 'name'
greet("A", "B")  -> TypeError: greet() takes 1 positional argument but 2 were given
```

The fix was **applied**: only that passage changed, and both error messages are now shown.

### QC Layer 2 - Instructional quality

| Run | Revision | Score | Verdict | Key finding |
|---|---|---|---|---|
| 1 | 1 | **72** | Passed with recommendations | Time compliance 4/10: knowledge check 4 min for 6 questions incl. 3 written; activity overloaded |
| 2 | 4 | 75 | Passed with recommendations | **High: Q5 option D is mis-explained** |
| 3 | 5 (final) | **76** | Passed with recommendations | Remaining: concepts section dense (11 subtopics in 13 min), activity mixes a SyntaxError line into a runnable file |

- Activity reduced from 4 to 3 calls: **applied**.
- Knowledge-check time: the suggestion quoted the rendered heading `## Knowledge check (4 min)`,
  which is not editable text, so the apply engine reported a **conflict** instead of guessing. The
  instructor changed the timings in the editor (concepts 15 → 13 min, check 4 → 6 min, autosaved) and
  the QC prompts were tightened to never quote headings.
- Q5: option D `calculate_cost(0.74, item="bananas", quantity=6)` was explained as a
  positional-after-keyword error. Running it gives `TypeError: calculate_cost() got multiple values
  for argument 'item'`. QC's suggestion was to rewrite D into a duplicate of option C. **Rejected** in
  favour of an instructor edit that keeps D as a distinct distractor and gives the correct
  explanation.

### Manual factual verification

Every code sample in the lesson was executed: `f(4) = 17`; `student('John')` uses the defaults;
the positional-after-keyword `SyntaxError` and the default-before-non-default `SyntaxError`
messages match Python 3.12 exactly; a function without `return` gives `None`;
`add_item()` gives `missing 2 required positional arguments`. Definitions of parameter vs argument
match the Python glossary and FAQ.

---

## Extra live run - SQL INNER and LEFT JOINs

Run after the research fixes below, to confirm them on a new topic (*Explain how INNER JOIN and LEFT
JOIN combine rows from two tables and predict the result of each on sample data.*): 7/7 steps,
17 verified sources (Microsoft SQL Server docs and Microsoft Learn, Wikipedia, W3Schools, MySQL
tutorial, AWS migration docs, *SQL Queries for Mere Mortals*, 5 English videos), **no duplicate
URLs**, 174 evidence passages, 9 sections / 6 questions / 45 minutes. QC 1: **74**, passed with
recommendations (uncited core facts such as INNER JOIN commutativity and row fan-out; minor citation
mismatches). QC 2: **79**, passed with recommendations (dense 8-minute concept section, 4 minutes for
6 questions, examples show answers before inviting a prediction). The same book appeared twice under
two subtitles; book de-duplication now compares the main title only.

## Bugs found during testing and fixed

| Bug | Fix |
|---|---|
| fpdf2 crashed on inline formatting inside table cells and on literal `<placeholder>` text | Cell content flattened; stray `<` escaped outside code |
| Two search URLs redirecting to the same MDN page produced duplicate sources (S1/S2) | Deduplicate on the final fetched URL (applies to new runs; the recorded HTTP fixture keeps the duplicate) |
| QC 1 judged citations only against the globally top-ranked passages, so a correct citation to a large page (the Python glossary, whose entries lose their heading word when chunked) looked like a wrong citation (score 64) | **Citation-aware retrieval**: each claim also gets the best passage from every source its sentence cites. Same lesson re-scored 82, false findings gone |
| A Hindi-language video was selected for an English lesson (as a source, not used in the lesson) | Non-English titles filtered |
| QC suggestions quoting rendered headings could not be applied | Prompt rule added; the apply engine already reported these as conflicts |
| Dashboard overflowed horizontally with long titles | `minmax(0,1fr)` grid columns |

## Automated tests

`python -m pytest` in `backend/`: unit tests (timing guard, apply engine, citations, reliability
rules, BM25, JSON extraction) and API tests (23 tests total) in demo mode (validation, full workflow, autosave
revision conflict, invalid content rejection, QC reject, all exports including PDF, version
restore, **simulated AI outage → failed step → retry without re-running earlier steps**, placeholder
topic).

## Observations on QC behaviour

- **Run-to-run variance.** The same unchanged lesson can score a few points differently between QC
  runs (HTTP QC 1: 93 vs 92 on revision 8), because claim extraction is model-driven. Verdict bands
  were stable across runs; scores should be read as bands, not exact values.
- **The layers catch different things.** QC 1 caught the Python TypeError error and wrong citations;
  QC 2 caught an assessment item whose explanation contradicted the code, unsafe activity
  instructions and unrealistic timing. Neither layer alone would have caught all of them.
- **Re-running after applying fixes is useful**: QC 2's second run caught a problem introduced by
  a fix accepted from its first run.
