"""Research providers. Each returns raw candidates; nothing here invents data.

Web search : Tavily (if TAVILY_API_KEY), else Claude's web search tool (Anthropic API key, or the
             local Claude Code CLI), else DuckDuckGo's HTML "lite" endpoint as a best-effort
             fallback (if it rate-limits us we stop and record a note - we never try to evade it).
Reference  : Wikipedia search API (no key).
Books      : Google Books (if GOOGLE_BOOKS_API_KEY) else Open Library search API (no key).
Videos     : YouTube Data API v3 (if YOUTUBE_API_KEY) else the public YouTube results page;
             every video is then confirmed to exist through YouTube's oEmbed endpoint.
Page fetch : downloads a URL and extracts readable text + metadata for verification/evidence.
"""
from __future__ import annotations

import html
import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import parse_qs, quote, quote_plus, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from ..config import settings

log = logging.getLogger("kalvium.research")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/130.0 Safari/537.36 KalviumTeachingAIResearchBot/1.0")
HEADERS = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}


def client(timeout: float = 15.0) -> httpx.Client:
    return httpx.Client(headers=HEADERS, timeout=timeout, follow_redirects=True)


@dataclass
class Candidate:
    title: str
    url: str
    snippet: str = ""
    provider: str = ""
    kind: str = "web"                 # web | book | video
    meta: dict = field(default_factory=dict)


# --------------------------------------------------------------------------- web search
def web_search_provider() -> str:
    if settings.tavily_api_key:
        return "tavily"
    if settings.resolved_llm_provider() == "anthropic":
        return "anthropic_web_search"
    if settings.resolved_llm_provider() == "claude_cli":
        return "claude_cli_web_search"
    return "duckduckgo"


def search_web_batch(queries: list[str], notes: list[str], max_results: int = 6) -> list[Candidate]:
    """Run all web queries with the best available provider. Failures are recorded in `notes`."""
    provider = web_search_provider()
    out: list[Candidate] = []
    if provider in ("anthropic_web_search", "claude_cli_web_search"):
        try:
            fn = _anthropic_web_search if provider == "anthropic_web_search" else _claude_cli_web_search
            return fn(queries, max_results)
        except Exception as e:
            notes.append(f"{provider} failed ({e}); falling back to DuckDuckGo")
            log.warning("%s failed: %s", provider, e)
            provider = "duckduckgo"
    for q in queries:
        try:
            out += _tavily(q, max_results) if provider == "tavily" else _duckduckgo(q, max_results)
        except Exception as e:
            notes.append(f"Web search ({provider}) failed for '{q}': {e}")
            if provider == "duckduckgo":
                break  # respect the block; don't hammer the service
    return out


_SEARCH_SYSTEM = (
    "You are a research assistant for an educational content tool. Use the web search tool to find "
    "authoritative sources (official documentation, standards, university or reputable educational "
    "publishers) for each query. Report ONLY results that the search tool actually returned - never "
    "invent or guess URLs. Reply with JSON only: "
    '{"results": [{"query": "...", "title": "...", "url": "https://...", "snippet": "..."}]}'
)


def _anthropic_web_search(queries: list[str], max_results: int) -> list[Candidate]:
    """Claude API server-side web search. URLs are read from the tool's result blocks, not from
    model prose, so every candidate is a real search result."""
    import anthropic
    c = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=180.0)
    with c.messages.stream(
        model=settings.anthropic_model, max_tokens=8000, system=_SEARCH_SYSTEM,
        output_config={"effort": "low"},
        tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": len(queries) + 1}],
        messages=[{"role": "user", "content": "Search for each of these queries:\n- " + "\n- ".join(queries)}],
    ) as stream:
        msg = stream.get_final_message()
    out: list[Candidate] = []
    for block in msg.content:
        if block.type == "web_search_tool_result" and isinstance(block.content, list):
            for r in block.content[:max_results]:
                out.append(Candidate(title=getattr(r, "title", "") or "", url=r.url, provider="anthropic_web_search"))
    if not out:
        raise RuntimeError("web search returned no results")
    return out


