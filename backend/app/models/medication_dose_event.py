"""MedicationDoseEvent ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, Text, Uuid, DateTime, Index
from sqlalchemy.orm import relationship

from app.db.base import Base


class MedicationDoseEvent(Base):
    __tablename__ = "medication_dose_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    reminder_id = Column(
        Uuid, ForeignKey("medication_reminders.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        String(20), nullable=False, default="pending"
    )  # pending, taken, missed, skipped, snoozed

    taken_at = Column(DateTime(timezone=True), nullable=True)
    snoozed_until = Column(DateTime(timezone=True), nullable=True)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, nullable=True)
    source = Column(
        String(30), nullable=False, default="manual"
    )  # manual, notification_action, auto

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    reminder = relationship("MedicationReminder", back_populates="dose_events")

    __table_args__ = (
        Index("ix_dose_event_reminder_scheduled", "reminder_id", "scheduled_at"),
        Index("ix_dose_event_reminder_status", "reminder_id", "status"),
    )
