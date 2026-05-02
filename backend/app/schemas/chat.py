"""Chat assistant request and response schemas."""

from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    profile_id: Optional[UUID] = None
    include_family_profiles: bool = True
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    max_records: int = Field(default=20, ge=1, le=50)


class ChatSource(BaseModel):
    type: Literal[
        "prescription",
        "reminder",
        "dose",
        "general_medical",
        "safety",
        "system",
    ]
    title: str
    reference_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    message: str
    mode: Literal["llamaindex", "fallback"]
    sources: list[ChatSource] = Field(default_factory=list)
    safety_disclaimer: str
