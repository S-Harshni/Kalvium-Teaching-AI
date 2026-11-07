# Python Functions and Parameters

**Learning objective:** Explain how to define and call Python functions, distinguish parameters from arguments, and demonstrate positional and keyword arguments.

**Estimated duration:** 45 minutes (limit 45)

**Audience:** Beginner Python programmers who know basic syntax (variables, print, indentation) but have not yet written their own functions  ·  **Difficulty:** beginner

## Overview

This lesson teaches you how to package reusable logic into Python functions using the `def` keyword, and how to supply data to those functions when you call them. You'll learn the precise difference between a parameter (the named slot in a function's definition) and an argument (the actual value you send in), and you'll practice both positional and keyword argument styles. By the end, you'll be able to write, call, and debug simple functions with confidence.

## Learning objectives

- Define a Python function using the `def` keyword, correct syntax, and consistent indentation
- Call a Python function by name with the correct number of arguments, and explain what happens if you don't
- Distinguish a parameter (defined in the function signature) from an argument (passed at call time)
- Write and evaluate function calls that use positional arguments, where order determines matching
- Write and evaluate function calls that use keyword arguments, including mixing positional and keyword correctly

## Why Functions Matter (4 min)

### The problem functions solve
Imagine you need to greet 50 different users by name. Without functions, you'd copy-paste `print("Hello, " + name)` 50 times. A **function** lets you write that logic once and reuse it everywhere.

A Python function is a *self-contained block of code designed to perform a specific task*, which you can call and reuse in different parts of your program [S5]. Functions help organize code and make it more modular, reusable, and easier to maintain [S5].

### Analogy: a function is a vending machine
Think of a function like a vending machine. You don't need to know how it makes coffee internally — you just press a button (call it) and provide coins (arguments). It does its work and gives you a result (the return value). The machine's **slots** for coins are like **parameters**; the actual **coins you insert** are like **arguments**.

By the end of this lesson you'll be able to build your own "vending machines" in Python.

## Before You Start (3 min)

### You should already be comfortable with:
- Writing and running basic Python statements (e.g., `print()`, variable assignment)
- Python's use of **indentation** to define blocks (no curly braces) [S8]
- Basic data types: strings, integers, lists

### Tools needed
- Any Python 3 interpreter (python.org, an IDE, or an online REPL like the one at docs.python.org)

If you can run `print("hello")` and understand that indented lines belong to the same block as the `if` or `for` statement above them, you're ready.

## Defining and Calling Functions (13 min)

### Defining a function
To write a Python function you need a **header** that starts with the `def` keyword, followed by the function name, an optional comma-separated list of parameters inside a required pair of parentheses, and a final colon [S8]. The function's **body** is indented one level to the right and holds the code that runs when the function is called [S8].

```python
def greet(name):
    print("Hello, " + name)
```

Here, `def` is the keyword for defining a function; the function name (`greet`) is followed by parameter(s) in parentheses; the colon signals the start of the function body, marked by indentation [S4].

### Calling a function
You **call** a function by writing its name followed by parentheses, which enclose any necessary arguments [S5]:

```python
greet("Maria")   # Output: Hello, Maria
```

The parentheses are *always required* in a call — even with zero arguments — because leaving them off just references the function object instead of running it [S8].

### Parameters vs. arguments
This is a precise but often-confused pair of terms:

| Term | Where it lives | Definition |
|---|---|---|
| **Parameter** | Function *definition* | The named variable listed inside the parentheses when the function is defined [S2] |
| **Argument** | Function *call* | The actual value sent to the function when it is called [S10] |

```python
def greet(name):      # 'name' is a PARAMETER
    print("Hello, " + name)

greet("Maria")         # "Maria" is an ARGUMENT
```

From the function's perspective: the parameter is the placeholder; the argument is what fills it in at run time [S6]. The two terms are often used loosely as synonyms, but being precise helps you read error messages correctly.

### Matching counts: required arguments
By default, a function must be called with the exact number of arguments it expects [S10]. Calling `greet()` with zero arguments when `greet` requires one raises:

```
TypeError: greet() missing 1 required positional argument: 'name'
```

Calling `greet("A", "B")` with two arguments when `greet` only accepts one raises a different `TypeError`, because Python distinguishes missing arguments from extra arguments [S5][S7]:

```
TypeError: greet() takes 1 positional argument but 2 were given
```

### Positional arguments
**Positional arguments** are matched to parameters strictly by their order in the call [S9][S5]. The first argument fills the first parameter, the second fills the second, and so on.

```python
def describe_pet(animal, name):
    print(f"{name} is a {animal}")

describe_pet("dog", "Rex")   # animal='dog', name='Rex'
describe_pet("Rex", "dog")   # Swapped! animal='Rex', name='dog' — likely wrong
```

### Keyword arguments
**Keyword arguments** are passed as `name=value` pairs and are matched by parameter name rather than position [S7][S2]. This removes the ordering restriction entirely — if you use keyword arguments, order does not matter [S9][S5]:

```python
describe_pet(animal="dog", name="Rex")
describe_pet(name="Rex", animal="dog")   # Same result, different order
```

