"""Workflow controller — orchestrates n8n pipeline execution."""

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.job import JobStatus
from app.repos.document_repo import DocumentRepo, JobRepo
from app.repos.prescription_repo import (
    PrescriptionRepo,
    DoctorRepo,
    FacilityRepo,
    MedicationRepo,
)
from app.models.document import DocumentStatus
from app.schemas.prescription import NormalizedPrescriptionOutput
from app.utils.n8n_client import N8nClient
from app.utils.parsing import parse_workflow_output

logger = logging.getLogger(__name__)


class WorkflowController:
    @staticmethod
    async def process_document(db: AsyncSession, document_id: UUID, job_id: UUID) -> None:
        """
        Full processing pipeline:
        1. Update statuses to PROCESSING
        2. Read file content
        3. Call n8n webhook
        4. Parse & normalize output
        5. Persist structured data
        6. Update statuses to DONE
        """
        try:
            # 1. Mark as processing
            await DocumentRepo.update_status(db, document_id, DocumentStatus.PROCESSING)
            await JobRepo.update_status(db, job_id, JobStatus.PROCESSING, progress=10)

            # 2. Get document
            doc = await DocumentRepo.get_by_id(db, document_id)
            if not doc:
                raise Exception("Document not found")

            # 3. Call n8n webhook
            await JobRepo.update_status(db, job_id, JobStatus.PROCESSING, progress=30)
            client = N8nClient()
            raw_output = await client.run_workflow(
                file_path=doc.file_url,
            )

            # 4. Parse output
            await JobRepo.update_status(db, job_id, JobStatus.PROCESSING, progress=70)
            normalized: NormalizedPrescriptionOutput = parse_workflow_output(raw_output)

            # 5. Persist structured data
            doctor = None
            if normalized.doctor and normalized.doctor.name:
                doctor = await DoctorRepo.find_or_create(
                    db, name=normalized.doctor.name, license_no=normalized.doctor.license_no
                )

            facility = None
            if normalized.facility and normalized.facility.name:
                facility = await FacilityRepo.find_or_create(
                    db, name=normalized.facility.name, address=normalized.facility.address
                )

            prescription = await PrescriptionRepo.create(
                db,
                profile_id=doc.profile_id,
                document_id=document_id,
                doctor_id=doctor.id if doctor else None,
                facility_id=facility.id if facility else None,
                diagnosis_text=normalized.diagnosis,
                raw_output_json=raw_output,
                confidence_score=normalized.confidence.overall,
            )

            # Create medications
            if normalized.medications:
                meds_data = [med.model_dump() for med in normalized.medications]
                await MedicationRepo.bulk_create(db, prescription.id, meds_data)

                # Auto-generate MedicationReminders
                from app.utils.parsing import parse_frequency_to_schedule
                from app.controllers.medication_reminder_controller import MedicationReminderController
                from app.schemas.medication_reminder import ReminderCreateRequest
                from datetime import datetime, timezone
                
                for med in normalized.medications:
                    schedule_data = parse_frequency_to_schedule(med.frequency)
                    req_data = {
                        "medication_name": med.name,
                        "dosage": med.dose,
                        "form": None,
                        "instructions": med.notes,
                        "prescription_id": str(prescription.id),
                        "start_date": datetime.now(timezone.utc),
                        "timezone": "UTC",
                        **schedule_data
                    }
                    try:
                        req_obj = ReminderCreateRequest(**req_data)
                        await MedicationReminderController.create_reminder(db, doc.user_id, req_obj)
                    except Exception as err:
                        logger.error(f"Failed to auto-create reminder for {med.name}: {err}")

            # 6. Done
            await JobRepo.update_status(db, job_id, JobStatus.DONE, progress=100)
            await DocumentRepo.update_status(db, document_id, DocumentStatus.DONE)
            await db.commit()

            logger.info(f"Document {document_id} processed successfully")

        except Exception as e:
            logger.error(f"Processing failed for document {document_id}: {e}")
            await JobRepo.update_status(
                db, job_id, JobStatus.FAILED, error_message=str(e)
            )
            await DocumentRepo.update_status(db, document_id, DocumentStatus.FAILED)
            await db.commit()
            raise
