"""MedicationReminder ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, ForeignKey, Text, Uuid, DateTime, Boolean,
    Integer, Float, JSON, Index,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    profile_id = Column(Uuid, ForeignKey("patient_profiles.id"), nullable=True, index=True)
    prescription_id = Column(
        Uuid, ForeignKey("prescriptions.id"), nullable=True, index=True
    )
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True)
    form = Column(String(50), nullable=True)  # tablet, capsule, liquid, etc.
    instructions = Column(Text, nullable=True)

    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(50), nullable=False, default="UTC")  # IANA timezone

    # Schedule configuration
    schedule_type = Column(
        String(20), nullable=False, default="fixed_times"
    )  # fixed_times, interval, as_needed
    times_per_day = Column(Integer, nullable=True, default=1)
    times = Column(JSON, nullable=True)  # e.g. ["08:00", "14:00", "20:00"]
    interval_hours = Column(Float, nullable=True)
    days_of_week = Column(JSON, nullable=True)  # e.g. [0,1,2,3,4] (Mon-Fri)

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="medication_reminders")
    profile = relationship("PatientProfile", backref="medication_reminders")
    prescription = relationship("Prescription", backref="medication_reminders")
    dose_events = relationship(
        "MedicationDoseEvent",
        back_populates="reminder",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_med_reminder_user_active", "user_id", "is_active"),
        Index("ix_med_reminder_user_deleted", "user_id", "is_deleted"),
    )
