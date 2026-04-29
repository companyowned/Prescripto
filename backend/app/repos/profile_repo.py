"""Patient profile repository."""

from typing import Optional
from uuid import UUID

from sqlalchemy import and_, case, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient_profile import PatientProfile, RelationshipToOwner


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
