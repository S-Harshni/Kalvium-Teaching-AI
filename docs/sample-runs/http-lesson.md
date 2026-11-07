# HTTP Requests and Responses

**Learning objective:** Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.

**Estimated duration:** 44 minutes (limit 45)

**Audience:** Beginner web developers who are comfortable using a browser and basic HTML, and want to understand how the web communicates under the hood  ·  **Difficulty:** beginner

## Overview

HTTP powers nearly every interaction on the web, from loading a page to submitting a form. In this lesson you'll learn how the client-server request/response cycle works, how the two most common HTTP methods—GET and POST—differ in purpose and behavior, and how to read HTTP status codes to quickly diagnose whether a request succeeded, failed because of something the client did, or failed because the server broke. By the end, you'll be able to look at a request or a status code and immediately say what it means.

## Learning objectives

- Describe the HTTP client-server request/response cycle and identify the parts of a request and response
- Explain the purpose, safety, and idempotency of the GET method, including how it sends data via the URL query string
- Explain the purpose, body usage, and idempotency of the POST method, including how it submits data to the server
- Distinguish between 2xx (success), 4xx (client error), and 5xx (server error) status code categories
- Identify what common status codes (200, 201, 400, 401, 403, 404, 500, 502, 503) mean in practice

## Why HTTP Requests and Responses Matter (4 min)

### The web runs on a conversation
Every time you load a page, submit a form, or an app fetches data, your browser (the **client**) and a web server are having a structured conversation called **HTTP** (Hypertext Transfer Protocol). HTTP is an application-layer, client-server protocol: the client opens a connection and sends a **request**, then waits for the server to send back a **response** [S4]. HTTP is also **stateless** — by default the server doesn't remember anything between two separate requests [S4].

Clients and servers exchange individual messages rather than a continuous stream: messages sent by the client are *requests*, and messages sent back are *responses* [S5].

### Analogy: ordering at a counter
Think of HTTP like ordering at a counter. You (the client) walk up and either:
- **Ask to see something** ("Can I see the menu?") — this is like **GET**, you're just retrieving information.
- **Hand over a form or an order** ("Here's my order slip with my choices written on it") — this is like **POST**, you're submitting data for the server to process.

The cashier's reply — "Here you go," "Sorry, we don't have that," or "Our kitchen is down" — maps directly to HTTP **status codes**: success, client error, or server error.

By the end of this lesson you'll be able to read both halves of that conversation fluently.

## What You Need Before Starting (3 min)

### Assumed knowledge
- Basic familiarity with URLs (e.g., `https://example.com/contact`)
- Basic HTML, especially the idea of a `<form>` element
- Comfort opening browser developer tools (optional but helpful for the activity)

### Key vocabulary you'll use
| Term | Quick definition |
|---|---|
| Client | The program initiating the request (usually a browser) [S5] |
| Server | The program that listens for requests and sends responses [S10] |
| Request method ("HTTP verb") | A word describing what the client wants to do, e.g., `GET`, `POST` [S3] |
| Status code | A 3-digit number telling the client whether the request succeeded or failed [S3] |
| Header | Metadata about the request or response, sent as key:value pairs [S3][S4] |
| Body | Optional data attached to a message, such as form data in a request or HTML in a response [S3] |

No prior HTTP knowledge is required — we build everything up from these basics.

## GET and POST: Purpose, Safety, and Idempotency (8 min)

### Anatomy of a request and response
An HTTP request has a start-line (method + target + protocol version), headers, and an optional body; a response has a status line (protocol + status code + reason phrase), headers, and an optional body [S3][S5]. HTTP defines a set of **request methods** to indicate the purpose of a request and what's expected if it succeeds; the two most common are **GET** and **POST** [S4][S8].

### GET: retrieve data
The `GET` method requests a representation of a specified resource. Requests using GET **should only retrieve data and should not contain a request body** — the semantics of sending a body with GET are undefined, and some servers will reject it with a 4xx error [S6][S7][S8]. Instead, GET sends parameters through the **URL query string** (the part after `?`), often as `key=value` pairs [S6][S7]:

```http
GET /contact?name=alex HTTP/1.1
Host: example.com
```

**GET's three defining properties** [S6][S7][S8]:
- **Safe** — Yes. It does not alter server state.
- **Idempotent** — Yes. Making the same GET request once or ten times produces the same result and has the same effect.
- **Cacheable** — Yes. Browsers and intermediaries can store and reuse GET responses.

### POST: submit data
The `POST` method submits an entity (data) to the specified resource, often causing a change in state or side effects on the server, such as creating a new record [S8]. Formally, POST asks the target resource to process the enclosed data according to that resource's own semantics [S10] - creating a resource is one common use, but POST is equally used to submit forms, post messages, or trigger actions such as checkout. Unlike GET, POST data is sent in the **request body**, not the URL [S9]:

