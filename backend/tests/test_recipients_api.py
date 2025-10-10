"""
Integration tests for Recipient API endpoints.
"""
import pytest
from uuid import uuid4
from app.models.recipient import RecipientStatus


class TestRecipientAPI:
    """Test cases for Recipient API endpoints."""
    
    def test_get_recipients_list(self, client, auth_headers, test_recipients):
        """Test GET /api/v1/recipients - list with pagination."""
        response = client.get(
            "/api/v1/recipients",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "pagination" in data
        assert data["pagination"]["total_items"] == 5
        assert len(data["items"]) == 5
    
    def test_get_recipients_with_pagination(self, client, auth_headers, test_recipients):
        """Test GET /api/v1/recipients with pagination parameters."""
        response = client.get(
            "/api/v1/recipients?page=1&per_page=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["items"]) == 5  # All 5 recipients on first page
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["per_page"] == 10
        assert data["pagination"]["total_pages"] == 1
    
    def test_get_recipients_with_search(self, client, auth_headers, test_recipients):
        """Test GET /api/v1/recipients with search filter."""
        response = client.get(
            "/api/v1/recipients?search=Recipient 3",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pagination"]["total_items"] == 1
        assert data["items"][0]["name"] == "Test Recipient 3"
    
    def test_get_recipients_with_status_filter(self, client, auth_headers, test_recipients, db_session):
        """Test GET /api/v1/recipients with status filter."""
        # Change one recipient status
        test_recipients[0].status = RecipientStatus.ASSIGNED.value
        db_session.commit()
        
        response = client.get(
            "/api/v1/recipients?status=Unassigned",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pagination"]["total_items"] == 4
    
    def test_get_recipients_unauthorized(self, client, test_recipients):
        """Test GET /api/v1/recipients without authentication."""
        response = client.get("/api/v1/recipients")
        
        assert response.status_code == 401
    
    def test_get_recipient_detail(self, client, auth_headers, test_recipient):
        """Test GET /api/v1/recipients/{id} - get detail."""
        response = client.get(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(test_recipient.id)
        assert data["name"] == test_recipient.name
        assert data["phone"] == test_recipient.phone
        assert "province" in data
        assert "city" in data
        assert "location" in data
    
    def test_get_recipient_detail_not_found(self, client, auth_headers):
        """Test GET /api/v1/recipients/{id} with invalid ID."""
        response = client.get(
            f"/api/v1/recipients/{uuid4()}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_create_recipient(self, client, auth_headers, test_province, test_city):
        """Test POST /api/v1/recipients - create new recipient."""
        recipient_data = {
            "name": "New Test Recipient",
            "phone": "081999999999",
            "address": "Jl. New Test No. 999",
            "province_id": test_province.id,
            "city_id": test_city.id,
            "location": {
                "lat": -6.2088,
                "lng": 106.8456
            },
            "num_packages": 5
        }
        
        response = client.post(
            "/api/v1/recipients",
            headers=auth_headers,
            json=recipient_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["name"] == "New Test Recipient"
        assert data["phone"] == "081999999999"
        assert data["num_packages"] == 5
        assert data["status"] == "Unassigned"
    
    def test_create_recipient_invalid_data(self, client, auth_headers, test_province, test_city):
        """Test POST /api/v1/recipients with invalid data."""
        recipient_data = {
            "name": "Test",
            "phone": "invalid",  # Invalid phone format
            "address": "Test",
            "province_id": test_province.id,
            "city_id": test_city.id,
            "location": {
                "lat": -6.2088,
                "lng": 106.8456
            }
        }
        
        response = client.post(
            "/api/v1/recipients",
            headers=auth_headers,
            json=recipient_data
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_recipient_missing_fields(self, client, auth_headers):
        """Test POST /api/v1/recipients with missing required fields."""
        recipient_data = {
            "name": "Test"
        }
        
        response = client.post(
            "/api/v1/recipients",
            headers=auth_headers,
            json=recipient_data
        )
        
        assert response.status_code == 422
    
    def test_update_recipient(self, client, auth_headers, test_recipient):
        """Test PUT /api/v1/recipients/{id} - update recipient."""
        update_data = {
            "name": "Updated Recipient Name",
            "phone": "081888888888",
            "address": test_recipient.address,
            "province_id": test_recipient.province_id,
            "city_id": test_recipient.city_id,
            "location": {
                "lat": -6.2100,
                "lng": 106.8500
            },
            "num_packages": 10
        }
        
        response = client.put(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Updated Recipient Name"
        assert data["phone"] == "081888888888"
        assert data["num_packages"] == 10
    
    def test_update_recipient_not_found(self, client, auth_headers, test_province, test_city):
        """Test PUT /api/v1/recipients/{id} with invalid ID."""
        update_data = {
            "name": "Test",
            "phone": "081234567890",
            "address": "Test",
            "province_id": test_province.id,
            "city_id": test_city.id,
            "location": {"lat": -6.2088, "lng": 106.8456},
            "num_packages": 1
        }
        
        response = client.put(
            f"/api/v1/recipients/{uuid4()}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 404
    
    def test_update_recipient_invalid_status(self, client, auth_headers, test_recipient, db_session):
        """Test updating recipient with invalid status (Delivery)."""
        # Set status to Delivery
        test_recipient.status = RecipientStatus.DELIVERY.value
        db_session.commit()
        
        update_data = {
            "name": "Updated Name",
            "phone": "081234567890",
            "address": test_recipient.address,
            "province_id": test_recipient.province_id,
            "city_id": test_recipient.city_id,
            "location": {"lat": -6.2088, "lng": 106.8456},
            "num_packages": 1
        }
        
        response = client.put(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 400
    
    def test_delete_recipient(self, client, auth_headers, test_recipient):
        """Test DELETE /api/v1/recipients/{id} - soft delete."""
        response = client.delete(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = client.get(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
    
    def test_delete_recipient_not_found(self, client, auth_headers):
        """Test DELETE /api/v1/recipients/{id} with invalid ID."""
        response = client.delete(
            f"/api/v1/recipients/{uuid4()}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_delete_recipient_invalid_status(self, client, auth_headers, test_recipient, db_session):
        """Test deleting recipient with invalid status (Assigned)."""
        # Set status to Assigned
        test_recipient.status = RecipientStatus.ASSIGNED.value
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/recipients/{test_recipient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    def test_bulk_delete_recipients(self, client, auth_headers, test_recipients):
        """Test DELETE /api/v1/recipients/bulk/delete - bulk soft delete."""
        ids_to_delete = [str(r.id) for r in test_recipients[:3]]
        
        response = client.request(
            "DELETE",
            "/api/v1/recipients/bulk/delete",
            headers=auth_headers,
            json={"ids": ids_to_delete}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["deleted_count"] == 3
    
    def test_bulk_delete_empty_list(self, client, auth_headers):
        """Test bulk delete with empty ID list."""
        response = client.request(
            "DELETE",
            "/api/v1/recipients/bulk/delete",
            headers=auth_headers,
            json={"ids": []}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_get_recipient_status_history(self, client, auth_headers, test_recipient):
        """Test GET /api/v1/recipients/{id}/history - get status history."""
        response = client.get(
            f"/api/v1/recipients/{test_recipient.id}/history",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recipient_id" in data
        assert "history" in data
        assert isinstance(data["history"], list)
        # New recipient has no history yet
        assert len(data["history"]) == 0
    
    def test_get_recipient_history_not_found(self, client, auth_headers):
        """Test getting history for non-existent recipient."""
        response = client.get(
            f"/api/v1/recipients/{uuid4()}/history",
            headers=auth_headers
        )
        
        assert response.status_code == 404
