"""Patient profile repository."""

from typing import Optional
from uuid import UUID

from sqlalchemy import and_, case, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient_profile import PatientProfile, ProfileAccess, AccessRole, RelationshipToOwner


class PatientProfileRepo:
    @staticmethod
    async def list_by_owner(db: AsyncSession, owner_user_id: UUID) -> list[PatientProfile]:
        result = await db.execute(
            select(PatientProfile)
            .where(PatientProfile.owner_user_id == owner_user_id)
            .order_by(case((PatientProfile.is_default, 0), else_=1), PatientProfile.created_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, profile_id: UUID) -> Optional[PatientProfile]:
        result = await db.execute(select(PatientProfile).where(PatientProfile.id == profile_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_owned_by_id(
        db: AsyncSession, owner_user_id: UUID, profile_id: UUID
    ) -> Optional[PatientProfile]:
        result = await db.execute(
            select(PatientProfile).where(
                and_(
                    PatientProfile.id == profile_id,
                    PatientProfile.owner_user_id == owner_user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_default_by_owner(
        db: AsyncSession, owner_user_id: UUID
    ) -> Optional[PatientProfile]:
        result = await db.execute(
            select(PatientProfile).where(
                and_(
                    PatientProfile.owner_user_id == owner_user_id,
                    PatientProfile.is_default.is_(True),
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_accessible_profiles_with_grants(
        db: AsyncSession, user_id: UUID
    ) -> list[tuple[PatientProfile, ProfileAccess]]:
        """Profiles reachable via ProfileAccess, with the grant row (for permission metadata)."""
        result = await db.execute(
            select(PatientProfile, ProfileAccess)
            .join(ProfileAccess, ProfileAccess.profile_id == PatientProfile.id)
            .where(ProfileAccess.user_id == user_id)
            .order_by(
                case((PatientProfile.owner_user_id == user_id, 0), else_=1),
                case((PatientProfile.is_default, 0), else_=1),
                PatientProfile.created_at.asc(),
            )
        )
        return list(result.all())

    @staticmethod
    async def create(
        db: AsyncSession,
        owner_user_id: UUID,
        full_name: str,
        date_of_birth=None,
        gender: Optional[str] = None,
        relationship_to_owner: RelationshipToOwner = RelationshipToOwner.SELF,
        avatar_url: Optional[str] = None,
        is_default: bool = False,
        linked_user_id: Optional[UUID] = None,
    ) -> PatientProfile:
        profile = PatientProfile(
            owner_user_id=owner_user_id,
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            relationship_to_owner=relationship_to_owner,
            avatar_url=avatar_url,
            is_default=is_default,
            linked_user_id=linked_user_id,
        )
        db.add(profile)
        await db.flush()
        await db.refresh(profile)
        return profile


class ProfileAccessRepo:
    """Data access for the ProfileAccess junction table."""

    @staticmethod
    async def create_access_grant(
        db: AsyncSession,
        profile_id: UUID,
        user_id: UUID,
        role: AccessRole = AccessRole.OWNER,
    ) -> ProfileAccess:
        """Create a ProfileAccess row (idempotent — skips if already exists)."""
        existing = await db.execute(
            select(ProfileAccess).where(
                and_(
                    ProfileAccess.profile_id == profile_id,
                    ProfileAccess.user_id == user_id,
                )
            )
        )
        grant = existing.scalar_one_or_none()
        if grant:
            return grant

        grant = ProfileAccess(
            profile_id=profile_id,
            user_id=user_id,
            role=role,
        )
        db.add(grant)
        await db.flush()
        await db.refresh(grant)
        return grant

    @staticmethod
    async def get_grant(
        db: AsyncSession, user_id: UUID, profile_id: UUID
    ) -> Optional[ProfileAccess]:
        result = await db.execute(
            select(ProfileAccess).where(
                and_(
                    ProfileAccess.profile_id == profile_id,
                    ProfileAccess.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert_viewer_grant(
        db: AsyncSession,
        profile_id: UUID,
        user_id: UUID,
        *,
        can_read_prescriptions: bool,
        can_read_documents: bool,
        can_read_reminders: bool,
        can_read_family_profile: bool,
        can_read_medical_history: bool,
    ) -> ProfileAccess:
        grant = await ProfileAccessRepo.get_grant(db, user_id, profile_id)
        if grant:
            grant.role = AccessRole.VIEWER
            grant.can_read_prescriptions = can_read_prescriptions
            grant.can_read_documents = can_read_documents
            grant.can_read_reminders = can_read_reminders
            grant.can_read_family_profile = can_read_family_profile
            grant.can_read_medical_history = can_read_medical_history
            await db.flush()
            await db.refresh(grant)
            return grant
        grant = ProfileAccess(
            profile_id=profile_id,
            user_id=user_id,
            role=AccessRole.VIEWER,
            can_read_prescriptions=can_read_prescriptions,
            can_read_documents=can_read_documents,
            can_read_reminders=can_read_reminders,
            can_read_family_profile=can_read_family_profile,
            can_read_medical_history=can_read_medical_history,
        )
        db.add(grant)
        await db.flush()
        await db.refresh(grant)
        return grant

    @staticmethod
    async def get_accessible_profiles(
        db: AsyncSession, user_id: UUID
    ) -> list[PatientProfile]:
        """Get all profiles a user has access to (owner, self, or viewer)."""
        result = await db.execute(
            select(PatientProfile)
            .join(ProfileAccess, ProfileAccess.profile_id == PatientProfile.id)
            .where(ProfileAccess.user_id == user_id)
            .order_by(PatientProfile.created_at.asc())
        )
        return list(result.scalars().all())
