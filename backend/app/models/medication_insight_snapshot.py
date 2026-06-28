"""MedicationInsightSnapshot ORM model — daily aggregate cache."""

import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Column, Uuid, ForeignKey, Date, Integer, Float, DateTime, Index
from sqlalchemy.orm import relationship

from app.db.base import Base


class MedicationInsightSnapshot(Base):
    __tablename__ = "medication_insight_snapshots"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    profile_id = Column(Uuid, ForeignKey("patient_profiles.id"), nullable=True, index=True)
    date = Column(Date, nullable=False)

    total_doses = Column(Integer, default=0)
    taken_count = Column(Integer, default=0)
    missed_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    adherence_rate = Column(Float, default=0.0)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", backref="insight_snapshots")
    profile = relationship("PatientProfile", backref="insight_snapshots")

    __table_args__ = (
        Index("ix_insight_user_profile_date", "user_id", "profile_id", "date", unique=True),
    )
