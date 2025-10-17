"""
Unit tests for CourierRepository.
Tests repository layer operations for couriers.
"""
import pytest
from uuid import UUID
from app.repositories.courier_repository import CourierRepository
from app.models.courier import Courier


def test_create_courier(db_session):
    """Test creating a new courier."""
    repo = CourierRepository(db_session)
    
    courier_data = {
        "name": "Test Courier",
        "phone": "081234567890"
    }
    
    courier = repo.create(courier_data)
    
    assert courier.id is not None
    assert courier.name == "Test Courier"
    assert courier.phone == "081234567890"
    assert courier.is_deleted == False


def test_create_courier_duplicate_phone(db_session):
    """Test creating courier with duplicate phone number."""
    repo = CourierRepository(db_session)
    
    courier_data = {
        "name": "Test Courier 1",
        "phone": "081234567890"
    }
    
    repo.create(courier_data)
    
    # Try to create with same phone
    with pytest.raises(ValueError, match="Phone number .* already exists"):
        repo.create(courier_data)


def test_get_by_id(db_session):
    """Test getting courier by ID."""
    repo = CourierRepository(db_session)
    
    courier_data = {
        "name": "Test Courier",
        "phone": "081234567890"
    }
    
    created = repo.create(courier_data)
    retrieved = repo.get_by_id(created.id)
    
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.name == created.name


def test_get_by_id_not_found(db_session):
    """Test getting non-existent courier."""
    repo = CourierRepository(db_session)
    
    fake_id = UUID("00000000-0000-0000-0000-000000000000")
    courier = repo.get_by_id(fake_id)
    
    assert courier is None


def test_get_by_id_deleted(db_session):
    """Test that soft-deleted courier is not returned."""
    repo = CourierRepository(db_session)
    
    courier_data = {
        "name": "Test Courier",
        "phone": "081234567890"
    }
    
    created = repo.create(courier_data)
    repo.delete(created.id)
    
    retrieved = repo.get_by_id(created.id)
    assert retrieved is None


def test_get_by_phone(db_session):
    """Test getting courier by phone number."""
    repo = CourierRepository(db_session)
    
    courier_data = {
        "name": "Test Courier",
        "phone": "081234567890"
    }
    
    created = repo.create(courier_data)
    retrieved = repo.get_by_phone("081234567890")
    
    assert retrieved is not None
    assert retrieved.id == created.id


def test_get_by_phone_with_exclude(db_session):
    """Test getting courier by phone excluding specific ID."""
    repo = CourierRepository(db_session)
    
    courier1 = repo.create({"name": "Courier 1", "phone": "081234567890"})
    courier2 = repo.create({"name": "Courier 2", "phone": "082345678901"})
    
    # Should return courier1
    result = repo.get_by_phone("081234567890")
    assert result.id == courier1.id
    
    # Should return None when excluding courier1
    result = repo.get_by_phone("081234567890", exclude_id=courier1.id)
    assert result is None


def test_get_all_no_filters(db_session):
    """Test getting all couriers without filters."""
    repo = CourierRepository(db_session)
    
    # Create 3 couriers
    repo.create({"name": "Courier A", "phone": "081111111111"})
    repo.create({"name": "Courier B", "phone": "082222222222"})
    repo.create({"name": "Courier C", "phone": "083333333333"})
    
    couriers, total = repo.get_all(page=1, per_page=10)
    
    assert len(couriers) == 3
    assert total == 3


def test_get_all_with_search(db_session):
    """Test getting couriers with search filter."""
    repo = CourierRepository(db_session)
    
    repo.create({"name": "Ahmad Ridwan", "phone": "081111111111"})
    repo.create({"name": "Budi Santoso", "phone": "082222222222"})
    repo.create({"name": "Citra Ahmad", "phone": "083333333333"})
    
    # Search by name
    couriers, total = repo.get_all(search="Ahmad")
    assert len(couriers) == 2
    assert total == 2
    
    # Search by phone
    couriers, total = repo.get_all(search="08111")
    assert len(couriers) == 1
    assert total == 1


