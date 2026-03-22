"""Medication Dose Event controller — business logic for dose actions."""

import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, BadRequestError
from app.repos.medication_dose_event_repo import MedicationDoseEventRepo

logger = logging.getLogger(__name__)

# Valid state transitions
VALID_TRANSITIONS = {
    "pending": {"taken", "missed", "skipped", "snoozed"},
    "snoozed": {"taken", "missed", "skipped"},
    "taken": set(),
    "missed": {"taken"},  # Allow late marking of missed doses
    "skipped": set(),
}


class MedicationDoseEventController:
    @staticmethod
    async def mark_taken(
        db: AsyncSession, event_id: UUID, user_id: UUID, note: str = None
    ):
        """Mark a dose event as taken."""
        event = await _get_event_with_ownership(db, event_id, user_id)
        _validate_transition(event.status, "taken")

        event.status = "taken"
        event.taken_at = datetime.now(timezone.utc)
        event.source = "manual"
        if note:
            event.note = note

        logger.info(f"Dose event {event_id} marked as taken")
        return await MedicationDoseEventRepo.update(db, event)

    @staticmethod
    async def skip_dose(
        db: AsyncSession, event_id: UUID, user_id: UUID, note: str = None
    ):
        """Skip a dose event."""
        event = await _get_event_with_ownership(db, event_id, user_id)
        _validate_transition(event.status, "skipped")

        event.status = "skipped"
        event.source = "manual"
        if note:
            event.note = note

        logger.info(f"Dose event {event_id} skipped")
        return await MedicationDoseEventRepo.update(db, event)

    @staticmethod
    async def snooze_dose(
        db: AsyncSession,
        event_id: UUID,
        user_id: UUID,
        snooze_minutes: int = 10,
        note: str = None,
    ):
        """Snooze a dose event."""
        event = await _get_event_with_ownership(db, event_id, user_id)
        _validate_transition(event.status, "snoozed")

        event.status = "snoozed"
        event.snoozed_until = datetime.now(timezone.utc) + timedelta(minutes=snooze_minutes)
        event.source = "manual"
        if note:
            event.note = note

        logger.info(f"Dose event {event_id} snoozed for {snooze_minutes} minutes")
        return await MedicationDoseEventRepo.update(db, event)

    @staticmethod
    async def get_today_doses(db: AsyncSession, user_id: UUID):
        """Get today's dose events for a user."""
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)

        events = await MedicationDoseEventRepo.get_user_events_in_range(
            db, user_id, start, end
        )
        return events


async def _get_event_with_ownership(
    db: AsyncSession, event_id: UUID, user_id: UUID
):
    """Get a dose event and verify the user owns the associated reminder."""
    event = await MedicationDoseEventRepo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Dose event not found")
    if event.reminder.user_id != user_id:
        raise NotFoundError("Dose event not found")
    return event


def _validate_transition(current_status: str, new_status: str) -> None:
    """Validate state transition."""
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise BadRequestError(
            f"Cannot transition from '{current_status}' to '{new_status}'"
        )
