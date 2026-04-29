"""Prescription Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# --- Nested schemas ---
class MedicationSchema(BaseModel):
    id: Optional[str] = None
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class DoctorSchema(BaseModel):
    id: Optional[str] = None
    name: str
    license_no: Optional[str] = None

    model_config = {"from_attributes": True}


class FacilitySchema(BaseModel):
    id: Optional[str] = None
    name: str
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class ConfidenceSchema(BaseModel):
    overall: float = 0.0


# --- Prescription schemas ---
class PrescriptionResponse(BaseModel):
    id: str
    profile_id: Optional[str] = None
    document_id: str
    doctor: Optional[DoctorSchema] = None
    facility: Optional[FacilitySchema] = None
    diagnosis_text: Optional[str] = None
    medications: list[MedicationSchema] = []
    confidence_score: Optional[float] = None
    raw_output_json: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionUpdateRequest(BaseModel):
    diagnosis_text: Optional[str] = None
    doctor: Optional[DoctorSchema] = None
    facility: Optional[FacilitySchema] = None
    medications: Optional[list[MedicationSchema]] = None


class PrescriptionListItem(BaseModel):
    id: str
    profile_id: Optional[str] = None
    document_id: str
    diagnosis_text: Optional[str] = None
    doctor_name: Optional[str] = None
    facility_name: Optional[str] = None
    medication_count: int = 0
    confidence_score: Optional[float] = None
    created_at: datetime


class PrescriptionListResponse(BaseModel):
    prescriptions: list[PrescriptionListItem]
    total: int


# --- Normalized output from SkepticGen ---
class NormalizedPrescriptionOutput(BaseModel):
    """Schema matching the normalized SkepticGen workflow output."""

    doctor: Optional[DoctorSchema] = None
    facility: Optional[FacilitySchema] = None
    diagnosis: Optional[str] = None
    medications: list[MedicationSchema] = []
    confidence: ConfidenceSchema = Field(default_factory=ConfidenceSchema)
