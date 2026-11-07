"""Exports: lesson (Markdown/PDF/JSON), reference list, each QC report, and a complete project report.

Markdown is the single source format; the PDF is rendered from the same Markdown (markdown -> HTML ->
fpdf2), so every format shows identical content.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import markdown as md
from fpdf import FPDF

from ..models import FactualReport, InstructionalReport, LessonContent, ResearchBundle
from ..services.lesson_text import to_markdown

VERDICT = {"passed": "Passed", "passed_with_recommendations": "Passed with recommendations",
           "needs_revision": "Needs revision"}


def _demo_banner(lesson: dict) -> str:
    return ("> **DEMO MODE** - recorded sample output replayed without live research or AI calls.\n\n"
            if lesson.get("demo") else "")


def lesson_md(lesson: dict) -> str:
    return _demo_banner(lesson) + to_markdown(LessonContent(**lesson["content"]))


def references_md(lesson: dict) -> str:
    bundle = ResearchBundle(**(lesson.get("research") or {}))
    out = [f"# Research references - {lesson['title']}", "", _demo_banner(lesson)]
    groups = [("Standards & documentation", {"standard", "documentation"}),
              ("Websites & encyclopedias", {"website", "encyclopedia", "academic"}),
              ("Books (further reading - catalog records)", {"book"}), ("Videos", {"video"})]
    for label, kinds in groups:
        items = [s for s in bundle.sources if s.source_type in kinds]
        if not items:
            continue
        out += [f"## {label}", ""]
        for s in items:
            meta = " · ".join(x for x in [s.author, s.publisher, s.published, s.duration and f"{s.duration}"] if x)
            out.append(f"- **[{s.id}] [{s.title}]({s.url})**" + (f" — {meta}" if meta else ""))
            out.append(f"  - Reliability: {s.reliability} ({s.reliability_note}); relevance {round(s.relevance * 100)}%; "
                       f"status: {s.status} — {s.verification_note}")
        out.append("")
    if bundle.notes:
        out += ["## Research notes", ""] + [f"- {n}" for n in bundle.notes] + [""]
    return "\n".join(out)


def _issues_md(issues) -> list[str]:
    if not issues:
        return ["No issues identified.", ""]
    out = []
    for i in issues:
        out += [f"### {i.id} · {i.severity.upper()} · {i.category}" + (f" · _{i.status}_" if i.status != "open" else ""),
                f"- **Location:** {i.location or i.section_id or '-'}",
                f"- **Problem:** {i.problem}"]
        if i.why:
            out.append(f"- **Why it matters:** {i.why}")
        if i.evidence:
            out.append(f"- **Evidence:** {i.evidence}" + (f" ({', '.join(i.source_ids)})" if i.source_ids else ""))
        if i.original_text:
            out.append(f"- **Original:** {i.original_text}")
        if i.suggested_text:
            out.append(f"- **Suggested correction:** {i.suggested_text}")
        out.append("")
    return out


def factual_md(lesson: dict) -> str:
    r = FactualReport(**lesson["qc_factual"])
    out = [f"# Research & Factual Accuracy Report - {lesson['title']}", "", _demo_banner(lesson),
           f"**Overall score:** {r.score}/100  ·  **Verdict:** {VERDICT[r.verdict]}  ·  Lesson revision {r.lesson_revision}  ·  {r.generated_at}  ·  {r.provider}",
           "", r.summary, "", "## Scoring methodology", "", r.methodology, "",
           "| Component | Value | Weight | Detail |", "|---|---|---|---|"]
    out += [f"| {s.label} | {s.value} | {s.weight or ''} | {s.detail} |" for s in r.score_breakdown]
    for label, verdicts in [("Verified claims", {"supported"}), ("Partially supported claims", {"partially_supported"}),
                            ("Unsupported or contradicted claims", {"unsupported", "contradicted"})]:
        items = [c for c in r.claims if c.verdict in verdicts]
        out += ["", f"## {label} ({len(items)})", ""]
        for c in items:
            out.append(f"- **{c.id}** ({c.verdict}) {c.claim}" + (f" — _\"{c.evidence_quote}\"_ [{', '.join(c.source_ids)}]" if c.evidence_quote else "")
                       + (f" — {c.note}" if c.note else ""))
    out += ["", "## Source quality assessment", "", "| Source | Reliability | Relevance | Status | Cited |", "|---|---|---|---|---|"]
    out += [f"| [{s.source_id}] {s.title} | {s.reliability} | {round(s.relevance * 100)}% | {s.status} | {'yes' if s.cited_in_lesson else 'no'} |"
            for s in r.source_assessment]
    out += ["", "## Issues & recommended corrections", ""] + _issues_md(r.issues)
    out += ["## Research gaps", ""] + ([f"- {g}" for g in r.research_gaps] or ["None identified."]) + [""]
    out += ["## Final verdict", "", f"**{VERDICT[r.verdict]}** ({r.score}/100)", ""]
    return "\n".join(out)


def instructional_md(lesson: dict) -> str:
    r = InstructionalReport(**lesson["qc_instructional"])
    out = [f"# Instructional Quality Report - {lesson['title']}", "", _demo_banner(lesson),
           f"**Overall score:** {r.score}/100  ·  **Verdict:** {VERDICT[r.verdict]}  ·  Lesson revision {r.lesson_revision}  ·  {r.generated_at}  ·  {r.provider}",
           "", r.summary, "", "## Scoring methodology", "", r.methodology, "",
           "## Rubric", "", "| Criterion | Score | Notes |", "|---|---|---|"]
    out += [f"| {x.criterion} | {x.score}/10 | {x.note} |" for x in r.rubric]
    out += ["", "## Objective alignment & coverage", "", "| Objective part | Coverage | Where | Notes |", "|---|---|---|---|"]
    out += [f"| {c.objective_part} | {c.coverage} | {c.where} | {c.note} |" for c in r.objective_coverage]
    for label, text in [("Clarity assessment", r.clarity), ("Example quality", r.example_quality),
                        ("Activity quality", r.activity_quality), ("Assessment quality", r.assessment_quality)]:
        out += ["", f"## {label}", "", text or "-"]
    out += ["", "## Timing analysis", "", f"Total **{r.timing.total_minutes} min** of {r.timing.limit_minutes} "
            f"({'compliant' if r.timing.compliant else 'OVER LIMIT'}). {r.timing.note}", ""]
    out += [f"- {s.label}: {int(s.value)} min" for s in r.timing.per_section]
    out += ["", "## Missing concepts", ""] + ([f"- {m}" for m in r.missing_concepts] or ["None identified."])
    out += ["", "## Suggested restructuring", ""] + ([f"- {m}" for m in r.restructuring] or ["None."])
    out += ["", "## Issues & recommended improvements", ""] + _issues_md(r.issues)
    out += ["## Final verdict", "", f"**{VERDICT[r.verdict]}** ({r.score}/100)", ""]
    return "\n".join(out)


def project_md(lesson: dict) -> str:
    parts = [lesson_md(lesson), references_md(lesson)]
    if lesson.get("qc_factual"):
        parts.append(factual_md(lesson))
    if lesson.get("qc_instructional"):
        parts.append(instructional_md(lesson))
    return "\n\n---\n\n".join(parts)


def lesson_json(lesson: dict) -> str:
    keep = ["id", "title", "objective", "settings", "status", "demo", "revision", "created_at", "updated_at",
            "analysis", "content", "research", "qc_factual", "qc_instructional"]
    data = {k: lesson.get(k) for k in keep}
    if data.get("research"):
        data["research"] = {k: v for k, v in data["research"].items() if k != "evidence"}  # keep file small
    return json.dumps(data, indent=2, ensure_ascii=False)


# --------------------------------------------------------------------------- PDF
_FONT_CANDIDATES = [
    ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/segoeuii.ttf", "C:/Windows/Fonts/consola.ttf"),
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
     "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
    ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
     "/System/Library/Fonts/Supplemental/Arial Italic.ttf", "/System/Library/Fonts/Supplemental/Courier New.ttf"),
]


class _PDF(FPDF):
    title_text = ""

    def footer(self):
        self.set_y(-12)
        self.set_font(self.base_font, "", 8)
        self.set_text_color(120, 120, 140)
        self.cell(0, 8, f"Learnora AI  ·  {self.title_text}  ·  page {self.page_no()}", align="C")


def _latin1(text: str) -> str:
    repl = {"\u2014": "-", "\u2013": "-", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
            "\u2026": "...", "\u2192": "->", "\u2190": "<-", "\u00b7": "-", "\u2022": "*", "\u2264": "<=", "\u2265": ">="}
    for k, v in repl.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "replace").decode("latin-1")


_CODE = re.compile(r"(```.*?```|`[^`\n]*`)", re.S)


def _escape_angles(text: str) -> str:
    """Lesson prose may contain literal placeholders like <protocol>; outside code they would be parsed
    as HTML tags. Escape them (code spans/blocks are escaped by the Markdown renderer itself)."""
    parts = _CODE.split(text)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r"<(?!/?(?:details|summary|br)\b)", "&lt;", parts[i])
    return "".join(parts)


def _tag_styles() -> dict:
    from fpdf.fonts import TextStyle
    navy, indigo = (30, 26, 74), (70, 55, 200)
    return {
        "h1": TextStyle(color=navy, font_size_pt=22, t_margin=0, b_margin=1),
        "h2": TextStyle(color=navy, font_size_pt=16, t_margin=4, b_margin=0),
        "h3": TextStyle(color=indigo, font_size_pt=13, t_margin=3, b_margin=0),
        "h4": TextStyle(color=indigo, font_size_pt=11.5, t_margin=2, b_margin=0),
    }


def to_pdf(markdown_text: str, title: str) -> bytes:
    pdf = _PDF(format="A4")
    pdf.title_text = title[:60]
    pdf.set_margins(18, 16, 18)
    pdf.set_auto_page_break(True, 18)
    font_ok = False
    for reg, bold, ital, mono in _FONT_CANDIDATES:
        if all(Path(p).exists() for p in (reg, bold, ital, mono)):
            pdf.add_font("Body", "", reg)
            pdf.add_font("Body", "B", bold)
            pdf.add_font("Body", "I", ital)
            pdf.add_font("Body", "BI", bold)
            for style in ("", "B", "I", "BI"):  # code may contain bold/italic markup
                pdf.add_font("Mono", style, mono)
            font_ok = True
            break
    pdf.base_font = "Body" if font_ok else "Helvetica"
    text = markdown_text if font_ok else _latin1(markdown_text)
    # Emoji and other astral-plane symbols (e.g. in video titles) have no glyphs in document fonts.
    text = re.sub(r"[𐀀-􏿿️]", "", text)
    # <details> blocks are interactive in HTML only; flatten them for print.
    text = re.sub(r"<details><summary>(.*?)</summary>", r"**\1:**", text)
    text = _escape_angles(text)
    text = text.replace("</details>", "")
    html = md.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    # fpdf2 cannot render inline tags inside table cells: flatten cell content to plain text.
    html = re.sub(r"(<(?:td|th)(?:\s[^>]*)?>)(.*?)(</(?:td|th)>)",
                  lambda m: m.group(1) + re.sub(r"<[^>]+>", "", m.group(2)) + m.group(3), html, flags=re.S)
    pdf.add_page()
    pdf.set_font(pdf.base_font, "", 10.5)
    pdf.set_text_color(25, 28, 45)
    pdf.write_html(html, font_family=pdf.base_font, pre_code_font="Mono" if font_ok else "Courier",
                   tag_styles=_tag_styles(), table_line_separators=True)
    return bytes(pdf.output())
