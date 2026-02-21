"""Doctor ORM model."""

import uuid

from sqlalchemy import Column, String, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    license_no = Column(String(100), nullable=True)

    # Relationships
    prescriptions = relationship("Prescription", back_populates="doctor")
