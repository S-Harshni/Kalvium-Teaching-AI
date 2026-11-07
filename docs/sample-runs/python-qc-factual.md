# Research & Factual Accuracy Report - Python Functions and Parameters


**Overall score:** 82/100  ·  **Verdict:** Passed with recommendations  ·  Lesson revision 5  ·  2026-11-07T05:50:30+00:00  ·  claude_cli:sonnet

The lesson's core definitions and rules — def syntax, indentation, parameter vs. argument, positional vs. keyword argument matching, ordering rules, default values, return/None behavior, local scope, and docstrings — are all accurately and verbatim supported by the retrieved evidence. The main weaknesses are two illustrative TypeError messages (for a required-argument greet() call and for a too-many-arguments greet() call) that are factually standard Python behavior but are either uncited or cited to sources describing a different function/error condition, plus one uncited 'multiple values for argument' claim in the Q5 explanation.

## Scoring methodology

Score = 0.5 x Claim support + 0.3 x Source quality + 0.2 x Citation coverage - Issue penalty. Claim support: share of extracted factual claims backed by evidence retrieved from verified sources (partially supported = half credit). Source quality: mean reliability of verified sources cited in the lesson (high 100 / medium 60 / low 25, rule-based by publisher). Citation coverage: share of teaching sections with at least one valid citation. Issue penalty: critical 15, high 8, medium 3, low 1 per open issue, capped at 40. Verdict: 'Needs revision' if any critical issue, any contradicted claim, or score < 70; 'Passed' if score >= 85 and no high-severity issue; otherwise 'Passed with recommendations'.

| Component | Value | Weight | Detail |
|---|---|---|---|
| Claim support | 94.0 | 0.5 | 23 supported, 1 partial, 1 unsupported, 0 contradicted of 25 claims |
| Source quality | 73.3 | 0.3 | 9 verified sources cited |
| Citation coverage | 100.0 | 0.2 | 4/4 teaching sections cite a source |
| Issue penalty | -7.0 |  | 3 issues |

## Verified claims (23)

- **C1** (supported) A Python function is a self-contained block of code designed to perform a specific task, which can be called and reused in different parts of a program. — _"A Python function is a self-contained block of code designed to perform a specific task, which you can call and reuse in different parts of your code."_ [S5]
- **C2** (supported) A function header starts with the def keyword, followed by the function name, an optional comma-separated parameter list inside required parentheses, and a final colon. — _"you need a header that starts with the def keyword, followed by the name of the function, an optional list of comma-separated arguments inside a required pair of parentheses, and a final colon."_ [S8] — Evidence calls the def-line items 'arguments'; 'parameters' is the more technically precise term for the definition context, which the lesson correctly uses.
- **C3** (supported) A function's body is indented one level to the right and holds the code that runs when the function is called. — _"the function's code block, which will begin one level of indentation to the right."_ [S8]
- **C4** (supported) A function is called by writing its name followed by parentheses enclosing any necessary arguments. — _"You call a Python function by writing its name followed by parentheses, enclosing any necessary arguments, to execute its code block."_ [S5]
- **C5** (supported) Parentheses are always required when calling a function, even with zero arguments; omitting them just references the function object instead of running it. — _"The parentheses, on the other hand, are always required in a function call. If you forget them, then you won't be calling the function but referencing it as a function object."_ [S8]
- **C6** (supported) A parameter is the named variable listed inside the parentheses when a function is defined. — _"A parameter is the variable listed inside the parentheses in the function definition."_ [S10]
- **C7** (supported) An argument is the actual value sent to a function when it is called. — _"An argument is the value that are sent to the function when it is called."_ [S10]
- **C8** (supported) By default, a function must be called with the exact number of arguments it expects. — _"By default, a function must be called with the correct number of arguments."_ [S10]
- **C11** (supported) Positional arguments are matched to parameters strictly by their order in the call. — _"For positional (non-keyword) arguments, order matters strictly."_ [S9]
- **C12** (supported) Keyword arguments are passed as name=value pairs and are matched by parameter name rather than position, so order does not matter when using them. — _"Keyword arguments allow assigning values by name, and order does not matter."_ [S9]
- **C13** (supported) In a single function call, positional arguments must come before keyword arguments, or Python raises a SyntaxError. — _"SyntaxError: positional argument follows keyword argument"_ [S5]
- **C14** (supported) A parameter can be given a default value using = in the function signature, making that argument optional when calling. — _"If you assign a value to a given parameter in the definition of a function, then that value becomes a default argument value. Parameters with a default value are optional parameters"_ [S5]
- **C15** (supported) Non-default parameters must come before default parameters in a function definition; placing a default parameter first causes a SyntaxError. — _"If you place a parameter with a default value before one without, then Python raises a SyntaxError. Required parameters must always come before optional ones."_ [S7]
- **C16** (supported) The return statement ends function execution and sends a value back to the caller. — _"An explicit return statement immediately ends the function's execution and sends the specified value back to the caller."_ [S8]
- **C17** (supported) If no return statement is present, Python implicitly returns None. — _"If no return statement is present, Python adds one implicitly, which returns None."_ [S8]
- **C18** (supported) Variables created inside a function exist only in that function's local scope and are not accessible from outside it; each call creates a fresh local symbol table. — _"When a function calls another function, or calls itself recursively, a new local symbol table is created for that call."_ [S1]
- **C19** (supported) A docstring is a triple-quoted string as the very first statement in a function body that documents what the function does. — _"The first statement of the function body can optionally be a string literal; this string literal is the function's documentation string, or docstring."_ [S1]
- **C20** (supported) In the worked example, calling f(4) where def f(x): return x**2 + 1 computes 4**2 + 1 = 17 and returns 17. — _">>> def f(x):
 return x**2 + 1
