"""Tests for family profile validation and guardrails."""

import uuid
import pytest
from pydantic import ValidationError

from app.controllers.profile_controller import PatientProfileController
from app.core.exceptions import BadRequestError
from app.schemas.profile import PatientProfileCreateRequest


def test_profile_schema_relationship_validation():
    data = PatientProfileCreateRequest(full_name="John Doe", relationship_to_owner="self")
    assert data.relationship_to_owner == "self"

    with pytest.raises(ValidationError):
        PatientProfileCreateRequest(full_name="Jane", relationship_to_owner="invalid")


@pytest.mark.asyncio
async def test_cannot_delete_only_remaining_profile(monkeypatch):
    owner_id = uuid.uuid4()
    profile_id = uuid.uuid4()

    class Profile:
        def __init__(self):
            self.id = profile_id
            self.is_default = False

    profile = Profile()

    async def fake_get_profile(db, owner_user_id, target_profile_id):
        assert owner_user_id == owner_id
        assert target_profile_id == profile_id
        return profile

    async def fake_list_by_owner(db, owner_user_id):
        return [profile]

    monkeypatch.setattr(PatientProfileController, "get_profile", fake_get_profile)
    from app.repos.profile_repo import PatientProfileRepo
    monkeypatch.setattr(PatientProfileRepo, "list_by_owner", fake_list_by_owner)

    with pytest.raises(BadRequestError, match="only remaining profile"):
        await PatientProfileController.delete_profile(None, owner_id, profile_id)