```http
POST / HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 13

say=Hi&to=Mom
```

**POST's defining properties** [S8]:
- **Safe** — No. It is expected to change server state.
- **Idempotent** — No, by default. Submitting the same POST twice (e.g., resubmitting an order form) can create two resources instead of one.
- **Cacheable** — Only conditionally, when the response explicitly provides freshness information and a matching `Content-Location` header [S8]; in practice, POST responses are generally not cached.

### GET vs. POST at a glance
| Property | GET | POST |
|---|---|---|
| Purpose | Retrieve a representation of a resource [S6] | Submit data to be processed, often creating/changing a resource [S8] |
| Where data goes | URL query string [S6][S7] | Request body [S9] |
| Has a request body? | No (undefined/discouraged) [S6] | Yes [S3][S9] |
| Safe (no server state change) | Yes [S6][S7][S8] | No [S8] |
| Idempotent (repeat = same effect) | Yes [S6][S7][S8] | No [S8] |
| Cacheable | Yes [S6][S7][S8] | Conditional only [S8] |
| Visible in browser history/URL | Yes [S6] | No [S9] |

The method purposes, safety, and idempotency described above are formally defined in **RFC 9110**, the current IETF standard for HTTP semantics (successor to the original RFC 2616); detailed caching behavior is further specified in the companion standard RFC 9111 (HTTP Caching). MDN's documentation draws on both [S1][S2][S10].

### Connecting to HTML you already know
If you've written a `<form>` in HTML, you've likely set (or seen) its `method` attribute:
```html
<form method="get" action="/search">...</form>
<form method="post" action="/users">...</form>
```
`method="get"` makes the browser submit the form's fields as a URL query string (exactly the GET behavior above); `method="post"` makes the browser submit them in the request body (exactly the POST behavior above). This is the same GET/POST distinction you just learned — just expressed as an HTML attribute instead of a raw HTTP message.

## Status Code Categories: 2xx, 4xx, and 5xx (8 min)

### The structure: first digit = category
HTTP response status codes are 3-digit numbers that indicate whether a specific HTTP request was successfully completed [S1][S2]. The **first digit** tells you the category; responses are grouped into **five classes** [S1][S2][S4]:

| Range | Class | Meaning |
|---|---|---|
| 1xx (100–199) | Informational | Request received, continuing process (rarely seen directly) [S1] |
| 2xx (200–299) | **Successful** | The request was received, understood, and accepted [S1] |
| 3xx (300–399) | Redirection | Further action (usually a follow-up request) is needed [S1] |
| 4xx (400–499) | **Client error** | The request sent by the client was invalid [S1] |
| 5xx (500–599) | **Server error** | The server failed to fulfill an apparently valid request [S1] |

These categories and the codes within them are defined by **RFC 9110** [S1][S2]. If you ever see a code not in the standard list, it's a non-standard, server-specific response [S1].

### 2xx — Success
- **200 OK** — The request succeeded; meaning depends on the method. For GET, the resource is fetched and returned in the body; for POST, a resource describing the result of the action is returned [S1][S2].
- **201 Created** — A new resource was successfully created, commonly returned after a successful POST [S1][S3]. Example: creating a user returns `201 Created` with a `Location` header pointing to the new resource [S3].
- **204 No Content** — The request succeeded, but there is no additional content to send in the response body (common after a successful delete or an autosave) [S1][S10].

### 4xx — Client error (something wrong with the request)
- **400 Bad Request** — The server cannot or will not process the request due to a client-side problem, e.g., malformed syntax [S1][S2].
- **401 Unauthorized** — Semantically means "unauthenticated": the client must authenticate itself before getting the requested response [S1][S2].
- **403 Forbidden** — The client's identity is known, but it doesn't have access rights to the content [S1][S2].
- **404 Not Found** — The server cannot find the requested resource [S1][S2].

### 5xx — Server error (something wrong on the server)
- **500 Internal Server Error** — A generic error meaning the server hit a problem it doesn't have a more specific 5xx code for [S1][S2].
- **501 Not Implemented** — The request method isn't supported by the server (note: GET and HEAD must always be supported) [S1][S2].
- **502 Bad Gateway** — The server, acting as a gateway/proxy, got an invalid response from an upstream server [S1][S2].
- **503 Service Unavailable** — The server is not ready to handle the request, often due to overload or maintenance [S1][S2].

### The core distinction
- **2xx** = "It worked."
- **4xx** = "*You* (the client) sent something wrong." Fix the request.
- **5xx** = "*I* (the server) broke." The client usually can't fix this by changing the request.