>>> f(4)
17"_ [S4]
- **C21** (supported) In the student function example, calling student('John') with defaults ln='Mark', std='Fifth' prints 'John Mark studies in Fifth Standard'. — _"student('John')
Output
John Mark studies in Fifth Standard"_ [S9]
- **C22** (supported) Calling calculate_cost(price=0.74, quantity=6, item="bananas") with all keyword arguments prints '6 bananas cost $4.44'. — _"calculate_cost(item="bananas", quantity=6, price=0.74)
6 bananas cost $4.44"_ [S5] — Lesson order of keyword args differs from evidence example but keyword matching makes order irrelevant, consistent with evidence.
- **C23** (supported) Calling add_item() when add_item requires item_name and quantity raises TypeError: add_item() missing 2 required positional arguments: 'item_name' and 'quantity'. — _"TypeError: add_item() missing 2 required positional arguments: 'item_name' and 'quantity'"_ [S7]
- **C24** (supported) Calling add_item(item_name="Bread", "3") raises SyntaxError: positional argument follows keyword argument. — _"SyntaxError: positional argument follows keyword argument"_ [S5] — General syntax rule confirmed; applies regardless of specific function name used in the lesson's example.
- **C25** (supported) Python uses indentation, not curly braces, to define blocks. — _"Python defines code blocks using indentation instead of brackets, begin and end keywords, and so on."_ [S8]

## Partially supported claims (1)

- **C10** (partially_supported) Calling greet("A", "B") with two arguments when greet only accepts one raises TypeError: greet() takes 1 positional argument but 2 were given. — _"TypeError: function() takes 4 positional arguments but 5 positional arguments (and 1 keyword-only argument) were given"_ [S5] — S5 confirms the general 'takes N positional arguments but M were given' error pattern for a different (4-parameter) function, supporting the format but not the exact wording for a 1-parameter greet() call. S7's evidence in this set discusses missing arguments, not extra arguments, so it does not support this specific claim.

## Unsupported or contradicted claims (1)

- **C9** (unsupported) Calling greet() with zero arguments when greet requires one raises TypeError: greet() missing 1 required positional argument: 'name'. — _"greet(), no argument is passed, so Python uses the default value "Guest""_ [S9] — The retrieved evidence describes a greet(name='Guest') function WITH a default value, where calling greet() succeeds and prints 'Hello, Guest' rather than raising an error. No retrieved passage shows the exact TypeError text for a required (no-default) single-parameter function. The claim is standard, correct Python behavior, but the cited evidence does not confirm it.

## Source quality assessment

| Source | Reliability | Relevance | Status | Cited |
|---|---|---|---|---|
| [S1] 4. More Control Flow Tools | high | 66% | verified | yes |
| [S2] Glossary | high | 58% | verified | yes |
| [S3] 8. Compound statements | high | 43% | verified | no |
| [S4] Python 3 Notes: User Defined Functions | high | 42% | verified | yes |
| [S5] Defining Your Own Python Function – Real Python | medium | 65% | verified | yes |
| [S6] Parameter (computer programming) - Wikipedia | medium | 58% | verified | yes |
| [S7] Using Python Optional Arguments When Defining Functions – Real Python | medium | 57% | verified | yes |
| [S8] The Python return Statement: Usage and Best Practices – Real Python | medium | 57% | verified | yes |
| [S9] Default arguments in Python - GeeksforGeeks | medium | 51% | verified | yes |
| [S10] W3Schools.com | medium | 50% | verified | yes |
| [S11] Automate the Boring Stuff with Python: Practical Programming for Total Beginners | medium | 57% | verified | no |
| [S12] Tutorial 16-Position And Keyword Argument In Functions|Python In Hindi|Krish Naik | medium | 45% | verified | no |
| [S13] Python Arguments in Functions (Positional, Keywords & Default Arguments) #13 | medium | 36% | verified | no |
| [S14] Python keyword arguments are awesome! 🗝️ | high | 27% | verified | no |
| [S15] Positional-only and keyword-only arguments in Python | medium | 20% | verified | no |
| [S16] Functions in Python are easy 📞 | high | 18% | verified | no |

