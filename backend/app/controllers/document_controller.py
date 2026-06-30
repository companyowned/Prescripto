"""Document controller — business logic for document upload and management."""

import os
import uuid
import logging
from typing import Optional

logger = logging.getLogger(__name__)

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.document import DocumentStatus, FileType
from app.controllers.profile_controller import PatientProfileController
from app.repos.document_repo import DocumentRepo, JobRepo
from app.services.profile_access import ProfileAccessService
from app.utils.file_storage import FileStorage


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_PURPOSES = {"prescription", "lab_result", "radiology_report"}


class DocumentController:
    @staticmethod
    def _get_file_type(filename: str) -> FileType:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return FileType.PDF
        elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
            return FileType.IMAGE
        raise BadRequestError(f"Unsupported file type: {ext}")

    @staticmethod
    def _validate_extension(filename: str) -> None:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise BadRequestError(
                f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

    @staticmethod
    async def upload_document(
        db: AsyncSession,
        user_id: uuid.UUID,
        owner_full_name: str,
        file: UploadFile,
        profile_id: Optional[uuid.UUID] = None,
        purpose: str = "prescription",
        parent_document_id: Optional[uuid.UUID] = None,
    ) -> dict:
        """Upload a document file, create Document + Job records, trigger processing."""
        filename = file.filename or "unknown"
        DocumentController._validate_extension(filename)
        file_type = DocumentController._get_file_type(filename)
        if purpose not in ALLOWED_PURPOSES:
            raise BadRequestError(f"Unsupported document purpose: {purpose}")

        # Check size before reading to avoid loading large files into memory
        content = await file.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise BadRequestError(f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB")

        if profile_id:
            profile = await PatientProfileController.get_profile(db, user_id, profile_id)
        else:
            profile = await PatientProfileController.ensure_default_profile(db, user_id, owner_full_name)

        if parent_document_id:
            parent = await DocumentRepo.get_by_id(db, parent_document_id)
            if not parent or parent.user_id != user_id:
                raise NotFoundError("Parent document not found")

        # Save file locally (uses /tmp on Vercel)
        file_path = FileStorage.save_file(content, str(user_id), filename)

        # Create DB records
        document = await DocumentRepo.create(
            db,
            user_id=user_id,
            profile_id=profile.id,
            file_url=file_path,
            file_type=file_type,
            original_filename=filename,
            purpose=purpose,
            parent_document_id=parent_document_id,
        )
        job = await JobRepo.create(
            db,
            document_id=document.id,
            workflow_id=settings.N8N_WEBHOOK_URL,
        )

        # Process in background (no Celery needed in dev)
        import asyncio
        from app.controllers.workflow_controller import WorkflowController
        from app.db.session import async_session_factory

        async def _run_processing(doc_id, j_id):
            async with async_session_factory() as session:
                try:
                    await WorkflowController.process_document(session, doc_id, j_id)
                except Exception as e:
                    logger.error(f"Background processing failed for doc {doc_id}: {e}", exc_info=True)

        def _log_task_exception(task: asyncio.Task) -> None:
            if not task.cancelled() and task.exception():
                logger.error("Background task raised unhandled exception", exc_info=task.exception())

        task = asyncio.create_task(_run_processing(document.id, job.id))
        task.add_done_callback(_log_task_exception)

        return {
            "document_id": str(document.id),
            "profile_id": str(profile.id),
            "job_id": str(job.id),
            "status": document.status.value,
            "purpose": document.purpose,
        }

    @staticmethod
    async def get_document(db: AsyncSession, doc_id: uuid.UUID, user_id: uuid.UUID):
        """Get a document; verifies access via profile sharing rules."""
        doc = await DocumentRepo.get_by_id(db, doc_id)
        if not doc or not doc.profile_id:
            raise NotFoundError("Document not found")
        access = await ProfileAccessService.resolve(db, user_id, doc.profile_id)
        access.require_documents_read()
        if access.owner_like and doc.user_id != user_id:
            raise NotFoundError("Document not found")
        return doc

    @staticmethod
    async def get_job_status(db: AsyncSession, job_id: uuid.UUID, user_id: uuid.UUID):
        """Get job processing status."""
        job = await JobRepo.get_by_id(db, job_id)
        if not job:
            raise NotFoundError("Job not found")
        doc = await DocumentRepo.get_by_id(db, job.document_id)
        if not doc or not doc.profile_id:
            raise NotFoundError("Job not found")
        access = await ProfileAccessService.resolve(db, user_id, doc.profile_id)
        access.require_documents_read()
        if access.owner_like and doc.user_id != user_id:
            raise NotFoundError("Job not found")
        return job
