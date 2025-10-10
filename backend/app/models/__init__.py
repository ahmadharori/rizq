"""
SQLAlchemy models for RizQ application.
"""
from app.models.base import BaseModel
from app.models.user import User
from app.models.region import Province, City
from app.models.courier import Courier
from app.models.recipient import Recipient, RecipientStatus
from app.models.assignment import Assignment, AssignmentRecipient, StatusHistory

__all__ = [
    "BaseModel",
    "User",
    "Province",
    "City",
    "Courier",
    "Recipient",
    "RecipientStatus",
    "Assignment",
    "AssignmentRecipient",
    "StatusHistory",
]
