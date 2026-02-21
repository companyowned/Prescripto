"""Medication ORM model."""

import uuid

from sqlalchemy import Column, String, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    prescription_id = Column(
        Uuid, ForeignKey("prescriptions.id"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    dose = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    prescription = relationship("Prescription", back_populates="medications")
