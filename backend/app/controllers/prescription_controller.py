"""Prescription controller — business logic for prescription retrieval and editing."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repos.prescription_repo import (
    PrescriptionRepo,
    DoctorRepo,
    FacilityRepo,
    MedicationRepo,
)
from app.schemas.prescription import PrescriptionUpdateRequest


class PrescriptionController:
    @staticmethod
    async def get_by_document(db: AsyncSession, document_id: UUID, user_id: UUID):
        """Get prescription result for a document, checking ownership."""
        from app.repos.document_repo import DocumentRepo

        doc = await DocumentRepo.get_by_id(db, document_id)
        if not doc or doc.user_id != user_id:
            raise NotFoundError("Document not found")

        prescription = await PrescriptionRepo.get_by_document_id(db, document_id)
        if not prescription:
            raise NotFoundError("Prescription not found for this document")
        return prescription

    @staticmethod
    async def get_history(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 20):
        """Get paginated prescription history for a user."""
        return await PrescriptionRepo.get_user_prescriptions(db, user_id, skip, limit)

    @staticmethod
    async def update_prescription(
        db: AsyncSession,
        prescription_id: UUID,
        user_id: UUID,
        data: PrescriptionUpdateRequest,
    ):
        """Update prescription fields (user corrections)."""
        prescription = await PrescriptionRepo.get_by_id(db, prescription_id)
        if not prescription:
            raise NotFoundError("Prescription not found")

        # Verify ownership
        from app.repos.document_repo import DocumentRepo

        doc = await DocumentRepo.get_by_id(db, prescription.document_id)
        if not doc or doc.user_id != user_id:
            raise NotFoundError("Prescription not found")

        # Update diagnosis
        if data.diagnosis_text is not None:
            prescription.diagnosis_text = data.diagnosis_text

        # Update doctor
        if data.doctor is not None:
            doctor = await DoctorRepo.find_or_create(
                db, name=data.doctor.name, license_no=data.doctor.license_no
            )
            prescription.doctor_id = doctor.id

        # Update facility
        if data.facility is not None:
            facility = await FacilityRepo.find_or_create(
                db, name=data.facility.name, address=data.facility.address
            )
            prescription.facility_id = facility.id

        # Update medications (replace all)
        if data.medications is not None:
            await MedicationRepo.delete_by_prescription(db, prescription_id)
            meds_data = [med.model_dump() for med in data.medications]
            await MedicationRepo.bulk_create(db, prescription_id, meds_data)

        await PrescriptionRepo.update(db, prescription)
        return await PrescriptionRepo.get_by_id(db, prescription_id)
