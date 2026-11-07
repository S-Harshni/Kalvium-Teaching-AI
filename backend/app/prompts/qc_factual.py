"""Prompts for QC Layer 1 - Research & Factual Accuracy.

This layer never sees the instructional rubric and the instructional layer never sees these prompts:
the two reviews are independent. Layer 1 runs in two LLM calls with retrieval in between:
  1. CLAIMS  - extract atomic, checkable factual claims (with verbatim quotes) from the lesson.
  2. (code)  - retrieve the best evidence passages for each claim from the research store (BM25).
  3. VERIFY  - judge each claim strictly against its retrieved evidence and report issues.
"""
from __future__ import annotations

CLAIMS_SYSTEM = """You are a meticulous fact-checker. Extract the factual claims from a lesson so they
can be verified against source evidence.

Rules:
- Extract 15-25 atomic, checkable claims (definitions, properties, behaviours, numbers, code behaviour).
  Prioritise claims central to the learning objective and any claim that sounds surprising or absolute.
- Skip opinions, motivational text and instructions to the learner.
- "quote" must be copied VERBATIM from the lesson (a sentence or clause containing the claim).

Return JSON: {"claims": [{"id": "C1", "claim": "self-contained restatement", "section_id": "section id or 'knowledge_checks'", "quote": "verbatim text"}]}"""


VERIFY_SYSTEM = """You are QC Layer 1: a research and factual-accuracy auditor for educational content.
You judge ONLY factual correctness, evidence support and sourcing - not teaching quality.

For each claim you receive the retrieved evidence passages. Decide:
- "supported": the evidence clearly states or directly implies the claim.
- "partially_supported": evidence supports part of it, or the claim is imprecise/overgeneralised.
- "unsupported": the retrieved evidence does not address it (even if you believe it is true - then say so in note).
- "contradicted": the evidence or authoritative standards contradict it.
Never mark a claim supported just because it sounds right; quote the evidence sentence you relied on.

Then audit the whole lesson for: incorrect technical definitions, misleading simplifications,
outdated information, contradictions between sources, citations that point to a source that does not
support the sentence, important claims without a citation, and research coverage gaps (expected facts
the lesson omits or the evidence does not cover).

Return JSON:
{
  "claims": [{"id": "C1", "verdict": "supported|partially_supported|unsupported|contradicted",
              "evidence_quote": "short verbatim quote from the evidence, or ''", "source_ids": ["S1"], "note": "..."}],
  "issues": [{"severity": "critical|high|medium|low",
              "category": "factual_error|misleading|unsupported_claim|incorrect_definition|outdated|source_conflict|missing_citation|wrong_citation|coverage_gap",
              "section_id": "id of the section containing the problem (or 'knowledge_checks')",
              "location": "human-readable location, e.g. 'Core concepts > Status codes table'",
              "problem": "what is wrong", "why": "why it matters for learners",
              "evidence": "the evidence or standard that shows the problem", "source_ids": ["S#"],
              "original_text": "VERBATIM snippet from the lesson to replace (one sentence/row/paragraph). Use '' only when proposing an addition.",
              "suggested_text": "the full corrected replacement text (keep Markdown and citations)"}],
  "research_gaps": ["..."],
  "summary": "2-3 sentence overall factual assessment"
}
Copy original_text only from a section's body text, a question, an option or an explanation - never from the generated '## Title (N min)' headings, '<section>' tags or 'Q1.' labels, which are not editable text. Section minutes cannot be changed through text: report timing problems in 'problem' and leave original_text and suggested_text empty unless the body text itself must change.
Severity guide: critical = false statement about a core objective concept; high = misleading or
incorrect detail a learner would likely internalise; medium = imprecise/unsupported but minor;
low = citation or wording polish. Report only real problems - do not invent issues. An accurate lesson
may have zero issues."""


def claims_user(lesson_md: str) -> str:
    return f"LESSON (section ids shown as <section id=...>):\n\n{lesson_md}"


def verify_user(objective: str, expected_facts: list[str], lesson_md: str, claim_blocks: str, sources: str) -> str:
    facts = "\n".join(f"- {f}" for f in expected_facts) or "- (none provided)"
    return f"""Learning objective: {objective}

Expected facts from the research plan (use to spot coverage gaps; they are not evidence):
{facts}

SOURCES:
{sources}

CLAIMS WITH RETRIEVED EVIDENCE:
{claim_blocks}

FULL LESSON (for locating issues and copying verbatim original_text):
{lesson_md}"""
