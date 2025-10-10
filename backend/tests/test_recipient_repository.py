"""
Unit tests for RecipientRepository.
"""
import pytest
from uuid import uuid4
from app.repositories.recipient_repository import RecipientRepository
from app.models.recipient import Recipient, RecipientStatus


class TestRecipientRepository:
    """Test cases for RecipientRepository."""
    
    def test_create_recipient(self, db_session, test_province, test_city):
        """Test creating a new recipient."""
        repo = RecipientRepository(db_session)
        
        recipient_data = {
            "name": "New Recipient",
            "phone": "081234567890",
            "address": "Jl. New Test No. 456",
            "province_id": test_province.id,
            "city_id": test_city.id,
            "location": {"lat": -6.2088, "lng": 106.8456},
            "num_packages": 3
        }
        
        recipient = repo.create(recipient_data)
        
        assert recipient.id is not None
        assert recipient.name == "New Recipient"
        assert recipient.phone == "081234567890"
        assert recipient.status == RecipientStatus.UNASSIGNED.value
        assert recipient.num_packages == 3
        assert recipient.is_deleted is False
    
    def test_get_by_id(self, db_session, test_recipient):
        """Test getting recipient by ID."""
        repo = RecipientRepository(db_session)
        
        recipient = repo.get_by_id(test_recipient.id)
        
        assert recipient is not None
        assert recipient.id == test_recipient.id
        assert recipient.name == test_recipient.name
        assert recipient.province is not None
        assert recipient.city is not None
    
    def test_get_by_id_not_found(self, db_session):
        """Test getting non-existent recipient."""
        repo = RecipientRepository(db_session)
        
        recipient = repo.get_by_id(uuid4())
        
        assert recipient is None
    
    def test_get_all_with_pagination(self, db_session, test_recipients):
        """Test getting all recipients with pagination."""
        repo = RecipientRepository(db_session)
        
        recipients, total = repo.get_all(page=1, per_page=3)
        
        assert len(recipients) == 3
        assert total == 5
        assert recipients[0].name == "Test Recipient 5"  # desc order by default
    
    def test_get_all_with_search(self, db_session, test_recipients):
        """Test getting recipients with search filter."""
        repo = RecipientRepository(db_session)
        
        recipients, total = repo.get_all(search="Recipient 2")
        
        assert total == 1
        assert recipients[0].name == "Test Recipient 2"
    
    def test_get_all_with_status_filter(self, db_session, test_recipients):
        """Test getting recipients filtered by status."""
        repo = RecipientRepository(db_session)
        
        # Change one recipient status
        test_recipients[0].status = RecipientStatus.ASSIGNED.value
        db_session.commit()
        
        recipients, total = repo.get_all(status=RecipientStatus.UNASSIGNED)
        
        assert total == 4  # 5 total - 1 assigned
    
    def test_update_recipient(self, db_session, test_recipient):
        """Test updating a recipient."""
        repo = RecipientRepository(db_session)
        
        update_data = {
            "name": "Updated Name",
            "num_packages": 5,
            "location": {"lat": -6.2100, "lng": 106.8500}
        }
        
        updated = repo.update(test_recipient.id, update_data)
        
        assert updated is not None
        assert updated.name == "Updated Name"
        assert updated.num_packages == 5
    
    def test_update_recipient_not_found(self, db_session):
        """Test updating non-existent recipient."""
        repo = RecipientRepository(db_session)
        
        result = repo.update(uuid4(), {"name": "Test"})
        
        assert result is None
    
    def test_update_recipient_with_invalid_status(self, db_session, test_recipient):
        """Test updating recipient with invalid status (Delivery/Done)."""
        repo = RecipientRepository(db_session)
        
        # Set status to Delivery
        test_recipient.status = RecipientStatus.DELIVERY.value
        db_session.commit()
        
        with pytest.raises(ValueError, match="Cannot update recipient with status"):
            repo.update(test_recipient.id, {"name": "New Name"})
    
    def test_delete_recipient(self, db_session, test_recipient):
        """Test soft deleting a recipient."""
        repo = RecipientRepository(db_session)
        
        result = repo.delete(test_recipient.id)
        
        assert result is True
        
        # Verify soft delete
        deleted = repo.get_by_id(test_recipient.id)
        assert deleted is None  # Should not be found after deletion
        
        # Check database directly
        db_recipient = db_session.query(Recipient).filter(
            Recipient.id == test_recipient.id
        ).first()
        assert db_recipient.is_deleted is True
    
    def test_delete_recipient_not_found(self, db_session):
        """Test deleting non-existent recipient."""
        repo = RecipientRepository(db_session)
        
        result = repo.delete(uuid4())
        
        assert result is False
    
    def test_delete_recipient_with_invalid_status(self, db_session, test_recipient):
        """Test deleting recipient with invalid status (Assigned/Delivery/Done)."""
        repo = RecipientRepository(db_session)
        
        # Set status to Assigned
        test_recipient.status = RecipientStatus.ASSIGNED.value
        db_session.commit()
        
        with pytest.raises(ValueError, match="Cannot delete recipient with status"):
            repo.delete(test_recipient.id)
    
    def test_bulk_delete(self, db_session, test_recipients):
        """Test bulk soft delete."""
        repo = RecipientRepository(db_session)
        
        # Get first 3 recipient IDs
        ids_to_delete = [r.id for r in test_recipients[:3]]
        
        deleted_count = repo.bulk_delete(ids_to_delete)
        
        assert deleted_count == 3
        
        # Verify they're deleted
        remaining, total = repo.get_all()
        assert total == 2
    
    def test_bulk_delete_skips_invalid_status(self, db_session, test_recipients):
        """Test bulk delete skips recipients with invalid status."""
        repo = RecipientRepository(db_session)
        
        # Set one recipient to Assigned status
        test_recipients[0].status = RecipientStatus.ASSIGNED.value
        db_session.commit()
        
        # Try to delete all
        ids_to_delete = [r.id for r in test_recipients]
        deleted_count = repo.bulk_delete(ids_to_delete)
        
        # Should skip the Assigned one
        assert deleted_count == 4
    
    def test_extract_location(self, db_session, test_recipient):
        """Test extracting lat/lng from location."""
        location = RecipientRepository.extract_location(test_recipient)
        
        assert location is not None
        assert "lat" in location
        assert "lng" in location
        assert isinstance(location["lat"], float)
        assert isinstance(location["lng"], float)
