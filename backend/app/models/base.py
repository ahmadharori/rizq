"""
Base model with common fields for all database models.
"""
from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class BaseModel(Base):
    """Abstract base model with common fields."""
    
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    def soft_delete(self):
        """Mark record as deleted (soft delete)."""
        self.is_deleted = True
