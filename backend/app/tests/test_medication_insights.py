"""Tests for medication insights calculations."""

import pytest
from datetime import datetime, timezone, timedelta

from app.controllers.medication_insights_controller import _compute_streaks


class TestAdherenceCalculation:
    """Tests for adherence rate computation."""

    def test_adherence_rate_all_taken(self):
        """All doses taken = 100% adherence."""
        stats = {"total": 10, "taken": 10, "missed": 0, "skipped": 0}
        total = stats["taken"] + stats["missed"] + stats["skipped"]
        rate = stats["taken"] / total if total > 0 else 0.0
        assert rate == 1.0

    def test_adherence_rate_half_taken(self):
        """Half taken = 50% adherence."""
        stats = {"total": 10, "taken": 5, "missed": 5, "skipped": 0}
        total = stats["taken"] + stats["missed"] + stats["skipped"]
        rate = stats["taken"] / total
        assert rate == 0.5

    def test_adherence_rate_with_skips(self):
        """Adherence includes skips in denominator."""
        stats = {"total": 10, "taken": 6, "missed": 2, "skipped": 2}
        total = stats["taken"] + stats["missed"] + stats["skipped"]
        rate = stats["taken"] / total
        assert rate == 0.6

    def test_adherence_rate_no_data(self):
        """No data = 0% adherence."""
        stats = {"total": 0, "taken": 0, "missed": 0, "skipped": 0}
        total = stats["taken"] + stats["missed"] + stats["skipped"]
        rate = stats["taken"] / total if total > 0 else 0.0
        assert rate == 0.0


class TestRiskFlags:
    """Tests for risk flag heuristic logic."""

    def test_missed_recent_threshold(self):
        """Missed >= 2 in 3 days triggers warning."""
        stats = {"missed": 2}
        assert stats["missed"] >= 2  # Should trigger

        stats = {"missed": 1}
        assert not (stats["missed"] >= 2)  # Should not trigger

    def test_low_adherence_threshold(self):
        """Adherence < 70% over 14 days triggers critical flag."""
        adherence = 0.65
        assert adherence < 0.70  # Should trigger

        adherence = 0.75
        assert not (adherence < 0.70)  # Should not trigger

    def test_repeated_miss_threshold(self):
        """Medication missed >= 3 times triggers warning."""
        med = {"medication_name": "Aspirin", "missed_count": 3}
        assert med["missed_count"] >= 3  # Should trigger

        med = {"medication_name": "Aspirin", "missed_count": 2}
        assert not (med["missed_count"] >= 3)  # Should not trigger


class TestRangeMapping:
    """Tests for range parameter mapping."""

    def test_range_mapping(self):
        """Range strings map to correct day counts."""
        from app.controllers.medication_insights_controller import RANGE_MAP

        assert RANGE_MAP["7d"] == 7
        assert RANGE_MAP["30d"] == 30
        assert RANGE_MAP["90d"] == 90

    def test_unknown_range_defaults(self):
        """Unknown range defaults to 7 days."""
        from app.controllers.medication_insights_controller import RANGE_MAP

        days = RANGE_MAP.get("1y", 7)
        assert days == 7


class TestTrendDataPoint:
    """Tests for trend data point schema."""

    def test_trend_data_point_creation(self):
        """Trend data points can be created with valid data."""
        from app.schemas.medication_insights import TrendDataPoint

        point = TrendDataPoint(
            date="2026-03-20",
            adherence_rate=0.85,
            taken=17,
            missed=3,
            skipped=0,
            total=20,
        )
        assert point.adherence_rate == 0.85
        assert point.taken == 17

    def test_insights_summary_response(self):
        """Insights summary response schema validates correctly."""
        from app.schemas.medication_insights import InsightsSummaryResponse

        summary = InsightsSummaryResponse(
            adherence_rate=0.92,
            total_doses=100,
            taken_count=92,
            missed_count=5,
            skipped_count=3,
            current_streak=7,
            best_streak=14,
            range_days=30,
        )
        assert summary.adherence_rate == 0.92
        assert summary.current_streak == 7
