"""
Integration tests for Courier API endpoints.
Tests API layer with authentication and database.
"""
import pytest
from uuid import UUID
from fastapi import status
from app.models.courier import Courier


def test_get_couriers_list(client, auth_headers, db_session):
    """Test GET /api/v1/couriers - list couriers."""
    # Create test couriers
    courier1 = Courier(name="Test Courier 1", phone="081111111111")
    courier2 = Courier(name="Test Courier 2", phone="082222222222")
    db_session.add_all([courier1, courier2])
    db_session.commit()
    
    response = client.get("/api/v1/couriers", headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 2
    assert data["pagination"]["total_items"] == 2


def test_get_couriers_list_unauthorized(client):
    """Test GET /api/v1/couriers without authentication."""
    response = client.get("/api/v1/couriers")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_couriers_with_search(client, auth_headers, db_session):
    """Test GET /api/v1/couriers with search parameter."""
    courier1 = Courier(name="Ahmad Ridwan", phone="081111111111")
    courier2 = Courier(name="Budi Santoso", phone="082222222222")
    courier3 = Courier(name="Ahmad Setiawan", phone="083333333333")
    db_session.add_all([courier1, courier2, courier3])
    db_session.commit()
    
    response = client.get("/api/v1/couriers?search=Ahmad", headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) == 2
    assert data["pagination"]["total_items"] == 2


def test_get_couriers_with_pagination(client, auth_headers, db_session):
    """Test GET /api/v1/couriers with pagination."""
    # Create 25 couriers to test pagination properly
    for i in range(25):
        courier = Courier(name=f"Courier {i:02d}", phone=f"081{i:08d}")
        db_session.add(courier)
    db_session.commit()
    
    # Page 1 with 10 items
    response = client.get("/api/v1/couriers?page=1&per_page=10", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) == 10
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["total_items"] == 25
    assert data["pagination"]["total_pages"] == 3
    
    # Page 2 with 10 items
    response = client.get("/api/v1/couriers?page=2&per_page=10", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) == 10
    assert data["pagination"]["page"] == 2
    
    # Page 3 with remaining 5 items
    response = client.get("/api/v1/couriers?page=3&per_page=10", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) == 5
    assert data["pagination"]["page"] == 3


def test_get_couriers_with_sorting(client, auth_headers, db_session):
    """Test GET /api/v1/couriers with sorting."""
    courier1 = Courier(name="Charlie", phone="081111111111")
    courier2 = Courier(name="Alice", phone="082222222222")
    courier3 = Courier(name="Bob", phone="083333333333")
    db_session.add_all([courier1, courier2, courier3])
    db_session.commit()
    
    # Sort by name ascending
    response = client.get("/api/v1/couriers?sort_by=name&sort_order=asc", headers=auth_headers)
    data = response.json()
    assert data["items"][0]["name"] == "Alice"
    assert data["items"][1]["name"] == "Bob"
    assert data["items"][2]["name"] == "Charlie"


def test_get_courier_by_id(client, auth_headers, db_session):
    """Test GET /api/v1/couriers/{id} - get courier detail."""
    courier = Courier(name="Test Courier", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    db_session.refresh(courier)
    
    response = client.get(f"/api/v1/couriers/{courier.id}", headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(courier.id)
    assert data["name"] == "Test Courier"
    assert data["phone"] == "081234567890"


def test_get_courier_not_found(client, auth_headers):
    """Test GET /api/v1/couriers/{id} with non-existent ID."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/couriers/{fake_id}", headers=auth_headers)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_courier_unauthorized(client, db_session):
    """Test GET /api/v1/couriers/{id} without authentication."""
    courier = Courier(name="Test", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    
    response = client.get(f"/api/v1/couriers/{courier.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_courier(client, auth_headers):
    """Test POST /api/v1/couriers - create new courier."""
    courier_data = {
        "name": "New Courier",
        "phone": "081234567890"
    }
    
    response = client.post("/api/v1/couriers", json=courier_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["name"] == "New Courier"
    assert data["phone"] == "081234567890"


def test_create_courier_duplicate_phone(client, auth_headers, db_session):
    """Test POST /api/v1/couriers with duplicate phone."""
    # Create existing courier
    existing = Courier(name="Existing", phone="081234567890")
    db_session.add(existing)
    db_session.commit()
    
    courier_data = {
        "name": "New Courier",
        "phone": "081234567890"
    }
    
    response = client.post("/api/v1/couriers", json=courier_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


def test_create_courier_invalid_data(client, auth_headers):
    """Test POST /api/v1/couriers with invalid data."""
    courier_data = {
        "name": "",  # Empty name
        "phone": "081234567890"
    }
    
    response = client.post("/api/v1/couriers", json=courier_data, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_courier_unauthorized(client):
    """Test POST /api/v1/couriers without authentication."""
    courier_data = {"name": "Test", "phone": "081234567890"}
    response = client.post("/api/v1/couriers", json=courier_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_courier(client, auth_headers, db_session):
    """Test PUT /api/v1/couriers/{id} - update courier."""
    courier = Courier(name="Original Name", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    db_session.refresh(courier)
    
    update_data = {
        "name": "Updated Name",
        "phone": "081234567890"
    }
    
    response = client.put(f"/api/v1/couriers/{courier.id}", json=update_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"


def test_update_courier_phone(client, auth_headers, db_session):
    """Test PUT /api/v1/couriers/{id} - update phone."""
    courier = Courier(name="Test", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    db_session.refresh(courier)
    
    update_data = {
        "name": "Test",
        "phone": "082345678901"
    }
    
    response = client.put(f"/api/v1/couriers/{courier.id}", json=update_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["phone"] == "082345678901"


def test_update_courier_duplicate_phone(client, auth_headers, db_session):
    """Test PUT /api/v1/couriers/{id} with duplicate phone."""
    courier1 = Courier(name="Courier 1", phone="081111111111")
    courier2 = Courier(name="Courier 2", phone="082222222222")
    db_session.add_all([courier1, courier2])
    db_session.commit()
    db_session.refresh(courier2)
    
    update_data = {
        "name": "Courier 2",
        "phone": "081111111111"  # courier1's phone
    }
    
    response = client.put(f"/api/v1/couriers/{courier2.id}", json=update_data, headers=auth_headers)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


def test_update_courier_not_found(client, auth_headers):
    """Test PUT /api/v1/couriers/{id} with non-existent ID."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = {"name": "New Name", "phone": "081234567890"}
    
    response = client.put(f"/api/v1/couriers/{fake_id}", json=update_data, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_courier_unauthorized(client, db_session):
    """Test PUT /api/v1/couriers/{id} without authentication."""
    courier = Courier(name="Test", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    
    update_data = {"name": "Updated", "phone": "081234567890"}
    response = client.put(f"/api/v1/couriers/{courier.id}", json=update_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_delete_courier(client, auth_headers, db_session):
    """Test DELETE /api/v1/couriers/{id} - soft delete."""
    courier = Courier(name="Test Courier", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    db_session.refresh(courier)
    
    response = client.delete(f"/api/v1/couriers/{courier.id}", headers=auth_headers)
    
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify soft delete
    db_session.refresh(courier)
    assert courier.is_deleted == True


def test_delete_courier_not_found(client, auth_headers):
    """Test DELETE /api/v1/couriers/{id} with non-existent ID."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.delete(f"/api/v1/couriers/{fake_id}", headers=auth_headers)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_courier_unauthorized(client, db_session):
    """Test DELETE /api/v1/couriers/{id} without authentication."""
    courier = Courier(name="Test", phone="081234567890")
    db_session.add(courier)
    db_session.commit()
    
    response = client.delete(f"/api/v1/couriers/{courier.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_bulk_delete_couriers(client, auth_headers, db_session):
    """Test DELETE /api/v1/couriers/bulk/delete - bulk soft delete."""
    courier1 = Courier(name="Courier 1", phone="081111111111")
    courier2 = Courier(name="Courier 2", phone="082222222222")
    courier3 = Courier(name="Courier 3", phone="083333333333")
    db_session.add_all([courier1, courier2, courier3])
    db_session.commit()
    db_session.refresh(courier1)
    db_session.refresh(courier2)
    
    delete_request = {
        "ids": [str(courier1.id), str(courier2.id)]
    }
    
    response = client.request("DELETE", "/api/v1/couriers/bulk/delete", json=delete_request, headers=auth_headers)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["deleted_count"] == 2
    
    # Verify soft delete
    db_session.refresh(courier1)
    db_session.refresh(courier2)
    db_session.refresh(courier3)
    assert courier1.is_deleted == True
    assert courier2.is_deleted == True
    assert courier3.is_deleted == False


def test_bulk_delete_empty_list(client, auth_headers):
    """Test DELETE /api/v1/couriers/bulk/delete with empty list."""
    delete_request = {"ids": []}
    
    response = client.request("DELETE", "/api/v1/couriers/bulk/delete", json=delete_request, headers=auth_headers)
    
    # Should fail validation
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_bulk_delete_unauthorized(client):
    """Test DELETE /api/v1/couriers/bulk/delete without authentication."""
    delete_request = {"ids": ["00000000-0000-0000-0000-000000000000"]}
    response = client.request("DELETE", "/api/v1/couriers/bulk/delete", json=delete_request)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
