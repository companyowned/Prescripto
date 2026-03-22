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
from app.repos.document_repo import DocumentRepo, JobRepo
from app.utils.file_storage import FileStorage


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


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
        file: UploadFile,
    ) -> dict:
        """Upload a document file, create Document + Job records, trigger processing."""
        filename = file.filename or "unknown"
        DocumentController._validate_extension(filename)
        file_type = DocumentController._get_file_type(filename)

        # Read file content
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise BadRequestError(f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB")

        # Save file locally (uses /tmp on Vercel)
        file_path = FileStorage.save_file(content, str(user_id), filename)

        # Create DB records
        document = await DocumentRepo.create(
            db,
            user_id=user_id,
            file_url=file_path,
            file_type=file_type,
            original_filename=filename,
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
                    logger.error(f"Background processing failed: {e}")

        asyncio.create_task(_run_processing(document.id, job.id))

        return {
            "document_id": str(document.id),
            "job_id": str(job.id),
            "status": document.status.value,
        }

    @staticmethod
    async def get_document(db: AsyncSession, doc_id: uuid.UUID, user_id: uuid.UUID):
        """Get a document; verifies ownership."""
        doc = await DocumentRepo.get_by_id(db, doc_id)
        if not doc or doc.user_id != user_id:
            raise NotFoundError("Document not found")
        return doc

    @staticmethod
    async def get_job_status(db: AsyncSession, job_id: uuid.UUID):
        """Get job processing status."""
        job = await JobRepo.get_by_id(db, job_id)
        if not job:
            raise NotFoundError("Job not found")
        return job