## Worked Examples: Reading Real Requests and Responses (7 min)

### Example 1 — A GET request and its 200 response
Request:
```http
GET /contact HTTP/1.1
Host: example.com
User-Agent: curl/8.6.0
Accept: */*
```
Response:
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 1234

<!doctype html>
<!-- page content -->
```
*Walkthrough:* The method is `GET`, so no body is sent; the resource path and query (if any) carry all the needed info [S6][S7]. The server responds `200 OK` because the resource was found and returned in the body [S1][S6].

### Example 2 — A POST request and its 201 response
Request (submitting a form that creates a user):
```http
POST /users HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 13

say=Hi&to=Mom
```
Response:
```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: http://example.com/users/123

{"message": "New user created", "user": {"id": 123}}
```
*Walkthrough:* The data (`say=Hi&to=Mom`) is in the **body**, not the URL [S9]. The server used `201 Created` (not just `200`) because a brand-new resource was made, and it tells the client exactly where via the `Location` header [S1][S3].

### Example 3 — Diagnosing an error
You POST a login form with the wrong password and get:
```http
HTTP/1.1 401 Unauthorized
```
*Walkthrough:* `4` as the first digit → client error. Specifically `401` means the client hasn't successfully authenticated [S1][S2] — you'd fix this by resubmitting with correct credentials, not by reporting a bug.

Now compare: your request is fine, but the server's database crashed:
```http
HTTP/1.1 503 Service Unavailable
```
*Walkthrough:* `5` as the first digit → server error. The server isn't ready to handle any request right now [S1][S2] — retrying later (or reporting to the ops team) is the right move, not editing your request.

## Where This Shows Up in Real Development (2 min)

- **Search bars and links** use `GET` because they only fetch data — this is why you can bookmark or refresh a search results page safely [S6][S8].
- **Login, checkout, and "create" forms** use `POST` because they submit data that changes server state (new order, new account) [S8][S9].
- **APIs** (built on the Fetch API or similar) rely on status codes so client code can branch logic: show data on `200`, show a validation message on `400`, prompt re-login on `401`, and show a generic "try again later" on `5xx` [S1][S5].
- Browser **dev tools** (Network tab) let you inspect the exact method, headers, body, and status code of every request your page makes — the fastest way to debug "why didn't my form work?"

## Practical Activity: Classify Real Requests and Status Codes (6 min)

### Step 1 — Inspect a real GET request
1. Open any website in your browser.
2. Open DevTools (F12) → **Network** tab, then reload the page.
3. Click the first HTML request. Note the **Method** (should be `GET`) and the **Status** code (should be `200`).

### Step 2 — Trigger a POST and a 4xx
1. Open `https://httpbin.org/forms/post` — a public test form built for exactly this kind of practice.
2. Fill in any values and submit it with the Network tab open.
3. Click the request in the Network tab: confirm **Method = POST**, note the **Request Payload/body** (your submitted data), and check the status — it should return `200 OK` with your data echoed back as JSON.
4. (Optional) To see a real 401 safely, open `https://httpbin.org/basic-auth/testuser/testpass` in a new (ideally private/incognito) tab. When the browser's login prompt appears, enter any *wrong* username or password and check the Network tab — the response will be `401 Unauthorized`, which is exactly how a real login form's server-side check would respond to bad credentials. Avoid testing wrong passwords on live accounts you actually use, since repeated failed logins can trigger lockouts or security alerts.

### Step 3 — Classify
For each scenario below, write down GET or POST, and the status category (2xx/4xx/5xx):
- Fetching a product page by clicking a link → ______
- Submitting a "Create account" form successfully → ______
- Requesting a page that was deleted (`/old-page`) → ______
- Hitting an API during server maintenance → ______

**Expected outcome:** Page/link = GET, 2xx. Successful signup = POST, 2xx (likely 201). Deleted page = GET, 4xx (404). Maintenance = 5xx (503), independent of method.

**Self-check:** Can you explain *why* resubmitting the same GET request is always safe, but resubmitting the same POST form (e.g., double-clicking "Submit") could create a duplicate order? If yes, you've grasped idempotency [S6][S7][S8].

## Knowledge check (4 min)

Answer all 6 questions below to confirm you can explain GET and POST and distinguish 2xx/4xx/5xx status categories.

**Q1. Which statement correctly describes the GET method?**

- A. GET sends data in the request body and is not idempotent
- B. GET should only retrieve data, sends parameters via the URL query string, and is safe and idempotent
- C. GET always creates a new resource on the server
- D. GET requests cannot be cached by browsers

<details><summary>Answer</summary>

