"""Medication Reminder controller — business logic for reminder CRUD and scheduling."""

import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, BadRequestError
from app.repos.medication_reminder_repo import MedicationReminderRepo
from app.repos.medication_dose_event_repo import MedicationDoseEventRepo
from app.schemas.medication_reminder import ReminderCreateRequest, ReminderUpdateRequest
from app.services.profile_access import ProfileAccessService

logger = logging.getLogger(__name__)


class MedicationReminderController:
    @staticmethod
    async def create_reminder(
        db: AsyncSession, user_id: UUID, data: ReminderCreateRequest
    ):
        """Create a new medication reminder with schedule validation."""
        _validate_schedule(data.schedule_type, data.times, data.interval_hours, data.times_per_day)

        # Resolve profile_id — use provided value or fall back to default profile
        resolved_profile_id = None
        if data.profile_id:
            from app.controllers.profile_controller import PatientProfileController
            profile = await PatientProfileController.get_profile(db, user_id, UUID(data.profile_id))
            resolved_profile_id = profile.id
        else:
            from app.controllers.profile_controller import PatientProfileController
            from app.repos.user_repo import UserRepo
            user = await UserRepo.get_by_id(db, user_id)
            owner_name = user.full_name if user else "User"
            default_profile = await PatientProfileController.ensure_default_profile(db, user_id, owner_name)
            resolved_profile_id = default_profile.id

        reminder = await MedicationReminderRepo.create(
            db,
            user_id=user_id,
            profile_id=resolved_profile_id,
            prescription_id=UUID(data.prescription_id) if data.prescription_id else None,
            medication_name=data.medication_name,
            dosage=data.dosage,
            form=data.form,
            instructions=data.instructions,
            start_date=data.start_date,
            end_date=data.end_date,
            timezone=data.timezone,
            schedule_type=data.schedule_type,
            times_per_day=data.times_per_day,
            times=data.times,
            interval_hours=data.interval_hours,
            days_of_week=data.days_of_week,
        )
        logger.info(f"Created medication reminder {reminder.id} for user {user_id}, profile {resolved_profile_id}")

        # Generate initial dose events for the next 48 hours
        await _generate_doses_for_reminder(db, reminder, hours_ahead=48)

        return reminder

    @staticmethod
    async def get_reminder(db: AsyncSession, reminder_id: UUID, user_id: UUID):
        """Get a single reminder, checking access."""
        reminder = await MedicationReminderRepo.get_by_id(db, reminder_id)
        if not reminder or not reminder.profile_id:
            raise NotFoundError("Reminder not found")
        access = await ProfileAccessService.resolve(db, user_id, reminder.profile_id)
        access.require_reminders_read()
        if access.owner_like and reminder.user_id != user_id:
            raise NotFoundError("Reminder not found")
        return reminder

    @staticmethod
    async def list_reminders(
        db: AsyncSession,
        user_id: UUID,
        active_only: bool = False,
        profile_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        """List reminders for a user."""
        if profile_id:
            access = await ProfileAccessService.resolve(db, user_id, profile_id)
            access.require_reminders_read()
            if access.owner_like:
                return await MedicationReminderRepo.get_user_reminders(
                    db, user_id, active_only=active_only, profile_id=profile_id, skip=skip, limit=limit
                )
            return await MedicationReminderRepo.get_reminders_for_profile(
                db, profile_id, active_only=active_only, skip=skip, limit=limit
            )
        return await MedicationReminderRepo.get_user_reminders(
            db, user_id, active_only=active_only, profile_id=profile_id, skip=skip, limit=limit
        )

    @staticmethod
    async def update_reminder(
        db: AsyncSession,
        reminder_id: UUID,
        user_id: UUID,
        data: ReminderUpdateRequest,
    ):
        """Update a reminder, checking ownership."""
        reminder = await MedicationReminderRepo.get_by_id(db, reminder_id)
        if not reminder or reminder.user_id != user_id:
            raise NotFoundError("Reminder not found")

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(reminder, field, value)

        if any(f in update_fields for f in ("schedule_type", "times", "interval_hours", "times_per_day")):
            _validate_schedule(
                reminder.schedule_type,
                reminder.times,
                reminder.interval_hours,
                reminder.times_per_day,
            )

        return await MedicationReminderRepo.update(db, reminder)

    @staticmethod
    async def delete_reminder(db: AsyncSession, reminder_id: UUID, user_id: UUID):
        """Soft-delete a reminder."""
        reminder = await MedicationReminderRepo.get_by_id(db, reminder_id)
        if not reminder or reminder.user_id != user_id:
            raise NotFoundError("Reminder not found")
        return await MedicationReminderRepo.soft_delete(db, reminder)

    @staticmethod
    async def pause_reminder(db: AsyncSession, reminder_id: UUID, user_id: UUID):
        """Pause a reminder."""
        reminder = await MedicationReminderRepo.get_by_id(db, reminder_id)
        if not reminder or reminder.user_id != user_id:
            raise NotFoundError("Reminder not found")
        if not reminder.is_active:
            raise BadRequestError("Reminder is already paused")
        reminder.is_active = False
        return await MedicationReminderRepo.update(db, reminder)

    @staticmethod
    async def resume_reminder(db: AsyncSession, reminder_id: UUID, user_id: UUID):
        """Resume a paused reminder."""
        reminder = await MedicationReminderRepo.get_by_id(db, reminder_id)
        if not reminder or reminder.user_id != user_id:
            raise NotFoundError("Reminder not found")
        if reminder.is_active:
            raise BadRequestError("Reminder is already active")
        reminder.is_active = True
        return await MedicationReminderRepo.update(db, reminder)

    @staticmethod
    async def get_upcoming_doses(
        db: AsyncSession, user_id: UUID, window_hours: int = 24, profile_id: Optional[UUID] = None
    ):
        """Get upcoming dose events for a user."""
        if profile_id:
            access = await ProfileAccessService.resolve(db, user_id, profile_id)
            access.require_reminders_read()
            if access.owner_like:
                return await MedicationDoseEventRepo.get_upcoming_for_user(
                    db, user_id, window_hours=window_hours, profile_id=profile_id
                )
            return await MedicationDoseEventRepo.get_upcoming_for_user(
                db,
                user_id,
                window_hours=window_hours,
                profile_id=profile_id,
                profile_scope_only=True,
            )
        return await MedicationDoseEventRepo.get_upcoming_for_user(
            db, user_id, window_hours=window_hours, profile_id=profile_id
        )


def _validate_schedule(
    schedule_type: str,
    times: Optional[list[str]],
    interval_hours: Optional[float],
    times_per_day: Optional[int],
) -> None:
    """Validate schedule configuration consistency."""
    if schedule_type == "fixed_times":
        if not times or len(times) == 0:
            raise BadRequestError(
                "fixed_times schedule requires at least one time in 'times' array"
            )
    elif schedule_type == "interval":
        if not interval_hours:
            raise BadRequestError(
                "interval schedule requires 'interval_hours' to be set"
            )
    elif schedule_type == "as_needed":
        pass  # No schedule constraints
    else:
        raise BadRequestError(f"Unknown schedule_type: {schedule_type}")


async def _generate_doses_for_reminder(
    db: AsyncSession, reminder, hours_ahead: int = 48
) -> list:
    """Generate dose events for a reminder over the next N hours."""
    if reminder.schedule_type == "as_needed":
        return []

    now = datetime.now(timezone.utc)
    end = now + timedelta(hours=hours_ahead)
    start = max(reminder.start_date.replace(tzinfo=timezone.utc) if reminder.start_date.tzinfo is None else reminder.start_date, now)

    if reminder.end_date:
        end_date = reminder.end_date.replace(tzinfo=timezone.utc) if reminder.end_date.tzinfo is None else reminder.end_date
        end = min(end, end_date)

    events_data = []

    if reminder.schedule_type == "fixed_times" and reminder.times:
        current_date = start.date()
        end_date_val = end.date()
        while current_date <= end_date_val:
            # Check day of week filter
            if reminder.days_of_week and current_date.weekday() not in reminder.days_of_week:
                current_date += timedelta(days=1)
                continue

            for time_str in reminder.times:
                hour, minute = map(int, time_str.split(":"))
                scheduled = datetime(
                    current_date.year, current_date.month, current_date.day,
                    hour, minute, tzinfo=timezone.utc,
                )
                if scheduled < start or scheduled >= end:
                    continue

                # Dedup check
                exists = await MedicationDoseEventRepo.exists_for_reminder_at(
                    db, reminder.id, scheduled
                )
                if not exists:
                    events_data.append({
                        "reminder_id": reminder.id,
                        "scheduled_at": scheduled,
                        "status": "pending",
                        "source": "auto",
                    })
            current_date += timedelta(days=1)

    elif reminder.schedule_type == "interval" and reminder.interval_hours:
        current = start
        while current < end:
            if reminder.days_of_week and current.weekday() not in reminder.days_of_week:
                current += timedelta(hours=reminder.interval_hours)
                continue

            exists = await MedicationDoseEventRepo.exists_for_reminder_at(
                db, reminder.id, current
            )
            if not exists:
                events_data.append({
                    "reminder_id": reminder.id,
                    "scheduled_at": current,
                    "status": "pending",
                    "source": "auto",
                })
            current += timedelta(hours=reminder.interval_hours)

    if events_data:
        created = await MedicationDoseEventRepo.bulk_create(db, events_data)
        logger.info(
            f"Generated {len(created)} dose events for reminder {reminder.id}"
        )
        return created
    return []
