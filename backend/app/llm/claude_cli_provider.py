"""Claude via the locally installed Claude Code CLI (`claude -p`).

This lets the app run on a developer machine that is signed in to Claude Code but has no API
key. Tools are disabled and our own system prompt replaces the default one, so the CLI behaves
like a plain completion endpoint.
"""
from __future__ import annotations

import json
import shutil
import subprocess

from .base import LLMError, LLMProvider


class ClaudeCLIProvider(LLMProvider):
    name = "claude_cli"

    def __init__(self, cli_path: str = "claude", model: str = "sonnet", timeout_s: int = 600):
        self.cli = shutil.which(cli_path) or cli_path
        self.model = model
        self.timeout_s = timeout_s

    def complete(self, system: str, user: str, max_tokens: int = 32000) -> str:
        cmd = [
            self.cli, "-p",
            "--output-format", "json",
            "--model", self.model,
            "--tools", "",
            "--no-session-persistence",
            "--system-prompt", system,
        ]
        try:
            proc = subprocess.run(
                cmd, input=user, capture_output=True, text=True, encoding="utf-8",
                timeout=self.timeout_s,
            )
        except FileNotFoundError as e:
            raise LLMError("Claude Code CLI not found (set CLAUDE_CLI_PATH or use another provider).") from e
        except subprocess.TimeoutExpired as e:
            raise LLMError(f"Claude Code CLI timed out after {self.timeout_s}s.") from e

        out = (proc.stdout or "").strip()
        try:
            payload = json.loads(out)
        except json.JSONDecodeError:
            detail = (proc.stderr or out or "no output").strip()[:500]
            raise LLMError(f"Claude Code CLI failed (exit {proc.returncode}): {detail}")
        if payload.get("is_error"):
            raise LLMError(f"Claude Code CLI error: {str(payload.get('result'))[:500]}")
        text = payload.get("result") or ""
        if not text.strip():
            raise LLMError("Claude Code CLI returned an empty response.")
        return text
