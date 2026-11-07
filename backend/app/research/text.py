"""Small text utilities: tokenisation, term-overlap relevance and BM25 passage ranking.

Used to (a) score source relevance and (b) retrieve evidence passages for each lesson claim
during factual QC. Pure Python so it runs anywhere without an embedding service.
"""
from __future__ import annotations

import math
import re
from collections import Counter

STOP = set("""a an the and or of to in on for with by is are was were be been being as at from that this
these those it its into than then there their they them which who whom what when where why how can could
should would will shall may might must do does did done not no yes if else but so such also about over
under between both each other more most some any all only own same too very just your you we our us he she
his her i me my use used using via per vs etc e g ie one two explain describe distinguish demonstrate
understand learn learner lesson students student""".split())


def tokens(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9][a-z0-9+#.\-]*[a-z0-9+#]|[a-z0-9]", text.lower()) if t not in STOP]


def overlap(query_terms: set[str], text: str) -> float:
    """Fraction of query terms that appear in text (0..1)."""
    if not query_terms:
        return 0.0
    t = set(tokens(text))
    return len(query_terms & t) / len(query_terms)


def chunk(text: str, size: int = 700, min_len: int = 120) -> list[str]:
    """Split text into ~size-char passages on paragraph/sentence boundaries."""
    paras = [p.strip() for p in re.split(r"\n\s*\n|\n(?=[A-Z0-9#*\-])", text) if p.strip()]
    out, buf = [], ""
    for p in paras:
        if len(buf) + len(p) + 1 <= size:
            buf = f"{buf}\n{p}" if buf else p
            continue
        if buf:
            out.append(buf)
        while len(p) > size:
            cut = p.rfind(". ", 0, size)
            cut = cut + 1 if cut > size // 3 else size
            out.append(p[:cut].strip())
            p = p[cut:].strip()
        buf = p
    if buf:
        out.append(buf)
    return [re.sub(r"[ \t]+", " ", c) for c in out if len(c) >= min_len]


class BM25:
    def __init__(self, docs: list[str], k1: float = 1.4, b: float = 0.75):
        self.docs = [tokens(d) for d in docs]
        self.k1, self.b = k1, b
        self.avg = sum(len(d) for d in self.docs) / max(len(self.docs), 1)
        df: Counter = Counter()
        for d in self.docs:
            df.update(set(d))
        n = len(self.docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}
        self.tf = [Counter(d) for d in self.docs]

    def scores(self, query: str) -> list[float]:
        q = tokens(query)
        res = []
        for i, d in enumerate(self.docs):
            s, dl = 0.0, len(d) or 1
            for t in q:
                f = self.tf[i].get(t)
                if f:
                    s += self.idf.get(t, 0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self.avg))
            res.append(s)
        return res

    def top(self, query: str, k: int = 3) -> list[tuple[int, float]]:
        sc = self.scores(query)
        ranked = sorted(range(len(sc)), key=lambda i: sc[i], reverse=True)
        return [(i, sc[i]) for i in ranked[:k] if sc[i] > 0]
