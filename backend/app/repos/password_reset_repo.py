"""Password reset OTP repository."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine
from app.models.password_reset_otp import PasswordResetOtp


class PasswordResetRepo:
    @staticmethod
    async def ensure_table() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(PasswordResetOtp.__table__.create, checkfirst=True)

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: UUID,
        email: str,
        otp_hash: str,
        expires_at: datetime,
    ) -> PasswordResetOtp:
        reset_otp = PasswordResetOtp(
            user_id=user_id,
            email=email,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )
        db.add(reset_otp)
        await db.flush()
        await db.refresh(reset_otp)
        return reset_otp

    @staticmethod
    async def get_latest_active(db: AsyncSession, user_id: UUID, email: str) -> Optional[PasswordResetOtp]:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(PasswordResetOtp)
            .where(
                PasswordResetOtp.user_id == user_id,
                PasswordResetOtp.email == email,
                PasswordResetOtp.used_at.is_(None),
                PasswordResetOtp.expires_at > now,
            )
            .order_by(desc(PasswordResetOtp.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
