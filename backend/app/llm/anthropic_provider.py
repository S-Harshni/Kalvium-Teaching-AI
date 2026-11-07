"""Claude via the official Anthropic Python SDK (needs ANTHROPIC_API_KEY)."""
from __future__ import annotations

import anthropic

from .base import LLMError, LLMProvider


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model: str, effort: str = "medium", timeout_s: int = 600):
        self.client = anthropic.Anthropic(api_key=api_key, timeout=float(timeout_s), max_retries=2)
        self.model = model
        self.effort = effort

    def complete(self, system: str, user: str, max_tokens: int = 32000) -> str:
        try:
            # Streaming avoids HTTP timeouts on long lesson generations; we only need the final message.
            with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                thinking={"type": "adaptive"},
                output_config={"effort": self.effort},
                messages=[{"role": "user", "content": user}],
            ) as stream:
                message = stream.get_final_message()
        except anthropic.AuthenticationError as e:
            raise LLMError("Anthropic rejected the API key (check ANTHROPIC_API_KEY).") from e
        except anthropic.RateLimitError as e:
            raise LLMError("Anthropic rate limit reached - wait a moment and retry the step.") from e
        except anthropic.APIStatusError as e:
            raise LLMError(f"Anthropic API error {e.status_code}: {e.message}") from e
        except anthropic.APIConnectionError as e:
            raise LLMError("Could not reach the Anthropic API (network problem).") from e

        if message.stop_reason == "refusal":
            raise LLMError("The model declined this request.")
        if message.stop_reason == "max_tokens":
            raise LLMError("The model output was cut off (max_tokens reached).")
        text = "".join(b.text for b in message.content if b.type == "text")
        if not text.strip():
            raise LLMError("The model returned an empty response.")
        return text
