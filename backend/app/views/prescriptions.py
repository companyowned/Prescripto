"""Prescription API router — results, editing, and history."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.prescription_controller import PrescriptionController
from app.schemas.prescription import (
    PrescriptionResponse,
    PrescriptionUpdateRequest,
    PrescriptionListResponse,
    PrescriptionListItem,
    MedicationSchema,
    DoctorSchema,
    FacilitySchema,
)
from app.utils.parsing import extract_follow_up_requests

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def _to_response(p) -> PrescriptionResponse:
    """Convert ORM prescription to response schema."""
    follow_up_requests = extract_follow_up_requests(p.raw_output_json)
    return PrescriptionResponse(
        id=str(p.id),
        profile_id=str(p.profile_id) if p.profile_id else None,
        document_id=str(p.document_id),
        doctor=DoctorSchema(
            id=str(p.doctor.id), name=p.doctor.name, license_no=p.doctor.license_no
        ) if p.doctor else None,
        facility=FacilitySchema(
            id=str(p.facility.id), name=p.facility.name, address=p.facility.address
        ) if p.facility else None,
        diagnosis_text=p.diagnosis_text,
        medications=[
            MedicationSchema(
                id=str(m.id),
                name=m.name,
                dose=m.dose,
                frequency=m.frequency,
                duration=m.duration,
                notes=m.notes,
            )
            for m in (p.medications or [])
        ],
        follow_up_requests=follow_up_requests,
        has_lab_requests=any(request.kind == "lab" for request in follow_up_requests),
        has_radiology_requests=any(
            request.kind == "radiology" for request in follow_up_requests
        ),
        confidence_score=p.confidence_score,
        raw_output_json=p.raw_output_json,
        created_at=p.created_at,
    )


@router.get("", response_model=PrescriptionListResponse)
async def list_prescriptions(
    profile_id: UUID | None = Query(default=None),
    purpose: str | None = Query(default=None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated prescription history for the current user."""
    prescriptions, total = await PrescriptionController.get_history(
        db, current_user.id, current_user.full_name, profile_id, skip, limit, purpose
    )
    items = [
        PrescriptionListItem(
            id=str(p.id),
            profile_id=str(p.profile_id) if p.profile_id else None,
            document_id=str(p.document_id),
            purpose=p.document.purpose if p.document else "prescription",
            diagnosis_text=p.diagnosis_text,
            doctor_name=p.doctor.name if p.doctor else None,
            facility_name=p.facility.name if p.facility else None,
            medication_count=len(p.medications) if p.medications else 0,
            confidence_score=p.confidence_score,
            created_at=p.created_at,
        )
        for p in prescriptions
    ]
    return PrescriptionListResponse(prescriptions=items, total=total)


@router.get("/{document_id}", response_model=PrescriptionResponse)
async def get_prescription(
    document_id: UUID,
    profile_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full prescription analysis result for a document."""
    p = await PrescriptionController.get_by_document(db, document_id, current_user.id, profile_id)
    return _to_response(p)


@router.patch("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update prescription fields (user corrections)."""
    p = await PrescriptionController.update_prescription(
        db, prescription_id, current_user.id, data
    )
    return _to_response(p)
