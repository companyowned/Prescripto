"""Tests for medication reminder and dose event functionality."""

import uuid
import pytest
from datetime import datetime, timezone, timedelta

# ── Schedule Validation Tests ──


class TestScheduleValidation:
    """Tests for schedule configuration validation logic."""

    def test_fixed_times_requires_times_array(self):
        """Fixed times schedule must have at least one time."""
        from app.controllers.medication_reminder_controller import _validate_schedule
        from app.core.exceptions import BadRequestError

        with pytest.raises(BadRequestError, match="fixed_times schedule requires"):
            _validate_schedule("fixed_times", times=None, interval_hours=None, times_per_day=1)

        with pytest.raises(BadRequestError, match="fixed_times schedule requires"):
            _validate_schedule("fixed_times", times=[], interval_hours=None, times_per_day=1)

    def test_fixed_times_valid(self):
        """Fixed times schedule with valid times array passes."""
        from app.controllers.medication_reminder_controller import _validate_schedule

        _validate_schedule("fixed_times", times=["08:00", "20:00"], interval_hours=None, times_per_day=2)

    def test_interval_requires_hours(self):
        """Interval schedule must have interval_hours set."""
        from app.controllers.medication_reminder_controller import _validate_schedule
        from app.core.exceptions import BadRequestError

        with pytest.raises(BadRequestError, match="interval_hours"):
            _validate_schedule("interval", times=None, interval_hours=None, times_per_day=1)

    def test_interval_valid(self):
        """Interval schedule with valid hours passes."""
        from app.controllers.medication_reminder_controller import _validate_schedule

        _validate_schedule("interval", times=None, interval_hours=8, times_per_day=3)

    def test_as_needed_no_constraints(self):
        """As-needed schedule has no constraints."""
        from app.controllers.medication_reminder_controller import _validate_schedule

        _validate_schedule("as_needed", times=None, interval_hours=None, times_per_day=None)

    def test_unknown_schedule_type_rejected(self):
        """Unknown schedule types are rejected."""
        from app.controllers.medication_reminder_controller import _validate_schedule
        from app.core.exceptions import BadRequestError

        with pytest.raises(BadRequestError, match="Unknown schedule_type"):
            _validate_schedule("weekly", times=None, interval_hours=None, times_per_day=1)


# ── State Transition Tests ──


class TestStateTransitions:
    """Tests for dose event status transition validation."""

    def test_pending_to_taken(self):
        """Can transition from pending to taken."""
        from app.controllers.medication_dose_event_controller import _validate_transition

        _validate_transition("pending", "taken")  # Should not raise

    def test_pending_to_skipped(self):
        """Can transition from pending to skipped."""
        from app.controllers.medication_dose_event_controller import _validate_transition

        _validate_transition("pending", "skipped")

    def test_pending_to_snoozed(self):
        """Can transition from pending to snoozed."""
        from app.controllers.medication_dose_event_controller import _validate_transition

        _validate_transition("pending", "snoozed")

    def test_taken_cannot_go_pending(self):
        """Cannot transition from taken back to pending."""
        from app.controllers.medication_dose_event_controller import _validate_transition
        from app.core.exceptions import BadRequestError

        with pytest.raises(BadRequestError, match="Cannot transition"):
            _validate_transition("taken", "pending")

    def test_skipped_is_terminal(self):
        """Skipped is a terminal state."""
        from app.controllers.medication_dose_event_controller import _validate_transition
        from app.core.exceptions import BadRequestError

        with pytest.raises(BadRequestError):
            _validate_transition("skipped", "taken")

    def test_missed_can_be_marked_taken(self):
        """Missed doses can be retroactively marked as taken."""
        from app.controllers.medication_dose_event_controller import _validate_transition

        _validate_transition("missed", "taken")  # Should not raise

    def test_snoozed_to_taken(self):
        """Snoozed can be marked as taken."""
        from app.controllers.medication_dose_event_controller import _validate_transition

        _validate_transition("snoozed", "taken")


# ── Schema Validation Tests ──


class TestSchemaValidation:
    """Tests for Pydantic schema validation."""

    def test_valid_reminder_create(self):
        """Valid create request passes."""
        from app.schemas.medication_reminder import ReminderCreateRequest

        data = ReminderCreateRequest(
            medication_name="Aspirin",
            dosage="100mg",
            start_date=datetime.now(timezone.utc),
            schedule_type="fixed_times",
            times=["08:00", "20:00"],
            times_per_day=2,
            timezone="America/New_York",
        )
        assert data.medication_name == "Aspirin"
        assert len(data.times) == 2

    def test_invalid_time_format_rejected(self):
        """Invalid time format in times array is rejected."""
        from app.schemas.medication_reminder import ReminderCreateRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="HH:MM"):
            ReminderCreateRequest(
                medication_name="Aspirin",
                start_date=datetime.now(timezone.utc),
                schedule_type="fixed_times",
                times=["8am"],
                times_per_day=1,
            )

    def test_invalid_day_of_week_rejected(self):
        """Day of week values outside 0-6 are rejected."""
        from app.schemas.medication_reminder import ReminderCreateRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="0-6"):
            ReminderCreateRequest(
                medication_name="Aspirin",
                start_date=datetime.now(timezone.utc),
                schedule_type="fixed_times",
                times=["08:00"],
                times_per_day=1,
                days_of_week=[0, 1, 7],  # 7 is invalid
            )

    def test_snooze_within_bounds(self):
        """Snooze minutes must be 5-120."""
        from app.schemas.medication_dose_event import SnoozeRequest
        from pydantic import ValidationError

        s = SnoozeRequest(snooze_minutes=30)
        assert s.snooze_minutes == 30

        with pytest.raises(ValidationError):
            SnoozeRequest(snooze_minutes=3)  # Below 5

        with pytest.raises(ValidationError):
            SnoozeRequest(snooze_minutes=200)  # Above 120

    def test_invalid_schedule_type_rejected(self):
        """Invalid schedule type is rejected."""
        from app.schemas.medication_reminder import ReminderCreateRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="schedule_type"):
            ReminderCreateRequest(
                medication_name="Aspirin",
                start_date=datetime.now(timezone.utc),
                schedule_type="biweekly",
                times_per_day=1,
            )
