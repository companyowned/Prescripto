"""Prescription repository — data access for Prescription and related entities."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.prescription import Prescription
from app.models.medication import Medication
from app.models.doctor import Doctor
from app.models.facility import Facility


class PrescriptionRepo:
    @staticmethod
    async def create(
        db: AsyncSession,
        document_id: UUID,
        doctor_id: Optional[UUID] = None,
        facility_id: Optional[UUID] = None,
        diagnosis_text: Optional[str] = None,
        raw_output_json: Optional[dict] = None,
        confidence_score: Optional[float] = None,
    ) -> Prescription:
        prescription = Prescription(
            document_id=document_id,
            doctor_id=doctor_id,
            facility_id=facility_id,
            diagnosis_text=diagnosis_text,
            raw_output_json=raw_output_json,
            confidence_score=confidence_score,
        )
        db.add(prescription)
        await db.flush()
        await db.refresh(prescription)
        return prescription

    @staticmethod
    async def get_by_id(db: AsyncSession, prescription_id: UUID) -> Optional[Prescription]:
        result = await db.execute(
            select(Prescription)
            .options(
                selectinload(Prescription.doctor),
                selectinload(Prescription.facility),
                selectinload(Prescription.medications),
            )
            .where(Prescription.id == prescription_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_document_id(db: AsyncSession, document_id: UUID) -> Optional[Prescription]:
        result = await db.execute(
            select(Prescription)
            .options(
                selectinload(Prescription.doctor),
                selectinload(Prescription.facility),
                selectinload(Prescription.medications),
            )
            .where(Prescription.document_id == document_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_prescriptions(
        db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> tuple[list[Prescription], int]:
        from app.models.document import Document

        count_result = await db.execute(
            select(func.count())
            .select_from(Prescription)
            .join(Document)
            .where(Document.user_id == user_id)
        )
        total = count_result.scalar()

        result = await db.execute(
            select(Prescription)
            .join(Document)
            .options(
                selectinload(Prescription.doctor),
                selectinload(Prescription.facility),
                selectinload(Prescription.medications),
            )
            .where(Document.user_id == user_id)
            .order_by(Prescription.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def update(db: AsyncSession, prescription: Prescription) -> Prescription:
        await db.flush()
        await db.refresh(prescription)
        return prescription


class DoctorRepo:
    @staticmethod
    async def find_or_create(db: AsyncSession, name: str, license_no: Optional[str] = None) -> Doctor:
        result = await db.execute(select(Doctor).where(Doctor.name == name))
        doctor = result.scalar_one_or_none()
        if not doctor:
            doctor = Doctor(name=name, license_no=license_no)
            db.add(doctor)
            await db.flush()
            await db.refresh(doctor)
        return doctor


class FacilityRepo:
    @staticmethod
    async def find_or_create(db: AsyncSession, name: str, address: Optional[str] = None) -> Facility:
        result = await db.execute(select(Facility).where(Facility.name == name))
        facility = result.scalar_one_or_none()
        if not facility:
            facility = Facility(name=name, address=address)
            db.add(facility)
            await db.flush()
            await db.refresh(facility)
        return facility


class MedicationRepo:
    @staticmethod
    async def bulk_create(
        db: AsyncSession, prescription_id: UUID, medications_data: list[dict]
    ) -> list[Medication]:
        medications = []
        for med_data in medications_data:
            med = Medication(
                prescription_id=prescription_id,
                name=med_data["name"],
                dose=med_data.get("dose"),
                frequency=med_data.get("frequency"),
                duration=med_data.get("duration"),
                notes=med_data.get("notes"),
            )
            db.add(med)
            medications.append(med)
        await db.flush()
        return medications

    @staticmethod
    async def delete_by_prescription(db: AsyncSession, prescription_id: UUID) -> None:
        result = await db.execute(
            select(Medication).where(Medication.prescription_id == prescription_id)
        )
        for med in result.scalars().all():
            await db.delete(med)
        await db.flush()
