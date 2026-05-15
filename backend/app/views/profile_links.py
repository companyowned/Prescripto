"""Profile linking via QR — preview, request, accept/reject."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.profile_link_controller import ProfileLinkController
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile_link import (
    ProfileLinkPreviewRequest,
    ProfileLinkPreviewResponse,
    ProfileLinkRequestCreate,
    ProfileLinkRequestListResponse,
    ProfileLinkRequestResponse,
    link_request_to_response,
)

router = APIRouter(prefix="/profile-links", tags=["Profile links"])


@router.post("/preview", response_model=ProfileLinkPreviewResponse)
async def preview_profile_link_token(
    body: ProfileLinkPreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await ProfileLinkController.preview_token(db, current_user.id, body.token)
    return ProfileLinkPreviewResponse(**data)


@router.post("/request", response_model=ProfileLinkRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_profile_link_request(
    body: ProfileLinkRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    perms = body.permissions
    row = await ProfileLinkController.submit_link_request(
        db,
        current_user.id,
        body.token,
        body.relationship_to_subject,
        can_read_prescriptions=perms.can_read_prescriptions,
        can_read_documents=perms.can_read_documents,
        can_read_reminders=perms.can_read_reminders,
        can_read_family_profile=perms.can_read_family_profile,
        can_read_medical_history=perms.can_read_medical_history,
    )
    return link_request_to_response(row)


@router.get("/incoming", response_model=ProfileLinkRequestListResponse)
async def list_incoming_link_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await ProfileLinkController.list_incoming(db, current_user.id)
    return ProfileLinkRequestListResponse(requests=[link_request_to_response(r) for r in rows])


@router.get("/outgoing", response_model=ProfileLinkRequestListResponse)
async def list_outgoing_link_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await ProfileLinkController.list_outgoing(db, current_user.id)
    return ProfileLinkRequestListResponse(requests=[link_request_to_response(r) for r in rows])


@router.post("/{request_id}/accept", response_model=ProfileLinkRequestResponse)
async def accept_profile_link_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = await ProfileLinkController.accept_request(db, current_user.id, request_id)
    return link_request_to_response(row)


@router.post("/{request_id}/reject", response_model=ProfileLinkRequestResponse)
async def reject_profile_link_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = await ProfileLinkController.reject_request(db, current_user.id, request_id)
    return link_request_to_response(row)


@router.post("/{request_id}/cancel", response_model=ProfileLinkRequestResponse)
async def cancel_profile_link_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = await ProfileLinkController.cancel_outgoing(db, current_user.id, request_id)
    return link_request_to_response(row)
