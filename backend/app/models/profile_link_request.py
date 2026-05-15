"""QR-driven profile linking requests between accounts."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class ProfileLinkRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ProfileLinkRequest(Base):
    __tablename__ = "profile_link_requests"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    profile_id = Column(Uuid, ForeignKey("patient_profiles.id"), nullable=False, index=True)
    requester_user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(
        SAEnum(ProfileLinkRequestStatus),
        nullable=False,
        default=ProfileLinkRequestStatus.PENDING,
        index=True,
    )
    relationship_to_subject = Column(String(64), nullable=True)

    can_read_prescriptions = Column(Boolean, default=True, nullable=False)
    can_read_documents = Column(Boolean, default=True, nullable=False)
    can_read_reminders = Column(Boolean, default=True, nullable=False)
    can_read_family_profile = Column(Boolean, default=True, nullable=False)
    can_read_medical_history = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    profile = relationship("PatientProfile", backref="link_requests")
    requester = relationship("User", foreign_keys=[requester_user_id])
