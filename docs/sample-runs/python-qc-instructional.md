# Instructional Quality Report - Python Functions and Parameters


**Overall score:** 76/100  ·  **Verdict:** Passed with recommendations  ·  Lesson revision 5  ·  2026-11-07T05:47:09+00:00  ·  claude_cli:sonnet

This lesson is well-aligned to its objective, with clear explanations, strong analogies, relevant examples, and a knowledge check that maps directly onto each learning-objective part. Its main weakness is pacing: the concepts section folds in several non-objective topics (return, scope, docstrings) that crowd out time for the core positional/keyword material, and both the activity and knowledge check pack more cognitive work than their minute allotments realistically support, with the activity's final step also risking a confusing script-wide failure for beginners.

## Scoring methodology

Score = sum of ten rubric criteria scored 0-10 by an independent instructional-design review: Learning objective alignment, Explanation clarity, Logical sequence, Concept completeness, Quality of examples, Practical applicability, Student engagement, Knowledge-check relevance, Difficulty progression, 45-minute time compliance. The time-compliance criterion is forced to 0 by code when section minutes exceed 45. Deterministic checks add issues for missing required sections, fewer than 4 knowledge checks, or objective parts with no knowledge check. Verdict: 'Needs revision' if any critical issue, any objective part not covered, the 45-minute limit is exceeded, or score < 70; 'Passed' if score >= 85 and no high-severity issue; otherwise 'Passed with recommendations'.

## Rubric

