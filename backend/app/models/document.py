"""Document ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum, Uuid
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class FileType(str, enum.Enum):
    PDF = "pdf"
    IMAGE = "image"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(SAEnum(FileType), nullable=False)
    original_filename = Column(String(255), nullable=True)
    status = Column(SAEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="documents")
    jobs = relationship("Job", back_populates="document", cascade="all, delete-orphan")
    prescription = relationship(
        "Prescription", back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
