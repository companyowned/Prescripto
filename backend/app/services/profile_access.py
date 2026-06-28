"""Resolve whether a user may read or manage a patient profile (backend source of truth)."""

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.patient_profile import AccessRole, PatientProfile, ProfileAccess
from app.repos.profile_repo import PatientProfileRepo, ProfileAccessRepo


@dataclass
class ProfileAccessResolution:
    profile: PatientProfile
    """True if this user owns the profile row (family account owner)."""
    is_account_owner: bool
    grant: Optional[ProfileAccess]

    @property
    def owner_like(self) -> bool:
        if self.is_account_owner:
            return True
        if not self.grant:
            return False
        return self.grant.role in (AccessRole.OWNER, AccessRole.SELF)

    def require_prescriptions_read(self) -> None:
        if self.owner_like:
            return
        if not self.grant or self.grant.role != AccessRole.VIEWER:
            raise NotFoundError("Profile not found")
        if not self.grant.can_read_prescriptions:
            raise ForbiddenError("No permission to view prescriptions for this profile")

    def require_medical_history_read(self) -> None:
        if self.owner_like:
            return
        if not self.grant or self.grant.role != AccessRole.VIEWER:
            raise NotFoundError("Profile not found")
        if not self.grant.can_read_medical_history:
            raise ForbiddenError("No permission to view medical history for this profile")

    def require_documents_read(self) -> None:
        if self.owner_like:
            return
        if not self.grant or self.grant.role != AccessRole.VIEWER:
            raise NotFoundError("Profile not found")
        if not self.grant.can_read_documents:
            raise ForbiddenError("No permission to view documents for this profile")

    def require_reminders_read(self) -> None:
        if self.owner_like:
            return
        if not self.grant or self.grant.role != AccessRole.VIEWER:
            raise NotFoundError("Profile not found")
        if not self.grant.can_read_reminders:
            raise ForbiddenError("No permission to view reminders for this profile")

    def require_family_profile_read(self) -> None:
        if self.owner_like:
            return
        if not self.grant or self.grant.role != AccessRole.VIEWER:
            raise NotFoundError("Profile not found")
        if not self.grant.can_read_family_profile:
            raise ForbiddenError("No permission to view profile details for this profile")


class ProfileAccessService:
    @staticmethod
    async def resolve(db: AsyncSession, user_id: UUID, profile_id: UUID) -> ProfileAccessResolution:
        profile = await PatientProfileRepo.get_by_id(db, profile_id)
        if not profile:
            raise NotFoundError("Profile not found")

        if profile.owner_user_id == user_id:
            grant = await ProfileAccessRepo.get_grant(db, user_id, profile_id)
            return ProfileAccessResolution(
                profile=profile, is_account_owner=True, grant=grant
            )

        grant = await ProfileAccessRepo.get_grant(db, user_id, profile_id)
        if grant:
            return ProfileAccessResolution(
                profile=profile, is_account_owner=False, grant=grant
            )

        raise NotFoundError("Profile not found")

    @staticmethod
    async def resolve_optional(
        db: AsyncSession, user_id: UUID, profile_id: UUID
    ) -> Optional[ProfileAccessResolution]:
        try:
            return await ProfileAccessService.resolve(db, user_id, profile_id)
        except NotFoundError:
            return None
