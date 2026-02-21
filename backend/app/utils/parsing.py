"""Parsing utility — normalize SkepticGen workflow output to structured schema."""

import logging
from typing import Any

from app.schemas.prescription import (
    NormalizedPrescriptionOutput,
    DoctorSchema,
    FacilitySchema,
    MedicationSchema,
    ConfidenceSchema,
)

logger = logging.getLogger(__name__)


def parse_workflow_output(raw_output: dict[str, Any]) -> NormalizedPrescriptionOutput:
    """
    Parse and normalize the raw n8n webhook output into
    the standardized NormalizedPrescriptionOutput schema.

    Handles missing fields gracefully, setting them to None.
    """
    try:
        import json

        def _find_json_with_meds(data: Any) -> dict | None:
            """Recursively search for a dictionary containing 'medications' or 'doctor',
               even if it's buried in a string like Gemini's content.parts[0].text"""
            if isinstance(data, dict):
                # If this dict has what we want, return it!
                if "doctor" in data or "medications" in data:
                    return data
                
                # Otherwise, search its values
                for k, v in data.items():
                    res = _find_json_with_meds(v)
                    if res: return res

            elif isinstance(data, list):
                for item in data:
                    res = _find_json_with_meds(item)
                    if res: return res

            elif isinstance(data, str):
                # Is it an encoded JSON string?
                try:
                    if "{" in data and "}" in data:
                        start = data.find("{")
                        end = data.rfind("}") + 1
                        parsed = json.loads(data[start:end])
                        if isinstance(parsed, dict) and ("doctor" in parsed or "medications" in parsed):
                            return parsed
                except Exception:
                    pass
            return None

        # Try to find the real JSON payload hidden ANYWHERE in the response
        found_data = _find_json_with_meds(raw_output)
        if found_data:
            raw_output = found_data

        if "json" in raw_output and isinstance(raw_output["json"], dict):
            raw_output = raw_output["json"]
        if "data" in raw_output and isinstance(raw_output["data"], dict):
            raw_output = raw_output["data"]

        # Parse doctor
        doctor_data = raw_output.get("doctor")
        doctor = None
        if doctor_data and isinstance(doctor_data, dict):
            name = doctor_data.get("name")
            if name:
                doctor = DoctorSchema(
                    name=name,
                    license_no=doctor_data.get("license_no"),
                )

        # Parse facility
        facility_data = raw_output.get("facility")
        facility = None
        if facility_data and isinstance(facility_data, dict):
            name = facility_data.get("name")
            if name:
                facility = FacilitySchema(
                    name=name,
                    address=facility_data.get("address"),
                )

        # Parse diagnosis
        diagnosis = raw_output.get("diagnosis")
        if isinstance(diagnosis, dict):
            diagnosis = diagnosis.get("text") or diagnosis.get("description")

        # Parse medications
        medications_data = raw_output.get("medications", [])
        medications = []
        if isinstance(medications_data, list):
            for med in medications_data:
                if isinstance(med, dict) and med.get("name"):
                    medications.append(
                        MedicationSchema(
                            name=med["name"],
                            dose=med.get("dose") or med.get("dosage"),
                            frequency=med.get("frequency"),
                            duration=med.get("duration"),
                            notes=med.get("notes"),
                        )
                    )

        # Parse confidence
        confidence_data = raw_output.get("confidence", {})
        overall = 0.0
        if isinstance(confidence_data, dict):
            overall = float(confidence_data.get("overall", 0.0))
        elif isinstance(confidence_data, (int, float)):
            overall = float(confidence_data)

        return NormalizedPrescriptionOutput(
            doctor=doctor,
            facility=facility,
            diagnosis=diagnosis,
            medications=medications,
            confidence=ConfidenceSchema(overall=overall),
        )

    except Exception as e:
        logger.error(f"Failed to parse workflow output: {e}")
        # Return empty but valid output on parse failure
        return NormalizedPrescriptionOutput()
