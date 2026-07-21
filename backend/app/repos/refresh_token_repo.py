"""Refresh token repository.

Tokens are opaque, high-entropy random strings — the raw value is only ever
returned to the caller once (at issue time); only its SHA-256 hash is stored,
so a DB leak alone can't be used to resume sessions. Unlike passwords/OTPs,
no slow hashing (bcrypt) is needed since the token itself already has ~380
bits of entropy.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import engine
from app.models.refresh_token import RefreshToken


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class RefreshTokenRepo:
    @staticmethod
    async def ensure_table() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(RefreshToken.__table__.create, checkfirst=True)

    @staticmethod
    async def issue(db: AsyncSession, user_id: UUID) -> Tuple[str, RefreshToken]:
        """Create a new refresh token, returning the raw (unhashed) value once."""
        raw_token = secrets.token_urlsafe(48)
        row = RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return raw_token, row

    @staticmethod
    async def get_active(db: AsyncSession, raw_token: str) -> Optional[RefreshToken]:
        """Look up a non-revoked, non-expired token by its raw value."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == _hash_token(raw_token),
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def revoke(db: AsyncSession, row: RefreshToken) -> None:
        row.revoked_at = datetime.now(timezone.utc)
        await db.flush()

    @staticmethod
    async def revoke_raw(db: AsyncSession, raw_token: str) -> None:
        """Best-effort revoke by raw value — no-op if it doesn't match any row."""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == _hash_token(raw_token))
        )
        row = result.scalar_one_or_none()
        if row and row.revoked_at is None:
            row.revoked_at = datetime.now(timezone.utc)
            await db.flush()