### The ordering rule: positional before keyword
In a single call you *can* mix positional and keyword arguments, but **positional arguments must come before keyword arguments**, or Python raises a `SyntaxError` [S9][S7]:

```python
describe_pet("dog", name="Rex")   # OK: positional first, then keyword
describe_pet(animal="dog", "Rex")  # SyntaxError: positional argument follows keyword argument
```

### Default parameter values
You can give a parameter a **default value** using `=` in the function signature, which makes that argument optional when calling [S9]:

```python
def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}")

greet("Sam")                 # Hello, Sam  (default used)
greet("Sam", "Hi")           # Hi, Sam     (default overridden)
```

Non-default parameters must come before default parameters in the definition; placing a default parameter first causes a `SyntaxError` [S9][S7].

### Return values
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

## Worked Examples (8 min)

### Example 1 — Define, call, and trace execution
```python
def f(x):
    return x**2 + 1

print(f(4))   # 17
```
Step by step: `def f(x):` defines function `f` with parameter `x`. Calling `f(4)` passes argument `4`, binding `x = 4` inside the function. The body computes `4**2 + 1 = 17` and `return` sends `17` back to the caller [S4].

### Example 2 — Positional order matters
```python
def student(fn, ln='Mark', std='Fifth'):
    print(fn, ln, 'studies in', std, 'Standard')

student('John')                  # John Mark studies in Fifth Standard
student('John', 'Gates', 'Seventh')  # John Gates studies in Seventh Standard
student('John', 'Gates')         # John Gates studies in Fifth Standard
```
Notice how positional arguments fill in left to right, and any parameter not supplied falls back to its default [S9].

### Example 3 — Keyword arguments in any order
```python
def calculate_cost(item, quantity, price):
    print(f"{quantity} {item} cost ${quantity * price:.2f}")

calculate_cost(price=0.74, quantity=6, item="bananas")
# 6 bananas cost $4.44
```
Because each argument is named, Python unambiguously matches it to the correct parameter regardless of order [S5].

### Example 4 — Common errors
```python
def add_item(item_name, quantity):
    print(f"{quantity}x {item_name}")

add_item()
# TypeError: add_item() missing 2 required positional arguments: 'item_name' and 'quantity'

add_item(item_name="Bread", "3")
# SyntaxError: positional argument follows keyword argument
```
The first error occurs because required arguments were omitted [S7]; the second because a positional argument was placed after a keyword argument [S9].

## Real-World Applications (2 min)

- **Data validation functions**: `def is_valid_email(address):` — called with one positional argument wherever you need to check input.
- **Configurable reports**: `def generate_report(data, title="Report", include_chart=False):` — keyword arguments let callers customize only the options they care about, leaving sensible defaults for the rest [S7].
- **APIs and libraries**: Many Python library functions (e.g., `print(*objects, sep=' ', end='\n')`) rely on keyword arguments so users don't have to memorize argument order for rarely-used options.

## Practical Activity: Build and Call Your Own Function (7 min)

### Task
1. Open a Python interpreter or file.
2. Define a function `book_ticket` with three parameters: `name`, `destination`, and `seat="Economy"` (default value).
   ```python
   def book_ticket(name, destination, seat="Economy"):
       """Print a booking confirmation."""
       print(f"{name} is booked to {destination} in {seat} class.")
   ```
3. Call the function **three** different ways (one call per line, so you can compare outputs):
   - Using only positional arguments, including `seat`.
   - Using keyword arguments in a different order than the parameter list.
   - Mixing positional and keyword correctly (positional first), omitting `seat` so the default is used.
4. Deliberately write one call that puts a keyword argument before a positional one, run it, and read the error message.

### Expected outcome
- Calls 1–3 print correct booking confirmations; call 2 shows the default `seat` value overridden.
- Call 4 raises `SyntaxError: positional argument follows keyword argument` — confirming the ordering rule [S9].

### Self-check
- Can you explain, in your own words, why call 4 failed?
- Can you identify which lines are parameters and which are arguments in your code?

## Knowledge check (6 min)

Answer all 6 questions below before checking the explanations.

**Q1. Which keyword is used to begin a Python function definition, and what must immediately follow the function name?**


<details><summary>Answer</summary>

**The `def` keyword; it must be followed by the function name, then a required pair of parentheses (optionally containing parameters), and a colon.** — A function header starts with `def`, the function name, an optional parameter list inside required parentheses, and a final colon [S8].

</details>

**Q2. What happens if you write `greet` (the function name) without parentheses instead of `greet()`?**

- A. The function runs normally
- B. Python raises a SyntaxError
- C. You reference the function object but do not call/execute it
- D. Python returns None immediately

<details><summary>Answer</summary>

**C. You reference the function object but do not call/execute it** — Parentheses are always required to actually call a function; without them, you are just referencing the function object, not invoking it [S8].

</details>

**Q3. In `def add(a, b): return a + b` followed by `add(2, 3)`, which of these are the parameters and which are the arguments?**


<details><summary>Answer</summary>

