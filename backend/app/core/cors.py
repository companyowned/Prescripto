"""Shared CORS origin configuration."""

import os


def get_allowed_origins() -> list[str]:
    """Build CORS origin list from ALLOWED_ORIGINS env var (comma-separated).

    Falls back to localhost addresses for local development only.
    """
    raw = os.environ.get("ALLOWED_ORIGINS", "")
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return [
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
    ]