**B. GET should only retrieve data, sends parameters via the URL query string, and is safe and idempotent** — GET requests should only retrieve data and shouldn't contain a body; parameters go in the query string, and GET is classified as safe, idempotent, and cacheable [S6][S7][S8].

</details>

**Q2. True or False: Submitting the same POST request twice (e.g., double-clicking a 'Buy Now' button) is guaranteed to produce the same end result as submitting it once.**

- True
- False

<details><summary>Answer</summary>

**False** — POST is not idempotent by default — repeating it can cause side effects to happen twice, such as creating two orders instead of one [S8].

</details>

**Q3. Where does POST place submitted form data, and where does GET place it?**


<details><summary>Answer</summary>

**POST places data in the request body; GET places data in the URL's query string.** — When a form uses POST, data is appended to the request body instead of the URL; GET appends data as a query string on the URL [S6][S9].

</details>

**Q4. A client successfully creates a new user account via a POST request. Which status code is most appropriate for the server to return?**

- A. 200 OK
- B. 201 Created
- C. 401 Unauthorized
- D. 503 Service Unavailable

<details><summary>Answer</summary>

**B. 201 Created** — 201 Created indicates a resource was successfully created, commonly returned after a successful POST that makes a new resource, often with a Location header [S1][S3].

</details>

**Q5. A request fails because the client sent malformed JSON in the body. What category of status code should the server return, and give one example code.**


<details><summary>Answer</summary>

**4xx client error — e.g., 400 Bad Request.** — 4xx codes indicate the request sent by the client was invalid; 400 Bad Request specifically covers malformed request syntax [S1][S2].

</details>

**Q6. A user's request is well-formed and valid, but the server's database connection crashed while processing it. Which category and example code apply?**

- A. 4xx — 404 Not Found, because the client made an error
- B. 5xx — 500 Internal Server Error, because the server failed to fulfill a valid request
- C. 2xx — 200 OK, because the request format was correct
- D. 3xx — 301 Moved Permanently, because the resource moved

<details><summary>Answer</summary>

**B. 5xx — 500 Internal Server Error, because the server failed to fulfill a valid request** — 5xx codes mean the server failed to fulfill an apparently valid request; 500 is the generic code used when no more specific 5xx error applies [S1][S2].

</details>

## Summary and Key Takeaways (2 min)

### What you learned
- HTTP is a client-server, request/response protocol: clients send requests, servers send responses [S4][S5].
- **GET** retrieves data, sends parameters via the URL query string, has no body, and is **safe**, **idempotent**, and **cacheable** [S6][S7][S8].
- **POST** submits data in the **request body**, often changes server state, and is **not safe** and **not idempotent** by default [S8][S9].
- Status codes are 3-digit numbers whose first digit sets the category: **2xx = success**, **4xx = client error**, **5xx = server error** [S1][S2][S4].
- Common codes to remember: `200 OK`, `201 Created` (2xx); `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (4xx); `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` (5xx) [S1][S2].

### Next steps
Try inspecting more of your own app's requests in DevTools, and look up the 3xx (redirection) and PUT/PATCH/DELETE methods to round out your HTTP vocabulary [S8].

## Supplementary videos

- [HTTP Request Methods | GET, POST, PUT, DELETE](https://www.youtube.com/watch?v=tkfVQK6UxDI) — Quick 3-minute visual recap of GET and POST alongside other HTTP methods, good for reinforcing the GET/POST distinction right after the concepts section.
- [Every HTTP Status Code Explained in 8 Minutes!](https://www.youtube.com/watch?v=nb0xQUcxVj4) — A fast tour through status code categories (1xx-5xx) with examples — useful reinforcement for the 2xx/4xx/5xx section.

## References

- [S1] [HTTP response status codes - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) — Primary source for status code classes and definitions of 200, 201, 400, 401, 403, 404, 500, 501, 502, 503.
- [S3] [HTTP messages - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages) — Supports anatomy of requests/responses, status line, headers, body, and the 201 Created example.
- [S4] [HTTP: Hypertext Transfer Protocol | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP) — Supports the client-server model, statelessness, and overview of methods/status code classes.
- [S5] [Overview of HTTP - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) — Supports the general request/response cycle description and response elements.
- [S6] [GET request method - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET) — Primary source for GET's safety, idempotency, cacheability, lack of body, and query string usage.
- [S8] [HTTP request methods - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) — Primary source for POST's definition and the safe/idempotent/cacheable comparison table.
- [S9] [Sending form data - Learn web development | MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data) — Source for GET vs POST form submission examples and request body usage.
- [S10] [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — Official IETF standard underlying method and status code semantics; cited for authoritative definitions.
- [S11] [HTTP: The Definitive Guide](https://openlibrary.org/works/OL16026044W) — Further reading on HTTP protocol fundamentals beyond this lesson.
