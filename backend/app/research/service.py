"""Research orchestration: search -> verify -> score -> select -> build the evidence store.

Two pipeline steps use this module:
  collect_candidates()  - "Researching trusted resources" (search providers, network)
  analyze_candidates()  - "Analyzing research materials" (fetch + verify pages, score, extract evidence)

Rules that keep research honest:
- A source's metadata only ever comes from a provider response or the fetched page itself.
- Web pages are marked `verified` only if we actually downloaded readable content; only verified
  pages contribute evidence passages that the lesson generator and factual QC can cite.
- URLs the LLM *suggests* (canonical specs/docs) are included only if they can be fetched.
- Books are catalog records: the record is verified, the book content is not read, so books are
  offered as further reading and never used as evidence for claims.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

from ..models import EvidenceChunk, ObjectiveAnalysis, ResearchBundle, Source
from . import providers as P
from .reliability import TIER_SCORE, assess, classify_type, domain_of
from .text import BM25, chunk, overlap, tokens

log = logging.getLogger("kalvium.research")

MAX_WEB_SOURCES = 10
MAX_BOOKS = 4
MAX_VIDEOS = 5
MAX_CHUNKS_PER_SOURCE = 40


def _norm(url: str) -> str:
    u = url.split("#")[0].rstrip("/")
    return u.replace("http://", "https://").replace("://www.", "://")


_OTHER_LANG = ("hindi", "urdu", "tamil", "telugu", "bangla", "bengali", "español", "espanol", "português",
               "in arabic", "en español", "auf deutsch", "en français")


def _looks_english(title: str) -> bool:
    t = title.lower()
    if any(w in t for w in _OTHER_LANG):
        return False
    letters = [ch for ch in title if ch.isalpha()]
    return not letters or sum(ch.isascii() for ch in letters) / len(letters) > 0.85


def collect_candidates(title: str, objective: str, analysis: ObjectiveAnalysis,
                       progress: Optional[Callable[[str], None]] = None) -> dict:
    notes: list[str] = []
    web: list[P.Candidate] = []
    books: list[P.Candidate] = []
    videos: list[P.Candidate] = []

    queries = (analysis.search_queries or [title])[:5]
    book_queries = (analysis.book_queries or [title])[:2]
    video_queries = (analysis.video_queries or [f"{title} explained"])[:2]

    def safe(fn, q, label):
        try:
            return fn(q)
        except Exception as e:
            notes.append(f"{label} search failed for '{q}': {e}")
            log.warning("%s search failed for %r: %s", label, q, e)
            return []

    # Web search providers are rate-sensitive, so queries run sequentially; the three
    # provider families (web/books/videos) run in parallel.
    def run_web():
        out = P.search_web_batch(queries, notes)
        out += safe(P.search_wikipedia, title, "Wikipedia")
        return out

    def run_books():
        out = []
        for q in book_queries:
            out += safe(P.search_books, q, "Book")
        return out

    def run_videos():
        out = []
        for q in video_queries:
            out += safe(P.search_videos, q, "Video")
        return out

    if progress:
        progress(f"Searching the web via {P.web_search_provider()} ({len(queries)} queries), book catalogs and YouTube")
    with ThreadPoolExecutor(3) as ex:
        fw, fb, fv = ex.submit(run_web), ex.submit(run_books), ex.submit(run_videos)
        web, books, videos = fw.result(), fb.result(), fv.result()

    # Canonical URLs proposed by the objective analysis are candidates too - they will only be
    # kept if analyze_candidates() can fetch them.
    for url in analysis.authoritative_urls[:6]:
        web.append(P.Candidate(title="", url=url, provider="llm_suggested"))

    if not web and not books and not videos:
        raise RuntimeError("All research providers failed: " + "; ".join(notes[:3]))

    return {
        "queries": queries + book_queries + video_queries,
        "web": [c.__dict__ for c in web],
        "books": [c.__dict__ for c in books],
        "videos": [c.__dict__ for c in videos],
        "notes": notes,
    }


def analyze_candidates(title: str, objective: str, analysis: ObjectiveAnalysis, raw: dict,
                       progress: Optional[Callable[[str], None]] = None) -> ResearchBundle:
    terms = set(tokens(" ".join([title, objective] + analysis.key_concepts)))
    notes = list(raw.get("notes", []))

    # ---- web: dedupe, fetch, verify
    seen: dict[str, P.Candidate] = {}
    for c in (P.Candidate(**d) for d in raw.get("web", [])):
        key = _norm(c.url)
        if key.endswith(".pdf") or key in seen:
            continue
        seen[key] = c
    # Fetch high-tier domains first, then the rest, capped for latency.
    cands = sorted(seen.values(), key=lambda c: -TIER_SCORE[assess(c.url)[0]])[:18]
    if progress:
        progress(f"Fetching and verifying {len(cands)} web pages")
    with ThreadPoolExecutor(8) as ex:
        pages = list(ex.map(lambda c: P.fetch_page(c.url), cands))

    web_sources: list[tuple[Source, str]] = []
    final_urls: set[str] = set()
    for c, page in zip(cands, pages):
        # Different search URLs can redirect to the same page (e.g. MDN moved paths) - keep one.
        if page.ok:
            if _norm(page.url) in final_urls:
                continue
            final_urls.add(_norm(page.url))
        tier, why = assess(page.url if page.ok else c.url)
        if not page.ok:
            # URLs that came through model text (suggestions, CLI search) must be fetchable to count.
            if c.provider in ("llm_suggested", "claude_cli_web_search"):
                notes.append(f"Suggested URL could not be verified and was dropped: {c.url} ({page.error})")
                continue
            # Keep search results we could not fetch only as clearly-labelled unverified metadata.
            src = Source(id="", title=c.title or c.url, url=c.url, source_type=classify_type(c.url),
                         description=c.snippet, reliability=tier, reliability_note=why, status="failed",
                         verification_note=f"Could not retrieve page: {page.error}. Metadata from search snippet only.",
                         provider=c.provider)
            src.relevance = round(overlap(terms, f"{c.title} {c.snippet}"), 2)
            web_sources.append((src, ""))
            continue
        head_rel = overlap(terms, f"{page.title} {page.description} {c.snippet}")
        body_rel = overlap(terms, page.text[:30000])
        rel = round(0.4 * head_rel + 0.6 * body_rel, 2)
        src = Source(
            id="", title=page.title or c.title or c.url, url=page.url, source_type=classify_type(page.url),
            author=page.author, publisher=page.publisher or domain_of(page.url), published=page.published,
            description=page.description or c.snippet, relevance=rel,
            relevance_note=f"{round(body_rel * 100)}% of the lesson's key terms appear in the page text",
            reliability=tier, reliability_note=why, status="verified",
            verification_note=f"Page fetched (HTTP {page.status}); {len(page.text):,} characters of text extracted.",
            provider=c.provider,
        )
        web_sources.append((src, page.text))

    # Rank: verified first, then reliability tier, then relevance. Drop clearly irrelevant pages.
    web_sources = [w for w in web_sources if w[0].relevance >= 0.2 or w[0].reliability == "high"]
    web_sources.sort(key=lambda w: (w[0].status == "verified", TIER_SCORE[w[0].reliability] + w[0].relevance),
                     reverse=True)
    web_sources = web_sources[:MAX_WEB_SOURCES]

    # ---- books
    if progress:
        progress("Checking book catalog records")
    book_sources: list[Source] = []
    seen_titles = set()
    topic_terms = set(tokens(" ".join([title] + analysis.key_concepts[:4])))
    for c in (P.Candidate(**d) for d in raw.get("books", [])):
        # Same book, different editions/subtitles: compare the main title only.
        tkey = "".join(ch for ch in c.title.split(":")[0].lower() if ch.isalnum())[:50]
        if tkey in seen_titles:
            continue
        seen_titles.add(tkey)
        if not topic_terms & set(tokens(c.title)):
            continue  # e.g. "JavaScript: The Definitive Guide" for an HTTP query
        desc = c.snippet or (P.open_library_description(c.meta["work_key"]) if c.meta.get("work_key") else "")
        # Book relevance = how well the title matches the targeted book query (lesson terms are too
        # many for a short title), nudged up by description overlap with the lesson.
        rel = round(min(1.0, c.meta.get("query_match", 0.5) * 0.7 + overlap(terms, desc) * 0.3), 2)
        tier, why = assess(c.url)
        book_sources.append(Source(
            id="", title=c.title, url=c.url, source_type="book", author=c.meta.get("author"),
            publisher=c.meta.get("publisher"), published=c.meta.get("published"), isbn=c.meta.get("isbn"),
            description=desc, relevance=rel, relevance_note="Title/description match with lesson key terms",
            reliability=tier, reliability_note=why, status="verified",
            verification_note=f"Catalog record retrieved from {c.provider}. Book content was not read; "
                              "listed as further reading, not used as evidence.",
            provider=c.provider))
        if len(book_sources) >= MAX_BOOKS:
            break

    # ---- videos (verify each one exists via oEmbed)
    if progress:
        progress("Verifying YouTube videos")
    vids = []
    seen_ids = set()
    for c in (P.Candidate(**d) for d in raw.get("videos", [])):
        vid = c.meta.get("video_id")
        if not vid or vid in seen_ids:
            continue
        if not _looks_english(c.title):
            continue  # lessons are generated in English; skip videos titled in other languages
        seen_ids.add(vid)
        vids.append(c)
    def video_rel(c: P.Candidate) -> float:
        return max(overlap(topic_terms, c.title), overlap(terms, f"{c.title} {c.snippet}"))

    vids.sort(key=video_rel, reverse=True)
    with ThreadPoolExecutor(5) as ex:
        checks = list(ex.map(lambda c: P.verify_youtube(c.meta["video_id"]), vids[: MAX_VIDEOS + 3]))
    video_sources: list[Source] = []
    for c, check in zip(vids, checks):
        if not check:
            notes.append(f"Video {c.url} could not be verified via oEmbed and was dropped.")
            continue
        channel = check.get("channel") or c.meta.get("channel")
        tier, why = assess(c.url, channel)
        video_sources.append(Source(
            id="", title=check.get("title") or c.title, url=c.url, source_type="video",
            author=channel, channel=channel, published=c.meta.get("published"), duration=c.meta.get("duration"),
            thumbnail=c.meta.get("thumbnail"), video_id=c.meta["video_id"], description=c.snippet,
            relevance=round(video_rel(c), 2),
            relevance_note="Title/description match with lesson topic and key terms",
            reliability=tier, reliability_note=why, status="verified",
            verification_note="Existence, title and channel confirmed via YouTube oEmbed. Video content was not analysed.",
            provider=c.provider))
        if len(video_sources) >= MAX_VIDEOS:
            break

    # ---- assign stable ids and build evidence
    sources: list[Source] = []
    evidence: list[EvidenceChunk] = []
    n = 0
    for src, text in web_sources:
        n += 1
        src.id = f"S{n}"
        sources.append(src)
        if text:
            chunks = chunk(text)
            if len(chunks) > MAX_CHUNKS_PER_SOURCE:
                bm = BM25(chunks)
                keep = sorted(i for i, _ in bm.top(" ".join([objective] + analysis.key_concepts), MAX_CHUNKS_PER_SOURCE))
                chunks = [chunks[i] for i in keep] or chunks[:MAX_CHUNKS_PER_SOURCE]
            evidence += [EvidenceChunk(source_id=src.id, text=t) for t in chunks]
    for src in book_sources + video_sources:
        n += 1
        src.id = f"S{n}"
        sources.append(src)

    if not any(s.status == "verified" and s.source_type not in ("book", "video") for s in sources):
        notes.append("No web page could be verified - lesson claims will lack retrieved evidence.")

    return ResearchBundle(queries=raw.get("queries", []), sources=sources, evidence=evidence, notes=notes)


def evidence_pack(bundle: ResearchBundle, query: str, per_source: int = 3, max_total: int = 24) -> list[EvidenceChunk]:
    """Pick the most relevant evidence passages for a query, spread across sources."""
    if not bundle.evidence:
        return []
    bm = BM25([e.text for e in bundle.evidence])
    ranked = bm.top(query, k=len(bundle.evidence))
    picked, count = [], {}
    for i, _ in ranked:
        e = bundle.evidence[i]
        if count.get(e.source_id, 0) >= per_source:
            continue
        count[e.source_id] = count.get(e.source_id, 0) + 1
        picked.append(e)
        if len(picked) >= max_total:
            break
    return picked
