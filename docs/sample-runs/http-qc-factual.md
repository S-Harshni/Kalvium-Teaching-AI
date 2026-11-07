# Research & Factual Accuracy Report - HTTP Requests and Responses


**Overall score:** 92/100  ·  **Verdict:** Passed  ·  Lesson revision 8  ·  2026-11-07T05:50:14+00:00  ·  claude_cli:sonnet

The lesson's core factual content on GET/POST semantics (safety, idempotency, cacheability, body vs. query-string usage) and on 2xx/4xx/5xx status categories with specific codes (200, 201, 204, 400, 401, 403, 404, 500, 501, 502, 503) is well supported by the retrieved MDN and RFC 9110 evidence, with no contradictions found. The main weaknesses are a few uncited or loosely-sourced additions — a specific RFC 2616→9110 lineage claim plus an invented reference to RFC 9111 that appears nowhere in the source list, a 204 example tied to 'delete/autosave' not found in evidence, and RFC-style phrasing for 2xx not verbatim in the cited MDN passage — all minor relative to the otherwise accurate and well-cited lesson.

## Scoring methodology

Score = 0.5 x Claim support + 0.3 x Source quality + 0.2 x Citation coverage - Issue penalty. Claim support: share of extracted factual claims backed by evidence retrieved from verified sources (partially supported = half credit). Source quality: mean reliability of verified sources cited in the lesson (high 100 / medium 60 / low 25, rule-based by publisher). Citation coverage: share of teaching sections with at least one valid citation. Issue penalty: critical 15, high 8, medium 3, low 1 per open issue, capped at 40. Verdict: 'Needs revision' if any critical issue, any contradicted claim, or score < 70; 'Passed' if score >= 85 and no high-severity issue; otherwise 'Passed with recommendations'.

| Component | Value | Weight | Detail |
|---|---|---|---|
| Claim support | 94.0 | 0.5 | 22 supported, 3 partial, 0 unsupported, 0 contradicted of 25 claims |
| Source quality | 100.0 | 0.3 | 10 verified sources cited |
| Citation coverage | 100.0 | 0.2 | 5/5 teaching sections cite a source |
| Issue penalty | -5.0 |  | 3 issues |

## Verified claims (22)

