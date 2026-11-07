"""LLM provider abstraction.

Every provider exposes one method, `complete(system, user) -> str`. Prompt construction, JSON
parsing and schema validation live outside the providers (see json_utils.py), so swapping
Claude for another model means writing one small class.
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class LLMError(RuntimeError):
    """Raised for any failure talking to the model (network, auth, refusal, bad output)."""


class LLMProvider(ABC):
    name: str = "base"
    model: str = ""

    @abstractmethod
    def complete(self, system: str, user: str, max_tokens: int = 32000) -> str: ...

    def describe(self) -> str:
        return f"{self.name}:{self.model}" if self.model else self.name
