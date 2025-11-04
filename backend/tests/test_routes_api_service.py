"""
Unit tests for RoutesAPIService (Google Routes API v2 integration).
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from app.services.routes_api_service import RoutesAPIService
from app.utils.cache_service import CacheService


class TestRoutesAPIService:
    """Test RoutesAPIService functionality."""
    
    @pytest.fixture
    def mock_cache_service(self):
        """Create mock cache service."""
        cache = Mock(spec=CacheService)
        cache.get_base_distance.return_value = None
        cache.get_traffic_duration.return_value = None
        cache.set_base_distance.return_value = True
        cache.set_traffic_duration.return_value = True
        return cache
    
    @pytest.fixture
    def routes_service(self, mock_cache_service):
        """Create RoutesAPIService instance for testing."""
        return RoutesAPIService(
            api_key="test-api-key",
            cache_service=mock_cache_service
        )
    
    # Initialization Tests
    
    def test_initialization_with_api_key(self):
        """Test service initialization with API key."""
        service = RoutesAPIService(api_key="test-key")
        assert service.api_key == "test-key"
        assert service.cache_service is not None
    
    def test_initialization_without_api_key(self):
        """Test service initialization without API key (should use settings)."""
        with patch('app.services.routes_api_service.settings') as mock_settings:
            mock_settings.GOOGLE_MAPS_API_KEY = "settings-key"
            mock_settings.ROUTES_API_TIMEOUT = 30
            service = RoutesAPIService()
            assert service.api_key == "settings-key"
    
    # Element Limit Tests
    
    def test_essentials_mode_element_limit(self, routes_service):
        """Test Essentials mode has correct element limit (625)."""
        assert routes_service.ESSENTIALS_MAX_ELEMENTS == 625
    
    def test_pro_mode_element_limit(self, routes_service):
        """Test Pro mode has correct element limit (100)."""
        assert routes_service.PRO_MAX_ELEMENTS == 100
    
    # Validation Tests
    
    def test_empty_origins_raises_error(self, routes_service):
        """Test that empty origins raises ValueError."""
        with pytest.raises(ValueError, match="cannot be empty"):
            routes_service.compute_route_matrix([], [(-6.2, 106.8)])
    
    def test_empty_destinations_raises_error(self, routes_service):
        """Test that empty destinations raises ValueError."""
        with pytest.raises(ValueError, match="cannot be empty"):
            routes_service.compute_route_matrix([(-6.2, 106.8)], [])
    
    # Euclidean Distance Calculation Tests
    
    def test_euclidean_distance_same_point(self, routes_service):
        """Test Euclidean distance for same point is 0."""
        origin = (-6.2, 106.8)
        distance = routes_service._calculate_euclidean_distance(origin, origin)
        assert distance == 0
    
    def test_euclidean_distance_calculation(self, routes_service):
        """Test Euclidean distance calculation (Haversine formula)."""
        # Jakarta to Bogor (~60 km)
        jakarta = (-6.2, 106.8)
        bogor = (-6.6, 106.8)
        
        distance = routes_service._calculate_euclidean_distance(jakarta, bogor)
        
        # Should be approximately 44-45 km
        assert 40000 < distance < 50000
    
    # Cache Integration Tests
    
    def test_cache_hit_essentials_mode(self, routes_service, mock_cache_service):
        """Test that cache hit returns cached data (Essentials mode)."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        
        # Mock cache hit
        mock_cache_service.get_base_distance.return_value = 15000
        
        result = routes_service.compute_route_matrix(
            origins, destinations, use_traffic=False
        )
        
        assert result["distance_matrix"][0][0] == 15000
        assert result["duration_matrix"][0][0] == 900  # 15km at 60km/h = 15 min
        assert result["status"] == "OK"
        
        # Verify cache was checked
        mock_cache_service.get_base_distance.assert_called_once()
    
    def test_cache_hit_pro_mode(self, routes_service, mock_cache_service):
        """Test that cache hit returns cached data (Pro mode with traffic)."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        departure_time = datetime(2025, 11, 1, 8, 0)
        
        # Mock both Layer 1 and Layer 2 cache hits
        mock_cache_service.get_base_distance.return_value = 15000
        mock_cache_service.get_traffic_duration.return_value = 1800
        
        result = routes_service.compute_route_matrix(
            origins, destinations, use_traffic=True, departure_time=departure_time
        )
        
        assert result["distance_matrix"][0][0] == 15000
        assert result["duration_matrix"][0][0] == 1800
        assert result["status"] == "OK"
        
        # Verify both cache layers checked
        mock_cache_service.get_base_distance.assert_called_once()
        mock_cache_service.get_traffic_duration.assert_called_once()
    
    @patch('app.services.routes_api_service.requests.post')
    def test_cache_miss_calls_api(self, mock_post, routes_service, mock_cache_service):
        """Test that cache miss triggers API call."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        
        # Mock cache miss
        mock_cache_service.get_base_distance.return_value = None
        
        # Mock API response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = [
            {
                "originIndex": 0,
                "destinationIndex": 0,
                "distanceMeters": 15000,
                "duration": "900s",
                "status": "OK"
            }
        ]
        mock_post.return_value = mock_response
        
        result = routes_service.compute_route_matrix(
            origins, destinations, use_traffic=False
        )
        
        # Verify API was called
        mock_post.assert_called_once()
        
        # Verify result was cached
        mock_cache_service.set_base_distance.assert_called_once_with(
            origins[0], destinations[0], 15000
        )
    
    # Batching Tests
    
    def test_no_batching_under_limit(self, routes_service):
        """Test that requests under element limit don't trigger batching."""
        # 10 origins × 10 destinations = 100 elements (< 625)
        origins = [(-6.2 + i*0.01, 106.8) for i in range(10)]
        destinations = [(-6.3 + j*0.01, 106.9) for j in range(10)]
        
        with patch.object(routes_service, '_compute_single_request') as mock_single:
            with patch.object(routes_service, '_compute_with_batching') as mock_batch:
                mock_single.return_value = {
                    "distance_matrix": [[0]*10 for _ in range(10)],
                    "duration_matrix": [[0]*10 for _ in range(10)],
                    "status": "OK"
                }
                
                routes_service.compute_route_matrix(origins, destinations)
                
                # Single request should be called, not batching
                mock_single.assert_called_once()
                mock_batch.assert_not_called()
    
    def test_batching_over_limit_essentials(self, routes_service):
        """Test batching triggers for Essentials mode when over 625 elements."""
        # 30 origins × 30 destinations = 900 elements (> 625)
        origins = [(-6.2 + i*0.01, 106.8) for i in range(30)]
        destinations = [(-6.3 + j*0.01, 106.9) for j in range(30)]
        
        with patch.object(routes_service, '_compute_with_batching') as mock_batch:
            mock_batch.return_value = {
                "distance_matrix": [[0]*30 for _ in range(30)],
                "duration_matrix": [[0]*30 for _ in range(30)],
                "status": "OK"
            }
            
            routes_service.compute_route_matrix(
                origins, destinations, use_traffic=False
            )
            
            # Batching should be called
            mock_batch.assert_called_once()
            args = mock_batch.call_args[0]
            assert len(args[0]) == 30  # origins
            assert len(args[1]) == 30  # destinations
            assert args[4] == 625  # max_elements (Essentials)
    
    def test_batching_over_limit_pro(self, routes_service):
        """Test batching triggers for Pro mode when over 100 elements."""
        # 15 origins × 15 destinations = 225 elements (> 100)
        origins = [(-6.2 + i*0.01, 106.8) for i in range(15)]
        destinations = [(-6.3 + j*0.01, 106.9) for j in range(15)]
        
        with patch.object(routes_service, '_compute_with_batching') as mock_batch:
            mock_batch.return_value = {
                "distance_matrix": [[0]*15 for _ in range(15)],
                "duration_matrix": [[0]*15 for _ in range(15)],
                "status": "OK"
            }
            
            routes_service.compute_route_matrix(
                origins, destinations, use_traffic=True
            )
            
            # Batching should be called
            mock_batch.assert_called_once()
            args = mock_batch.call_args[0]
            assert args[4] == 100  # max_elements (Pro)
    
    # API Call Payload Tests
    
    @patch('app.services.routes_api_service.requests.post')
    def test_api_payload_essentials_mode(self, mock_post, routes_service, mock_cache_service):
        """Test API payload structure for Essentials mode."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        
        mock_cache_service.get_base_distance.return_value = None
        
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = []
        mock_post.return_value = mock_response
        
        routes_service.compute_route_matrix(origins, destinations, use_traffic=False)
        
        # Get the payload from the call
        call_args = mock_post.call_args
        payload = call_args[1]['json']
        
        # Verify payload structure
        assert payload['travelMode'] == 'DRIVE'
        assert payload['routingPreference'] == 'TRAFFIC_UNAWARE'
        assert len(payload['origins']) == 1
        assert len(payload['destinations']) == 1
        assert payload['origins'][0]['waypoint']['location']['latLng']['latitude'] == -6.2
        assert 'departureTime' not in payload  # No departure time for Essentials
    
    @patch('app.services.routes_api_service.requests.post')
    def test_api_payload_pro_mode(self, mock_post, routes_service, mock_cache_service):
        """Test API payload structure for Pro mode."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        departure_time = datetime(2025, 11, 1, 8, 0)
        
        mock_cache_service.get_base_distance.return_value = None
        
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = []
        mock_post.return_value = mock_response
        
        routes_service.compute_route_matrix(
            origins, destinations, use_traffic=True, departure_time=departure_time
        )
        
        payload = mock_post.call_args[1]['json']
        
        # Verify Pro mode specifics
        assert payload['routingPreference'] == 'TRAFFIC_AWARE'
        assert 'departureTime' in payload
        assert '2025-11-01' in payload['departureTime']
    
    # Error Handling Tests
    
    @patch('app.services.routes_api_service.requests.post')
    def test_api_error_fallback_to_euclidean(self, mock_post, routes_service, mock_cache_service):
        """Test that API error triggers fallback to Euclidean distance."""
        origins = [(-6.2, 106.8)]
        destinations = [(-6.3, 106.9)]
        
        mock_cache_service.get_base_distance.return_value = None
        
        # Mock API error
        mock_post.side_effect = Exception("API Error")
        
        result = routes_service.compute_route_matrix(origins, destinations)
        
        # Should fallback to Euclidean distance
        assert result["status"] == "FALLBACK"
        assert result["distance_matrix"][0][0] > 0  # Some distance calculated
        assert result["duration_matrix"][0][0] > 0


class TestRoutesAPIServiceIntegration:
    """Integration tests with real cache (optional - requires Redis)."""
    
    @pytest.fixture
    def service_with_real_cache(self):
        """Create service with real cache."""
        cache = CacheService()
        return RoutesAPIService(api_key="test-key", cache_service=cache)
    
    def test_cache_integration_workflow(self, service_with_real_cache):
        """Test complete cache workflow (if Redis available)."""
        cache = service_with_real_cache.cache_service
        
        if not cache.enabled:
            pytest.skip("Redis not available")
        
        # Clear cache
        cache.clear_cache(pattern="distance:*")
        cache.reset_stats()
        
        origin = (-6.2, 106.8)
        destination = (-6.3, 106.9)
        
        # First call: cache miss
        cache.get_base_distance(origin, destination)
        
        # Set cache
        cache.set_base_distance(origin, destination, 15000)
        
        # Second call: cache hit
        cached = cache.get_base_distance(origin, destination)
        
        assert cached == 15000
        
        stats = cache.get_cache_stats()
        assert stats["layer1"]["hits"] == 1
        assert stats["layer1"]["misses"] == 1


if __name__ == "__main__":
    """Run tests directly."""
    pytest.main([__file__, "-v", "-s"])
