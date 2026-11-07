"""Structured-output helper: ask for JSON, extract it, validate it against a pydantic model.

If the first answer is not valid JSON or fails schema validation, the validation error is sent
back to the model once (a "repair" turn). A second failure raises LLMError so the pipeline marks
the step as failed and the user can retry it.
"""
from __future__ import annotations

import json
import re
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from .base import LLMError, LLMProvider

T = TypeVar("T", bound=BaseModel)


def extract_json(text: str) -> object:
    text = text.strip()
    if text.startswith("```"):
        fence = re.match(r"```(?:json)?\s*(.*?)```\s*$", text, re.S)
        if fence:
            text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fall back to the outermost {...} block.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        return json.loads(text[start : end + 1])
    raise json.JSONDecodeError("No JSON object found", text, 0)


def generate_json(provider: LLMProvider, system: str, user: str, model: type[T],
                  max_tokens: int = 32000) -> T:
    system = system + "\n\nRespond with a single JSON object only: no prose before or after it, no markdown fences."
    raw = provider.complete(system, user, max_tokens=max_tokens)
    try:
        return model.model_validate(extract_json(raw))
    except (json.JSONDecodeError, ValidationError) as first_error:
        repair = (
            f"{user}\n\n---\nYour previous answer could not be used:\n{str(first_error)[:1500]}\n"
            "Return the complete corrected JSON object only."
        )
        raw = provider.complete(system, repair, max_tokens=max_tokens)
        try:
            return model.model_validate(extract_json(raw))
        except (json.JSONDecodeError, ValidationError) as e:
            raise LLMError(f"Model output did not match the expected schema: {str(e)[:300]}") from e