| Criterion | Score | Notes |
|---|---|---|
| Learning objective alignment | 9/10 | All five objective parts (def keyword, calling, parameter/argument distinction, positional args, keyword args) are explicitly taught in the concepts section, reinforced in worked examples, practiced in the activity, and directly tested in the knowledge check. Alignment is tight and traceable end-to-end. |
| Explanation clarity | 8/10 | The vending-machine analogy, the parameter-vs-argument comparison table, and the explicit TypeError/SyntaxError examples are unusually clear for a beginner audience. One clarity gap: the lesson never explains that a SyntaxError is a parse-time failure (before any code runs) while a TypeError is a run-time failure, which matters for how the activity's error-producing call behaves relative to the other calls. |
| Logical sequence | 8/10 | Def → call → parameter/argument distinction → required-argument errors → positional → keyword → ordering rule → defaults → return → scope → docstrings is a sensible progression for the core objective, but return/scope/docstrings are inserted as if core material even though they sit outside the stated objective, adding length without a matching time allowance. |
| Concept completeness | 9/10 | Every objective part is covered in depth, and the lesson even goes beyond it (defaults, return values, scope, docstrings), which is generous for completeness but creates downstream timing pressure (see timing criterion). |
| Quality of examples | 8/10 | Four worked examples progress from a simple trace, to positional defaults, to pure keyword matching, to two distinct error types — strong variety and realistic patterns (student records, cost calculator). The error-timing nuance between the TypeError and SyntaxError examples in Example 4 is not explained, which is a minor clarity gap for examples otherwise well-chosen. |
| Practical applicability | 7/10 | Real-World Applications gives plausible use cases (validation, configurable reports, print()'s signature) but stays at the bullet-point level with no runnable code, so at only 2 minutes it reads more like a list than an application. The activity itself (ticket booking) is a good practical scenario. |
| Student engagement | 6/10 | The 13-minute concepts section is a long, dense run of prose + code blocks with no embedded checkpoint or 'predict the output' prompt until the learner reaches the separate Examples section; engagement relies almost entirely on the activity and knowledge check to break up passive reading. |
| Knowledge-check relevance | 9/10 | Each question maps to a distinct objective part (Q1 def, Q2 call semantics, Q3 parameter/argument, Q4 positional, Q5 keyword, Q6 ordering rule). Q5's distractors are especially strong (D tests a subtle 'multiple values for argument' case). Mixing 3 open-response and 3 MC items is pedagogically fine but adds time risk (see timing). |
| Difficulty progression | 8/10 | Progression from single-parameter greet() to multi-parameter describe_pet() to defaults in student() to all-keyword calculate_cost() to intentional error cases is well-graded; the activity mirrors this by building up to a deliberately broken call. |
| 45-minute time compliance | 4/10 | Arithmetic sums to 45, but per-section load is unrealistic for true beginners: 13 minutes for ~11 subtopics (def, call, params vs args, required-argument errors, positional, keyword, ordering, defaults, return, scope, docstrings) is dense reading alone, let alone comprehension; the 7-minute activity asks a beginner to write a function, make 4 calls, run two different error types, and self-reflect; the 6-minute knowledge check mixes 3 constructed-response items with 3 MC items. Each of these three sections likely needs materially more time than allotted, or the extraneous content (return/scope/docstrings) needs to be trimmed to make room. |

## Objective alignment & coverage

| Objective part | Coverage | Where | Notes |
|---|---|---|---|
| Explain how to define a Python function using the def keyword | full | Defining and Calling Functions (concepts) | Header syntax, parentheses, colon, and indentation are explained with a worked greet() example and tested in Q1. |
| Explain how to call a Python function | full | Defining and Calling Functions (concepts); Knowledge check | Covers call syntax, the required-parentheses rule, and the object-reference-vs-call distinction; tested in Q2. |
| Distinguish parameters from arguments | full | Defining and Calling Functions (concepts); Worked Examples; Knowledge check | Explicit comparison table plus repeated callouts in examples; tested in Q3 and the activity self-check. |
| Demonstrate the use of positional arguments in a function call | full | Defining and Calling Functions (concepts); Worked Examples (Ex. 1-2); Practical Activity; Knowledge check | Taught, exemplified (describe_pet, student()), practiced in the activity, and tested in Q4. |
| Demonstrate the use of keyword arguments in a function call | full | Defining and Calling Functions (concepts); Worked Examples (Ex. 3-4); Practical Activity; Knowledge check | Taught with ordering rule, exemplified (calculate_cost), practiced in the activity, and tested in Q5 and Q6. |

## Clarity assessment

Explanations are generally excellent for the target audience, using concrete analogies (vending machine), a direct comparison table for parameters vs. arguments, and side-by-side code for each new idea. The one recurring clarity gap is around error semantics: the lesson shows both a TypeError (runtime) and a SyntaxError (parse-time) as if they are equivalent failure modes encountered 'when you run the call,' without ever stating that a SyntaxError prevents the whole file from executing at all — a distinction that matters directly for the activity's final step.

## Example quality

The four worked examples are well-chosen and appropriately varied: a basic trace, a multi-default positional case, an all-keyword case, and two contrasting error cases. They reinforce the objective directly and use readable, realistic function names. The only weakness is that Example 4 juxtaposes a TypeError and a SyntaxError without clarifying that the second line would never even be reached if both lines were run together in one script, which could plant a misconception about how/when Python errors surface.

## Activity quality

The ticket-booking activity is a strong, realistic task that requires the learner to produce all three argument-passing styles plus a deliberate failure case, which is pedagogically sound. However, as written, placing the SyntaxError-triggering call 4 in the same file as calls 1–3 (per the instructions) means the file would fail to parse before any of calls 1–3 could run, contradicting the stated 'Expected outcome' that calls 1–3 print correctly. This is a real risk of confusing beginners who won't understand why nothing printed. The task should instruct learners to test the broken call separately (comment it out or add/remove it after confirming the first three calls work).

## Assessment quality

The six knowledge-check questions map cleanly onto each part of the objective and include some genuinely strong distractors (especially Q5's option D, which tests a subtle 'multiple values for argument' TypeError rather than just syntax). Explanations are thorough and reference-backed. The main risk is cognitive-load/time: three of six items (Q1, Q3, Q6) are open constructed-response rather than MC, which typically take longer to compose and self-grade than the 1-minute-per-question pace the 6-minute allotment implies.

## Timing analysis

Total **45 min** of 45 (compliant). Arithmetic sums to 45, but per-section load is unrealistic for true beginners: 13 minutes for ~11 subtopics (def, call, params vs args, required-argument errors, positional, keyword, ordering, defaults, return, scope, docstrings) is dense reading alone, let alone comprehension; the 7-minute activity asks a beginner to write a function, make 4 calls, run two different error types, and self-reflect; the 6-minute knowledge check mixes 3 constructed-response items with 3 MC items. Each of these three sections likely needs materially more time than allotted, or the extraneous content (return/scope/docstrings) needs to be trimmed to make room.

- Why Functions Matter: 4 min
- Before You Start: 3 min
- Defining and Calling Functions: 13 min
- Worked Examples: 8 min
- Real-World Applications: 2 min
- Practical Activity: Build and Call Your Own Function: 7 min
- Knowledge check: 6 min
- Key Takeaways: 2 min

## Missing concepts

- The distinction between when a SyntaxError occurs (before the program runs, during parsing) versus when a TypeError occurs (at call time) is used implicitly in Example 4 and the activity but never explicitly taught, even though it directly affects how the activity's final step should be carried out.

## Suggested restructuring

- Condense the 'Return values', 'Function (local) scope', and 'Docstrings' subsections (none of which are part of the stated objective) into a brief 'Beyond this lesson' callout, freeing several minutes inside the 13-minute concepts block for deeper engagement with positional/keyword mechanics.
- Reallocate the reclaimed time toward the Practical Activity (currently 7 min for a 4-part, two-error-type task) and the Knowledge check (currently 6 min for 3 open-response + 3 MC items), both of which are tight for the target audience.
- Insert one short embedded 'predict the output' micro-check partway through the 13-minute concepts section (e.g., right after the Positional arguments subsection) to break up the long passive-reading stretch before the Worked Examples section.
- Revise the activity's step 4 so the SyntaxError-producing call is tested in isolation (after confirming calls 1–3 work), since leaving it in the same script as calls 1–3 would prevent the whole file from parsing and running.

## Issues & recommended improvements

### I1 · HIGH · timing
- **Location:** Defining and Calling Functions — 'Return values', 'Function (local) scope', and 'Docstrings' subsections
- **Problem:** The 13-minute concepts section packs in roughly eleven distinct subtopics (def syntax, calling, parameter/argument distinction, required-argument errors, positional, keyword, ordering rule, defaults, return values, scope, docstrings) for an audience that has never written a function before. Three of these (return, scope, docstrings) are outside the stated learning objective entirely.
- **Why it matters:** Beginners need processing time for each new idea; cramming non-objective content into an already-dense section risks shallow understanding of the actually-tested concepts (positional/keyword arguments) and makes the 13-minute budget unrealistic.
- **Original:** ### Return values
The `return` statement ends function execution and sends a value back to the caller [S1][S8]. If no `return` statement is present, Python implicitly returns `None` [S8].

```python
def add(a, b):
    return a + b

result = add(2, 3)   # result = 5
```

### Function (local) scope
Variables created inside a function exist only in that function's **local scope** and are not accessible from outside it [S1]. Each call creates a fresh local symbol table [S1].

### Docstrings
A **docstring** — a triple-quoted string as the very first statement in a function body — documents what the function does:

```python
def add(a, b):
    """Return the sum of a and b."""
    return a + b
```
- **Suggested correction:** ### Beyond this lesson
Two quick facts for later: a function can send a value back to its caller with `return` (and returns `None` automatically if you never use `return`), and variables created inside a function only exist inside that function (its **local scope**) — they're not visible outside it. You can also document a function with a **docstring**, a triple-quoted string right after `def`:

```python
def add(a, b):
    """Return the sum of a and b."""
    return a + b
```

We'll dig into `return` and scope properly in a later lesson — for now, keep your focus on defining, calling, and passing positional/keyword arguments.

### I2 · HIGH · activity
- **Location:** Practical Activity, Task step 4
- **Problem:** Step 4 tells the learner to write the keyword-before-positional call as another line in the same file as calls 1–3, then 'run it.' In Python, a SyntaxError is raised when the file is parsed, before any line executes — so if call 4 stays in the same file, calls 1–3 will never print anything either, contradicting the stated expected outcome.
- **Why it matters:** A beginner running the whole file and seeing no output at all (not even the first three correct confirmations) will likely be confused about why 'nothing worked,' undermining the very outcome the activity is trying to produce.
- **Original:** 4. Deliberately write one call that puts a keyword argument before a positional one, run it, and read the error message.
- **Suggested correction:** 4. First run the file with only calls 1–3 and confirm all three booking confirmations print correctly. Then, on a new line below them, add a call that puts a keyword argument before a positional one (e.g., `book_ticket(name="Ana", "Paris")`), save, and run the file again just to see the error message — then comment that line back out before moving on.

### I3 · MEDIUM · activity
- **Location:** Practical Activity, Expected outcome
- **Problem:** The expected-outcome bullets state calls 1–3 print correctly and call 4 raises a SyntaxError, but don't clarify that a SyntaxError anywhere in a Python file blocks the entire file from running — so if call 4 is left in place alongside calls 1–3, the learner would see only the error and no prints at all, not both outcomes simultaneously.
- **Why it matters:** Without this clarification, learners may think they did something wrong when calls 1–3 don't print once call 4 is added, rather than understanding this as expected Python behavior.
- **Original:** - Call 4 raises `SyntaxError: positional argument follows keyword argument` — confirming the ordering rule [S9].
- **Suggested correction:** - Call 4 raises `SyntaxError: positional argument follows keyword argument` — confirming the ordering rule [S9]. Because Python detects this error while reading the file, before running anything, test call 4 by itself (temporarily removing or commenting out calls 1–3, or adding call 4 only after you've already seen calls 1–3 succeed) rather than expecting both outcomes from a single run.

### I4 · MEDIUM · clarity
- **Location:** Worked Examples, Example 4 — Common errors
- **Problem:** The explanation names why each error occurs but never distinguishes that the TypeError happens at call/run time while the SyntaxError happens at parse time (before the program runs at all), even though both are presented back-to-back as if encountered the same way.
- **Why it matters:** Without this distinction, learners can't correctly predict what happens when a SyntaxError-causing line sits in a larger script (e.g., in the Practical Activity), and may misunderstand Python's error model more broadly.
- **Original:** The first error occurs because required arguments were omitted [S7]; the second because a positional argument was placed after a keyword argument [S9].
- **Suggested correction:** The first error occurs because required arguments were omitted [S7] — this is a `TypeError`, detected when Python actually tries to run the call. The second occurs because a positional argument was placed after a keyword argument [S9] — this is a `SyntaxError`, detected while Python reads the file, *before* any code runs. That means a single bad `SyntaxError` line can stop an entire script from running at all, not just the one call.

### I5 · MEDIUM · timing
- **Location:** Knowledge check, overall question mix
- **Problem:** Six minutes is allotted for 6 questions, but 3 of them (Q1, Q3, Q6) are open constructed-response items requiring the learner to compose a written explanation, not just select an answer — this takes meaningfully longer per item than a multiple-choice question.
- **Why it matters:** At a true 1-minute-per-question pace, learners won't have time to actually think through and write out explanations for the open-response items, turning the check into a skim-the-answer exercise rather than genuine retrieval practice.

### I6 · LOW · engagement
- **Location:** End of 'Positional arguments' subsection
- **Problem:** The 13-minute concepts section has no embedded interactive checkpoint between the introduction of positional arguments and the start of the separate Worked Examples section, making it a long passive read.
- **Why it matters:** Without a mid-section checkpoint, learners may lose focus or fail to self-correct a misunderstanding until much later, reducing retention of the positional-argument rule that the rest of the lesson builds on.
- **Suggested correction:** **Quick check:** Before reading on, predict the output of `describe_pet("Rex", "dog")` from the example above, then compare it to the comment shown. If your prediction was wrong, re-read the positional-matching rule before moving on.

## Final verdict

**Passed with recommendations** (76/100)
