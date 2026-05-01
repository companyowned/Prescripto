"""Document Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    document_id: str
    profile_id: str
    job_id: str
    status: str
    purpose: str = "prescription"
    message: str = "Document uploaded successfully"


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    profile_id: Optional[str] = None
    file_url: str
    file_type: str
    original_filename: Optional[str] = None
    purpose: str = "prescription"
    parent_document_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
