"""Medication Reminders API router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.medication_reminder_controller import MedicationReminderController
from app.schemas.medication_reminder import (
    ReminderCreateRequest,
    ReminderUpdateRequest,
    ReminderResponse,
    ReminderListResponse,
    UpcomingDoseResponse,
)

router = APIRouter(prefix="/medication-reminders", tags=["Medication Reminders"])


@router.get("/run-cron")
async def run_cron(db: AsyncSession = Depends(get_db)):
    """Vercel cron job endpoint for serverless background tasks."""
    from app.workers.reminder_tasks import (
        generate_upcoming_doses,
        mark_overdue_as_missed,
        send_dose_reminders,
    )
    from app.db.session import init_db
    import logging
    logger = logging.getLogger(__name__)
    try:
        # Safety: Ensure tables exist in production
        await init_db()
        
        await generate_upcoming_doses(48)
        await mark_overdue_as_missed()
        await send_dose_reminders()
        return {"status": "success", "message": "Cron executed successfully"}
    except Exception as e:
        logger.error(f"Vercel Cron failed: {e}")
        return {"status": "error", "message": str(e)}


def _to_response(r) -> ReminderResponse:
    """Convert ORM reminder to response schema."""
    return ReminderResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        prescription_id=str(r.prescription_id) if r.prescription_id else None,
        medication_name=r.medication_name,
        dosage=r.dosage,
        form=r.form,
        instructions=r.instructions,
        start_date=r.start_date,
        end_date=r.end_date,
        timezone=r.timezone,
        schedule_type=r.schedule_type,
        times_per_day=r.times_per_day,
        times=r.times,
        interval_hours=r.interval_hours,
        days_of_week=r.days_of_week,
        is_active=r.is_active,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


@router.post("", response_model=ReminderResponse, status_code=201)
async def create_reminder(
    data: ReminderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new medication reminder."""
    reminder = await MedicationReminderController.create_reminder(
        db, current_user.id, data
    )
    return _to_response(reminder)


@router.get("", response_model=ReminderListResponse)
async def list_reminders(
    active_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the current user's medication reminders."""
    reminders, total = await MedicationReminderController.list_reminders(
        db, current_user.id, active_only=active_only, skip=skip, limit=limit
    )
    return ReminderListResponse(
        reminders=[_to_response(r) for r in reminders],
        total=total,
    )


@router.get("/upcoming", response_model=list[UpcomingDoseResponse])
async def get_upcoming_doses(
    window_hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get upcoming doses within a time window."""
    events = await MedicationReminderController.get_upcoming_doses(
        db, current_user.id, window_hours=window_hours
    )
    return [
        UpcomingDoseResponse(
            dose_event_id=str(e.id),
            reminder_id=str(e.reminder_id),
            medication_name=e.reminder.medication_name,
            dosage=e.reminder.dosage,
            form=e.reminder.form,
            scheduled_at=e.scheduled_at,
            status=e.status,
        )
        for e in events
    ]


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single medication reminder."""
    reminder = await MedicationReminderController.get_reminder(
        db, reminder_id, current_user.id
    )
    return _to_response(reminder)


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: UUID,
    data: ReminderUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a medication reminder."""
    reminder = await MedicationReminderController.update_reminder(
        db, reminder_id, current_user.id, data
    )
    return _to_response(reminder)


@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(
    reminder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a medication reminder."""
    await MedicationReminderController.delete_reminder(
        db, reminder_id, current_user.id
    )


@router.post("/{reminder_id}/pause", response_model=ReminderResponse)
async def pause_reminder(
    reminder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pause a medication reminder."""
    reminder = await MedicationReminderController.pause_reminder(
        db, reminder_id, current_user.id
    )
    return _to_response(reminder)


@router.post("/{reminder_id}/resume", response_model=ReminderResponse)
async def resume_reminder(
    reminder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resume a paused medication reminder."""
    reminder = await MedicationReminderController.resume_reminder(
        db, reminder_id, current_user.id
    )
    return _to_response(reminder)