- **C1** (supported) HTTP is an application-layer, client-server protocol in which the client opens a connection and sends a request, then waits for the server to send back a response. — _"HTTP follows a classical client-server model, with a client opening a connection to make a request, then waiting until it receives a response from the server."_ [S4]
- **C2** (supported) HTTP is stateless, meaning by default the server doesn't remember anything between two separate requests. — _"HTTP is a stateless protocol, meaning that the server does not keep any session data between two requests"_ [S4]
- **C3** (supported) A status code is a 3-digit number telling the client whether the request succeeded or failed. — _"A numeric status code that indicates whether the request succeeded or failed."_ [S3]
- **C4** (supported) An HTTP request consists of a start-line (method + target + protocol version), headers, and an optional body. — _"The start-line in HTTP/1.x requests ... is called a 'request-line' and is made of three parts: <method> <request-target> <protocol>"_ [S3, S5] — Headers/body-optional part supported by same source.
- **C5** (supported) A response consists of a status line (protocol + status code + reason phrase), headers, and an optional body. — _"The start-line (HTTP/1.1 201 Created above) is called a 'status line' in responses, and has three parts: <protocol> <status-code> <reason-phrase>"_ [S3, S5]
- **C6** (supported) GET requests should only retrieve data and should not contain a request body; the semantics of sending a body with GET are undefined, and some servers will reject it with a 4xx error. — _"Requests using GET should only be used to request data and shouldn't contain a body. Note: The semantics of sending a message body in GET requests are undefined. Some servers may reject the request with a 4XX client error response."_ [S6, S7, S8]
- **C7** (supported) GET sends parameters through the URL query string (the part after '?'), often as key=value pairs. — _"An optional query component preceded by a question-mark ?. Often used to carry identifying information in the form of key=value pairs."_ [S6, S7]
- **C8** (supported) GET is safe, meaning it does not alter server state. — _"Method Safe Idempotent Cacheable GET Yes Yes Yes"_ [S8]
- **C9** (supported) GET is idempotent, meaning making the same GET request once or ten times produces the same result and has the same effect. — _"Method Safe Idempotent Cacheable GET Yes Yes Yes"_ [S8]
- **C10** (supported) GET is cacheable, meaning browsers and intermediaries can store and reuse GET responses. — _"Cacheable Yes"_ [S6, S7, S8]
- **C11** (supported) POST submits an entity (data) to the specified resource, often causing a change in state or side effects on the server, such as creating a new record. — _"The POST method submits an entity to the specified resource, often causing a change in state or side effects on the server."_ [S8]
- **C12** (supported) POST data is sent in the request body, not the URL. — _"When the form is submitted using the POST method, you get no data appended to the URL, and the HTTP request looks like so, with the data included in the request body instead"_ [S9]
- **C13** (supported) POST is not safe by default, as it is expected to change server state. — _"POST No No Conditional"_ [S8]
- **C14** (supported) POST is not idempotent by default; submitting the same POST twice can create two resources instead of one. — _"POST No No Conditional"_ [S8]
- **C15** (supported) POST responses are only conditionally cacheable, when the response explicitly provides freshness information and a matching Content-Location header; in practice POST responses are generally not cached. — _"POST and PATCH are cacheable when responses explicitly include freshness information and a matching Content-Location header."_ [S8]
- **C17** (supported) HTTP response status codes are 3-digit numbers that indicate whether a specific HTTP request was successfully completed, and are grouped into five classes based on the first digit. — _"Responses are grouped in five classes: Informational responses (100–199) Successful responses (200–299) Redirection messages (300–399) Client error responses (400–499) Server error responses (500–599)"_ [S1, S2]
- **C19** (supported) 4xx status codes mean the request sent by the client was invalid (Client error). — _"The server cannot or will not process the request due to something that is perceived to be a client error"_ [S1]
- **C20** (supported) 5xx status codes mean the server failed to fulfill an apparently valid request (Server error). — _"The server has encountered a situation it does not know how to handle."_ [S1]
- **C21** (supported) 201 Created indicates a new resource was successfully created, commonly returned after a successful POST, e.g. creating a user returns 201 Created with a Location header pointing to the new resource. — _"HTTP/1.1 201 Created Content-Type: application/json Location: http://example.com/users/123"_ [S3]
- **C23** (supported) 401 Unauthorized semantically means 'unauthenticated': the client must authenticate itself before getting the requested response. — _"Although the HTTP standard specifies 'unauthorized', semantically this response means 'unauthenticated'. That is, the client must authenticate itself to get the requested response."_ [S1]
- **C24** (supported) 403 Forbidden means the client's identity is known, but it doesn't have access rights to the content. — _"The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to the server."_ [S1]
- **C25** (supported) 501 Not Implemented means the request method isn't supported by the server; GET and HEAD must always be supported. — _"The request method is not supported by the server and cannot be handled. The only methods that servers are required to support (and therefore must not return this code) are GET and HEAD."_ [S1]

## Partially supported claims (3)

- **C16** (partially_supported) The method purposes, safety, and idempotency described are formally defined in RFC 9110, the current IETF standard for HTTP semantics, successor to RFC 2616. — _"The status codes listed below are defined by RFC 9110."_ [S1, S2, S10] — RFC 9110 as the current standard is supported, but no retrieved evidence states that it is the 'successor to RFC 2616' or that RFC 9111 is a 'companion standard' for caching — those specifics are unsupported by the given sources.
- **C18** (partially_supported) 2xx status codes mean the request was received, understood, and accepted (Successful). — _"Successful responses (200–299)"_ [S1, S2] — Evidence confirms 2xx = Successful, but the specific phrasing 'received, understood, and accepted' is RFC wording not present verbatim in the retrieved passages.
- **C22** (partially_supported) 204 No Content means the request succeeded but there is no additional content to send in the response body, common after a successful delete or an autosave. — _"All 1xx (Informational), 204 (No Content), and 304 (Not Modified) responses do not include content."_ [S10] — Core definition supported; the added examples 'successful delete or an autosave' are not stated in the retrieved evidence.

## Unsupported or contradicted claims (0)


## Source quality assessment

