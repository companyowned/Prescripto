"""Medication Reminder Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# --- Request schemas ---
class ReminderCreateRequest(BaseModel):
    """Create a new medication reminder."""
    medication_name: str = Field(..., min_length=1, max_length=255)
    dosage: Optional[str] = None
    form: Optional[str] = None
    instructions: Optional[str] = None
    prescription_id: Optional[str] = None
    profile_id: Optional[str] = None

    start_date: datetime
    end_date: Optional[datetime] = None
    timezone: str = Field(default="UTC", max_length=50)

    schedule_type: str = Field(default="fixed_times")  # fixed_times, interval, as_needed
    times_per_day: Optional[int] = Field(default=1, ge=1, le=24)
    times: Optional[list[str]] = None  # ["08:00", "14:00", "20:00"]
    interval_hours: Optional[float] = Field(default=None, gt=0, le=24)
    days_of_week: Optional[list[int]] = None  # 0=Mon, 6=Sun

    @field_validator("schedule_type")
    @classmethod
    def validate_schedule_type(cls, v: str) -> str:
        valid = {"fixed_times", "interval", "as_needed"}
        if v not in valid:
            raise ValueError(f"schedule_type must be one of {valid}")
        return v

    @field_validator("days_of_week")
    @classmethod
    def validate_days_of_week(cls, v: Optional[list[int]]) -> Optional[list[int]]:
        if v is not None:
            if not all(0 <= d <= 6 for d in v):
                raise ValueError("days_of_week values must be 0-6")
        return v

    @field_validator("times")
    @classmethod
    def validate_times(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            import re
            for t in v:
                if not re.match(r"^\d{2}:\d{2}$", t):
                    raise ValueError(f"Invalid time format '{t}', expected HH:MM")
        return v


class ReminderUpdateRequest(BaseModel):
    """Update an existing medication reminder."""
    medication_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    dosage: Optional[str] = None
    form: Optional[str] = None
    instructions: Optional[str] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: Optional[str] = None

    schedule_type: Optional[str] = None
    times_per_day: Optional[int] = Field(default=None, ge=1, le=24)
    times: Optional[list[str]] = None
    interval_hours: Optional[float] = Field(default=None, gt=0, le=24)
    days_of_week: Optional[list[int]] = None


# --- Response schemas ---
class ReminderResponse(BaseModel):
    """Single medication reminder response."""
    id: str
    user_id: str
    profile_id: Optional[str] = None
    prescription_id: Optional[str] = None
    medication_name: str
    dosage: Optional[str] = None
    form: Optional[str] = None
    instructions: Optional[str] = None

    start_date: datetime
    end_date: Optional[datetime] = None
    timezone: str

    schedule_type: str
    times_per_day: Optional[int] = None
    times: Optional[list[str]] = None
    interval_hours: Optional[float] = None
    days_of_week: Optional[list[int]] = None

    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReminderListResponse(BaseModel):
    """Paginated list of reminders."""
    reminders: list[ReminderResponse]
    total: int


class UpcomingDoseResponse(BaseModel):
    """Upcoming dose with reminder context."""
    dose_event_id: str
    reminder_id: str
    medication_name: str
    dosage: Optional[str] = None
    form: Optional[str] = None
    scheduled_at: datetime
    status: str
