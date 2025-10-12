"""
Repository pattern for Recipient data access.
Handles all database operations for recipients.
"""
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_X, ST_Y
from app.models.recipient import Recipient, RecipientStatus
from app.models.region import Province, City


class RecipientRepository:
    """Repository for recipient data access operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, recipient_id: UUID) -> Optional[Recipient]:
        """
        Get recipient by ID with relationships loaded.
        
        Args:
            recipient_id: UUID of the recipient
            
        Returns:
            Recipient object or None if not found
        """
        return self.db.query(Recipient).options(
            joinedload(Recipient.province),
            joinedload(Recipient.city)
        ).filter(
            Recipient.id == recipient_id,
            Recipient.is_deleted == False
        ).first()
    
    def get_all(
        self,
        page: int = 1,
        per_page: int = 30,
        search: Optional[str] = None,
        status: Optional[RecipientStatus] = None,
        province_id: Optional[int] = None,
        city_id: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[list[Recipient], int]:
        """
        Get paginated list of recipients with filters.
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page (10-100)
            search: Search query (applies to name, phone, address)
            status: Filter by status
            province_id: Filter by province
            city_id: Filter by city
            sort_by: Column to sort by
            sort_order: 'asc' or 'desc'
            
        Returns:
            Tuple of (list of recipients, total count)
        """
        query = self.db.query(Recipient).options(
            joinedload(Recipient.province),
            joinedload(Recipient.city)
        ).filter(Recipient.is_deleted == False)
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Recipient.name.ilike(search_term),
                    Recipient.phone.ilike(search_term),
                    Recipient.address.ilike(search_term)
                )
            )
        
        if status:
            query = query.filter(Recipient.status == status.value)
        
        if province_id:
            query = query.filter(Recipient.province_id == province_id)
        
        if city_id:
            query = query.filter(Recipient.city_id == city_id)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        # Handle sorting by related fields (province.name, city.name)
        if sort_by == "province.name":
            query = query.join(Province).order_by(
                Province.name.desc() if sort_order == "desc" else Province.name.asc()
            )
        elif sort_by == "city.name":
            query = query.join(City).order_by(
                City.name.desc() if sort_order == "desc" else City.name.asc()
            )
        else:
            # Default sorting by recipient columns
            sort_column = getattr(Recipient, sort_by, Recipient.created_at)
            if sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        recipients = query.all()
        
        return recipients, total_count
    
    def create(self, recipient_data: dict) -> Recipient:
        """
        Create a new recipient.
        
        Args:
            recipient_data: Dictionary containing recipient fields
            
        Returns:
            Created recipient object
        """
        # Convert location dict to PostGIS POINT
        location = recipient_data.pop('location')
        point_wkt = f"SRID=4326;POINT({location['lng']} {location['lat']})"
        
        recipient = Recipient(
            **recipient_data,
            location=point_wkt,
            status=RecipientStatus.UNASSIGNED.value
        )
        
        self.db.add(recipient)
        self.db.commit()
        self.db.refresh(recipient)
        
        return recipient
    
    def update(self, recipient_id: UUID, recipient_data: dict) -> Optional[Recipient]:
        """
        Update an existing recipient.
        
        Args:
            recipient_id: UUID of the recipient
            recipient_data: Dictionary containing fields to update
            
        Returns:
            Updated recipient object or None if not found
        """
        recipient = self.get_by_id(recipient_id)
        
        if not recipient:
            return None
        
        # Check if update is allowed
        if recipient.status in [RecipientStatus.DELIVERY.value, RecipientStatus.DONE.value]:
            raise ValueError(f"Cannot update recipient with status {recipient.status}")
        
        # Convert location if present
        if 'location' in recipient_data:
            location = recipient_data.pop('location')
            point_wkt = f"SRID=4326;POINT({location['lng']} {location['lat']})"
            recipient.location = point_wkt
        
        # Update other fields
        for key, value in recipient_data.items():
            setattr(recipient, key, value)
        
        self.db.commit()
        self.db.refresh(recipient)
        
        return recipient
    
    def delete(self, recipient_id: UUID) -> bool:
        """
        Soft delete a recipient.
        
        Args:
            recipient_id: UUID of the recipient
            
        Returns:
            True if deleted, False if not found or cannot be deleted
        """
        recipient = self.get_by_id(recipient_id)
        
        if not recipient:
            return False
        
        # Check if deletion is allowed
        if recipient.status in [RecipientStatus.ASSIGNED.value, RecipientStatus.DELIVERY.value, RecipientStatus.DONE.value]:
            raise ValueError(f"Cannot delete recipient with status {recipient.status}")
        
        recipient.is_deleted = True
        self.db.commit()
        
        return True
    
    def bulk_delete(self, recipient_ids: list[UUID]) -> int:
        """
        Soft delete multiple recipients.
        
        Args:
            recipient_ids: List of recipient UUIDs
            
        Returns:
            Number of recipients deleted
        """
        # Get recipients that can be deleted
        recipients = self.db.query(Recipient).filter(
            Recipient.id.in_(recipient_ids),
            Recipient.is_deleted == False,
            Recipient.status.notin_([
                RecipientStatus.ASSIGNED.value,
                RecipientStatus.DELIVERY.value,
                RecipientStatus.DONE.value
            ])
        ).all()
        
        deleted_count = len(recipients)
        
        for recipient in recipients:
            recipient.is_deleted = True
        
        self.db.commit()
        
        return deleted_count
    
    def get_status_history(self, recipient_id: UUID):
        """
        Get status change history for a recipient.
        
        Args:
            recipient_id: UUID of the recipient
            
        Returns:
            List of status history records
        """
        from app.models.assignment import StatusHistory
        from app.models.user import User
        
        history = self.db.query(StatusHistory).options(
            joinedload(StatusHistory.changed_by_user)
        ).filter(
            StatusHistory.recipient_id == recipient_id
        ).order_by(StatusHistory.changed_at.desc()).all()
        
        return history
    
    @staticmethod
    def extract_location(recipient: Recipient) -> Optional[dict]:
        """
        Extract lat/lng from PostGIS location field.
        
        Args:
            recipient: Recipient object with location
            
        Returns:
            Dictionary with lat and lng or None
        """
        if recipient.location:
            # Use geoalchemy2.shape to convert WKBElement to shapely geometry
            from geoalchemy2 import shape
            from shapely.geometry import Point
            
            # Convert WKBElement to shapely Point
            point = shape.to_shape(recipient.location)
            
            # shapely Point has x (longitude) and y (latitude) attributes
            return {
                "lng": point.x,
                "lat": point.y
            }
        return None
