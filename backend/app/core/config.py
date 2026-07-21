"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings
from pydantic import field_validator


def _require_env(name: str) -> str:
    """Return env var value or raise at import time if missing."""
    value = os.environ.get(name)
    if not value:
        raise ValueError(
            f"Required environment variable '{name}' is not set. "
            "Set it in your .env file or deployment environment."
        )
    return value


class Settings(BaseSettings):
    """Global application settings."""

    # App
    APP_NAME: str = "Prescripto"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database — must be provided via environment; no hardcoded fallback
    DATABASE_URL: str = ""
    INIT_DB_ON_STARTUP: bool = True

    # JWT — must be provided via environment; no weak fallback
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Refresh tokens — long-lived, rotated on each use, revocable server-side.
    # Lets biometric/"remember me" login resume a session indefinitely without
    # re-prompting for a password, without making the short-lived access token itself long-lived.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 180

    # Password reset email / OTP
    PASSWORD_RESET_OTP_EXPIRE_MINUTES: int = 10
    PASSWORD_RESET_OTP_LENGTH: int = 6
    PASSWORD_RESET_MAX_ATTEMPTS: int = 5
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Prescripto"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    # Storage
    STORAGE_BACKEND: str = "local"  # "local" (dev, disk) or "vercel_blob" (prod, persistent)
    UPLOAD_DIR: str = "uploads"
    BLOB_READ_WRITE_TOKEN: str = ""

    # n8n
    N8N_WEBHOOK_URL: str = ""
    N8N_AUTH_KEY: str = ""

    # Vercel Cron — secures GET /medication-reminders/run-cron (Vercel sends this as a Bearer token)
    CRON_SECRET: str = ""

    # Azure Vision (OCR)
    AZURE_VISION_ENDPOINT: str = ""
    AZURE_VISION_KEY: str = ""

    # Gemini / Google GenAI
    GOOGLE_API_KEY: str = ""
    CHAT_LLM_MODEL: str = "gemini-2.5-flash"
    CHAT_TEMPERATURE: float = 0.2

    # Deep link scheme embedded in profile QR (must match Expo `expo.scheme`)
    PROFILE_LINK_QR_SCHEME: str = "dawini"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug(cls, value):
        """Accept deployment-style DEBUG values like release/production."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"debug", "dev", "development"}:
                return True
        return value

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not value:
            raise ValueError(
                "DATABASE_URL is required. Set it in your .env file or environment."
            )
        return value

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if not value:
            raise ValueError(
                "JWT_SECRET_KEY is required. Set it in your .env file or environment."
            )
        if len(value) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long.")
        return value


settings = Settings()
