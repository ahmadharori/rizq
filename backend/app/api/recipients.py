"""
Recipient API endpoints.
Handles CRUD operations for sembako recipients.
"""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.recipient import RecipientStatus
from app.repositories.recipient_repository import RecipientRepository
from app.schemas.recipient import (
    RecipientCreate,
    RecipientUpdate,
    RecipientResponse,
    RecipientListResponse,
    RecipientListItem,
    PaginationMetadata,
    RecipientStatusHistoryResponse,
    StatusHistoryItem,
    BulkDeleteRequest,
    LocationSchema,
    ProvinceSchema,
    CitySchema
)

router = APIRouter(prefix="/recipients", tags=["Recipients"])


def serialize_recipient_with_location(recipient) -> dict:
    """
    Serialize recipient with extracted location coordinates.
    
    Args:
        recipient: Recipient model instance
        
    Returns:
        Dictionary with all recipient fields including parsed location
    """
    from geoalchemy2.shape import to_shape
    from shapely.geometry import Point
    
    # Extract coordinates from PostGIS Geography
    point = to_shape(recipient.location)
    
    return {
        "id": recipient.id,
        "name": recipient.name,
        "phone": recipient.phone,
        "address": recipient.address,
        "province_id": recipient.province_id,
        "city_id": recipient.city_id,
        "location": {
            "lat": point.y,
            "lng": point.x
        },
        "num_packages": recipient.num_packages,
        "status": recipient.status,
        "province": {
            "id": recipient.province.id,
            "name": recipient.province.name
        },
        "city": {
            "id": recipient.city.id,
            "name": recipient.city.name,
            "province_id": recipient.city.province_id
        },
        "created_at": recipient.created_at,
        "updated_at": recipient.updated_at
    }


@router.get("", response_model=RecipientListResponse)
async def get_recipients(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=10, le=100),
    search: Optional[str] = Query(None),
    status: Optional[RecipientStatus] = Query(None),
    province_id: Optional[int] = Query(None),
    city_id: Optional[int] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Get paginated list of recipients with filters.
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (10-100, default: 30)
    - search: Search in name, phone, address
    - status: Filter by status
    - province_id: Filter by province
    - city_id: Filter by city
    - sort_by: Column to sort by (default: created_at)
    - sort_order: asc or desc (default: desc)
    """
    repo = RecipientRepository(db)
    
    recipients, total_count = repo.get_all(
        page=page,
        per_page=per_page,
        search=search,
        status=status,
        province_id=province_id,
        city_id=city_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Serialize recipients with location
    items = [serialize_recipient_with_location(r) for r in recipients]
    
    # Calculate pagination metadata
    total_pages = (total_count + per_page - 1) // per_page
    
    return {
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_count,
            "total_pages": total_pages
        }
    }


@router.get("/{recipient_id}", response_model=RecipientResponse)
async def get_recipient(
    recipient_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get recipient detail by ID.
    
    Args:
        recipient_id: UUID of the recipient
    """
    repo = RecipientRepository(db)
    recipient = repo.get_by_id(recipient_id)
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Serialize with location
    return serialize_recipient_with_location(recipient)


@router.post("", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
async def create_recipient(
    recipient_data: RecipientCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new recipient.
    
    Args:
        recipient_data: Recipient creation data
    """
    repo = RecipientRepository(db)
    
    try:
        # Convert Pydantic model to dict
        data_dict = recipient_data.model_dump()
        
        # Create recipient
        recipient = repo.create(data_dict)
        
        # Serialize response
        return serialize_recipient_with_location(recipient)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{recipient_id}", response_model=RecipientResponse)
async def update_recipient(
    recipient_id: UUID,
    recipient_data: RecipientUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update an existing recipient.
    
    Args:
        recipient_id: UUID of the recipient
        recipient_data: Updated recipient data
    """
    repo = RecipientRepository(db)
    
    try:
        # Convert Pydantic model to dict
        data_dict = recipient_data.model_dump()
        
        # Update recipient
        recipient = repo.update(recipient_id, data_dict)
        
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient not found"
            )
        
        # Serialize response
        return serialize_recipient_with_location(recipient)
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipient(
    recipient_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Soft delete a recipient.
    
    Args:
        recipient_id: UUID of the recipient
    """
    repo = RecipientRepository(db)
    
    try:
        deleted = repo.delete(recipient_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient not found"
            )
        
        return None
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/bulk/delete")
async def bulk_delete_recipients(
    request: BulkDeleteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Bulk soft delete recipients.
    
    Args:
        request: List of recipient IDs to delete
        
    Returns:
        Number of recipients deleted
    """
    repo = RecipientRepository(db)
    
    deleted_count = repo.bulk_delete(request.ids)
    
    return {
        "deleted_count": deleted_count,
        "message": f"{deleted_count} recipient(s) deleted successfully"
    }


@router.get("/{recipient_id}/history", response_model=RecipientStatusHistoryResponse)
async def get_recipient_history(
    recipient_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get status change history for a recipient.
    
    Args:
        recipient_id: UUID of the recipient
    """
    repo = RecipientRepository(db)
    
    # Verify recipient exists
    recipient = repo.get_by_id(recipient_id)
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Get history
    history_records = repo.get_status_history(recipient_id)
    
    # Serialize history
    history_items = []
    for record in history_records:
        history_items.append({
            "id": record.id,
            "old_status": record.old_status,
            "new_status": record.new_status,
            "changed_at": record.changed_at,
            "changed_by_username": record.changed_by_user.username if record.changed_by_user else None
        })
    
    return {
        "recipient_id": recipient_id,
        "history": history_items
    }