| Source | Reliability | Relevance | Status | Cited |
|---|---|---|---|---|
| [S1] HTTP response status codes - HTTP | MDN | high | 49% | verified | yes |
| [S2] HTTP response status codes - HTTP | MDN | high | 47% | verified | yes |
| [S3] HTTP messages - HTTP | MDN | high | 44% | verified | yes |
| [S4] HTTP: Hypertext Transfer Protocol | MDN | high | 35% | verified | yes |
| [S5] Overview of HTTP - HTTP | MDN | high | 33% | verified | yes |
| [S6] GET request method - HTTP | MDN | high | 32% | verified | yes |
| [S7] GET request method - HTTP | MDN | high | 32% | verified | yes |
| [S8] HTTP request methods - HTTP | MDN | high | 28% | verified | yes |
| [S9] Sending form data - Learn web development | MDN | high | 26% | verified | yes |
| [S10] RFC 9110: HTTP Semantics | high | 26% | verified | yes |
| [S11] HTTP: The Definitive Guide | medium | 71% | verified | no |
| [S12] (Hindi) GET /POST / PUT / PATCH / DELETE Request Explained  | HTTP Methods |  Day 4 | medium | 33% | verified | no |
| [S13] HTTP Request Methods | GET, POST, PUT, DELETE | medium | 33% | verified | no |
| [S14] Postman Beginner Tutorial 2026 | HTTP Methods Explained (GET, POST, PUT, PATCH, DELETE) + QUIZ | medium | 25% | verified | no |
| [S15] HTTP & HTTP Methods Explained | GET, POST, PUT, PATCH & DELETE | JavaScript Tutorial #37 | medium | 25% | verified | no |
| [S16] Every HTTP Status Code Explained in 8 Minutes! | medium | 24% | verified | no |

## Issues & recommended corrections

### F1 · MEDIUM · unsupported_claim
- **Location:** GET and POST: Purpose, Safety, and Idempotency > RFC callout paragraph
- **Problem:** The lesson states RFC 9110 is the 'successor to the original RFC 2616' and that caching is 'further specified in the companion standard RFC 9111 (HTTP Caching)', but none of the cited sources (S1, S2, S10) say this, and RFC 9111 does not appear anywhere in the SOURCES list at all.
- **Why it matters:** Learners are given a specific standards-lineage claim with citations attached, implying it was verified against those sources, when in fact the cited passages only say status codes 'are defined by RFC 9110' — the extra lineage detail is uncited and could be wrong or misleading if taken as sourced fact.
- **Evidence:** S1/S2: 'The status codes listed below are defined by RFC 9110.' — no mention of RFC 2616 succession or RFC 9111 in any retrieved passage. (S1, S2, S10)
- **Original:** The method purposes, safety, and idempotency described above are formally defined in **RFC 9110**, the current IETF standard for HTTP semantics (successor to the original RFC 2616); detailed caching behavior is further specified in the companion standard RFC 9111 (HTTP Caching). MDN's documentation draws on both [S1][S2][S10].
- **Suggested correction:** The method purposes, safety, and idempotency described above are formally defined in **RFC 9110**, the current IETF standard for HTTP semantics [S1][S2][S10].

### F2 · LOW · unsupported_claim
- **Location:** Status Code Categories: 2xx, 4xx, and 5xx > 2xx — Success > 204 No Content
- **Problem:** The lesson adds '(common after a successful delete or an autosave)' as typical use cases for 204, but the retrieved evidence only states that 204 responses carry no content — it does not say delete operations or autosaves are the common triggers.
- **Why it matters:** Overly specific, uncited examples can make learners think 204 is tied narrowly to those two scenarios rather than any successful request with nothing to return.
- **Evidence:** S10: 'All 1xx (Informational), 204 (No Content), and 304 (Not Modified) responses do not include content.' (S10)
- **Original:** **204 No Content** — The request succeeded, but there is no additional content to send in the response body (common after a successful delete or an autosave) [S1][S10].
- **Suggested correction:** **204 No Content** — The request succeeded, but there is no additional content to send in the response body — this status code never includes response content [S1][S10].

### F3 · LOW · missing_citation
- **Location:** Status Code Categories table > 2xx row
- **Problem:** The table defines 2xx as 'The request was received, understood, and accepted', which is classic RFC phrasing, but no retrieved passage from the cited source (S1) actually contains this wording — S1 only lists 'Successful responses (200–299)'.
- **Why it matters:** Presenting unquoted RFC-style phrasing next to an MDN citation could mislead a reviewer into thinking MDN states this verbatim; precision in sourcing matters for a factual-accuracy audit.
- **Evidence:** S1: 'Successful responses (200–299)' — no elaboration on 'received, understood, and accepted' in the retrieved text. (S1)
- **Original:** | 2xx (200–299) | **Successful** | The request was received, understood, and accepted [S1] |
- **Suggested correction:** | 2xx (200–299) | **Successful** | The request succeeded [S1] |

## Research gaps

- RFC 9111 (HTTP Caching) is referenced in the lesson text but is not present anywhere in the SOURCES list, so there is no evidence to verify that citation.
- The research plan notes the RFC suite as '9110/9111/9112', but only RFC 9110 was actually retrieved as evidence (S10); no source covers RFC 9112 (message syntax) if the lesson were to expand on standards lineage further.

## Final verdict

**Passed** (92/100)
