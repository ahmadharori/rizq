"""
Assignment models for delivery assignment management.

Includes:
- Assignment: Main assignment entity linking courier to recipients
- AssignmentRecipient: Junction table for assignment-recipient relationship with route order
- StatusHistory: Audit trail for recipient status changes
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Assignment(BaseModel):
    """Assignment model linking courier to recipients with optimized route."""
    
    __tablename__ = "assignments"
    
    name = Column(String(100), nullable=False)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id"), nullable=False, index=True)
    
    # Store TSP/CVRP optimization output (JSON structure)
    # Contains: routes, waypoints, distance matrix, etc.
    route_data = Column(JSONB, nullable=True)
    
    # Aggregate metrics
    total_distance_meters = Column(Float, nullable=True)
    total_duration_seconds = Column(Integer, nullable=True)
    
    # Track who created the assignment
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Soft delete flag
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    courier = relationship("Courier", back_populates="assignments")
    created_by_user = relationship("User")
    assignment_recipients = relationship(
        "AssignmentRecipient", 
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="AssignmentRecipient.sequence_order"
    )
    
    def __repr__(self):
        return f"<Assignment {self.name}>"


class AssignmentRecipient(BaseModel):
    """Junction table linking assignments to recipients with route sequence."""
    
    __tablename__ = "assignment_recipients"
    
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Route sequence (1, 2, 3, ...) - order of delivery
    sequence_order = Column(Integer, nullable=False)
    
    # Route metrics from optimization algorithm
    distance_from_previous_meters = Column(Float, nullable=True)
    duration_from_previous_seconds = Column(Integer, nullable=True)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="assignment_recipients")
    recipient = relationship("Recipient", back_populates="assignment_recipients")
    
    # Table constraints
    __table_args__ = (
        # Ensure unique assignment-recipient pairs
        UniqueConstraint("assignment_id", "recipient_id", name="unique_assignment_recipient"),
        # Index for efficient route ordering queries
        Index("idx_assignment_sequence", "assignment_id", "sequence_order"),
    )
    
    def __repr__(self):
        return f"<AssignmentRecipient assignment={self.assignment_id} recipient={self.recipient_id} order={self.sequence_order}>"


class StatusHistory(BaseModel):
    """Audit trail for recipient status changes."""
    
    __tablename__ = "status_history"
    
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status transition tracking
    old_status = Column(String(20), nullable=True)  # Null for initial status
    new_status = Column(String(20), nullable=False)
    
    # Audit information
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, nullable=False, index=True)
    
    # Relationships
    recipient = relationship("Recipient", back_populates="status_history")
    changed_by_user = relationship("User")
    
    def __repr__(self):
        return f"<StatusHistory {self.old_status} → {self.new_status}>"
