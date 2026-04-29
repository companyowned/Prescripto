"""User ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Uuid, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Push notification token
    push_token = Column(String(255), nullable=True)
    push_token_updated_at = Column(DateTime(timezone=True), nullable=True)

    # Family Management
    managed_by_id = Column(Uuid, ForeignKey("users.id"), nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    patient_profiles = relationship(
        "PatientProfile", 
        back_populates="owner", 
        cascade="all, delete-orphan",
        foreign_keys="[PatientProfile.owner_user_id]"
    )
    medication_reminders = relationship(
        "MedicationReminder", back_populates="user", cascade="all, delete-orphan"
    )
