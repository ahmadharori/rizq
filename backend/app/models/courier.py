"""
Courier model for delivery personnel.
"""
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Courier(BaseModel):
    """Courier (delivery personnel) model."""
    
    __tablename__ = "couriers"
    
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    assignments = relationship("Assignment", back_populates="courier")
    
    def __repr__(self):
        return f"<Courier {self.name}>"
