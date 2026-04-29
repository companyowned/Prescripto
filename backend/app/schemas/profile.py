"""Patient profile schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.patient_profile import RelationshipToOwner


class PatientProfileBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=50)
    relationship_to_owner: RelationshipToOwner
    avatar_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("full_name cannot be empty")
        return cleaned


class PatientProfileCreateRequest(PatientProfileBase):
    is_default: bool = False
    linked_email: Optional[str] = Field(default=None, max_length=255)



class PatientProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=50)
    relationship_to_owner: Optional[RelationshipToOwner] = None
    avatar_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("full_name cannot be empty")
        return cleaned


class PatientProfileResponse(BaseModel):
    id: str
    owner_user_id: str
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    relationship_to_owner: RelationshipToOwner
    avatar_url: Optional[str] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientProfileListResponse(BaseModel):
    profiles: list[PatientProfileResponse]
