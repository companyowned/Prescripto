"""Patient profile API router."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.profile_controller import PatientProfileController
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import (
    PatientProfileCreateRequest,
    PatientProfileListResponse,
    PatientProfileResponse,
    PatientProfileUpdateRequest,
)

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def _to_response(profile) -> PatientProfileResponse:
    return PatientProfileResponse(
        id=str(profile.id),
        owner_user_id=str(profile.owner_user_id),
        full_name=profile.full_name,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        relationship_to_owner=profile.relationship_to_owner,
        avatar_url=profile.avatar_url,
        is_default=profile.is_default,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=PatientProfileListResponse)
async def list_profiles(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    profiles = await PatientProfileController.list_profiles(db, current_user.id, current_user.full_name)
    return PatientProfileListResponse(profiles=[_to_response(p) for p in profiles])


@router.post("", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: PatientProfileCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.create_profile(
        db, current_user.id, current_user.full_name, data
    )
    return _to_response(profile)


@router.get("/{profile_id}", response_model=PatientProfileResponse)
async def get_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.get_profile(db, current_user.id, profile_id)
    return _to_response(profile)


@router.patch("/{profile_id}", response_model=PatientProfileResponse)
async def update_profile(
    profile_id: UUID,
    data: PatientProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await PatientProfileController.update_profile(db, current_user.id, profile_id, data)
    return _to_response(profile)


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
    return _to_response(profile)
