"""Patient profile ORM model for family mode."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, Enum as SAEnum, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class RelationshipToOwner(str, enum.Enum):
    SELF = "self"
    CHILD = "child"
    PARENT = "parent"
    SPOUSE = "spouse"
    SIBLING = "sibling"
    OTHER = "other"


class AccessRole(str, enum.Enum):
    OWNER = "owner"       # Created the profile
    SELF = "self"         # The person this profile represents (after claiming)
    VIEWER = "viewer"     # Read-only access


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
    access_grants = relationship("ProfileAccess", back_populates="profile", cascade="all, delete-orphan")


class ProfileAccess(Base):
    """Junction table: which users can access which profiles."""
    __tablename__ = "profile_access"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    profile_id = Column(Uuid, ForeignKey("patient_profiles.id"), nullable=False, index=True)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(SAEnum(AccessRole), nullable=False, default=AccessRole.OWNER)
    granted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Granular read sharing for VIEWER role (ignored for OWNER / SELF — treated as full access).
    can_read_prescriptions = Column(Boolean, default=True, nullable=False)
    can_read_documents = Column(Boolean, default=True, nullable=False)
    can_read_reminders = Column(Boolean, default=True, nullable=False)
    can_read_family_profile = Column(Boolean, default=True, nullable=False)
    can_read_medical_history = Column(Boolean, default=True, nullable=False)

    profile = relationship("PatientProfile", back_populates="access_grants")
    user = relationship("User", backref="profile_access_grants")

    __table_args__ = (
        Index("ix_profile_access_profile_user", "profile_id", "user_id", unique=True),
    )
