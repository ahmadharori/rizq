"""
Pydantic schemas for Courier model.
Request/response validation and serialization.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CourierBase(BaseModel):
    """Base courier schema with common fields."""
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)


class CourierCreate(CourierBase):
    """Schema for creating a new courier."""
    pass


class CourierUpdate(CourierBase):
    """Schema for updating an existing courier."""
    pass


class CourierResponse(CourierBase):
    """Schema for courier response (includes metadata)."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourierListItem(BaseModel):
    """Schema for courier list item (lightweight version)."""
    id: UUID
    name: str
    phone: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaginationMetadata(BaseModel):
    """Schema for pagination metadata."""
    page: int
    per_page: int
    total_items: int
    total_pages: int


class CourierListResponse(BaseModel):
    """Schema for paginated courier list response."""
    items: list[CourierListItem]
    pagination: PaginationMetadata


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete request."""
    ids: list[UUID] = Field(..., min_length=1)
