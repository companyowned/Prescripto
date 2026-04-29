"""Patient profile ORM model for family mode."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, Enum as SAEnum, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class RelationshipToOwner(str, enum.Enum):
    SELF = "self"
    CHILD = "child"
    PARENT = "parent"
    SPOUSE = "spouse"
    SIBLING = "sibling"
    OTHER = "other"


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    relationship_to_owner = Column(
        SAEnum(RelationshipToOwner), nullable=False, default=RelationshipToOwner.SELF
    )
    avatar_url = Column(String(500), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False, index=True)

    # Linked Family Account & Privacy
    linked_user_id = Column(Uuid, ForeignKey("users.id"), nullable=True, index=True)
    sharing_level = Column(String(50), default="FULL_ACCESS", nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = relationship("User", back_populates="patient_profiles", foreign_keys=[owner_user_id])
    linked_user = relationship("User", foreign_keys=[linked_user_id])
    documents = relationship("Document", back_populates="profile")
    prescriptions = relationship("Prescription", back_populates="profile")
