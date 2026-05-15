"""Prescription controller — business logic for prescription retrieval and editing."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.profile_controller import PatientProfileController
from app.core.exceptions import NotFoundError, BadRequestError
from app.repos.prescription_repo import (
    PrescriptionRepo,
    DoctorRepo,
    FacilityRepo,
    MedicationRepo,
)
from app.services.profile_access import ProfileAccessService
from app.schemas.prescription import PrescriptionUpdateRequest


class PrescriptionController:
    @staticmethod
    async def get_by_document(
        db: AsyncSession, document_id: UUID, user_id: UUID, profile_id: Optional[UUID] = None
    ):
        """Get prescription result for a document, checking ownership."""
        from app.repos.document_repo import DocumentRepo

        doc = await DocumentRepo.get_by_id(db, document_id)
        if not doc or not doc.profile_id:
            raise NotFoundError("Document not found")

        access = await ProfileAccessService.resolve(db, user_id, doc.profile_id)
        access.require_prescriptions_read()

        if profile_id and doc.profile_id != profile_id:
            raise NotFoundError("Document not found")

        if access.owner_like and doc.user_id != user_id:
            raise NotFoundError("Document not found")

        prescription = await PrescriptionRepo.get_by_document_id(db, document_id)
        if not prescription:
            raise NotFoundError("Prescription not found for this document")
        return prescription

    @staticmethod
    async def get_history(
        db: AsyncSession,
        user_id: UUID,
        owner_full_name: str,
        profile_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
        purpose: Optional[str] = None,
    ):
        """Get paginated prescription history for a user."""
        resolved_profile_id = profile_id
        if resolved_profile_id:
            access = await ProfileAccessService.resolve(db, user_id, resolved_profile_id)
            access.require_prescriptions_read()
            if access.owner_like:
                return await PrescriptionRepo.get_user_prescriptions(
                    db, user_id, resolved_profile_id, skip, limit, purpose
                )
            return await PrescriptionRepo.get_prescriptions_for_profile(
                db, resolved_profile_id, skip, limit, purpose
            )

        default_profile = await PatientProfileController.ensure_default_profile(
            db, user_id, owner_full_name
        )
        resolved_profile_id = default_profile.id
        return await PrescriptionRepo.get_user_prescriptions(
            db, user_id, resolved_profile_id, skip, limit, purpose
        )

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
        if doc.profile_id is None:
            raise BadRequestError("Prescription is not linked to a profile")

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
