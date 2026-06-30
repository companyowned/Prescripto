"""Background tasks for medication reminder scheduling."""

import asyncio
import logging
from datetime import datetime, timezone, timedelta

from app.db.session import async_session_factory
from app.repos.medication_reminder_repo import MedicationReminderRepo
from app.repos.medication_dose_event_repo import MedicationDoseEventRepo
from app.utils.notification_service import send_push_notification

logger = logging.getLogger(__name__)


async def generate_upcoming_doses(hours_ahead: int = 48) -> int:
    """
    Generate dose events for all active reminders over the next N hours.

    Idempotent: uses dedup guard (exists_for_reminder_at) so safe to retry.

    In production, wire this to Celery beat:
        @celery_app.task(bind=True, max_retries=3)
        def generate_upcoming_doses_task(self, hours_ahead=48):
            asyncio.run(generate_upcoming_doses(hours_ahead))
    """
    logger.info(f"[WORKER] Starting dose generation for next {hours_ahead}h")
    total_created = 0

    async with async_session_factory() as db:
        try:
            reminders = await MedicationReminderRepo.get_active_reminders_for_generation(db)
            logger.info(f"[WORKER] Found {len(reminders)} active reminders")

            for reminder in reminders:
                count = await _generate_doses_for_reminder(db, reminder, hours_ahead)
                total_created += count

            await db.commit()
            logger.info(f"[WORKER] Generated {total_created} total dose events")
        except Exception as e:
            await db.rollback()
            logger.error(f"[WORKER] Dose generation failed: {e}", exc_info=True)
            raise

    return total_created


async def mark_overdue_as_missed() -> int:
    """
    Scan pending dose events past 1 hour and mark them as missed.

    Idempotent: only updates events still in 'pending' status.

    In production, wire to Celery beat (run every 15 minutes):
        @celery_app.task(bind=True, max_retries=3)
        def mark_overdue_task(self):
            asyncio.run(mark_overdue_as_missed())
    """
    logger.info("[WORKER] Starting overdue dose marking")
    marked_count = 0

    async with async_session_factory() as db:
        try:
            overdue_events = await MedicationDoseEventRepo.get_overdue_pending(db)
            logger.info(f"[WORKER] Found {len(overdue_events)} overdue events")

            for event in overdue_events:
                event.status = "missed"
                event.source = "auto"
                event.updated_at = datetime.now(timezone.utc)
                marked_count += 1

                # Optionally notify user about missed dose
                try:
                    if event.reminder and event.reminder.user:
                        await send_push_notification(
                            user=event.reminder.user,
                            title="Missed Dose",
                            body=f"You missed your {event.reminder.medication_name} dose",
                            data={"event_id": str(event.id), "type": "missed_dose"},
                        )
                except Exception as notify_err:
                    logger.warning(f"[WORKER] Failed to send missed notification: {notify_err}")

            await db.commit()
            logger.info(f"[WORKER] Marked {marked_count} events as missed")
        except Exception as e:
            await db.rollback()
            logger.error(f"[WORKER] Overdue marking failed: {e}", exc_info=True)
            raise

    return marked_count


async def send_dose_reminders() -> int:
    """
    Send push notifications precisely when upcoming doses are due.

    Deduplication is handled via the dose event's `notified_at` column so the
    check is correct across multiple workers and server restarts.
    """
    logger.info("[WORKER] Checking for exactly-due dose notifications")
    sent_count = 0

    async with async_session_factory() as db:
        try:
            now = datetime.now(timezone.utc)
            # Narrow window to catch exactly-due doses (±2 minutes)
            window_start = now - timedelta(minutes=2)
            window_end = now + timedelta(minutes=1)

            from sqlalchemy import select
            from app.models.medication_dose_event import MedicationDoseEvent
            from app.models.medication_reminder import MedicationReminder
            from sqlalchemy.orm import selectinload

            result = await db.execute(
                select(MedicationDoseEvent)
                .join(MedicationReminder)
                .options(selectinload(MedicationDoseEvent.reminder))
                .where(
                    MedicationDoseEvent.status.in_(["pending", "snoozed"]),
                    MedicationDoseEvent.scheduled_at >= window_start,
                    MedicationDoseEvent.scheduled_at <= window_end,
                    MedicationDoseEvent.notified_at.is_(None),
                    MedicationReminder.is_active == True,
                    MedicationReminder.is_deleted == False,
                )
            )
            events = list(result.scalars().all())

            for event in events:
                # For snoozed events, check snoozed_until
                if event.status == "snoozed" and event.snoozed_until:
                    if event.snoozed_until > now:
                        continue

                try:
                    from app.repos.user_repo import UserRepo
                    user = await UserRepo.get_by_id(db, event.reminder.user_id)
                    if user:
                        await send_push_notification(
                            user=user,
                            title="Time for your medication",
                            body=f"Take {event.reminder.medication_name}"
                                 + (f" — {event.reminder.dosage}" if event.reminder.dosage else ""),
                            data={
                                "event_id": str(event.id),
                                "reminder_id": str(event.reminder_id),
                                "type": "dose_reminder",
                            },
                        )
                        # Mark as notified to prevent duplicate sends across workers/restarts
                        event.notified_at = now
                        sent_count += 1
                except Exception as notify_err:
                    logger.warning(f"[WORKER] Failed to send reminder notification: {notify_err}")

            if sent_count:
                await db.commit()
            logger.info(f"[WORKER] Sent {sent_count} dose reminder notifications")
        except Exception as e:
            logger.error(f"[WORKER] Dose reminder sending failed: {e}", exc_info=True)
            raise

    return sent_count


async def _generate_doses_for_reminder(db, reminder, hours_ahead: int) -> int:
    """Generate dose events for a single reminder. Returns count created."""
    if reminder.schedule_type == "as_needed":
        return 0

    now = datetime.now(timezone.utc)
    end = now + timedelta(hours=hours_ahead)
    start = max(
        reminder.start_date.replace(tzinfo=timezone.utc)
        if reminder.start_date.tzinfo is None
        else reminder.start_date,
        now,
    )

    if reminder.end_date:
        end_dt = (
            reminder.end_date.replace(tzinfo=timezone.utc)
            if reminder.end_date.tzinfo is None
            else reminder.end_date
        )
        end = min(end, end_dt)

    events_data = []

    if reminder.schedule_type == "fixed_times" and reminder.times:
        current_date = start.date()
        end_date_val = end.date()
        while current_date <= end_date_val:
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
        await MedicationDoseEventRepo.bulk_create(db, events_data)
        logger.info(f"[WORKER] Generated {len(events_data)} events for reminder {reminder.id}")
    return len(events_data)
