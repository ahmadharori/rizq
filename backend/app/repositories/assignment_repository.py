"""
Repository for Assignment model.
Handles database operations with transaction support.
"""
from uuid import UUID
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_, func, desc, asc

from app.models.assignment import Assignment, AssignmentRecipient, StatusHistory
from app.models.recipient import Recipient, RecipientStatus
from app.models.courier import Courier
from app.schemas.assignment import AssignmentCreate


class AssignmentRepository:
    """Repository for Assignment CRUD operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_with_recipients(
        self, 
        assignment_data: AssignmentCreate,
        created_by: UUID
    ) -> Assignment:
        """
        Create assignment with recipients in a single transaction.
        
        This method performs the following operations atomically:
        1. Create Assignment record
        2. Create AssignmentRecipient junction records
        3. Update recipient statuses to 'Assigned'
        4. Create initial StatusHistory records for audit trail
        
        Args:
            assignment_data: Assignment creation data with recipients
            created_by: UUID of the user creating the assignment
            
        Returns:
            Created Assignment object with relationships loaded
            
        Raises:
            ValueError: If validation fails (courier not found, recipients invalid)
            IntegrityError: If database constraints violated
        """
        try:
            # 1. Validate courier exists
            courier = self.db.query(Courier).filter(
                and_(
                    Courier.id == assignment_data.courier_id,
                    Courier.is_deleted == False
                )
            ).first()
            if not courier:
                raise ValueError(f"Courier {assignment_data.courier_id} not found")
            
            # 2. Validate all recipients exist and are 'Unassigned'
            recipient_ids = [r.recipient_id for r in assignment_data.recipients]
            recipients = self.db.query(Recipient).filter(
                and_(
                    Recipient.id.in_(recipient_ids),
                    Recipient.is_deleted == False
                )
            ).all()
            
            if len(recipients) != len(recipient_ids):
                found_ids = {r.id for r in recipients}
                missing_ids = set(recipient_ids) - found_ids
                raise ValueError(f"Recipients not found: {missing_ids}")
            
            # Check all recipients are 'Unassigned'
            non_unassigned = [
                r for r in recipients 
                if r.status != RecipientStatus.UNASSIGNED
            ]
            if non_unassigned:
                invalid_ids = [str(r.id) for r in non_unassigned]
                raise ValueError(
                    f"Recipients must be 'Unassigned'. Invalid: {invalid_ids}"
                )
            
            # 3. Create Assignment record
            assignment = Assignment(
                name=assignment_data.name,
                courier_id=assignment_data.courier_id,
                route_data=assignment_data.route_data,
                total_distance_meters=assignment_data.total_distance_meters,
                total_duration_seconds=assignment_data.total_duration_seconds,
                created_by=created_by,
                is_deleted=False
            )
            self.db.add(assignment)
            self.db.flush()  # Get assignment ID
            
            # 4. Create AssignmentRecipient junction records
            for recipient_data in assignment_data.recipients:
                assignment_recipient = AssignmentRecipient(
                    assignment_id=assignment.id,
                    recipient_id=recipient_data.recipient_id,
                    sequence_order=recipient_data.sequence_order,
                    distance_from_previous_meters=recipient_data.distance_from_previous_meters,
                    duration_from_previous_seconds=recipient_data.duration_from_previous_seconds
                )
                self.db.add(assignment_recipient)
            
            # 5. Update recipient statuses to 'Assigned' (batch update)
            self.db.query(Recipient).filter(
                Recipient.id.in_(recipient_ids)
            ).update(
                {
                    'status': RecipientStatus.ASSIGNED,
                    'updated_at': datetime.utcnow()
                },
                synchronize_session=False
            )
            
            # 6. Create StatusHistory records for audit trail
            for recipient_id in recipient_ids:
                history = StatusHistory(
                    recipient_id=recipient_id,
                    old_status=RecipientStatus.UNASSIGNED.value,
                    new_status=RecipientStatus.ASSIGNED.value,
                    changed_by=created_by,
                    changed_at=datetime.utcnow()
                )
                self.db.add(history)
            
            # 7. Commit transaction
            self.db.commit()
            self.db.refresh(assignment)
            
            return assignment
            
        except (ValueError, IntegrityError) as e:
            # Rollback on error
            self.db.rollback()
            raise e
        except Exception as e:
            # Rollback on unexpected error
            self.db.rollback()
            raise RuntimeError(f"Failed to create assignment: {str(e)}")
    
    def get_by_id(self, assignment_id: UUID) -> Optional[Assignment]:
        """Get assignment by ID."""
        return self.db.query(Assignment).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.is_deleted == False
            )
        ).first()
    
    def get_by_id_with_recipients(self, assignment_id: UUID) -> Optional[Assignment]:
        """Get assignment by ID with recipients loaded."""
        assignment = self.db.query(Assignment).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.is_deleted == False
            )
        ).first()
        
        if assignment:
            # Eagerly load relationships
            self.db.refresh(assignment)
            _ = assignment.assignment_recipients  # Trigger lazy loading
        
        return assignment
    
    def get_all(
        self,
        page: int = 1,
        per_page: int = 30,
        search: Optional[str] = None,
        courier_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Assignment], int]:
        """
        Get paginated list of assignments with filters.
        
        Args:
            page: Page number (1-based)
            per_page: Items per page
            search: Search in assignment name
            courier_id: Filter by courier
            sort_by: Column to sort by (name, created_at, courier_name)
            sort_order: asc or desc
            
        Returns:
            Tuple of (assignments list, total count)
        """
        # Base query
        query = self.db.query(Assignment).filter(
            Assignment.is_deleted == False
        )
        
        # Apply search filter
        if search:
            query = query.filter(
                Assignment.name.ilike(f"%{search}%")
            )
        
        # Apply courier filter
        if courier_id:
            query = query.filter(Assignment.courier_id == courier_id)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        if sort_by == "courier_name":
            # Join with Courier table for sorting by courier name
            query = query.join(Courier, Assignment.courier_id == Courier.id)
            sort_column = Courier.name
        elif sort_by == "name":
            sort_column = Assignment.name
        else:  # default to created_at
            sort_column = Assignment.created_at
        
        if sort_order == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        # Apply pagination
        offset = (page - 1) * per_page
        assignments = query.offset(offset).limit(per_page).all()
        
        return assignments, total_count
    
    def get_by_id_with_full_details(self, assignment_id: UUID) -> Optional[Assignment]:
        """
        Get assignment by ID with all relationships loaded.
        
        Loads:
        - Courier details
        - Assignment recipients with full recipient details (name, address, location)
        - Province and city for each recipient
        
        Returns:
            Assignment with all relationships or None if not found
        """
        from app.models.region import Province, City
        
        assignment = self.db.query(Assignment).options(
            joinedload(Assignment.courier),
            joinedload(Assignment.assignment_recipients).joinedload(AssignmentRecipient.recipient),
            joinedload(Assignment.assignment_recipients).joinedload(AssignmentRecipient.recipient).joinedload(Recipient.province),
            joinedload(Assignment.assignment_recipients).joinedload(AssignmentRecipient.recipient).joinedload(Recipient.city)
        ).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.is_deleted == False
            )
        ).first()
        
        return assignment
    
    def update_assignment(
        self,
        assignment_id: UUID,
        update_data: dict,
        updated_by: UUID
    ) -> Optional[Assignment]:
        """
        Update assignment with new data.
        
        Args:
            assignment_id: UUID of assignment to update
            update_data: Dictionary with fields to update
            updated_by: UUID of user making the update
            
        Returns:
            Updated Assignment or None if not found
            
        Raises:
            ValueError: If validation fails
        """
        try:
            assignment = self.get_by_id(assignment_id)
            if not assignment:
                raise ValueError(f"Assignment {assignment_id} not found")
            
            # Check if any recipients have status 'Delivery' or 'Done'
            # These assignments cannot be edited
            for ar in assignment.assignment_recipients:
                recipient = ar.recipient
                if recipient.status in [RecipientStatus.DELIVERY.value, RecipientStatus.DONE.value]:
                    raise ValueError(
                        f"Cannot edit assignment: Recipient {recipient.name} has status {recipient.status}"
                    )
            
            # Update basic fields
            if 'name' in update_data and update_data['name']:
                assignment.name = update_data['name']
            
            if 'total_distance_meters' in update_data:
                assignment.total_distance_meters = update_data['total_distance_meters']
            
            if 'total_duration_seconds' in update_data:
                assignment.total_duration_seconds = update_data['total_duration_seconds']
            
            # Update recipients if provided
            if 'recipients' in update_data and update_data['recipients']:
                # Delete old assignment recipients
                self.db.query(AssignmentRecipient).filter(
                    AssignmentRecipient.assignment_id == assignment_id
                ).delete(synchronize_session=False)
                
                # Get old recipient IDs
                old_recipient_ids = [ar.recipient_id for ar in assignment.assignment_recipients]
                
                # Create new assignment recipients
                new_recipient_ids = []
                for recipient_data in update_data['recipients']:
                    ar = AssignmentRecipient(
                        assignment_id=assignment.id,
                        recipient_id=recipient_data['recipient_id'],
                        sequence_order=recipient_data['sequence_order'],
                        distance_from_previous_meters=recipient_data.get('distance_from_previous_meters'),
                        duration_from_previous_seconds=recipient_data.get('duration_from_previous_seconds')
                    )
                    self.db.add(ar)
                    new_recipient_ids.append(recipient_data['recipient_id'])
                
                # Update status for removed recipients (Assigned → Unassigned)
                removed_ids = set(old_recipient_ids) - set(new_recipient_ids)
                if removed_ids:
                    self.db.query(Recipient).filter(
                        Recipient.id.in_(removed_ids)
                    ).update(
                        {'status': RecipientStatus.UNASSIGNED.value, 'updated_at': datetime.utcnow()},
                        synchronize_session=False
                    )
                    
                    # Create status history for removed recipients
                    for recipient_id in removed_ids:
                        history = StatusHistory(
                            recipient_id=recipient_id,
                            old_status=RecipientStatus.ASSIGNED.value,
                            new_status=RecipientStatus.UNASSIGNED.value,
                            changed_by=updated_by,
                            changed_at=datetime.utcnow()
                        )
                        self.db.add(history)
            
            # Update timestamp
            assignment.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(assignment)
            
            return assignment
            
        except (ValueError, IntegrityError) as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise RuntimeError(f"Failed to update assignment: {str(e)}")
    
    def update_recipient_status(
        self,
        assignment_id: UUID,
        recipient_id: UUID,
        new_status: str,
        updated_by: UUID
    ) -> Recipient:
        """
        Update status of a single recipient within an assignment.
        
        Args:
            assignment_id: UUID of assignment
            recipient_id: UUID of recipient
            new_status: New status value
            updated_by: UUID of user making the change
            
        Returns:
            Updated Recipient
            
        Raises:
            ValueError: If validation fails or transition is invalid
        """
        from app.utils.status_validator import is_valid_transition
        
        try:
            # Verify assignment exists
            assignment = self.get_by_id(assignment_id)
            if not assignment:
                raise ValueError(f"Assignment {assignment_id} not found")
            
            # Get recipient
            recipient = self.db.query(Recipient).filter(
                and_(
                    Recipient.id == recipient_id,
                    Recipient.is_deleted == False
                )
            ).first()
            
            if not recipient:
                raise ValueError(f"Recipient {recipient_id} not found")
            
            # Verify recipient is in this assignment
            ar = self.db.query(AssignmentRecipient).filter(
                and_(
                    AssignmentRecipient.assignment_id == assignment_id,
                    AssignmentRecipient.recipient_id == recipient_id
                )
            ).first()
            
            if not ar:
                raise ValueError(f"Recipient {recipient_id} not in assignment {assignment_id}")
            
            # Validate status transition
            current_status = recipient.status if isinstance(recipient.status, str) else recipient.status.value
            if not is_valid_transition(current_status, new_status):
                raise ValueError(
                    f"Invalid status transition: {current_status} → {new_status}"
                )
            
            # Create status history
            history = StatusHistory(
                recipient_id=recipient_id,
                old_status=current_status,
                new_status=new_status,
                changed_by=updated_by,
                changed_at=datetime.utcnow()
            )
            self.db.add(history)
            
            # Update recipient status
            recipient.status = new_status
            recipient.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(recipient)
            
            return recipient
            
        except (ValueError, IntegrityError) as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise RuntimeError(f"Failed to update recipient status: {str(e)}")
    
    def bulk_update_recipient_status(
        self,
        assignment_id: UUID,
        recipient_ids: List[UUID],
        new_status: str,
        updated_by: UUID
    ) -> dict:
        """
        Bulk update status for multiple recipients.
        
        Args:
            assignment_id: UUID of assignment
            recipient_ids: List of recipient UUIDs
            new_status: New status to apply
            updated_by: UUID of user making the change
            
        Returns:
            Dictionary with success/failure counts and details
            
        Raises:
            ValueError: If assignment not found or no valid recipients
        """
        from app.utils.status_validator import is_valid_transition
        
        try:
            # Verify assignment exists
            assignment = self.get_by_id(assignment_id)
            if not assignment:
                raise ValueError(f"Assignment {assignment_id} not found")
            
            # Get all recipients in this assignment
            recipients = self.db.query(Recipient).join(
                AssignmentRecipient,
                and_(
                    AssignmentRecipient.recipient_id == Recipient.id,
                    AssignmentRecipient.assignment_id == assignment_id
                )
            ).filter(
                and_(
                    Recipient.id.in_(recipient_ids),
                    Recipient.is_deleted == False
                )
            ).all()
            
            if not recipients:
                raise ValueError("No valid recipients found")
            
            success_count = 0
            failed_count = 0
            failed_details = []
            
            for recipient in recipients:
                current_status = recipient.status if isinstance(recipient.status, str) else recipient.status.value
                
                # Check if transition is valid
                if not is_valid_transition(current_status, new_status):
                    failed_count += 1
                    failed_details.append({
                        "id": str(recipient.id),
                        "name": recipient.name,
                        "current_status": current_status,
                        "reason": f"Invalid transition: {current_status} → {new_status}"
                    })
                    continue
                
                # Create status history
                history = StatusHistory(
                    recipient_id=recipient.id,
                    old_status=current_status,
                    new_status=new_status,
                    changed_by=updated_by,
                    changed_at=datetime.utcnow()
                )
                self.db.add(history)
                
                # Update status
                recipient.status = new_status
                recipient.updated_at = datetime.utcnow()
                success_count += 1
            
            self.db.commit()
            
            return {
                "success_count": success_count,
                "failed_count": failed_count,
                "failed_details": failed_details
            }
            
        except (ValueError, IntegrityError) as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise RuntimeError(f"Failed to bulk update recipient status: {str(e)}")
    
    def get_recipient_status_history(
        self,
        assignment_id: UUID,
        recipient_id: UUID
    ) -> List[StatusHistory]:
        """
        Get status history for a recipient within an assignment.
        
        Args:
            assignment_id: UUID of assignment
            recipient_id: UUID of recipient
            
        Returns:
            List of StatusHistory entries ordered by changed_at (newest first)
            
        Raises:
            ValueError: If assignment or recipient not found
        """
        # Verify assignment exists
        assignment = self.get_by_id(assignment_id)
        if not assignment:
            raise ValueError(f"Assignment {assignment_id} not found")
        
        # Verify recipient is in this assignment
        ar = self.db.query(AssignmentRecipient).filter(
            and_(
                AssignmentRecipient.assignment_id == assignment_id,
                AssignmentRecipient.recipient_id == recipient_id
            )
        ).first()
        
        if not ar:
            raise ValueError(f"Recipient {recipient_id} not in assignment {assignment_id}")
        
        # Get status history
        history = self.db.query(StatusHistory).filter(
            StatusHistory.recipient_id == recipient_id
        ).order_by(desc(StatusHistory.changed_at)).all()
        
        return history
