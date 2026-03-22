"""Medication Insights controller — analytics and risk detection."""

import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repos.medication_dose_event_repo import MedicationDoseEventRepo
from app.schemas.medication_insights import (
    InsightsSummaryResponse,
    TrendDataPoint,
    TrendsResponse,
    MissedPatternEntry,
    RiskFlag,
    RiskFlagsResponse,
)

logger = logging.getLogger(__name__)

RANGE_MAP = {"7d": 7, "30d": 30, "90d": 90}


class MedicationInsightsController:
    @staticmethod
    async def get_summary(
        db: AsyncSession, user_id: UUID, range_str: str = "7d"
    ) -> InsightsSummaryResponse:
        """Compute KPI summary for the given range."""
        days = RANGE_MAP.get(range_str, 7)
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)

        stats = await MedicationDoseEventRepo.get_aggregate_stats(
            db, user_id, start, end
        )

        total = stats["taken"] + stats["missed"] + stats["skipped"]
        adherence_rate = stats["taken"] / total if total > 0 else 0.0

        # Compute streaks
        current_streak, best_streak = await _compute_streaks(db, user_id, days=90)

        return InsightsSummaryResponse(
            adherence_rate=round(adherence_rate, 4),
            total_doses=stats["total"],
            taken_count=stats["taken"],
            missed_count=stats["missed"],
            skipped_count=stats["skipped"],
            current_streak=current_streak,
            best_streak=best_streak,
            range_days=days,
        )

    @staticmethod
    async def get_trends(
        db: AsyncSession, user_id: UUID, range_str: str = "30d"
    ) -> TrendsResponse:
        """Compute daily adherence trend series."""
        days = RANGE_MAP.get(range_str, 30)
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)

        daily_stats = await MedicationDoseEventRepo.get_daily_stats(
            db, user_id, start, end
        )

        data_points = []
        total_adherence = 0.0
        for day in daily_stats:
            actionable = day["taken"] + day["missed"] + day["skipped"]
            rate = day["taken"] / actionable if actionable > 0 else 0.0
            total_adherence += rate
            data_points.append(
                TrendDataPoint(
                    date=day["date"],
                    adherence_rate=round(rate, 4),
                    taken=day["taken"],
                    missed=day["missed"],
                    skipped=day["skipped"],
                    total=day["total"],
                )
            )

        avg = total_adherence / len(data_points) if data_points else 0.0

        return TrendsResponse(
            data=data_points,
            range_days=days,
            average_adherence=round(avg, 4),
        )

    @staticmethod
    async def get_risk_flags(
        db: AsyncSession, user_id: UUID
    ) -> RiskFlagsResponse:
        """Detect at-risk patterns."""
        now = datetime.now(timezone.utc)
        flags: list[RiskFlag] = []

        # 1. Missed ≥ 2 in last 3 days
        three_days_ago = now - timedelta(days=3)
        recent_stats = await MedicationDoseEventRepo.get_aggregate_stats(
            db, user_id, three_days_ago, now
        )
        if recent_stats["missed"] >= 2:
            flags.append(RiskFlag(
                type="missed_recent",
                severity="warning",
                message=f"You missed {recent_stats['missed']} doses in the last 3 days",
                details={"missed_count": recent_stats["missed"], "period_days": 3},
            ))

        # 2. Adherence < 70% over 14 days
        fourteen_days_ago = now - timedelta(days=14)
        two_week_stats = await MedicationDoseEventRepo.get_aggregate_stats(
            db, user_id, fourteen_days_ago, now
        )
        two_week_total = two_week_stats["taken"] + two_week_stats["missed"] + two_week_stats["skipped"]
        two_week_adherence = two_week_stats["taken"] / two_week_total if two_week_total > 0 else 1.0
        if two_week_adherence < 0.70 and two_week_total > 0:
            flags.append(RiskFlag(
                type="low_adherence",
                severity="critical",
                message=f"Your 14-day adherence is {round(two_week_adherence * 100, 1)}%",
                details={
                    "adherence_rate": round(two_week_adherence, 4),
                    "period_days": 14,
                },
            ))

        # 3. Repeated misses — top missed medication
        missed_by_med = await MedicationDoseEventRepo.get_missed_by_medication(
            db, user_id, fourteen_days_ago, now
        )
        for med in missed_by_med[:3]:
            if med["missed_count"] >= 3:
                flags.append(RiskFlag(
                    type="repeated_slot_miss",
                    severity="warning",
                    message=f"{med['medication_name']} has been missed {med['missed_count']} times",
                    details={
                        "medication_name": med["medication_name"],
                        "missed_count": med["missed_count"],
                    },
                ))

        return RiskFlagsResponse(flags=flags, evaluated_at=now)


async def _compute_streaks(
    db: AsyncSession, user_id: UUID, days: int = 90
) -> tuple[int, int]:
    """Compute current streak and best streak of consecutive 100% adherence days."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)

    daily_stats = await MedicationDoseEventRepo.get_daily_stats(
        db, user_id, start, end
    )

    if not daily_stats:
        return 0, 0

    # Build set of dates with 100% adherence
    perfect_dates = set()
    for day in daily_stats:
        actionable = day["taken"] + day["missed"] + day["skipped"]
        if actionable > 0 and day["taken"] == actionable:
            perfect_dates.add(day["date"])

    # Compute current streak (counting backwards from today)
    current_streak = 0
    check_date = end.date()
    while str(check_date) in perfect_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Compute best streak
    best_streak = 0
    current_run = 0
    check_date = start.date()
    while check_date <= end.date():
        if str(check_date) in perfect_dates:
            current_run += 1
            best_streak = max(best_streak, current_run)
        else:
            current_run = 0
        check_date += timedelta(days=1)

    return current_streak, best_streak
