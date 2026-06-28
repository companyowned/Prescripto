"""API schemas for QR profile linking."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProfileLinkQrResponse(BaseModel):
    token: str
    expires_in_hours: int
    qr_uri: str
    profile_id: str


class ProfileLinkPreviewRequest(BaseModel):
    token: str = Field(min_length=20)


class ProfileLinkPreviewResponse(BaseModel):
    profile_id: str
    profile_display_name: str
    owner_display_name: str
    is_own_profile: bool


class ProfileLinkPermissionsPayload(BaseModel):
    can_read_prescriptions: bool = True
    can_read_documents: bool = True
    can_read_reminders: bool = True
    can_read_family_profile: bool = True
    can_read_medical_history: bool = True


class ProfileLinkRequestCreate(BaseModel):
    token: str = Field(min_length=20)
    relationship_to_subject: Optional[str] = Field(default=None, max_length=64)
    permissions: ProfileLinkPermissionsPayload = Field(default_factory=ProfileLinkPermissionsPayload)


class ProfileLinkRequestResponse(BaseModel):
    id: str
    profile_id: str
    requester_user_id: str
    status: str
    relationship_to_subject: Optional[str] = None
    can_read_prescriptions: bool
    can_read_documents: bool
    can_read_reminders: bool
    can_read_family_profile: bool
    can_read_medical_history: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProfileLinkRequestListResponse(BaseModel):
    requests: list[ProfileLinkRequestResponse]


def link_request_to_response(row) -> ProfileLinkRequestResponse:
    return ProfileLinkRequestResponse(
        id=str(row.id),
        profile_id=str(row.profile_id),
        requester_user_id=str(row.requester_user_id),
        status=row.status.value if hasattr(row.status, "value") else str(row.status),
        relationship_to_subject=row.relationship_to_subject,
        can_read_prescriptions=row.can_read_prescriptions,
        can_read_documents=row.can_read_documents,
        can_read_reminders=row.can_read_reminders,
        can_read_family_profile=row.can_read_family_profile,
        can_read_medical_history=row.can_read_medical_history,
        created_at=row.created_at,
        resolved_at=row.resolved_at,
    )