def _claude_cli_web_search(queries: list[str], max_results: int) -> list[Candidate]:
    """Claude Code CLI with only its WebSearch tool enabled. The model reports the URLs it found;
    because that list passes through model text, every URL is later fetched and dropped if it
    cannot be retrieved (see service.analyze_candidates)."""
    import shutil
    import subprocess
    cli = shutil.which(settings.claude_cli_path) or settings.claude_cli_path
    prompt = (f"Search the web for each query below and list up to {max_results} results per query.\n- "
              + "\n- ".join(queries))
    proc = subprocess.run(
        [cli, "-p", "--output-format", "json", "--model", settings.claude_cli_model,
         "--tools", "WebSearch", "--allowedTools", "WebSearch", "--no-session-persistence",
         "--system-prompt", _SEARCH_SYSTEM],
        input=prompt, capture_output=True, text=True, encoding="utf-8", timeout=300)
    payload = json.loads(proc.stdout or "{}")
    if payload.get("is_error") or not payload.get("result"):
        raise RuntimeError(str(payload.get("result") or proc.stderr)[:300])
    from ..llm.json_utils import extract_json
    data = extract_json(payload["result"])
    out = [Candidate(title=r.get("title", ""), url=r["url"], snippet=r.get("snippet", "")[:400],
                     provider="claude_cli_web_search")
           for r in data.get("results", []) if str(r.get("url", "")).startswith("http")]
    if not out:
        raise RuntimeError("web search returned no results")
    return out


def _tavily(query: str, max_results: int) -> list[Candidate]:
    with client(25) as c:
        r = c.post("https://api.tavily.com/search", json={
            "api_key": settings.tavily_api_key, "query": query, "max_results": max_results,
            "search_depth": "advanced", "include_raw_content": False,
        })
        r.raise_for_status()
        data = r.json()
    return [Candidate(title=x.get("title", ""), url=x["url"], snippet=x.get("content", "")[:400],
                      provider="tavily") for x in data.get("results", []) if x.get("url")]


def _duckduckgo(query: str, max_results: int) -> list[Candidate]:
    with client() as c:
        r = c.get(f"https://lite.duckduckgo.com/lite/?q={quote_plus(query)}")
        r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    links = soup.select("a.result-link")
    snippets = soup.select("td.result-snippet")
    out: list[Candidate] = []
    for i, a in enumerate(links):
        href = a.get("href", "")
        if "duckduckgo.com/l/?" in href:  # unwrap redirect
            href = unquote(parse_qs(urlparse("https:" + href if href.startswith("//") else href).query).get("uddg", [""])[0])
        if not href.startswith("http") or "duckduckgo.com/y.js" in href:
            continue  # skip ads
        snippet = snippets[i].get_text(" ", strip=True) if i < len(snippets) else ""
        out.append(Candidate(title=a.get_text(" ", strip=True), url=href, snippet=snippet, provider="duckduckgo"))
        if len(out) >= max_results:
            break
    if not links and "anomaly" in r.text.lower():
        raise RuntimeError("DuckDuckGo temporarily blocked automated search (rate limit).")
    return out


def search_wikipedia(query: str, max_results: int = 2) -> list[Candidate]:
    with client() as c:
        r = c.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query", "list": "search", "srsearch": query, "format": "json", "srlimit": max_results,
        })
        r.raise_for_status()
    out = []
    for x in r.json().get("query", {}).get("search", []):
        title = x["title"]
        out.append(Candidate(
            title=f"{title} - Wikipedia", url=f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}",
            snippet=BeautifulSoup(x.get("snippet", ""), "html.parser").get_text(), provider="wikipedia"))
    return out


# --------------------------------------------------------------------------- books
def search_books(query: str, max_results: int = 4) -> list[Candidate]:
    if settings.google_books_api_key:
        try:
            return _google_books(query, max_results)
        except Exception as e:  # fall back to Open Library
            log.warning("Google Books failed (%s); using Open Library", e)
    return _open_library(query, max_results)


