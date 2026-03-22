"""Medication Insights API router."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.medication_insights_controller import MedicationInsightsController
from app.schemas.medication_insights import (
    InsightsSummaryResponse,
    TrendsResponse,
    RiskFlagsResponse,
)

router = APIRouter(prefix="/medication-insights", tags=["Medication Insights"])


@router.get("/summary", response_model=InsightsSummaryResponse)
async def get_summary(
    range: str = Query("7d", pattern="^(7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get medication adherence summary with KPIs."""
    return await MedicationInsightsController.get_summary(
        db, current_user.id, range_str=range
    )


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    range: str = Query("30d", pattern="^(7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get daily adherence trend series."""
    return await MedicationInsightsController.get_trends(
        db, current_user.id, range_str=range
    )


@router.get("/risk-flags", response_model=RiskFlagsResponse)
async def get_risk_flags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get at-risk heuristic flags."""
    return await MedicationInsightsController.get_risk_flags(db, current_user.id)
