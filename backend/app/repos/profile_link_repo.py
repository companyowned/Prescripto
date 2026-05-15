"""Persistence for profile link requests."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile_link_request import ProfileLinkRequest, ProfileLinkRequestStatus


class ProfileLinkRequestRepo:
    @staticmethod
    async def get_pending_for_pair(
        db: AsyncSession, profile_id: UUID, requester_user_id: UUID
    ) -> Optional[ProfileLinkRequest]:
        result = await db.execute(
            select(ProfileLinkRequest).where(
                and_(
                    ProfileLinkRequest.profile_id == profile_id,
                    ProfileLinkRequest.requester_user_id == requester_user_id,
                    ProfileLinkRequest.status == ProfileLinkRequestStatus.PENDING,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_pending(
        db: AsyncSession,
        profile_id: UUID,
        requester_user_id: UUID,
        relationship_to_subject: Optional[str],
        *,
        can_read_prescriptions: bool,
        can_read_documents: bool,
        can_read_reminders: bool,
        can_read_family_profile: bool,
        can_read_medical_history: bool,
    ) -> ProfileLinkRequest:
        row = ProfileLinkRequest(
            profile_id=profile_id,
            requester_user_id=requester_user_id,
            status=ProfileLinkRequestStatus.PENDING,
            relationship_to_subject=relationship_to_subject,
            can_read_prescriptions=can_read_prescriptions,
            can_read_documents=can_read_documents,
            can_read_reminders=can_read_reminders,
            can_read_family_profile=can_read_family_profile,
            can_read_medical_history=can_read_medical_history,
        )
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return row

    @staticmethod
    async def get_by_id(db: AsyncSession, request_id: UUID) -> Optional[ProfileLinkRequest]:
        result = await db.execute(select(ProfileLinkRequest).where(ProfileLinkRequest.id == request_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_incoming_for_owner_profiles(
        db: AsyncSession, owner_user_id: UUID
    ) -> list[ProfileLinkRequest]:
        from app.models.patient_profile import PatientProfile

        result = await db.execute(
            select(ProfileLinkRequest)
            .join(PatientProfile, PatientProfile.id == ProfileLinkRequest.profile_id)
            .where(
                and_(
                    PatientProfile.owner_user_id == owner_user_id,
                    ProfileLinkRequest.status == ProfileLinkRequestStatus.PENDING,
                )
            )
            .order_by(ProfileLinkRequest.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_outgoing_for_user(db: AsyncSession, user_id: UUID) -> list[ProfileLinkRequest]:
        result = await db.execute(
            select(ProfileLinkRequest)
            .where(
                and_(
                    ProfileLinkRequest.requester_user_id == user_id,
                    ProfileLinkRequest.status == ProfileLinkRequestStatus.PENDING,
                )
            )
            .order_by(ProfileLinkRequest.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def mark_status(
        db: AsyncSession,
        row: ProfileLinkRequest,
        status: ProfileLinkRequestStatus,
    ) -> ProfileLinkRequest:
        row.status = status
        row.resolved_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(row)
        return row