def _google_books(query: str, max_results: int) -> list[Candidate]:
    with client() as c:
        r = c.get("https://www.googleapis.com/books/v1/volumes", params={
            "q": query, "maxResults": max_results, "printType": "books", "key": settings.google_books_api_key})
        r.raise_for_status()
    out = []
    for item in r.json().get("items", []):
        v = item.get("volumeInfo", {})
        isbn = next((i["identifier"] for i in v.get("industryIdentifiers", []) if i["type"] == "ISBN_13"), None)
        out.append(Candidate(
            title=v.get("title", "") + (f": {v['subtitle']}" if v.get("subtitle") else ""),
            url=v.get("infoLink") or f"https://books.google.com/books?id={item['id']}",
            snippet=(v.get("description") or "")[:500], provider="google_books", kind="book",
            meta={"author": ", ".join(v.get("authors", [])) or None, "publisher": v.get("publisher"),
                  "published": v.get("publishedDate"), "isbn": isbn}))
    return out


def _open_library(query: str, max_results: int) -> list[Candidate]:
    with client(20) as c:
        r = c.get("https://openlibrary.org/search.json", params={
            "q": query, "limit": max_results * 3,
            "fields": "key,title,subtitle,author_name,first_publish_year,publisher,isbn,edition_count,language"})
        r.raise_for_status()
        docs = r.json().get("docs", [])
    from .text import overlap, tokens
    qterms = set(tokens(query))
    out = []
    for d in docs:
        if d.get("language") and "eng" not in d["language"]:
            continue
        title = d.get("title", "") + (f": {d['subtitle']}" if d.get("subtitle") else "")
        match = overlap(qterms, title)
        if match < 0.5:  # catalog search is fuzzy; require the title to match most query terms
            continue
        out.append(Candidate(
            title=title, url=f"https://openlibrary.org{d['key']}", provider="openlibrary", kind="book",
            meta={"author": ", ".join(d.get("author_name", [])[:3]) or None,
                  "publisher": (d.get("publisher") or [None])[0],
                  "published": str(d["first_publish_year"]) if d.get("first_publish_year") else None,
                  "isbn": next((i for i in d.get("isbn", []) if len(i) == 13), None),
                  "editions": d.get("edition_count", 0), "work_key": d["key"], "query_match": match}))
    # Best title match first; among equals, books with more editions (better established).
    out.sort(key=lambda x: (x.meta["query_match"], x.meta.get("editions", 0)), reverse=True)
    return out[:max_results]


def open_library_description(work_key: str) -> str:
    try:
        with client(10) as c:
            r = c.get(f"https://openlibrary.org{work_key}.json")
            r.raise_for_status()
            desc = r.json().get("description")
        if isinstance(desc, dict):
            desc = desc.get("value")
        return (desc or "").strip()[:600]
    except Exception:
        return ""


# --------------------------------------------------------------------------- videos
def search_videos(query: str, max_results: int = 5) -> list[Candidate]:
    if settings.youtube_api_key:
        try:
            return _youtube_api(query, max_results)
        except Exception as e:
            log.warning("YouTube Data API failed (%s); using public results page", e)
    return _youtube_page(query, max_results)


def _iso_duration(d: str) -> str:
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return ""
    h, mi, s = (int(x or 0) for x in m.groups())
    return f"{h}:{mi:02d}:{s:02d}" if h else f"{mi}:{s:02d}"


