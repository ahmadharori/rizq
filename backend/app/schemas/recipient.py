"""
Pydantic schemas for Recipient model.
Request/response validation and serialization.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.recipient import RecipientStatus


class LocationSchema(BaseModel):
    """Schema for geographic coordinates."""
    lat: float = Field(..., ge=-11.0, le=6.0, description="Latitude (Indonesia bounds)")
    lng: float = Field(..., ge=95.0, le=141.0, description="Longitude (Indonesia bounds)")


class ProvinceSchema(BaseModel):
    """Schema for province information."""
    id: int
    name: str
    
    class Config:
        from_attributes = True


class CitySchema(BaseModel):
    """Schema for city information."""
    id: int
    name: str
    province_id: int
    
    class Config:
        from_attributes = True


class RecipientBase(BaseModel):
    """Base recipient schema with common fields."""
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^(\+62|62|0)[0-9]{9,12}$")
    address: str = Field(..., min_length=1, max_length=500)
    province_id: int
    city_id: int
    location: LocationSchema
    num_packages: int = Field(..., ge=1, le=999)


class RecipientCreate(RecipientBase):
    """Schema for creating a new recipient."""
    pass


class RecipientUpdate(RecipientBase):
    """Schema for updating an existing recipient."""
    pass


class RecipientResponse(RecipientBase):
    """Schema for recipient response (includes relationships and metadata)."""
    id: UUID
    status: RecipientStatus
    province: ProvinceSchema
    city: CitySchema
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RecipientListItem(BaseModel):
    """Schema for recipient list item (lightweight version)."""
    id: UUID
    name: str
    phone: str
    address: str
    status: RecipientStatus
    province: ProvinceSchema
    city: CitySchema
    num_packages: int
    location: LocationSchema
    
    class Config:
        from_attributes = True


class PaginationMetadata(BaseModel):
    """Schema for pagination metadata."""
    page: int
    per_page: int
    total_items: int
    total_pages: int


class RecipientListResponse(BaseModel):
    """Schema for paginated recipient list response."""
    items: list[RecipientListItem]
    pagination: PaginationMetadata


class StatusHistoryItem(BaseModel):
    """Schema for status history entry."""
    id: UUID
    old_status: Optional[str]
    new_status: str
    changed_at: datetime
    changed_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class RecipientStatusHistoryResponse(BaseModel):
    """Schema for recipient status history response."""
    recipient_id: UUID
    history: list[StatusHistoryItem]


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete request."""
    ids: list[UUID] = Field(..., min_length=1)


class RecipientFilters(BaseModel):
    """Schema for recipient filtering and sorting."""
    search: Optional[str] = None
    status: Optional[list[RecipientStatus]] = None
    province_id: Optional[list[int]] = None
    city_id: Optional[list[int]] = None
    sort_by: str = 'created_at'
    sort_order: str = 'desc'
    
    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be "asc" or "desc"')
        return v
