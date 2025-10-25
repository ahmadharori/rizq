"""
Pydantic schemas for Assignment model.
Request/response validation and serialization.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.courier import CourierResponse


class AssignmentRecipientCreate(BaseModel):
    """Schema for creating assignment-recipient junction."""
    recipient_id: UUID
    sequence_order: int = Field(..., ge=1, description="Delivery sequence (1-based)")
    distance_from_previous_meters: Optional[float] = Field(None, ge=0)
    duration_from_previous_seconds: Optional[int] = Field(None, ge=0)


class AssignmentCreate(BaseModel):
    """Schema for creating a new assignment."""
    name: str = Field(..., min_length=1, max_length=100)
    courier_id: UUID
    route_data: Optional[dict] = None
    total_distance_meters: Optional[float] = Field(None, ge=0)
    total_duration_seconds: Optional[int] = Field(None, ge=0)
    recipients: List[AssignmentRecipientCreate] = Field(..., min_length=1)


class AssignmentRecipientResponse(BaseModel):
    """Schema for assignment-recipient junction response."""
    id: UUID
    recipient_id: UUID
    sequence_order: int
    distance_from_previous_meters: Optional[float]
    duration_from_previous_seconds: Optional[int]
    
    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    """Base assignment schema."""
    id: UUID
    name: str
    courier_id: UUID
    route_data: Optional[dict]
    total_distance_meters: Optional[float]
    total_duration_seconds: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssignmentPublic(AssignmentBase):
    """Public assignment schema (without sensitive data)."""
    pass


class AssignmentWithRecipients(AssignmentBase):
    """Assignment schema with recipients list."""
    assignment_recipients: List[AssignmentRecipientResponse]
    
    class Config:
        from_attributes = True


class BulkAssignmentCreate(BaseModel):
    """Schema for creating multiple assignments at once."""
    assignments: List[AssignmentCreate] = Field(..., min_length=1)


class AssignmentListItem(BaseModel):
    """Simplified assignment schema for list display."""
    id: UUID
    name: str
    courier_id: UUID
    courier_name: str
    total_recipients: int
    total_distance_meters: Optional[float]
    total_duration_seconds: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaginationMetadata(BaseModel):
    """Pagination metadata."""
    page: int
    per_page: int
    total_items: int
    total_pages: int


class AssignmentListResponse(BaseModel):
    """Response schema for assignment list endpoint."""
    items: List[AssignmentListItem]
    pagination: PaginationMetadata


class RecipientWithSequence(BaseModel):
    """Recipient with sequence order and route metrics."""
    # Recipient basic info
    id: UUID
    name: str
    phone: str
    address: str
    num_packages: int
    status: str
    
    # Location
    location: dict  # {lat: float, lng: float}
    
    # Regional info
    province: dict  # {id: int, name: str}
    city: dict  # {id: int, name: str}
    
    # Sequence info from AssignmentRecipient junction
    sequence_order: int
    distance_from_previous_meters: Optional[float]
    duration_from_previous_seconds: Optional[int]
    
    class Config:
        from_attributes = True


class AssignmentDetail(BaseModel):
    """Detailed assignment schema with full relationships."""
    id: UUID
    name: str
    courier: CourierResponse
    route_data: Optional[dict]
    total_distance_meters: Optional[float]
    total_duration_seconds: Optional[int]
    recipients: List[RecipientWithSequence]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssignmentUpdate(BaseModel):
    """Schema for updating an assignment."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    recipients: Optional[List[AssignmentRecipientCreate]] = None
    total_distance_meters: Optional[float] = Field(None, ge=0)
    total_duration_seconds: Optional[int] = Field(None, ge=0)


class RecipientStatusUpdate(BaseModel):
    """Schema for updating a single recipient's status."""
    status: str = Field(..., description="New status value")
    notes: Optional[str] = Field(None, max_length=500)


class BulkRecipientStatusUpdate(BaseModel):
    """Schema for bulk status update."""
    recipient_ids: List[UUID] = Field(..., min_length=1)
    status: str = Field(..., description="New status to apply to all recipients")
    notes: Optional[str] = Field(None, max_length=500)


class StatusHistoryItem(BaseModel):
    """Schema for status history entry."""
    id: UUID
    old_status: Optional[str]
    new_status: str
    changed_by: UUID
    changed_at: datetime
    
    class Config:
        from_attributes = True


class StatusHistoryResponse(BaseModel):
    """Response schema for status history endpoint."""
    recipient_id: UUID
    recipient_name: str
    history: List[StatusHistoryItem]