**`a` and `b` are the parameters (named variables in the function definition); `2` and `3` are the arguments (actual values passed in the call).** — A parameter is the variable listed inside the parentheses in the function definition; an argument is the value sent to the function when called [S10][S2].

</details>

**Q4. True or False: In the call `describe_pet("dog", "Rex")`, Python matches "dog" and "Rex" to parameters based on their names, not their order.**

- True
- False

<details><summary>Answer</summary>

**False** — These are positional arguments, which are matched to parameters strictly by order of appearance in the call, not by name [S9][S5].

</details>

**Q5. Given `def calculate_cost(item, quantity, price):`, which call correctly uses keyword arguments?**

- A. calculate_cost("bananas", 6, 0.74)
- B. calculate_cost(price=0.74, quantity=6, item="bananas")
- C. calculate_cost(item="bananas", 6, 0.74)
- D. calculate_cost(0.74, item="bananas", quantity=6)

<details><summary>Answer</summary>

**B. calculate_cost(price=0.74, quantity=6, item="bananas")** — Keyword arguments use name=value pairs matched by parameter name, so they can appear in any order relative to each other [S5]. A uses only positional arguments. C is invalid because positional arguments (6, 0.74) follow a keyword argument, which is a SyntaxError. D is legal syntax (positional first), but 0.74 is assigned to `item` by position and then `item` is passed again by keyword, so Python raises `TypeError: calculate_cost() got multiple values for argument 'item'`.

</details>

**Q6. Why does `describe_pet(animal="dog", "Rex")` raise a SyntaxError, and what rule explains it?**


<details><summary>Answer</summary>

**Because a positional argument ("Rex") appears after a keyword argument (animal="dog"). The rule is: positional arguments must always come before keyword arguments in a function call.** — Python requires positional arguments to precede keyword arguments in a call; violating this order raises a SyntaxError [S9][S7].

</details>

## Key Takeaways (2 min)

- Define functions with `def name(parameters):` followed by an indented body [S8].
- Call functions with `name(arguments)`; parentheses are always required [S8].
- **Parameters** live in the definition; **arguments** are the values passed at call time [S2][S10].
- **Positional arguments** match by order; **keyword arguments** match by name and can appear in any order relative to each other [S9][S5].
- Positional arguments must come before keyword arguments in a call, or you get a `SyntaxError` [S9].
- Default values (`param=value`) make arguments optional [S9]; missing required arguments raise `TypeError` [S7].
- `return` sends a value back to the caller; without it, a function returns `None` [S8].
- Variables defined inside a function are local to that function [S1].

## Supplementary videos

- [Functions in Python are easy 📞](https://www.youtube.com/watch?v=89cGQjB5R4M) — Good foundational overview of defining and calling functions before diving into argument types
- [Python Arguments in Functions (Positional, Keywords & Default Arguments) #13](https://www.youtube.com/watch?v=Gf-Ws2cXEuA) — Directly covers positional, keyword, and default arguments with examples matching this lesson
- [Python keyword arguments are awesome! 🗝️](https://www.youtube.com/watch?v=7QCHpAtlSMo) — Reinforces keyword argument syntax and why order-independence is useful

## References

- [S1] [4. More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html) — Official tutorial on argument passing rules, positional-only/keyword-only syntax, and scope
- [S2] [Glossary](https://docs.python.org/3/glossary.html#term-parameter) — Precise official definitions of parameter and argument, including keyword vs. positional argument
- [S3] [8. Compound statements](https://docs.python.org/3/reference/compound_stmts.html#function-definitions) — Formal grammar and semantics of function definitions, defaults, and argument binding
- [S4] [Python 3 Notes: User Defined Functions](https://sites.pitt.edu/~naraehan/python3/user_defined_functions.html) — Beginner-friendly walkthrough of def syntax and a worked example
- [S5] [Defining Your Own Python Function – Real Python](https://realpython.com/defining-your-own-python-function/) — Core explanations of defining/calling functions, positional vs keyword arguments, and error messages
- [S6] [Parameter (computer programming) - Wikipedia](https://en.wikipedia.org/wiki/Parameter_%28computer_programming%29) — General definition and distinction between parameters and arguments across languages
- [S7] [Using Python Optional Arguments When Defining Functions – Real Python](https://realpython.com/python-optional-arguments/) — Covers default values, required vs optional parameters, and ordering errors
- [S8] [The Python return Statement: Usage and Best Practices – Real Python](https://realpython.com/python-return-statement/) — Explains explicit vs implicit return and function call basics
- [S9] [Default arguments in Python - GeeksforGeeks](https://www.geeksforgeeks.org/python/default-arguments-in-python/) — Worked examples of default arguments and argument ordering rules
- [S10] [W3Schools.com](https://www.w3schools.com/python/gloss_python_function_arguments.asp) — Simple parameter vs argument explanation and argument-count error example
- [S11] [Automate the Boring Stuff with Python: Practical Programming for Total Beginners](https://openlibrary.org/works/OL17192141W) — Further reading: beginner-friendly book covering functions in practical projects
