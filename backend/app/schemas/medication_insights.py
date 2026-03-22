"""Medication Insights Pydantic schemas."""

from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel


class InsightsSummaryResponse(BaseModel):
    """KPI summary for the insights dashboard."""
    adherence_rate: float  # 0.0 - 1.0
    total_doses: int
    taken_count: int
    missed_count: int
    skipped_count: int
    current_streak: int  # consecutive days with 100% adherence
    best_streak: int
    range_days: int


class TrendDataPoint(BaseModel):
    """Single data point in a trend series."""
    date: str  # ISO date string
    adherence_rate: float
    taken: int
    missed: int
    skipped: int
    total: int


class TrendsResponse(BaseModel):
    """Adherence trend series."""
    data: list[TrendDataPoint]
    range_days: int
    average_adherence: float


class MissedPatternEntry(BaseModel):
    """Most-missed medication or time slot."""
    label: str  # medication name or hour label
    count: int
    percentage: float


class RiskFlag(BaseModel):
    """At-risk heuristic flag."""
    type: str  # missed_recent, low_adherence, repeated_slot_miss
    severity: str  # warning, critical
    message: str
    details: Optional[dict] = None


class RiskFlagsResponse(BaseModel):
    """List of detected risk flags."""
    flags: list[RiskFlag]
    evaluated_at: datetime
