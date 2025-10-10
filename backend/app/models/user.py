"""
User model for admin authentication.
"""
from sqlalchemy import Column, String
from app.models.base import BaseModel


class User(BaseModel):
    """User model for admin authentication."""
    
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    
    def __repr__(self):
        return f"<User {self.username}>"
