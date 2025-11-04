"""
Integration tests for Optimization API endpoints.
Tests TSP and CVRP endpoints with mocked Google Distance Matrix API.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.main import app
from app.models.recipient import Recipient
from app.models.region import Province, City
from app.database import SessionLocal
from geoalchemy2.elements import WKTElement


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """Get authentication headers."""
    # Login with test user (form-data, not JSON)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123!"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_recipients():
    """Create test recipients in database."""
    db = SessionLocal()
    recipients = []
    
    try:
        # Create test province and city first
        test_province = Province(
            id=9999,
            name="Test Province",
            is_deleted=False
        )
        db.add(test_province)
        
        test_city = City(
            id=9999,
            province_id=9999,
            name="Test City",
            is_deleted=False
        )
        db.add(test_city)
        db.commit()
        
        # Create 5 test recipients in Jakarta area
        locations = [
            (-6.200000, 106.816666),  # Jakarta Pusat
            (-6.210000, 106.820000),
            (-6.215000, 106.825000),
            (-6.220000, 106.830000),
            (-6.225000, 106.835000),
        ]
        
        for i, (lat, lng) in enumerate(locations):
            recipient = Recipient(
                name=f"Test Recipient {i+1}",
                phone=f"08123456789{i}",
                address=f"Test Address {i+1}, Jakarta",
                province_id=9999,
                city_id=9999,
                location=WKTElement(f"POINT({lng} {lat})", srid=4326),
                status="Unassigned",
                num_packages=5,
                is_deleted=False
            )
            db.add(recipient)
        
        db.commit()
        
        # Get created recipients
        recipients = db.query(Recipient).filter(
            Recipient.name.like("Test Recipient%")
        ).all()
        
        yield [r.id for r in recipients]
        
    finally:
        # Cleanup (cascade will delete recipients)
        db.query(Recipient).filter(
            Recipient.name.like("Test Recipient%")
        ).delete()
        db.query(City).filter(City.id == 9999).delete()
        db.query(Province).filter(Province.id == 9999).delete()
        db.commit()
        db.close()


@pytest.fixture
def mock_routes_api():
    """Mock Google Routes API response."""
    def _create_mock_response(num_locations):
        """Create mock distance matrix for given number of locations."""
        # Create simple distance matrix (symmetric, distance increases with index difference)
        distance_matrix = []
        duration_matrix = []
        
        for i in range(num_locations):
            distance_row = []
            duration_row = []
            for j in range(num_locations):
                if i == j:
                    # Same location
                    distance_row.append(0)
                    duration_row.append(0)
                else:
                    # Distance based on index difference (simplified)
                    distance = abs(i - j) * 2000  # 2km per index difference
                    duration = abs(i - j) * 300   # 5 minutes per index difference
                    distance_row.append(distance)
                    duration_row.append(duration)
            distance_matrix.append(distance_row)
            duration_matrix.append(duration_row)
        
        return {
            "distance_matrix": distance_matrix,
            "duration_matrix": duration_matrix,
            "status": "OK"
        }
    
    return _create_mock_response


class TestTSPEndpoint:
    """Test cases for TSP optimization endpoint."""
    
    def test_tsp_success(self, client, auth_headers, test_recipients, mock_routes_api):
        """Test successful TSP optimization."""
        with patch('app.services.routes_api_service.RoutesAPIService.compute_route_matrix') as mock_matrix:
            # Mock Routes API
            mock_matrix.return_value = mock_routes_api(4)  # 3 recipients + depot
            
            # Make request
            response = client.post(
                "/api/v1/optimize/tsp",
                json={
                    "recipient_ids": [str(rid) for rid in test_recipients[:3]],
                    "timeout_seconds": 5,
                    "use_traffic": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Validate response structure
            assert "optimized_sequence" in data
            assert "total_distance_meters" in data
            assert "total_duration_seconds" in data
            assert "num_stops" in data
            
            # Validate data
            assert len(data["optimized_sequence"]) == 3
            assert data["num_stops"] == 3
            assert data["total_distance_meters"] > 0
            assert data["total_duration_seconds"] > 0
    
    def test_tsp_with_custom_depot(self, client, auth_headers, test_recipients, mock_routes_api):
        """Test TSP with custom depot location."""
        with patch('app.services.routes_api_service.RoutesAPIService.compute_route_matrix') as mock_matrix:
            mock_matrix.return_value = mock_routes_api(4)
            
            response = client.post(
                "/api/v1/optimize/tsp",
                json={
                    "recipient_ids": [str(rid) for rid in test_recipients[:3]],
                    "depot_location": {
                        "lat": -6.195000,
                        "lng": 106.810000
                    },
                    "timeout_seconds": 5,
                    "use_traffic": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["optimized_sequence"]) == 3
    
    def test_tsp_empty_recipients(self, client, auth_headers):
        """Test TSP with empty recipient list."""
        response = client.post(
            "/api/v1/optimize/tsp",
            json={
                "recipient_ids": []
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_tsp_invalid_recipient_id(self, client, auth_headers):
        """Test TSP with non-existent recipient."""
        fake_id = str(uuid4())
        
        response = client.post(
            "/api/v1/optimize/tsp",
            json={
                "recipient_ids": [fake_id]
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
    
    def test_tsp_unauthorized(self, client, test_recipients):
        """Test TSP without authentication."""
        response = client.post(
            "/api/v1/optimize/tsp",
            json={
                "recipient_ids": [str(rid) for rid in test_recipients[:3]]
            }
        )
        
        assert response.status_code == 401


class TestCVRPEndpoint:
    """Test cases for CVRP optimization endpoint."""
    
    def test_cvrp_success(self, client, auth_headers, test_recipients, mock_routes_api):
        """Test successful CVRP optimization."""
        with patch('app.services.routes_api_service.RoutesAPIService.compute_route_matrix') as mock_matrix:
            mock_matrix.return_value = mock_routes_api(6)  # 5 recipients + depot
            
            response = client.post(
                "/api/v1/optimize/cvrp",
                json={
                    "recipient_ids": [str(rid) for rid in test_recipients],
                    "num_couriers": 2,
                    "capacity_per_courier": 15,
                    "timeout_seconds": 10,
                    "use_traffic": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Validate response structure
            assert "routes" in data
            assert "num_routes" in data
            assert "total_distance_meters" in data
            assert "total_duration_seconds" in data
            assert "total_recipients" in data
            
            # Validate data
            assert len(data["routes"]) > 0
            assert len(data["routes"]) <= 2  # Max 2 couriers
            assert data["total_recipients"] == 5
            
            # Validate route structure
            for route in data["routes"]:
                assert "courier_index" in route
                assert "recipient_sequence" in route
                assert "num_stops" in route
                assert "total_load" in route
                assert "total_distance_meters" in route
                assert "total_duration_seconds" in route
    
    def test_cvrp_insufficient_capacity(self, client, auth_headers, test_recipients, mock_routes_api):
        """Test CVRP with insufficient total capacity."""
        with patch('app.services.routes_api_service.RoutesAPIService.compute_route_matrix') as mock_matrix:
            mock_matrix.return_value = mock_routes_api(6)
            
            # Total demand = 5 recipients * 5 packages = 25
            # Total capacity = 2 couriers * 10 capacity = 20 (insufficient)
            response = client.post(
                "/api/v1/optimize/cvrp",
                json={
                    "recipient_ids": [str(rid) for rid in test_recipients],
                    "num_couriers": 2,
                    "capacity_per_courier": 10,
                    "timeout_seconds": 10,
                    "use_traffic": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 400
            assert "infeasible" in response.json()["detail"].lower() or "exceeds" in response.json()["detail"].lower()
    
    def test_cvrp_single_courier(self, client, auth_headers, test_recipients, mock_routes_api):
        """Test CVRP with single courier (should work like TSP)."""
        with patch('app.services.routes_api_service.RoutesAPIService.compute_route_matrix') as mock_matrix:
            mock_matrix.return_value = mock_routes_api(4)
            
            response = client.post(
                "/api/v1/optimize/cvrp",
                json={
                    "recipient_ids": [str(rid) for rid in test_recipients[:3]],
                    "num_couriers": 1,
                    "capacity_per_courier": 20,
                    "timeout_seconds": 10,
                    "use_traffic": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["num_routes"] == 1
            assert len(data["routes"][0]["recipient_sequence"]) == 3
    
    def test_cvrp_invalid_params(self, client, auth_headers, test_recipients):
        """Test CVRP with invalid parameters."""
        # Negative capacity
        response = client.post(
            "/api/v1/optimize/cvrp",
            json={
                "recipient_ids": [str(rid) for rid in test_recipients],
                "num_couriers": 2,
                "capacity_per_courier": -5
            },
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Zero couriers
        response = client.post(
            "/api/v1/optimize/cvrp",
            json={
                "recipient_ids": [str(rid) for rid in test_recipients],
                "num_couriers": 0,
                "capacity_per_courier": 20
            },
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_cvrp_unauthorized(self, client, test_recipients):
        """Test CVRP without authentication."""
        response = client.post(
            "/api/v1/optimize/cvrp",
            json={
                "recipient_ids": [str(rid) for rid in test_recipients],
                "num_couriers": 2,
                "capacity_per_courier": 20
            }
        )
        
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
