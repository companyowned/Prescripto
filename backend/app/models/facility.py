"""Facility ORM model."""

import uuid

from sqlalchemy import Column, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.db.base import Base


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)

    # Relationships
    prescriptions = relationship("Prescription", back_populates="facility")
