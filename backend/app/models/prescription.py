"""Prescription ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Uuid, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    profile_id = Column(Uuid, ForeignKey("patient_profiles.id"), nullable=True, index=True)
    document_id = Column(
        Uuid, ForeignKey("documents.id"), nullable=False, unique=True, index=True
    )
    doctor_id = Column(Uuid, ForeignKey("doctors.id"), nullable=True)
    facility_id = Column(Uuid, ForeignKey("facilities.id"), nullable=True)
    diagnosis_text = Column(Text, nullable=True)
    raw_output_json = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("PatientProfile", back_populates="prescriptions")
    document = relationship("Document", back_populates="prescription")
    doctor = relationship("Doctor", back_populates="prescriptions")
    facility = relationship("Facility", back_populates="prescriptions")
    medications = relationship(
        "Medication", back_populates="prescription", cascade="all, delete-orphan"
    )