## Issues & recommended corrections

### F1 · MEDIUM · missing_citation
- **Location:** Defining and Calling Functions > Matching counts: required arguments
- **Problem:** The exact error message 'TypeError: greet() missing 1 required positional argument: \'name\'' is presented as a factual Python output but has no citation attached to it, and none of the retrieved evidence for this claim shows this exact message for a required (no-default) single-parameter function.
- **Why it matters:** Learners rely on exact error-message wording to recognize errors in real code; presenting it without sourcing makes it unverifiable even though it happens to be correct.
- **Evidence:** Retrieved evidence instead shows a greet(name='Guest') function WITH a default value, where greet() succeeds and prints 'Hello, Guest' rather than erroring. (S9)
- **Original:** Calling `greet()` with zero arguments when `greet` requires one raises:

```
TypeError: greet() missing 1 required positional argument: 'name'
```
- **Suggested correction:** Calling `greet()` with zero arguments when `greet` requires one raises [S7]:

```
TypeError: greet() missing 1 required positional argument: 'name'
```

### F2 · MEDIUM · wrong_citation
- **Location:** Defining and Calling Functions > Matching counts: required arguments
- **Problem:** The sentence citing [S5][S7] for the 'extra arguments' TypeError message is only partially supported: S5's retrieved passage shows this error pattern for a 4-parameter function (not greet), and S7's retrieved passage is about MISSING required arguments, not extra/too-many arguments, so S7 does not actually support this specific claim.
- **Why it matters:** Citing a source that addresses a different error condition (missing vs. extra arguments) can mislead learners into thinking that source directly documents this exact scenario, undermining trust in the citations.
- **Evidence:** S5: 'TypeError: function() takes 4 positional arguments but 5 positional arguments (and 1 keyword-only argument) were given'; S7's retrieved content is about 'add_item() missing 2 required positional arguments', not extra-argument errors. (S5, S7)
- **Original:** Calling `greet("A", "B")` with two arguments when `greet` only accepts one raises a different `TypeError`, because Python distinguishes missing arguments from extra arguments [S5][S7]:
- **Suggested correction:** Calling `greet("A", "B")` with two arguments when `greet` only accepts one raises a different `TypeError`, because Python distinguishes missing arguments from extra arguments [S5]:

### F3 · LOW · missing_citation
- **Location:** Knowledge check > Q5 explanation (option D)
- **Problem:** The explanation for option D introduces a specific, uncited technical claim: 'Python raises TypeError: calculate_cost() got multiple values for argument \'item\''. No source is cited and none of the retrieved evidence for this lesson covers this exact error condition (positional argument duplicated by a later keyword argument of the same name).
- **Why it matters:** This is a precise technical detail that a learner could misremember or that could be wrong for a different Python version; leaving it unsourced reduces the lesson's verifiability even though the behavior described is standard CPython behavior.
- **Evidence:** No retrieved passage shows this 'got multiple values for argument' message.
- **Original:** D is legal syntax (positional first), but 0.74 is assigned to `item` by position and then `item` is passed again by keyword, so Python raises `TypeError: calculate_cost() got multiple values for argument 'item'`.
- **Suggested correction:** D is legal syntax (positional first), but 0.74 is assigned to `item` by position and then `item` is passed again by keyword, so Python raises a `TypeError` for a duplicate argument value — a case not covered by this lesson's cited sources, but consistent with Python's documented rule that each parameter can receive only one value [S9].

## Research gaps

- No retrieved evidence confirms the exact TypeError wording for calling a required (no-default) single-parameter function with zero arguments (e.g., 'greet() missing 1 required positional argument'); the closest evidence (S7) demonstrates this pattern only for a two-parameter function.
- No retrieved evidence confirms the exact TypeError wording for calling a one-parameter function with two arguments ('takes 1 positional argument but 2 were given'); the closest evidence (S5) demonstrates the pattern only for a four-parameter function.
- No retrieved evidence addresses the 'got multiple values for argument' TypeError referenced in the Q5 explanation (duplicate assignment via positional + keyword argument of the same name).

## Final verdict

**Passed with recommendations** (82/100)
