"""Document API router — upload, status, and management."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.document_controller import DocumentController
from app.schemas.document import DocumentUploadResponse, DocumentResponse
from app.schemas.job import JobStatusResponse

router = APIRouter(tags=["Documents"])


@router.post("/documents", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    profile_id: UUID | None = Form(default=None),
    purpose: str = Form(default="prescription"),
    parent_document_id: UUID | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a prescription document (image or PDF) for analysis."""
    result = await DocumentController.upload_document(
        db,
        current_user.id,
        current_user.full_name,
        file,
        profile_id,
        purpose,
        parent_document_id,
    )
    return DocumentUploadResponse(**result)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document metadata."""
    doc = await DocumentController.get_document(db, document_id, current_user.id)
    return DocumentResponse(
        id=str(doc.id),
        user_id=str(doc.user_id),
        profile_id=str(doc.profile_id) if doc.profile_id else None,
        file_url=doc.file_url,
        file_type=doc.file_type.value,
        original_filename=doc.original_filename,
        purpose=doc.purpose,
        parent_document_id=str(doc.parent_document_id) if doc.parent_document_id else None,
        status=doc.status.value,
        created_at=doc.created_at,
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get processing job status and progress."""
    job = await DocumentController.get_job_status(db, job_id, current_user.id)
    return JobStatusResponse(
        id=str(job.id),
        document_id=str(job.document_id),
        status=job.status.value,
        progress=job.progress,
        error_message=job.error_message,
        started_at=job.started_at,
        finished_at=job.finished_at,
    )
