from __future__ import annotations

from ..config import settings
from .base import LLMError, LLMProvider


def get_provider() -> LLMProvider:
    name = settings.resolved_llm_provider()
    if name == "anthropic":
        from .anthropic_provider import AnthropicProvider
        if not settings.anthropic_api_key:
            raise LLMError("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.")
        return AnthropicProvider(settings.anthropic_api_key, settings.anthropic_model,
                                 settings.anthropic_effort, settings.llm_timeout_s)
    if name == "claude_cli":
        from .claude_cli_provider import ClaudeCLIProvider
        return ClaudeCLIProvider(settings.claude_cli_path, settings.claude_cli_model, settings.llm_timeout_s)
    raise LLMError("No live LLM provider is configured - the app is in demo mode.")
