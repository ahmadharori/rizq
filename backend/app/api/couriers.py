"""
Courier API endpoints.
Handles CRUD operations for delivery couriers.
"""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.courier_repository import CourierRepository
from app.schemas.courier import (
    CourierCreate,
    CourierUpdate,
    CourierResponse,
    CourierListResponse,
    CourierListItem,
    PaginationMetadata,
    BulkDeleteRequest
)

router = APIRouter(prefix="/couriers", tags=["Couriers"])


@router.get("", response_model=CourierListResponse)
async def get_couriers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=10, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Get paginated list of couriers with filters.
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (10-100, default: 30)
    - search: Search in name, phone
    - sort_by: Column to sort by (default: created_at)
    - sort_order: asc or desc (default: desc)
    """
    repo = CourierRepository(db)
    
    couriers, total_count = repo.get_all(
        page=page,
        per_page=per_page,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Serialize couriers
    items = [
        CourierListItem(
            id=c.id,
            name=c.name,
            phone=c.phone,
            created_at=c.created_at
        )
        for c in couriers
    ]
    
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


@router.get("/{courier_id}", response_model=CourierResponse)
async def get_courier(
    courier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get courier detail by ID.
    
    Args:
        courier_id: UUID of the courier
    """
    repo = CourierRepository(db)
    courier = repo.get_by_id(courier_id)
    
    if not courier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Courier not found"
        )
    
    return courier


@router.post("", response_model=CourierResponse, status_code=status.HTTP_201_CREATED)
async def create_courier(
    courier_data: CourierCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new courier.
    
    Args:
        courier_data: Courier creation data
    """
    repo = CourierRepository(db)
    
    try:
        # Convert Pydantic model to dict
        data_dict = courier_data.model_dump()
        
        # Create courier
        courier = repo.create(data_dict)
        
        return courier
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{courier_id}", response_model=CourierResponse)
async def update_courier(
    courier_id: UUID,
    courier_data: CourierUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update an existing courier.
    
    Args:
        courier_id: UUID of the courier
        courier_data: Updated courier data
    """
    repo = CourierRepository(db)
    
    try:
        # Convert Pydantic model to dict
        data_dict = courier_data.model_dump()
        
        # Update courier
        courier = repo.update(courier_id, data_dict)
        
        if not courier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Courier not found"
            )
        
        return courier
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{courier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_courier(
    courier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Soft delete a courier.
    
    Args:
        courier_id: UUID of the courier
    """
    repo = CourierRepository(db)
    
    try:
        deleted = repo.delete(courier_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Courier not found"
            )
        
        return None
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/bulk/delete")
async def bulk_delete_couriers(
    request: BulkDeleteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Bulk soft delete couriers.
    
    Args:
        request: List of courier IDs to delete
        
    Returns:
        Number of couriers deleted
    """
    repo = CourierRepository(db)
    
    deleted_count = repo.bulk_delete(request.ids)
    
    return {
        "deleted_count": deleted_count,
        "message": f"{deleted_count} courier(s) deleted successfully"
    }
