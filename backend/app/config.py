"""Runtime configuration, read once from environment variables (and an optional .env file).

API keys live only here, on the server. The frontend never sees them; it only receives
the *names* of the active providers from GET /api/status.
"""
from __future__ import annotations

import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
# Load backend/.env first, then the repo-root .env (first value wins).
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env")


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


@dataclass
class Settings:
    # "auto" picks the first available provider: anthropic (API key) -> claude_cli (local
    # Claude Code login) -> demo. Any value can be forced explicitly.
    llm_provider: str = field(default_factory=lambda: _env("LLM_PROVIDER", "auto").lower())
    anthropic_api_key: str = field(default_factory=lambda: _env("ANTHROPIC_API_KEY"))
    anthropic_model: str = field(default_factory=lambda: _env("ANTHROPIC_MODEL", "claude-opus-5-5"))
    anthropic_effort: str = field(default_factory=lambda: _env("ANTHROPIC_EFFORT", "medium"))
    claude_cli_path: str = field(default_factory=lambda: _env("CLAUDE_CLI_PATH", "claude"))
    claude_cli_model: str = field(default_factory=lambda: _env("CLAUDE_CLI_MODEL", "sonnet"))
    llm_timeout_s: int = field(default_factory=lambda: int(_env("LLM_TIMEOUT_SECONDS", "600")))

    tavily_api_key: str = field(default_factory=lambda: _env("TAVILY_API_KEY"))
    youtube_api_key: str = field(default_factory=lambda: _env("YOUTUBE_API_KEY"))
    google_books_api_key: str = field(default_factory=lambda: _env("GOOGLE_BOOKS_API_KEY"))
    # Set RESEARCH_OFFLINE=1 to skip all network research (useful on locked-down networks).
    research_offline: bool = field(default_factory=lambda: _env("RESEARCH_OFFLINE", "0") == "1")

    database_path: Path = field(
        default_factory=lambda: Path(_env("DATABASE_PATH", str(BACKEND_DIR / "data" / "kalvium_teaching.db")))
    )
    cors_origins: list[str] = field(
        default_factory=lambda: [o.strip() for o in _env(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
    )

    def claude_cli_available(self) -> bool:
        return shutil.which(self.claude_cli_path) is not None

    def resolved_llm_provider(self) -> str:
        if self.llm_provider != "auto":
            return self.llm_provider
        if self.anthropic_api_key:
            return "anthropic"
        if self.claude_cli_available():
            return "claude_cli"
        return "demo"


settings = Settings()
