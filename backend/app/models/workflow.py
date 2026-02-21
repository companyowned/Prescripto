"""Workflow ORM model — configurable SkepticGen workflow definitions."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, Uuid, JSON

from app.db.base import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    version = Column(Integer, default=1)
    config_json = Column(JSON, nullable=False)  # Full skflow JSON
    prompt_template = Column(Text, nullable=True)
    output_schema = Column(JSON, nullable=True)  # Expected JSON shape
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
