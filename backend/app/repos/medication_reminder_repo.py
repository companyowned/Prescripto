"""Medication Reminder repository — data access layer."""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.medication_reminder import MedicationReminder


class MedicationReminderRepo:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> MedicationReminder:
        reminder = MedicationReminder(**kwargs)
        db.add(reminder)
        await db.flush()
        await db.refresh(reminder)
        return reminder

    @staticmethod
    async def get_by_id(
        db: AsyncSession, reminder_id: UUID
    ) -> Optional[MedicationReminder]:
        result = await db.execute(
            select(MedicationReminder)
            .options(selectinload(MedicationReminder.dose_events))
            .where(
                MedicationReminder.id == reminder_id,
                MedicationReminder.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_reminders(
        db: AsyncSession,
        user_id: UUID,
        active_only: bool = False,
        profile_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[MedicationReminder], int]:
        base_filter = and_(
            MedicationReminder.user_id == user_id,
            MedicationReminder.is_deleted == False,
        )
        if active_only:
            base_filter = and_(base_filter, MedicationReminder.is_active == True)
        if profile_id:
            base_filter = and_(base_filter, MedicationReminder.profile_id == profile_id)

        count_result = await db.execute(
            select(func.count()).select_from(MedicationReminder).where(base_filter)
        )
        total = count_result.scalar()

        result = await db.execute(
            select(MedicationReminder)
            .where(base_filter)
            .order_by(MedicationReminder.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def get_reminders_for_profile(
        db: AsyncSession,
        profile_id: UUID,
        active_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[MedicationReminder], int]:
        """List reminders for a profile (for viewers — ignores reminder.user_id)."""
        base_filter = and_(
            MedicationReminder.profile_id == profile_id,
            MedicationReminder.is_deleted == False,
        )
        if active_only:
            base_filter = and_(base_filter, MedicationReminder.is_active == True)

        count_result = await db.execute(
            select(func.count()).select_from(MedicationReminder).where(base_filter)
        )
        total = count_result.scalar()

        result = await db.execute(
            select(MedicationReminder)
            .where(base_filter)
            .order_by(MedicationReminder.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def get_active_reminders_for_generation(
        db: AsyncSession,
    ) -> list[MedicationReminder]:
        """Get all active, non-deleted reminders for dose generation."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(MedicationReminder).where(
                MedicationReminder.is_active == True,
                MedicationReminder.is_deleted == False,
                MedicationReminder.start_date <= now,
                (MedicationReminder.end_date == None)
                | (MedicationReminder.end_date >= now),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def update(db: AsyncSession, reminder: MedicationReminder) -> MedicationReminder:
        reminder.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(reminder)
        return reminder

    @staticmethod
    async def soft_delete(db: AsyncSession, reminder: MedicationReminder) -> MedicationReminder:
        reminder.is_deleted = True
        reminder.is_active = False
        reminder.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return reminder
