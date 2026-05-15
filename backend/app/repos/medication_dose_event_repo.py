"""Medication Dose Event repository — data access layer."""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta, date

from sqlalchemy import select, func, and_, case, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.medication_dose_event import MedicationDoseEvent
from app.models.medication_reminder import MedicationReminder


class MedicationDoseEventRepo:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> MedicationDoseEvent:
        event = MedicationDoseEvent(**kwargs)
        db.add(event)
        await db.flush()
        await db.refresh(event)
        return event

    @staticmethod
    async def bulk_create(
        db: AsyncSession, events_data: list[dict]
    ) -> list[MedicationDoseEvent]:
        events = []
        for data in events_data:
            event = MedicationDoseEvent(**data)
            db.add(event)
            events.append(event)
        await db.flush()
        return events

    @staticmethod
    async def get_by_id(
        db: AsyncSession, event_id: UUID
    ) -> Optional[MedicationDoseEvent]:
        result = await db.execute(
            select(MedicationDoseEvent)
            .options(selectinload(MedicationDoseEvent.reminder))
            .where(MedicationDoseEvent.id == event_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def exists_for_reminder_at(
        db: AsyncSession, reminder_id: UUID, scheduled_at: datetime
    ) -> bool:
        """Check if a dose event already exists (dedup guard)."""
        result = await db.execute(
            select(func.count()).select_from(MedicationDoseEvent).where(
                MedicationDoseEvent.reminder_id == reminder_id,
                MedicationDoseEvent.scheduled_at == scheduled_at,
            )
        )
        return result.scalar() > 0

    @staticmethod
    async def get_user_events_in_range(
        db: AsyncSession,
        user_id: UUID,
        start: datetime,
        end: datetime,
        profile_id: Optional[UUID] = None,
        profile_scope_only: bool = False,
    ) -> list[MedicationDoseEvent]:
        """Get dose events for a user within a date range, joined with reminder."""
        if profile_scope_only:
            if not profile_id:
                return []
            filters = [
                MedicationReminder.profile_id == profile_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
            ]
        else:
            filters = [
                MedicationReminder.user_id == user_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
            ]
            if profile_id:
                filters.append(MedicationReminder.profile_id == profile_id)
        result = await db.execute(
            select(MedicationDoseEvent)
            .join(MedicationReminder)
            .options(selectinload(MedicationDoseEvent.reminder))
            .where(*filters)
            .order_by(MedicationDoseEvent.scheduled_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_upcoming_for_user(
        db: AsyncSession,
        user_id: UUID,
        window_hours: int = 24,
        profile_id: Optional[UUID] = None,
        profile_scope_only: bool = False,
    ) -> list[MedicationDoseEvent]:
        """Get upcoming pending doses for a user."""
        now = datetime.now(timezone.utc)
        end = now + timedelta(hours=window_hours)
        if profile_scope_only:
            if not profile_id:
                return []
            filters = [
                MedicationReminder.profile_id == profile_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= now,
                MedicationDoseEvent.scheduled_at <= end,
                MedicationDoseEvent.status.in_(["pending", "snoozed"]),
            ]
        else:
            filters = [
                MedicationReminder.user_id == user_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= now,
                MedicationDoseEvent.scheduled_at <= end,
                MedicationDoseEvent.status.in_(["pending", "snoozed"]),
            ]
            if profile_id:
                filters.append(MedicationReminder.profile_id == profile_id)
        result = await db.execute(
            select(MedicationDoseEvent)
            .join(MedicationReminder)
            .options(selectinload(MedicationDoseEvent.reminder))
            .where(*filters)
            .order_by(MedicationDoseEvent.scheduled_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_overdue_pending(db: AsyncSession) -> list[MedicationDoseEvent]:
        """Get pending dose events that are past their scheduled time + grace period."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        result = await db.execute(
            select(MedicationDoseEvent)
            .options(
                selectinload(MedicationDoseEvent.reminder).selectinload(
                    MedicationReminder.user
                )
            )
            .where(
                MedicationDoseEvent.status == "pending",
                MedicationDoseEvent.scheduled_at < cutoff,
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_aggregate_stats(
        db: AsyncSession,
        user_id: UUID,
        start: datetime,
        end: datetime,
        profile_id: Optional[UUID] = None,
        profile_scope_only: bool = False,
    ) -> dict:
        """Get aggregate counts for doses in range."""
        if profile_scope_only:
            if not profile_id:
                return {"total": 0, "taken": 0, "missed": 0, "skipped": 0}
            filters = [
                MedicationReminder.profile_id == profile_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
                MedicationDoseEvent.status != "pending",
            ]
        else:
            filters = [
                MedicationReminder.user_id == user_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
                MedicationDoseEvent.status != "pending",
            ]
            if profile_id:
                filters.append(MedicationReminder.profile_id == profile_id)
        result = await db.execute(
            select(
                func.count().label("total"),
                func.sum(case((MedicationDoseEvent.status == "taken", 1), else_=0)).label("taken"),
                func.sum(case((MedicationDoseEvent.status == "missed", 1), else_=0)).label("missed"),
                func.sum(case((MedicationDoseEvent.status == "skipped", 1), else_=0)).label("skipped"),
            )
            .select_from(MedicationDoseEvent)
            .join(MedicationReminder)
            .where(*filters)
        )
        row = result.one()
        return {
            "total": row.total or 0,
            "taken": row.taken or 0,
            "missed": row.missed or 0,
            "skipped": row.skipped or 0,
        }

    @staticmethod
    async def get_daily_stats(
        db: AsyncSession,
        user_id: UUID,
        start: datetime,
        end: datetime,
        profile_id: Optional[UUID] = None,
        profile_scope_only: bool = False,
    ) -> list[dict]:
        """Get daily aggregate stats for trend data."""
        # Use date part of scheduled_at for grouping
        date_col = func.date(MedicationDoseEvent.scheduled_at)
        if profile_scope_only:
            if not profile_id:
                return []
            filters = [
                MedicationReminder.profile_id == profile_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
                MedicationDoseEvent.status != "pending",
            ]
        else:
            filters = [
                MedicationReminder.user_id == user_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
                MedicationDoseEvent.status != "pending",
            ]
            if profile_id:
                filters.append(MedicationReminder.profile_id == profile_id)
        result = await db.execute(
            select(
                date_col.label("date"),
                func.count().label("total"),
                func.sum(case((MedicationDoseEvent.status == "taken", 1), else_=0)).label("taken"),
                func.sum(case((MedicationDoseEvent.status == "missed", 1), else_=0)).label("missed"),
                func.sum(case((MedicationDoseEvent.status == "skipped", 1), else_=0)).label("skipped"),
            )
            .select_from(MedicationDoseEvent)
            .join(MedicationReminder)
            .where(*filters)
            .group_by(date_col)
            .order_by(date_col.asc())
        )
        return [
            {
                "date": str(row.date),
                "total": row.total or 0,
                "taken": row.taken or 0,
                "missed": row.missed or 0,
                "skipped": row.skipped or 0,
            }
            for row in result.all()
        ]

    @staticmethod
    async def get_missed_by_medication(
        db: AsyncSession,
        user_id: UUID,
        start: datetime,
        end: datetime,
        profile_id: Optional[UUID] = None,
        profile_scope_only: bool = False,
    ) -> list[dict]:
        """Get missed count grouped by medication name."""
        if profile_scope_only:
            if not profile_id:
                return []
            filters = [
                MedicationReminder.profile_id == profile_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.status == "missed",
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
            ]
        else:
            filters = [
                MedicationReminder.user_id == user_id,
                MedicationReminder.is_deleted == False,
                MedicationDoseEvent.status == "missed",
                MedicationDoseEvent.scheduled_at >= start,
                MedicationDoseEvent.scheduled_at < end,
            ]
            if profile_id:
                filters.append(MedicationReminder.profile_id == profile_id)
        result = await db.execute(
            select(
                MedicationReminder.medication_name,
                func.count().label("missed_count"),
            )
            .select_from(MedicationDoseEvent)
            .join(MedicationReminder)
            .where(*filters)
            .group_by(MedicationReminder.medication_name)
            .order_by(func.count().desc())
            .limit(10)
        )
        return [
            {"medication_name": row.medication_name, "missed_count": row.missed_count}
            for row in result.all()
        ]

    @staticmethod
    async def update(db: AsyncSession, event: MedicationDoseEvent) -> MedicationDoseEvent:
        event.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(event)
        return event
