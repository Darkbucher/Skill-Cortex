"""
core/config.py — Application settings loaded from environment variables.

All configuration is sourced from .env (or the actual environment).
No secrets or connection strings are hardcoded anywhere in the codebase.
See .env.example for the full list of required variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central config object. Add new env vars here — never read os.environ directly elsewhere."""

    # Database
    database_url: str

    # Clerk (Phase 1 — not used in Phase 0, but must be present in .env)
    clerk_secret_key: str
    clerk_publishable_key: str

    # Auth / Domain restriction
    # Server-side domain check uses this value on EVERY authenticated request.
    # See core/security.py. Rules.md §2: domain restriction must be enforced
    # server-side, not just via Google's hd parameter.
    college_domain: str

    # Internal signing
    secret_key: str

    # CORS — restrict API to this origin only
    frontend_origin: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Module-level singleton — import this everywhere instead of re-instantiating
settings = Settings()  # type: ignore[call-arg]
