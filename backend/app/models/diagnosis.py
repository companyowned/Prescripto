"""Diagnosis ORM model (optional standalone entity)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text, Uuid

from app.db.base import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(20), nullable=True)  # ICD code if available
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
