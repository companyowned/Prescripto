"""Parsing utility — normalize SkepticGen workflow output to structured schema."""

import logging
import re
from typing import Any

from app.schemas.prescription import (
    NormalizedPrescriptionOutput,
    DoctorSchema,
    FacilitySchema,
    MedicationSchema,
    ConfidenceSchema,
    FollowUpRequestSchema,
)

logger = logging.getLogger(__name__)


LAB_PATTERNS = {
    "CBC": r"\b(cbc|complete blood count)\b",
    "Blood glucose": r"\b(fbs|fasting blood sugar|blood glucose|blood sugar|rbs)\b",
    "HbA1c": r"\b(hba1c|a1c)\b",
    "Liver function tests": r"\b(lft|liver function)\b",
    "Kidney function tests": r"\b(kft|renal function|kidney function|creatinine|urea)\b",
    "Lipid profile": r"\b(lipid profile|cholesterol|triglycerides)\b",
    "Thyroid profile": r"\b(tsh|thyroid profile|t3|t4)\b",
    "Urine analysis": r"\b(urine analysis|urinalysis|urine test)\b",
    "Inflammatory markers": r"\b(crp|esr)\b",
    "Coagulation profile": r"\b(pt|inr|ptt|coagulation profile)\b",
    "Laboratory tests": r"\b(lab tests?|laboratory tests?|blood tests?|investigations?)\b",
}

RADIOLOGY_PATTERNS = {
    "X-ray": r"\b(x[- ]?ray|xray)\b",
    "Ultrasound": r"\b(ultrasound|u/s|usg|sonography)\b",
    "CT scan": r"\b(ct scan|computed tomography)\b",
    "MRI": r"\b(mri|magnetic resonance)\b",
    "Mammography": r"\b(mammogram|mammography)\b",
    "Doppler study": r"\b(doppler)\b",
    "Radiology report": r"\b(radiology|imaging|radiograph|scan report)\b",
}


def _flatten_text(data: Any) -> str:
    if isinstance(data, dict):
        return " ".join(_flatten_text(value) for value in data.values())
    if isinstance(data, list):
        return " ".join(_flatten_text(item) for item in data)
    if isinstance(data, str):
        return data
    return ""


def _normalize_follow_up_item(item: Any, kind: str) -> FollowUpRequestSchema | None:
    if isinstance(item, str):
        name = item.strip()
        return FollowUpRequestSchema(
            kind=kind,
            name=name or ("Laboratory tests" if kind == "lab" else "Radiology report"),
            confidence=0.85,
            source="workflow",
        )

    if not isinstance(item, dict):
        return None

    item_kind = (
        item.get("kind")
        or item.get("type")
        or item.get("category")
        or item.get("request_type")
        or kind
    )
    item_kind = str(item_kind).lower()
    if item_kind in {"laboratory", "labs", "lab_test", "lab tests"}:
        item_kind = "lab"
    if item_kind in {"radiology_report", "imaging", "scan", "xray", "x-ray"}:
        item_kind = "radiology"
    if item_kind not in {"lab", "radiology"}:
        item_kind = kind

    name = item.get("name") or item.get("test") or item.get("exam") or item.get("request")
    if not name:
        name = "Laboratory tests" if item_kind == "lab" else "Radiology report"

    confidence = item.get("confidence", 0.85)
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.85

    return FollowUpRequestSchema(
        kind=item_kind,
        name=str(name),
        instructions=item.get("instructions") or item.get("notes"),
        confidence=confidence,
        source=item.get("source") or "workflow",
    )


def _add_request(
    requests: list[FollowUpRequestSchema],
    seen: set[tuple[str, str]],
    request: FollowUpRequestSchema | None,
) -> None:
    if not request:
        return
    key = (request.kind, request.name.strip().lower())
    if key not in seen:
        seen.add(key)
        requests.append(request)


