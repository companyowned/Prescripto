"""Medication Dose Event Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DoseEventResponse(BaseModel):
    """Single dose event response."""
    id: str
    reminder_id: str
    scheduled_at: datetime
    status: str
    taken_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    note: Optional[str] = None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DoseEventWithReminderResponse(BaseModel):
    """Dose event enriched with reminder context (for today view)."""
    id: str
    reminder_id: str
    medication_name: str
    dosage: Optional[str] = None
    form: Optional[str] = None
    scheduled_at: datetime
    status: str
    taken_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    note: Optional[str] = None
    source: str


class SnoozeRequest(BaseModel):
    """Snooze a dose event."""
    snooze_minutes: int = Field(default=10, ge=5, le=120)
    note: Optional[str] = None


class DoseMarkRequest(BaseModel):
    """Mark a dose as taken (optionally provide a note)."""
    note: Optional[str] = None


class TodayDosesResponse(BaseModel):
    """Today's dose events list."""
    doses: list[DoseEventWithReminderResponse]
    total: int
