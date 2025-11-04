"""
Assignment API endpoints.
Handles assignment creation and management.
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.assignment_repository import AssignmentRepository
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentPublic,
    AssignmentWithRecipients,
    BulkAssignmentCreate,
    AssignmentListResponse,
    AssignmentListItem,
    PaginationMetadata,
    AssignmentDetail,
    RecipientWithSequence,
    AssignmentUpdate,
    RecipientStatusUpdate,
    BulkRecipientStatusUpdate,
    StatusHistoryResponse,
    StatusHistoryItem
)
from app.schemas.recipient import RecipientStatusHistoryResponse

router = APIRouter(prefix="/api/v1/assignments", tags=["assignments"])


@router.post("/", response_model=AssignmentPublic, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new assignment with recipients.
    
    This endpoint:
    1. Validates courier exists and is active
    2. Validates all recipients exist and are 'Unassigned'
    3. Creates assignment record
    4. Creates assignment-recipient junction records
    5. Updates recipient statuses to 'Assigned'
    6. Creates status history records for audit trail
    
    All operations are performed in a single database transaction.
    """
    repo = AssignmentRepository(db)
    
    try:
        created_assignment = repo.create_with_recipients(
            assignment_data=assignment,
            created_by=current_user.id
        )
        return created_assignment
        
    except ValueError as e:
        # Validation errors (courier not found, recipients invalid, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        # Unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/bulk", response_model=List[AssignmentPublic], status_code=status.HTTP_201_CREATED)
