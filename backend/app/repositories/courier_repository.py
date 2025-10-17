"""
Repository pattern for Courier data access.
Handles all database operations for couriers.
"""
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.courier import Courier


class CourierRepository:
    """Repository for courier data access operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, courier_id: UUID) -> Optional[Courier]:
        """
        Get courier by ID.
        
        Args:
            courier_id: UUID of the courier
            
        Returns:
            Courier object or None if not found
        """
        return self.db.query(Courier).filter(
            Courier.id == courier_id,
            Courier.is_deleted == False
        ).first()
    
    def get_by_phone(self, phone: str, exclude_id: Optional[UUID] = None) -> Optional[Courier]:
        """
        Get courier by phone number.
        
        Args:
            phone: Phone number to search
            exclude_id: Optional courier ID to exclude from search
            
        Returns:
            Courier object or None if not found
        """
        query = self.db.query(Courier).filter(
            Courier.phone == phone,
            Courier.is_deleted == False
        )
        
        if exclude_id:
            query = query.filter(Courier.id != exclude_id)
        
        return query.first()
    
    def get_all(
        self,
        page: int = 1,
        per_page: int = 30,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[list[Courier], int]:
        """
        Get paginated list of couriers with filters.
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page (10-100)
            search: Search query (applies to name, phone)
            sort_by: Column to sort by
            sort_order: 'asc' or 'desc'
            
        Returns:
            Tuple of (list of couriers, total count)
        """
        query = self.db.query(Courier).filter(Courier.is_deleted == False)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Courier.name.ilike(search_term),
                    Courier.phone.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(Courier, sort_by, Courier.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        couriers = query.all()
        
        return couriers, total_count
    
    def create(self, courier_data: dict) -> Courier:
        """
        Create a new courier.
        
        Args:
            courier_data: Dictionary containing courier fields
            
        Returns:
            Created courier object
            
        Raises:
            ValueError: If phone number already exists
        """
        # Check if phone already exists
        existing = self.get_by_phone(courier_data['phone'])
        if existing:
            raise ValueError(f"Phone number {courier_data['phone']} already exists")
        
        courier = Courier(**courier_data)
        
        self.db.add(courier)
        self.db.commit()
        self.db.refresh(courier)
        
        return courier
    
    def update(self, courier_id: UUID, courier_data: dict) -> Optional[Courier]:
        """
        Update an existing courier.
        
        Args:
            courier_id: UUID of the courier
            courier_data: Dictionary containing fields to update
            
        Returns:
            Updated courier object or None if not found
            
        Raises:
            ValueError: If phone number already exists for another courier
        """
        courier = self.get_by_id(courier_id)
        
        if not courier:
            return None
        
        # TODO: Add validation - cannot update courier with active assignments
        # This will be implemented when Assignment API is ready
        
        # Check if phone is being changed and if new phone already exists
        if 'phone' in courier_data and courier_data['phone'] != courier.phone:
            existing = self.get_by_phone(courier_data['phone'], exclude_id=courier_id)
            if existing:
                raise ValueError(f"Phone number {courier_data['phone']} already exists")
        
        # Update fields
        for key, value in courier_data.items():
            setattr(courier, key, value)
        
        self.db.commit()
        self.db.refresh(courier)
        
        return courier
    
    def delete(self, courier_id: UUID) -> bool:
        """
        Soft delete a courier.
        
        Args:
            courier_id: UUID of the courier
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            ValueError: If courier has active assignments
        """
        courier = self.get_by_id(courier_id)
        
        if not courier:
            return False
        
        # TODO: Add validation - cannot delete courier with active assignments
        # This will be implemented when Assignment API is ready
        # Check if courier has assignments with status: Assigned or Delivery
        
        courier.is_deleted = True
        self.db.commit()
        
        return True
    
    def bulk_delete(self, courier_ids: list[UUID]) -> int:
        """
        Soft delete multiple couriers.
        
        Args:
            courier_ids: List of courier UUIDs
            
        Returns:
            Number of couriers deleted
        """
        # TODO: Add validation - skip couriers with active assignments
        # This will be implemented when Assignment API is ready
        
        # Get couriers that can be deleted
        couriers = self.db.query(Courier).filter(
            Courier.id.in_(courier_ids),
            Courier.is_deleted == False
        ).all()
        
        deleted_count = len(couriers)
        
        for courier in couriers:
            courier.is_deleted = True
        
        self.db.commit()
        
        return deleted_count