def _youtube_api(query: str, max_results: int) -> list[Candidate]:
    with client() as c:
        r = c.get("https://www.googleapis.com/youtube/v3/search", params={
            "part": "snippet", "q": query, "type": "video", "maxResults": max_results,
            "relevanceLanguage": "en", "safeSearch": "strict", "videoEmbeddable": "true",
            "key": settings.youtube_api_key})
        r.raise_for_status()
        items = r.json().get("items", [])
        ids = [i["id"]["videoId"] for i in items]
        durations = {}
        if ids:
            r2 = c.get("https://www.googleapis.com/youtube/v3/videos", params={
                "part": "contentDetails", "id": ",".join(ids), "key": settings.youtube_api_key})
            if r2.status_code == 200:
                durations = {v["id"]: _iso_duration(v["contentDetails"]["duration"]) for v in r2.json().get("items", [])}
    out = []
    for i in items:
        vid, sn = i["id"]["videoId"], i["snippet"]
        out.append(Candidate(
            title=html.unescape(sn["title"]), url=f"https://www.youtube.com/watch?v={vid}",
            snippet=html.unescape(sn.get("description", ""))[:300], provider="youtube_api", kind="video",
            meta={"video_id": vid, "channel": sn.get("channelTitle"), "published": sn.get("publishedAt", "")[:10],
                  "duration": durations.get(vid), "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                  "verified_by_api": True}))
    return out


def _youtube_page(query: str, max_results: int) -> list[Candidate]:
    """Parse the public results page's embedded JSON (ytInitialData). Fragile by nature, so every
    result is re-verified via oEmbed before it is shown."""
    with client() as c:
        r = c.get(f"https://www.youtube.com/results?search_query={quote_plus(query)}&hl=en")
        r.raise_for_status()
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", r.text, re.S)
    if not m:
        raise RuntimeError("Could not parse YouTube results page.")
    data = json.loads(m.group(1))
    out: list[Candidate] = []

    def walk(node):
        if len(out) >= max_results:
            return
        if isinstance(node, dict):
            vr = node.get("videoRenderer")
            if vr and vr.get("videoId"):
                vid = vr["videoId"]
                title = "".join(x.get("text", "") for x in vr.get("title", {}).get("runs", []))
                channel = "".join(x.get("text", "") for x in vr.get("ownerText", {}).get("runs", []))
                length = vr.get("lengthText", {}).get("simpleText")
                desc = "".join(x.get("text", "") for sn in vr.get("detailedMetadataSnippets", [])
                               for x in sn.get("snippetText", {}).get("runs", []))
                if length:  # skip live streams / shorts without length
                    out.append(Candidate(
                        title=title, url=f"https://www.youtube.com/watch?v={vid}", snippet=desc[:300],
                        provider="youtube_page", kind="video",
                        meta={"video_id": vid, "channel": channel, "duration": length,
                              "published": vr.get("publishedTimeText", {}).get("simpleText"),
                              "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"}))
                return
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(data)
    return out


def verify_youtube(video_id: str) -> Optional[dict]:
    """Confirm a video exists (and get its canonical title/channel) via the public oEmbed API."""
    try:
        with client(10) as c:
            r = c.get("https://www.youtube.com/oembed", params={
                "url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"})
        if r.status_code == 200:
            d = r.json()
            return {"title": d.get("title"), "channel": d.get("author_name")}
    except Exception:
        pass
    return None


# --------------------------------------------------------------------------- page fetch
@dataclass
class FetchedPage:
    url: str
    ok: bool
    status: int = 0
    title: str = ""
    description: str = ""
    author: Optional[str] = None
    published: Optional[str] = None
    publisher: Optional[str] = None
    text: str = ""
    error: str = ""


def fetch_page(url: str, max_chars: int = 120_000) -> FetchedPage:
    try:
        with client(20) as c:
            r = c.get(url)
    except Exception as e:
        return FetchedPage(url=url, ok=False, error=f"{type(e).__name__}: {e}"[:200])
    if r.status_code >= 400:
        return FetchedPage(url=url, ok=False, status=r.status_code, error=f"HTTP {r.status_code}")
    ctype = r.headers.get("content-type", "")
    if "html" not in ctype and "text/plain" not in ctype:
        return FetchedPage(url=str(r.url), ok=False, status=r.status_code,
                           error=f"Unsupported content type ({ctype.split(';')[0]})")
    if "text/plain" in ctype:
        return FetchedPage(url=str(r.url), ok=True, status=r.status_code, text=r.text[:max_chars])

    soup = BeautifulSoup(r.text, "html.parser")

    def meta(*names):
        for n in names:
            tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
            if tag and tag.get("content"):
                return tag["content"].strip()
        return None

    title = meta("og:title") or (soup.title.get_text(strip=True) if soup.title else "")
    page = FetchedPage(
        url=str(r.url), ok=True, status=r.status_code, title=html.unescape(title or ""),
        description=html.unescape(meta("description", "og:description") or "")[:500],
        author=meta("author", "article:author", "DC.Creator"),
        published=meta("article:published_time", "DC.Date.Issued", "dcterms.date", "date", "citation_date"),
        publisher=meta("og:site_name", "DC.Publisher"),
    )
    for tag in soup(["script", "style", "noscript", "svg", "nav", "header", "footer", "aside", "form", "iframe"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = main.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    page.text = text[:max_chars]
    if len(page.text) < 200:
        page.ok = False
        page.error = "Page had too little readable text (may require JavaScript)"
    return page