def test_get_all_with_pagination(db_session):
    """Test pagination."""
    repo = CourierRepository(db_session)
    
    # Create 5 couriers
    for i in range(5):
        repo.create({"name": f"Courier {i}", "phone": f"08111111111{i}"})
    
    # Get page 1 with 2 items
    couriers, total = repo.get_all(page=1, per_page=2)
    assert len(couriers) == 2
    assert total == 5
    
    # Get page 2
    couriers, total = repo.get_all(page=2, per_page=2)
    assert len(couriers) == 2
    assert total == 5


def test_get_all_with_sorting(db_session):
    """Test sorting."""
    repo = CourierRepository(db_session)
    
    repo.create({"name": "Charlie", "phone": "081111111111"})
    repo.create({"name": "Alice", "phone": "082222222222"})
    repo.create({"name": "Bob", "phone": "083333333333"})
    
    # Sort by name ascending
    couriers, _ = repo.get_all(sort_by="name", sort_order="asc")
    assert couriers[0].name == "Alice"
    assert couriers[1].name == "Bob"
    assert couriers[2].name == "Charlie"
    
    # Sort by name descending
    couriers, _ = repo.get_all(sort_by="name", sort_order="desc")
    assert couriers[0].name == "Charlie"
    assert couriers[1].name == "Bob"
    assert couriers[2].name == "Alice"


def test_update_courier(db_session):
    """Test updating courier."""
    repo = CourierRepository(db_session)
    
    courier = repo.create({"name": "Original Name", "phone": "081111111111"})
    
    updated = repo.update(courier.id, {"name": "Updated Name"})
    
    assert updated is not None
    assert updated.name == "Updated Name"
    assert updated.phone == "081111111111"  # Unchanged


def test_update_courier_phone(db_session):
    """Test updating courier phone number."""
    repo = CourierRepository(db_session)
    
    courier = repo.create({"name": "Test", "phone": "081111111111"})
    
    updated = repo.update(courier.id, {"phone": "082222222222"})
    
    assert updated is not None
    assert updated.phone == "082222222222"


def test_update_courier_duplicate_phone(db_session):
    """Test updating courier with duplicate phone."""
    repo = CourierRepository(db_session)
    
    courier1 = repo.create({"name": "Courier 1", "phone": "081111111111"})
    courier2 = repo.create({"name": "Courier 2", "phone": "082222222222"})
    
    # Try to update courier2 with courier1's phone
    with pytest.raises(ValueError, match="Phone number .* already exists"):
        repo.update(courier2.id, {"phone": "081111111111"})


def test_update_courier_not_found(db_session):
    """Test updating non-existent courier."""
    repo = CourierRepository(db_session)
    
    fake_id = UUID("00000000-0000-0000-0000-000000000000")
    updated = repo.update(fake_id, {"name": "New Name"})
    
    assert updated is None


def test_delete_courier(db_session):
    """Test soft deleting courier."""
    repo = CourierRepository(db_session)
    
    courier = repo.create({"name": "Test Courier", "phone": "081111111111"})
    
    result = repo.delete(courier.id)
    assert result == True
    
    # Verify it's soft deleted
    retrieved = repo.get_by_id(courier.id)
    assert retrieved is None


def test_delete_courier_not_found(db_session):
    """Test deleting non-existent courier."""
    repo = CourierRepository(db_session)
    
    fake_id = UUID("00000000-0000-0000-0000-000000000000")
    result = repo.delete(fake_id)
    
    assert result == False


def test_bulk_delete(db_session):
    """Test bulk soft delete."""
    repo = CourierRepository(db_session)
    
    courier1 = repo.create({"name": "Courier 1", "phone": "081111111111"})
    courier2 = repo.create({"name": "Courier 2", "phone": "082222222222"})
    courier3 = repo.create({"name": "Courier 3", "phone": "083333333333"})
    
    deleted_count = repo.bulk_delete([courier1.id, courier2.id])
    
    assert deleted_count == 2
    
    # Verify they're deleted
    assert repo.get_by_id(courier1.id) is None
    assert repo.get_by_id(courier2.id) is None
    assert repo.get_by_id(courier3.id) is not None


def test_bulk_delete_empty_list(db_session):
    """Test bulk delete with empty list."""
    repo = CourierRepository(db_session)
    
    deleted_count = repo.bulk_delete([])
    assert deleted_count == 0
