"""User repository — data access layer for User model."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
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
        normalized_email = email.strip().lower()
        result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession, email: str, full_name: str, hashed_password: str, managed_by_id: Optional[UUID] = None
    ) -> User:
        user = User(
            email=email, full_name=full_name, hashed_password=hashed_password, managed_by_id=managed_by_id
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def update(db: AsyncSession, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user
