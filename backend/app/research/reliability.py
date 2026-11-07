"""Transparent, rule-based source reliability assessment.

We deliberately do NOT ask the LLM to judge reliability: a fixed, documented rule set is
auditable and cannot be talked into trusting a weak source. Tiers:

high   - standards bodies, official language/platform documentation, government and university
         sites, established reference works.
medium - reputable educational publishers and tutorial sites, encyclopedias, library catalog
         records, established educational YouTube channels.
low    - user-generated or unreviewed content (blogs, forums, Q&A, content farms).
"""
from __future__ import annotations

from urllib.parse import urlparse

HIGH = {
    "rfc-editor.org": "IETF RFC Editor - publishes the official RFC standards",
    "datatracker.ietf.org": "IETF Datatracker - official IETF standards repository",
    "ietf.org": "Internet Engineering Task Force - standards body",
    "w3.org": "World Wide Web Consortium - web standards body",
    "whatwg.org": "WHATWG - maintains the HTML/Fetch living standards",
    "developer.mozilla.org": "MDN Web Docs - widely used reference maintained by Mozilla and the community, reviewed against specs",
    "docs.python.org": "Official Python documentation (Python Software Foundation)",
    "peps.python.org": "Python Enhancement Proposals - official language design documents",
    "python.org": "Python Software Foundation - official site",
    "ecma-international.org": "Ecma International - standards body (ECMAScript)",
    "tc39.es": "TC39 - official ECMAScript specification",
    "nist.gov": "US National Institute of Standards and Technology",
    "iso.org": "International Organization for Standardization",
    "britannica.com": "Encyclopaedia Britannica - edited reference work",
    "khanacademy.org": "Khan Academy - non-profit educational publisher",
    "learn.microsoft.com": "Microsoft Learn - official vendor documentation",
    "docs.oracle.com": "Oracle - official vendor documentation",
    "cloud.google.com": "Google Cloud - official vendor documentation",
    "web.dev": "web.dev - Google Chrome team developer guidance",
    "nodejs.org": "Node.js - official documentation",
    "react.dev": "React - official documentation",
}

MEDIUM = {
    "wikipedia.org": "Wikipedia - community-edited encyclopedia; good overview, verify against primary sources",
    "realpython.com": "Real Python - edited tutorial publisher",
    "freecodecamp.org": "freeCodeCamp - non-profit educational publisher",
    "cloudflare.com": "Cloudflare Learning Center - vendor educational content",
    "openlibrary.org": "Open Library (Internet Archive) - library catalog record",
    "books.google.com": "Google Books - catalog record",
    "geeksforgeeks.org": "GeeksforGeeks - tutorial site; quality varies by article",
    "w3schools.com": "W3Schools - beginner tutorial site; simplified, verify details against specs",
    "programiz.com": "Programiz - tutorial site",
    "ibm.com": "IBM - vendor educational content",
    "aws.amazon.com": "AWS - vendor educational content",
    "digitalocean.com": "DigitalOcean community tutorials - edited",
    "oreilly.com": "O'Reilly Media - technical publisher",
    "coursera.org": "Coursera - course provider",
    "edx.org": "edX - course provider",
    "youtube.com": "YouTube video - see channel",
}

LOW = {
    "medium.com", "dev.to", "stackoverflow.com", "stackexchange.com", "reddit.com", "quora.com",
    "hashnode.dev", "blogspot.com", "wordpress.com", "tutorialspoint.com", "javatpoint.com",
}

EDU_CHANNELS = {
    "freecodecamp.org", "cs50", "khan academy", "mit opencourseware", "computerphile",
    "crashcourse", "harvard", "stanford", "corey schafer", "mdn web docs", "google for developers",
    "ibm technology", "python software foundation", "real python", "traversy media",
    "web dev simplified", "fireship", "net ninja", "programming with mosh", "bro code",
}


def domain_of(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _match(host: str, table) -> str | None:
    for d in table:
        if host == d or host.endswith("." + d):
            return d
    return None


def assess(url: str, channel: str | None = None) -> tuple[str, str]:
    """Return (tier, human-readable reason)."""
    host = domain_of(url)
    if host.endswith("youtube.com") or host == "youtu.be":
        if channel and any(c in channel.lower() for c in EDU_CHANNELS):
            return "high", f"YouTube - established educational channel ({channel})"
        return "medium", f"YouTube video from {channel or 'unknown channel'}; content not peer reviewed"
    if d := _match(host, HIGH):
        return "high", HIGH[d]
    if host.endswith(".gov") or host.endswith(".edu") or ".ac." in host or host.endswith(".gov.in"):
        return "high", "Government or academic institution domain"
    if d := _match(host, LOW):
        return "low", f"{d} - user-generated or unreviewed content"
    if d := _match(host, MEDIUM):
        return "medium", MEDIUM[d]
    if host.startswith("docs.") or host.startswith("developer."):
        return "medium", "Vendor/project documentation site"
    return "low", "Unknown publisher - no established editorial review identified"


def classify_type(url: str) -> str:
    host = domain_of(url)
    if _match(host, {"rfc-editor.org", "datatracker.ietf.org", "ietf.org", "w3.org", "whatwg.org",
                     "tc39.es", "ecma-international.org", "iso.org", "peps.python.org"}):
        return "standard"
    if _match(host, {"wikipedia.org", "britannica.com"}):
        return "encyclopedia"
    if (host.startswith("docs.") or host.startswith("developer.") or "learn.microsoft.com" in host
            or _match(host, {"python.org", "nodejs.org", "react.dev", "web.dev"})):
        return "documentation"
    if host.endswith(".edu") or "arxiv.org" in host or "acm.org" in host or "ieee.org" in host:
        return "academic"
    return "website"


TIER_SCORE = {"high": 1.0, "medium": 0.6, "low": 0.25}
