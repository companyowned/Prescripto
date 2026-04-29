"""Import all models so Alembic can discover them.

Use this module in alembic/env.py:
    from app.db.base_imports import Base  # noqa
"""

from app.db.base import Base  # noqa: F401

from app.models.user import User  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.patient_profile import PatientProfile  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.facility import Facility  # noqa: F401
from app.models.prescription import Prescription  # noqa: F401
from app.models.medication import Medication  # noqa: F401
from app.models.workflow import Workflow  # noqa: F401
