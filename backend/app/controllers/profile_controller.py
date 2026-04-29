"""Patient profile controller."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.document import Document
from app.models.patient_profile import RelationshipToOwner
from app.models.prescription import Prescription
from app.repos.profile_repo import PatientProfileRepo
from app.schemas.profile import PatientProfileCreateRequest, PatientProfileUpdateRequest


class PatientProfileController:
    @staticmethod
    async def ensure_default_profile(
        db: AsyncSession, owner_user_id: UUID, owner_full_name: str
    ):
        profile = await PatientProfileRepo.get_default_by_owner(db, owner_user_id)
        if profile:
            return profile

        profiles = await PatientProfileRepo.list_by_owner(db, owner_user_id)
        if profiles:
            profiles[0].is_default = True
            await db.flush()
            return profiles[0]

        return await PatientProfileRepo.create(
            db,
            owner_user_id=owner_user_id,
            full_name=owner_full_name,
            relationship_to_owner=RelationshipToOwner.SELF,
            is_default=True,
        )

    @staticmethod
    async def list_profiles(db: AsyncSession, owner_user_id: UUID, owner_full_name: str):
        await PatientProfileController.ensure_default_profile(db, owner_user_id, owner_full_name)
        return await PatientProfileRepo.list_by_owner(db, owner_user_id)

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
            from app.core.security import get_password_hash
            import secrets
            # Check if user already exists
            existing_user = await UserRepo.get_by_email(db, data.linked_email)
            if existing_user:
                raise BadRequestError("A user with this email already exists")
            # Create a pending user account
            temp_password = secrets.token_urlsafe(12)
            hashed_pw = get_password_hash(temp_password)
            new_user = await UserRepo.create(
                db, 
                email=data.linked_email, 
                full_name=data.full_name, 
                hashed_password=hashed_pw,
                managed_by_id=owner_user_id
            )
            linked_user_id = new_user.id
            
        return await PatientProfileRepo.create(
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
    async def _unset_default_for_owner(db: AsyncSession, owner_user_id: UUID):
        profiles = await PatientProfileRepo.list_by_owner(db, owner_user_id)
        for p in profiles:
            p.is_default = False
        await db.flush()
