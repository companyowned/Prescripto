"""Document API router — upload, status, and management."""

import mimetypes
import os
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.controllers.document_controller import DocumentController
from app.schemas.document import DocumentUploadResponse, DocumentResponse
from app.schemas.job import JobStatusResponse
from app.utils.file_storage import FileStorage

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


@router.get("/documents", response_model=list[DocumentResponse])
async def list_linked_documents(
    parent_document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all child documents (lab results, radiology reports) linked to a parent document."""
    from app.repos.document_repo import DocumentRepo
    docs = await DocumentRepo.get_children_by_parent_id(db, parent_document_id, current_user.id)
    return [
        DocumentResponse(
            id=str(d.id),
            user_id=str(d.user_id),
            profile_id=str(d.profile_id) if d.profile_id else None,
            file_url=d.file_url,
            file_type=d.file_type.value,
            original_filename=d.original_filename,
            purpose=d.purpose,
            parent_document_id=str(d.parent_document_id) if d.parent_document_id else None,
            status=d.status.value,
            created_at=d.created_at,
        )
        for d in docs
    ]


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


@router.get("/documents/{document_id}/file")
async def get_document_file(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream the raw file (image or PDF) for a document the caller has read access to."""
    doc = await DocumentController.get_document(db, document_id, current_user.id)
    file_ref = doc.file_url
    mime = mimetypes.guess_type(doc.original_filename or file_ref)[0] or "application/octet-stream"

    if FileStorage.is_remote_url(file_ref):
        content = await FileStorage.read_file(file_ref)
        if content is None:
            raise HTTPException(status_code=404, detail="File not available on server")
        return Response(content=content, media_type=mime)

    if not os.path.exists(file_ref):
        raise HTTPException(status_code=404, detail="File not available on server")
    return FileResponse(
        path=file_ref,
        media_type=mime,
        filename=doc.original_filename or "document",
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
