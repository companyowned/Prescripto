"""Patient profile API router."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.profile_controller import PatientProfileController
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repos.profile_repo import ProfileAccessRepo
from app.schemas.profile import (
    PatientProfileCreateRequest,
    PatientProfileListResponse,
    PatientProfileResponse,
    PatientProfileUpdateRequest,
    PromoteToIndependentRequest,
)
from app.schemas.profile_link import ProfileLinkQrResponse


router = APIRouter(prefix="/profiles", tags=["Profiles"])


def _to_response(
    profile,
    current_user_id,
    grant=None,
) -> PatientProfileResponse:
    return PatientProfileController.to_profile_response(profile, current_user_id, grant)


@router.get("", response_model=PatientProfileListResponse)
async def list_profiles(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    rows = await PatientProfileController.list_profile_rows_with_access(
        db, current_user.id, current_user.full_name
    )
    return PatientProfileListResponse(
        profiles=[_to_response(p, current_user.id, g) for p, g in rows]
    )


@router.post("", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: PatientProfileCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.create_profile(
        db, current_user.id, current_user.full_name, data
    )
    grant = await ProfileAccessRepo.get_grant(db, current_user.id, profile.id)
    return _to_response(profile, current_user.id, grant)


@router.get("/{profile_id}/link-qr", response_model=ProfileLinkQrResponse)
async def get_profile_link_qr(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.controllers.profile_link_controller import ProfileLinkController

    data = await ProfileLinkController.issue_qr_for_profile(db, current_user.id, profile_id)
    return ProfileLinkQrResponse(**data)


@router.get("/{profile_id}", response_model=PatientProfileResponse)
async def get_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await PatientProfileController.get_profile_readable(db, current_user.id, profile_id)
    return _to_response(res.profile, current_user.id, res.grant)


@router.patch("/{profile_id}", response_model=PatientProfileResponse)
async def update_profile(
    profile_id: UUID,
    data: PatientProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.update_profile(db, current_user.id, profile_id, data)
    grant = await ProfileAccessRepo.get_grant(db, current_user.id, profile.id)
    return _to_response(profile, current_user.id, grant)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await PatientProfileController.delete_profile(db, current_user.id, profile_id)


@router.post("/{profile_id}/set-default", response_model=PatientProfileResponse)
async def set_default_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.set_default_profile(db, current_user.id, profile_id)
    grant = await ProfileAccessRepo.get_grant(db, current_user.id, profile.id)
    return _to_response(profile, current_user.id, grant)


@router.post("/{profile_id}/promote-independent", response_model=PatientProfileResponse)
async def promote_to_independent(
    profile_id: UUID,
    data: PromoteToIndependentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an independent account for a family member profile."""
    profile = await PatientProfileController.promote_to_independent(
        db, current_user.id, profile_id, data.email, data.password
    )
    grant = await ProfileAccessRepo.get_grant(db, current_user.id, profile.id)
    return _to_response(profile, current_user.id, grant)
