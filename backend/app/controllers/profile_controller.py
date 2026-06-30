"""Patient profile controller."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.document import Document
from app.models.patient_profile import (
    PatientProfile,
    RelationshipToOwner,
    AccessRole,
    ProfileAccess,
)
from app.models.prescription import Prescription
from app.repos.profile_repo import PatientProfileRepo, ProfileAccessRepo
from app.schemas.profile import (
    PatientProfileCreateRequest,
    PatientProfileResponse,
    PatientProfileUpdateRequest,
)
from app.services.profile_access import ProfileAccessService, ProfileAccessResolution


class PatientProfileController:
    @staticmethod
    async def ensure_default_profile(
        db: AsyncSession, owner_user_id: UUID, owner_full_name: str
    ):
        profile = await PatientProfileRepo.get_default_by_owner(db, owner_user_id)
        if profile:
            # Ensure ProfileAccess grant exists
            await ProfileAccessRepo.create_access_grant(db, profile.id, owner_user_id, AccessRole.OWNER)
            return profile

        profiles = await PatientProfileRepo.list_by_owner(db, owner_user_id)
        if profiles:
            profiles[0].is_default = True
            await db.flush()
            await ProfileAccessRepo.create_access_grant(db, profiles[0].id, owner_user_id, AccessRole.OWNER)
            return profiles[0]

        profile = await PatientProfileRepo.create(
            db,
            owner_user_id=owner_user_id,
            full_name=owner_full_name,
            relationship_to_owner=RelationshipToOwner.SELF,
            is_default=True,
        )
        await ProfileAccessRepo.create_access_grant(db, profile.id, owner_user_id, AccessRole.OWNER)
        return profile

    @staticmethod
    async def list_profile_rows_with_access(
        db: AsyncSession, owner_user_id: UUID, owner_full_name: str
    ) -> list[tuple[PatientProfile, ProfileAccess]]:
        await PatientProfileController.ensure_default_profile(db, owner_user_id, owner_full_name)
        return await PatientProfileRepo.list_accessible_profiles_with_grants(db, owner_user_id)

    @staticmethod
    async def get_profile_readable(
        db: AsyncSession, user_id: UUID, profile_id: UUID
    ) -> ProfileAccessResolution:
        return await ProfileAccessService.resolve(db, user_id, profile_id)

    @staticmethod
    def to_profile_response(
        profile,
        current_user_id: UUID,
        grant: Optional[ProfileAccess],
    ) -> PatientProfileResponse:
        is_owned = profile.owner_user_id == current_user_id
        if is_owned:
            access_role = "owner"
        elif grant is not None:
            access_role = grant.role.value
        else:
            access_role = "owner"
        redact_family = (
            not is_owned
            and grant is not None
            and grant.role == AccessRole.VIEWER
            and not grant.can_read_family_profile
        )
        return PatientProfileResponse(
            id=str(profile.id),
            owner_user_id=str(profile.owner_user_id),
            full_name=profile.full_name,
            date_of_birth=None if redact_family else profile.date_of_birth,
            gender=None if redact_family else profile.gender,
            relationship_to_owner=profile.relationship_to_owner,
            avatar_url=None if redact_family else profile.avatar_url,
            is_default=profile.is_default,
            linked_user_id=str(profile.linked_user_id) if profile.linked_user_id else None,
            sharing_level=profile.sharing_level,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            is_owned=is_owned,
            my_access_role=access_role,
        )

    @staticmethod
    async def list_profiles(db: AsyncSession, owner_user_id: UUID, owner_full_name: str):
        rows = await PatientProfileController.list_profile_rows_with_access(
            db, owner_user_id, owner_full_name
        )
        return [p for p, _ in rows]

    @staticmethod
    async def get_profile(db: AsyncSession, owner_user_id: UUID, profile_id: UUID):
        profile = await PatientProfileRepo.get_owned_by_id(db, owner_user_id, profile_id)
        if not profile:
            raise NotFoundError("Profile not found")
        return profile

    @staticmethod
    async def create_profile(
        db: AsyncSession, owner_user_id: UUID, owner_full_name: str, data: PatientProfileCreateRequest
    ):
        await PatientProfileController.ensure_default_profile(db, owner_user_id, owner_full_name)
        if data.is_default:
            await PatientProfileController._unset_default_for_owner(db, owner_user_id)
            
        linked_user_id = None
        if getattr(data, "linked_email", None):
            from app.repos.user_repo import UserRepo
            from app.core.security import hash_password
            import secrets
            # Check if user already exists
            existing_user = await UserRepo.get_by_email(db, data.linked_email)
            if existing_user:
                raise BadRequestError("A user with this email already exists")
            # Create a pending user account
            temp_password = secrets.token_urlsafe(12)
            hashed_pw = hash_password(temp_password)
            new_user = await UserRepo.create(
                db, 
                email=data.linked_email, 
                full_name=data.full_name, 
                hashed_password=hashed_pw,
                managed_by_id=owner_user_id
            )
            linked_user_id = new_user.id
            
        profile = await PatientProfileRepo.create(
            db,
            owner_user_id=owner_user_id,
            full_name=data.full_name,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            relationship_to_owner=data.relationship_to_owner,
            avatar_url=data.avatar_url,
            is_default=data.is_default,
            linked_user_id=linked_user_id,
        )
        await ProfileAccessRepo.create_access_grant(db, profile.id, owner_user_id, AccessRole.OWNER)
        return profile

    @staticmethod
    async def update_profile(
        db: AsyncSession, owner_user_id: UUID, profile_id: UUID, data: PatientProfileUpdateRequest
    ):
        profile = await PatientProfileController.get_profile(db, owner_user_id, profile_id)
        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            setattr(profile, field, value)
        await db.flush()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def set_default_profile(db: AsyncSession, owner_user_id: UUID, profile_id: UUID):
        profile = await PatientProfileController.get_profile(db, owner_user_id, profile_id)
        await PatientProfileController._unset_default_for_owner(db, owner_user_id)
        profile.is_default = True
        await db.flush()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def delete_profile(db: AsyncSession, owner_user_id: UUID, profile_id: UUID):
        profile = await PatientProfileController.get_profile(db, owner_user_id, profile_id)
        profiles = await PatientProfileRepo.list_by_owner(db, owner_user_id)
        if len(profiles) <= 1:
            raise BadRequestError("You cannot delete your only remaining profile")
        if profile.is_default:
            raise BadRequestError("Set another profile as default before deleting this profile")

        linked_docs = await db.scalar(select(Document.id).where(Document.profile_id == profile.id).limit(1))
        linked_prescriptions = await db.scalar(
            select(Prescription.id).where(Prescription.profile_id == profile.id).limit(1)
        )
        if linked_docs or linked_prescriptions:
            raise BadRequestError(
                "Profile has linked medical records and cannot be deleted"
            )

        await db.delete(profile)
        await db.flush()

    @staticmethod
    async def promote_to_independent(
        db: AsyncSession, owner_user_id: UUID, profile_id: UUID, email: str, temp_password: str
    ):
        """
        Promote a family profile to an independent account.
        Creates a new user account (or reuses an existing one) and links it to this profile,
        granting them SELF access so the data transfers when they log in.
        """
        from app.repos.user_repo import UserRepo
        from app.core.security import hash_password

        profile = await PatientProfileController.get_profile(db, owner_user_id, profile_id)

        if profile.relationship_to_owner == RelationshipToOwner.SELF:
            raise BadRequestError("Cannot promote your own profile — it is already your account")

        if profile.linked_user_id:
            raise BadRequestError("This profile is already linked to an independent account")

        # Check if a user with this email already exists
        existing_user = await UserRepo.get_by_email(db, email)
        if existing_user:
            raise BadRequestError("A user with this email already exists. Please use a different email.")

        # Create a new user account for the family member
        hashed_pw = hash_password(temp_password)
        new_user = await UserRepo.create(
            db,
            email=email,
            full_name=profile.full_name,
            hashed_password=hashed_pw,
            managed_by_id=owner_user_id,
        )

        # Link the profile to the new user
        profile.linked_user_id = new_user.id
        await db.flush()

        # Grant the new user SELF access to this profile
        await ProfileAccessRepo.create_access_grant(db, profile.id, new_user.id, AccessRole.SELF)

        await db.refresh(profile)
        return profile

    @staticmethod
    async def _unset_default_for_owner(db: AsyncSession, owner_user_id: UUID):
        profiles = await PatientProfileRepo.list_by_owner(db, owner_user_id)
        for p in profiles:
            p.is_default = False
        await db.flush()
