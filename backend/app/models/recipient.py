"""
Recipient model for sembako package recipients.
"""
from enum import Enum
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text, CheckConstraint
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from app.models.base import BaseModel


class RecipientStatus(str, Enum):
    """Recipient delivery status enum."""
    UNASSIGNED = "Unassigned"
    ASSIGNED = "Assigned"
    DELIVERY = "Delivery"
    DONE = "Done"
    RETURN = "Return"


class Recipient(BaseModel):
    """Recipient (penerima sembako) model."""
    
    __tablename__ = "recipients"
    
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    
    # Regional references (Indonesian administrative divisions - simplified)
    province_id = Column(Integer, ForeignKey("provinces.id"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False, index=True)
    
    # PostGIS geographic point (lat, lng)
    # GEOGRAPHY type with SRID 4326 (WGS 84 - standard for GPS coordinates)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False, index=True)
    
    # Package information
    num_packages = Column(Integer, nullable=False, default=1)
    
    # Status tracking
    status = Column(String(20), nullable=False, default=RecipientStatus.UNASSIGNED.value, index=True)
    
    # Soft delete flag
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    province = relationship("Province", back_populates="recipients")
    city = relationship("City", back_populates="recipients")
    status_history = relationship("StatusHistory", back_populates="recipient", cascade="all, delete-orphan")
    assignment_recipients = relationship("AssignmentRecipient", back_populates="recipient")
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"status IN ('{RecipientStatus.UNASSIGNED.value}', '{RecipientStatus.ASSIGNED.value}', "
            f"'{RecipientStatus.DELIVERY.value}', '{RecipientStatus.DONE.value}', '{RecipientStatus.RETURN.value}')",
            name="check_recipient_status"
        ),
        CheckConstraint("num_packages >= 1", name="check_num_packages_positive"),
    )
    
    def __repr__(self):
        return f"<Recipient {self.name} ({self.status})>"
