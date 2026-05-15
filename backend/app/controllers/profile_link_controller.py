"""Business logic for QR-based profile linking."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.profile_qr_tokens import create_profile_qr_token, decode_profile_qr_token
from app.models.patient_profile import AccessRole
from app.models.profile_link_request import ProfileLinkRequestStatus
from app.repos.profile_link_repo import ProfileLinkRequestRepo
from app.repos.profile_repo import PatientProfileRepo, ProfileAccessRepo
from app.repos.user_repo import UserRepo


class ProfileLinkController:
    @staticmethod
    async def issue_qr_for_profile(
        db: AsyncSession, owner_user_id: UUID, profile_id: UUID
    ) -> dict:
        profile = await PatientProfileRepo.get_owned_by_id(db, owner_user_id, profile_id)
        if not profile:
            raise NotFoundError("Profile not found")
        token = create_profile_qr_token(profile.id)
        scheme = settings.PROFILE_LINK_QR_SCHEME.strip() or "dawini"
        return {
            "token": token,
            "expires_in_hours": 72,
            "qr_uri": f"{scheme}://profile-link?token={token}",
            "profile_id": str(profile.id),
        }

    @staticmethod
    async def preview_token(db: AsyncSession, current_user_id: UUID, token: str) -> dict:
        profile_id = decode_profile_qr_token(token)
        profile = await PatientProfileRepo.get_by_id(db, profile_id)
        if not profile:
            raise BadRequestError("This profile link is no longer valid")

        owner = await UserRepo.get_by_id(db, profile.owner_user_id)
        owner_label = owner.full_name if owner else "Another user"

        return {
            "profile_id": str(profile.id),
            "profile_display_name": profile.full_name,
            "owner_display_name": owner_label,
            "is_own_profile": profile.owner_user_id == current_user_id,
        }

    @staticmethod
    async def submit_link_request(
        db: AsyncSession,
        requester_user_id: UUID,
        token: str,
        relationship_to_subject: Optional[str],
        *,
        can_read_prescriptions: bool,
        can_read_documents: bool,
        can_read_reminders: bool,
        can_read_family_profile: bool,
        can_read_medical_history: bool,
    ):
        profile_id = decode_profile_qr_token(token)
        profile = await PatientProfileRepo.get_by_id(db, profile_id)
        if not profile:
            raise BadRequestError("This profile link is no longer valid")

        if profile.owner_user_id == requester_user_id:
            raise BadRequestError("You cannot link to your own profile")

        if profile.linked_user_id == requester_user_id:
            raise BadRequestError("This profile is already linked to your account")

        existing_grant = await ProfileAccessRepo.get_grant(db, requester_user_id, profile_id)
        if existing_grant and existing_grant.role == AccessRole.VIEWER:
            raise BadRequestError("You already have shared access to this profile")

        pending = await ProfileLinkRequestRepo.get_pending_for_pair(db, profile_id, requester_user_id)
        if pending:
            return pending

        return await ProfileLinkRequestRepo.create_pending(
            db,
            profile_id,
            requester_user_id,
            relationship_to_subject,
            can_read_prescriptions=can_read_prescriptions,
            can_read_documents=can_read_documents,
            can_read_reminders=can_read_reminders,
            can_read_family_profile=can_read_family_profile,
            can_read_medical_history=can_read_medical_history,
        )

    @staticmethod
    async def list_incoming(db: AsyncSession, owner_user_id: UUID):
        return await ProfileLinkRequestRepo.list_incoming_for_owner_profiles(db, owner_user_id)

    @staticmethod
    async def list_outgoing(db: AsyncSession, user_id: UUID):
        return await ProfileLinkRequestRepo.list_outgoing_for_user(db, user_id)

    @staticmethod
    async def accept_request(db: AsyncSession, owner_user_id: UUID, request_id: UUID):
        row = await ProfileLinkRequestRepo.get_by_id(db, request_id)
        if not row or row.status != ProfileLinkRequestStatus.PENDING:
            raise NotFoundError("Request not found")

        profile = await PatientProfileRepo.get_owned_by_id(db, owner_user_id, row.profile_id)
        if not profile:
            raise NotFoundError("Request not found")

        await ProfileAccessRepo.upsert_viewer_grant(
            db,
            row.profile_id,
            row.requester_user_id,
            can_read_prescriptions=row.can_read_prescriptions,
            can_read_documents=row.can_read_documents,
            can_read_reminders=row.can_read_reminders,
            can_read_family_profile=row.can_read_family_profile,
            can_read_medical_history=row.can_read_medical_history,
        )
        await ProfileLinkRequestRepo.mark_status(db, row, ProfileLinkRequestStatus.ACCEPTED)
        return row

    @staticmethod
    async def reject_request(db: AsyncSession, owner_user_id: UUID, request_id: UUID):
        row = await ProfileLinkRequestRepo.get_by_id(db, request_id)
        if not row or row.status != ProfileLinkRequestStatus.PENDING:
            raise NotFoundError("Request not found")

        profile = await PatientProfileRepo.get_owned_by_id(db, owner_user_id, row.profile_id)
        if not profile:
            raise NotFoundError("Request not found")

        await ProfileLinkRequestRepo.mark_status(db, row, ProfileLinkRequestStatus.REJECTED)
        return row

    @staticmethod
    async def cancel_outgoing(db: AsyncSession, requester_user_id: UUID, request_id: UUID):
        row = await ProfileLinkRequestRepo.get_by_id(db, request_id)
        if not row or row.requester_user_id != requester_user_id:
            raise NotFoundError("Request not found")
        if row.status != ProfileLinkRequestStatus.PENDING:
            raise BadRequestError("Request is no longer pending")
        await ProfileLinkRequestRepo.mark_status(db, row, ProfileLinkRequestStatus.CANCELLED)
        return row