def extract_follow_up_requests(raw_output: dict[str, Any] | None) -> list[FollowUpRequestSchema]:
    """Extract requested lab and radiology follow-ups from structured output or OCR text."""
    if not raw_output:
        return []

    requests: list[FollowUpRequestSchema] = []
    seen: set[tuple[str, str]] = set()

    structured_keys = {
        "follow_up_requests": None,
        "requested_tests": None,
        "investigations": None,
        "lab_tests": "lab",
        "laboratory_tests": "lab",
        "labs": "lab",
        "radiology_requests": "radiology",
        "radiology": "radiology",
        "imaging": "radiology",
        "imaging_requests": "radiology",
    }

    def visit(data: Any) -> None:
        if isinstance(data, dict):
            for key, value in data.items():
                normalized_key = key.lower()
                if normalized_key in structured_keys:
                    default_kind = structured_keys[normalized_key]
                    values = value if isinstance(value, list) else [value]
                    for item in values:
                        inferred_kind = default_kind
                        if inferred_kind is None and isinstance(item, dict):
                            inferred_kind = item.get("kind") or item.get("type") or item.get("category")
                        inferred_kind = str(inferred_kind or "lab").lower()
                        if inferred_kind in {"laboratory", "labs", "lab_test", "lab tests"}:
                            inferred_kind = "lab"
                        if inferred_kind in {"radiology_report", "imaging", "scan", "xray", "x-ray"}:
                            inferred_kind = "radiology"
                        if inferred_kind not in {"lab", "radiology"}:
                            inferred_kind = "lab"
                        _add_request(requests, seen, _normalize_follow_up_item(item, inferred_kind))
                visit(value)
        elif isinstance(data, list):
            for item in data:
                visit(item)

    visit(raw_output)

    flattened = _flatten_text(raw_output).lower()
    for name, pattern in LAB_PATTERNS.items():
        if re.search(pattern, flattened, re.IGNORECASE):
            _add_request(
                requests,
                seen,
                FollowUpRequestSchema(
                    kind="lab",
                    name=name,
                    instructions="Upload the completed lab result PDF or scan the result page.",
                    confidence=0.65,
                    source="keyword",
                ),
            )

    for name, pattern in RADIOLOGY_PATTERNS.items():
        if re.search(pattern, flattened, re.IGNORECASE):
            _add_request(
                requests,
                seen,
                FollowUpRequestSchema(
                    kind="radiology",
                    name=name,
                    instructions="Upload the finalized radiology report when it is available.",
                    confidence=0.65,
                    source="keyword",
                ),
            )

    return requests


def parse_workflow_output(raw_output: dict[str, Any]) -> NormalizedPrescriptionOutput:
    """
    Parse and normalize the raw n8n webhook output into
    the standardized NormalizedPrescriptionOutput schema.

    Handles missing fields gracefully, setting them to None.
    """
    try:
        import json

        def _find_json_with_meds(data: Any) -> dict | None:
            """Recursively search for a dictionary containing prescription output,
               even if it's buried in a string like Gemini's content.parts[0].text.
               Skips 'error' objects like {'doctor': {'name': 'JSON ERROR'}}."""
            if isinstance(data, dict):
                # If this dict has actual content (medications or follow-ups), return it!
                # But skip it if the doctor name is "JSON ERROR"
                has_content = any(
                    key in data
                    for key in (
                        "medications",
                        "follow_up_requests",
                        "lab_tests",
                        "radiology_requests",
                    )
                )
                is_error = "JSON ERROR" in str(data.get("doctor", {}).get("name", ""))
                
                if has_content and not is_error:
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
                # Is it an encoded JSON string? (Very common when n8n fails to parse but AI output is correct)
                try:
                    if "{" in data and "}" in data:
                        start = data.find("{")
                        end = data.rfind("}") + 1
                        candidate = data[start:end]
                        parsed = json.loads(candidate)
                        # Recurse into the parsed JSON to handle double-nesting
                        return _find_json_with_meds(parsed)
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
            follow_up_requests=extract_follow_up_requests(raw_output),
            confidence=ConfidenceSchema(overall=overall),
        )

    except Exception as e:
        logger.error(f"Failed to parse workflow output: {e}")
        # Return empty but valid output on parse failure
        return NormalizedPrescriptionOutput()


def parse_frequency_to_schedule(frequency: str | None) -> dict:
    """Heuristic parser to map free-text frequency to structured reminder schedule."""
    if not frequency:
        return {"schedule_type": "as_needed"}
    
    freq_lower = frequency.lower()
    
    if any(x in freq_lower for x in ["four times", "4 times", "qid"]):
        return {"schedule_type": "fixed_times", "times": ["08:00", "12:00", "16:00", "20:00"], "times_per_day": 4}
    elif any(x in freq_lower for x in ["three times", "3 times", "tid", "tds"]):
        return {"schedule_type": "fixed_times", "times": ["08:00", "14:00", "20:00"], "times_per_day": 3}
    elif any(x in freq_lower for x in ["twice", "2 times", "bid", "bd"]):
        return {"schedule_type": "fixed_times", "times": ["09:00", "21:00"], "times_per_day": 2}
    elif any(x in freq_lower for x in ["once", "1 time", "daily", "every day", "qd"]):
        return {"schedule_type": "fixed_times", "times": ["09:00"], "times_per_day": 1}
    elif "every" in freq_lower and "hour" in freq_lower:
        import re
        match = re.search(r"every\s*(\d+)\s*hour", freq_lower)
        if match:
            hours = int(match.group(1))
            return {"schedule_type": "interval", "interval_hours": float(hours)}
            
    return {"schedule_type": "as_needed"}
