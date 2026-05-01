import asyncio
import json
from sqlalchemy import select
from app.db.session import get_db
from app.models.prescription import Prescription
from sqlalchemy.ext.asyncio import AsyncSession

# Import models to register them on Base.metadata
import app.models.user
import app.models.patient_profile
import app.models.document
import app.models.doctor
import app.models.facility
import app.models.medication
import app.models.job
import app.models.medication_reminder
import app.models.medication_dose_event
import app.models.medication_insight_snapshot
import app.models.workflow
import app.models.diagnosis

async def check_recent_prescription():
    async for db in get_db():
        result = await db.execute(
            select(Prescription).order_by(Prescription.created_at.desc()).limit(1)
        )
        p = result.scalar_one_or_none()
        if p:
            print(f"Prescription ID: {p.id}")
            print(f"Created At: {p.created_at}")
            print(f"Diagnosis: {p.diagnosis_text}")
            print(f"Raw Output Keys: {list(p.raw_output_json.keys()) if p.raw_output_json else 'None'}")
            print("Raw Output JSON:")
            print(json.dumps(p.raw_output_json, indent=2))
        else:
            print("No prescriptions found.")
        break

if __name__ == "__main__":
    asyncio.run(check_recent_prescription())
