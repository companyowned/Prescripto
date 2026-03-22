"""Medication Dose Events API router."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.medication_dose_event_controller import MedicationDoseEventController
from app.schemas.medication_dose_event import (
    DoseEventResponse,
    DoseEventWithReminderResponse,
    SnoozeRequest,
    DoseMarkRequest,
    TodayDosesResponse,
)

router = APIRouter(prefix="/medication-dose-events", tags=["Medication Dose Events"])


def _to_response(e) -> DoseEventResponse:
    """Convert ORM event to response schema."""
    return DoseEventResponse(
        id=str(e.id),
        reminder_id=str(e.reminder_id),
        scheduled_at=e.scheduled_at,
        status=e.status,
        taken_at=e.taken_at,
        snoozed_until=e.snoozed_until,
        note=e.note,
        source=e.source,
        created_at=e.created_at,
    )


def _to_enriched_response(e) -> DoseEventWithReminderResponse:
    """Convert ORM event to enriched response with reminder context."""
    return DoseEventWithReminderResponse(
        id=str(e.id),
        reminder_id=str(e.reminder_id),
        medication_name=e.reminder.medication_name,
        dosage=e.reminder.dosage,
        form=e.reminder.form,
        scheduled_at=e.scheduled_at,
        status=e.status,
        taken_at=e.taken_at,
        snoozed_until=e.snoozed_until,
        note=e.note,
        source=e.source,
    )


@router.get("/today", response_model=TodayDosesResponse)
async def get_today_doses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get today's dose events."""
    events = await MedicationDoseEventController.get_today_doses(db, current_user.id)
    return TodayDosesResponse(
        doses=[_to_enriched_response(e) for e in events],
        total=len(events),
    )


@router.post("/{event_id}/mark-taken", response_model=DoseEventResponse)
async def mark_taken(
    event_id: UUID,
    data: DoseMarkRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a dose event as taken."""
    note = data.note if data else None
    event = await MedicationDoseEventController.mark_taken(
        db, event_id, current_user.id, note=note
    )
    return _to_response(event)


@router.post("/{event_id}/skip", response_model=DoseEventResponse)
async def skip_dose(
    event_id: UUID,
    data: DoseMarkRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Skip a dose event."""
    note = data.note if data else None
    event = await MedicationDoseEventController.skip_dose(
        db, event_id, current_user.id, note=note
    )
    return _to_response(event)


@router.post("/{event_id}/snooze", response_model=DoseEventResponse)
async def snooze_dose(
    event_id: UUID,
    data: SnoozeRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Snooze a dose event."""
    minutes = data.snooze_minutes if data else 10
    note = data.note if data else None
    event = await MedicationDoseEventController.snooze_dose(
        db, event_id, current_user.id, snooze_minutes=minutes, note=note
    )
    return _to_response(event)