def create_bulk_assignments(
    bulk_data: BulkAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create multiple assignments at once.
    
    Useful for Rekomendasi mode where multiple couriers get assignments.
    Each assignment is created independently - partial success is possible.
    
    Returns list of successfully created assignments.
    If any fail, they will be excluded from the response (not an error).
    """
    repo = AssignmentRepository(db)
    created_assignments = []
    errors = []
    
    for assignment_data in bulk_data.assignments:
        try:
            created = repo.create_with_recipients(
                assignment_data=assignment_data,
                created_by=current_user.id
            )
            created_assignments.append(created)
        except (ValueError, RuntimeError) as e:
            # Log error but continue with other assignments
            errors.append({
                "assignment_name": assignment_data.name,
                "courier_id": str(assignment_data.courier_id),
                "error": str(e)
            })
    
    # If all assignments failed, return error
    if not created_assignments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "All assignments failed to create",
                "errors": errors
            }
        )
    
    # Return successful assignments (partial success is OK)
    return created_assignments


@router.get("/", response_model=AssignmentListResponse)
def get_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=10, le=100),
    search: Optional[str] = Query(None),
    courier_id: Optional[UUID] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Get paginated list of assignments with filters.
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (10-100, default: 30)
    - search: Search in assignment name
    - courier_id: Filter by courier
    - sort_by: Column to sort by (name, created_at, courier_name)
    - sort_order: asc or desc (default: desc)
    """
    repo = AssignmentRepository(db)
    
    assignments, total_count = repo.get_all(
        page=page,
        per_page=per_page,
        search=search,
        courier_id=courier_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Serialize assignments to list items
    items = []
    for assignment in assignments:
        # Count recipients
        total_recipients = len(assignment.assignment_recipients)
        
        # Get courier name (relationship should be loaded)
        courier_name = assignment.courier.name if assignment.courier else "Unknown"
        
        items.append({
            "id": assignment.id,
            "name": assignment.name,
            "courier_id": assignment.courier_id,
            "courier_name": courier_name,
            "total_recipients": total_recipients,
            "total_distance_meters": assignment.total_distance_meters,
            "total_duration_seconds": assignment.total_duration_seconds,
            "created_at": assignment.created_at
        })
    
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


@router.get("/{assignment_id}", response_model=AssignmentDetail)
def get_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get assignment by ID with full details.
    
    Returns assignment details including:
    - Courier info
    - All recipients with sequence order and route metrics
    - Province and city details for each recipient
    """
    repo = AssignmentRepository(db)
    assignment = repo.get_by_id_with_full_details(assignment_id)
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )
    
    # Serialize recipients with sequence and location
    recipients = []
    for ar in assignment.assignment_recipients:
        recipient = ar.recipient
        
        # Extract location coordinates from PostGIS Geography
        point = to_shape(recipient.location)
        
        recipients.append({
            "id": recipient.id,
            "name": recipient.name,
            "phone": recipient.phone,
            "address": recipient.address,
            "num_packages": recipient.num_packages,
            "status": recipient.status if isinstance(recipient.status, str) else recipient.status.value,
            "location": {
                "lat": point.y,
                "lng": point.x
            },
            "province": {
                "id": recipient.province.id,
                "name": recipient.province.name
            },
            "city": {
                "id": recipient.city.id,
                "name": recipient.city.name
            },
            "sequence_order": ar.sequence_order,
            "distance_from_previous_meters": ar.distance_from_previous_meters,
            "duration_from_previous_seconds": ar.duration_from_previous_seconds
        })
    
    return {
        "id": assignment.id,
        "name": assignment.name,
        "courier": assignment.courier,
        "route_data": assignment.route_data,
        "total_distance_meters": assignment.total_distance_meters,
        "total_duration_seconds": assignment.total_duration_seconds,
        "recipients": recipients,
        "created_at": assignment.created_at,
        "updated_at": assignment.updated_at
    }


@router.put("/{assignment_id}", response_model=AssignmentPublic)
def update_assignment(
    assignment_id: UUID,
    update_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update assignment details.
    
    Can update:
    - Assignment name
    - Recipients list (add/remove/reorder)
    - Total distance and duration
    
    Restrictions:
    - Cannot edit if any recipient has status 'Delivery' or 'Done'
    - Removed recipients will have status reverted to 'Unassigned'
    """
    repo = AssignmentRepository(db)
    
    try:
        # Convert Pydantic model to dict, excluding None values
        update_dict = update_data.model_dump(exclude_none=True)
        
        # Convert recipients list to dict format if present
        if 'recipients' in update_dict and update_dict['recipients']:
            update_dict['recipients'] = [
                {
                    'recipient_id': r.recipient_id,
                    'sequence_order': r.sequence_order,
                    'distance_from_previous_meters': r.distance_from_previous_meters,
                    'duration_from_previous_seconds': r.duration_from_previous_seconds
                }
                for r in update_data.recipients
            ]
        
        updated_assignment = repo.update_assignment(
            assignment_id=assignment_id,
            update_data=update_dict,
            updated_by=current_user.id
        )
        
        if not updated_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignment {assignment_id} not found"
            )
        
        return updated_assignment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{assignment_id}/recipients/{recipient_id}/status", response_model=dict)
def update_recipient_status(
    assignment_id: UUID,
    recipient_id: UUID,
    status_update: RecipientStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update status of a single recipient.
    
    Validates status transition before updating.
    Creates status history entry for audit trail.
    """
    repo = AssignmentRepository(db)
    
    try:
        updated_recipient = repo.update_recipient_status(
            assignment_id=assignment_id,
            recipient_id=recipient_id,
            new_status=status_update.status,
            updated_by=current_user.id
        )
        
        return {
            "success": True,
            "recipient_id": str(updated_recipient.id),
            "old_status": updated_recipient.status,  # This will be the new status after update
            "new_status": status_update.status,
            "message": "Status updated successfully"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{assignment_id}/recipients/status/bulk", response_model=dict)
def bulk_update_recipient_status(
    assignment_id: UUID,
    bulk_update: BulkRecipientStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk update status for multiple recipients.
    
    Returns success/failure counts and details.
    Partial success is allowed - valid transitions will succeed.
    """
    repo = AssignmentRepository(db)
    
    try:
        result = repo.bulk_update_recipient_status(
            assignment_id=assignment_id,
            recipient_ids=bulk_update.recipient_ids,
            new_status=bulk_update.status,
            updated_by=current_user.id
        )
        
        return {
            "success": True,
            "success_count": result["success_count"],
            "failed_count": result["failed_count"],
            "failed_details": result["failed_details"],
            "message": f"Updated {result['success_count']} recipients successfully"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{assignment_id}/recipients/{recipient_id}/history", response_model=RecipientStatusHistoryResponse)
def get_recipient_status_history(
    assignment_id: UUID,
    recipient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get status change history for a recipient.
    
    Returns chronological list of all status transitions.
    """
    repo = AssignmentRepository(db)
    
    try:
        history = repo.get_recipient_status_history(
            assignment_id=assignment_id,
            recipient_id=recipient_id
        )
            # Serialize history
        history_items = []
        for item in history:
            history_items.append({
                "id": item.id,
                "old_status": item.old_status,
                "new_status": item.new_status,
                "changed_at": item.changed_at,
                "changed_by_username": item.changed_by_user.username if item.changed_by_user else None
            })
        
        # Get recipient name
        from app.models.recipient import Recipient
        recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
        
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipient {recipient_id} not found"
            )
        
        return {
            "recipient_id": recipient_id,
            "recipient_name": recipient.name,
            "history": history_items
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{assignment_id}", response_model=dict)
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete assignment.
    
    Restrictions:
    - Cannot delete if any recipient status = 'Done'
    - Cannot delete if any recipient status = 'Delivery'
    
    Side Effects:
    - All recipients revert to 'Unassigned'
    - Status history created for audit trail
    """
    repo = AssignmentRepository(db)
    
    try:
        result = repo.delete_assignment(
            assignment_id=assignment_id,
            deleted_by=current_user.id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
