"""Job Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobStatusResponse(BaseModel):
    id: str
    document_id: str
    status: str
    progress: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
