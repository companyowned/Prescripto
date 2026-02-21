"""User repository — data access layer for User model."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepo:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str | UUID) -> Optional[User]:
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, email: str, full_name: str, hashed_password: str) -> User:
        user = User(email=email, full_name=full_name, hashed_password=hashed_password)
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user
