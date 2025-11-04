"""
Unit tests for CacheService (2-layer Redis caching).
"""
import pytest
from datetime import datetime, time, timedelta
from unittest.mock import Mock, patch
from app.utils.cache_service import CacheService


class TestCacheService:
    """Test CacheService functionality."""
    
    @pytest.fixture
    def cache_service(self):
        """Create CacheService instance for testing."""
        return CacheService()
    
    @pytest.fixture
    def mock_redis(self):
        """Create mock Redis client."""
        mock = Mock()
        mock.ping.return_value = True
        return mock
    
    def test_redis_connection_success(self, cache_service):
        """Test Redis connection is successful."""
        assert cache_service.enabled is True
        assert cache_service.redis_client is not None
    
    def test_hash_generation_consistency(self, cache_service):
        """Test hash generation is consistent."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        hash1 = cache_service._generate_hash(origin, dest)
        hash2 = cache_service._generate_hash(origin, dest)
        
        assert hash1 == hash2
        assert len(hash1) == 16
    
    def test_time_bucket_peak_morning(self, cache_service):
        """Test time bucket calculation for peak morning."""
        dt = datetime(2025, 11, 1, 8, 0)  # 8 AM
        bucket = cache_service._get_time_bucket(dt)
        assert bucket == "peak_morning"
    
    def test_time_bucket_business_hours(self, cache_service):
        """Test time bucket calculation for business hours."""
        dt = datetime(2025, 11, 1, 14, 0)  # 2 PM
        bucket = cache_service._get_time_bucket(dt)
        assert bucket == "business"
    
    def test_time_bucket_peak_evening(self, cache_service):
        """Test time bucket calculation for peak evening."""
        dt = datetime(2025, 11, 1, 18, 0)  # 6 PM
        bucket = cache_service._get_time_bucket(dt)
        assert bucket == "peak_evening"
    
    def test_time_bucket_offpeak(self, cache_service):
        """Test time bucket calculation for off-peak."""
        dt = datetime(2025, 11, 1, 22, 0)  # 10 PM
        bucket = cache_service._get_time_bucket(dt)
        assert bucket == "offpeak"
    
    def test_dynamic_ttl_peak_hours(self, cache_service):
        """Test dynamic TTL for peak hours (15 min)."""
        dt = datetime(2025, 11, 1, 8, 0)  # Peak morning
        ttl = cache_service._get_dynamic_ttl(dt)
        assert ttl == 900  # 15 minutes
    
    def test_dynamic_ttl_business_hours(self, cache_service):
        """Test dynamic TTL for business hours (30 min)."""
        dt = datetime(2025, 11, 1, 12, 0)  # Business hours
        ttl = cache_service._get_dynamic_ttl(dt)
        assert ttl == 1800  # 30 minutes
    
    def test_dynamic_ttl_offpeak(self, cache_service):
        """Test dynamic TTL for off-peak (60 min)."""
        dt = datetime(2025, 11, 1, 22, 0)  # Off-peak
        ttl = cache_service._get_dynamic_ttl(dt)
        assert ttl == 3600  # 60 minutes
    
    # Layer 1: Base Distance Cache Tests
    
    def test_layer1_set_and_get_base_distance(self, cache_service):
        """Test setting and getting base distance (Layer 1)."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        distance = 15000  # 15 km
        
        # Set distance
        success = cache_service.set_base_distance(origin, dest, distance)
        assert success is True
        
        # Get distance
        cached_distance = cache_service.get_base_distance(origin, dest)
        assert cached_distance == distance
    
    def test_layer1_cache_miss(self, cache_service):
        """Test Layer 1 cache miss."""
        origin = (-6.2, 106.8)
        dest = (-6.999, 107.999)  # Non-existent location
        
        result = cache_service.get_base_distance(origin, dest)
        assert result is None
    
    def test_layer1_bidirectional_caching(self, cache_service):
        """Test that origin-dest and dest-origin have different cache keys."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        cache_service.set_base_distance(origin, dest, 15000)
        
        # Different direction should have different hash
        reverse = cache_service.get_base_distance(dest, origin)
        assert reverse is None  # Should not be cached
    
    # Layer 2: Traffic Duration Cache Tests
    
    def test_layer2_set_and_get_traffic_duration(self, cache_service):
        """Test setting and getting traffic duration (Layer 2)."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        duration = 1800  # 30 minutes
        departure_time = datetime(2025, 11, 1, 8, 0)  # Friday 8 AM
        
        # Set duration
        success = cache_service.set_traffic_duration(
            origin, dest, duration, departure_time
        )
        assert success is True
        
        # Get duration
        cached_duration = cache_service.get_traffic_duration(
            origin, dest, departure_time
        )
        assert cached_duration == duration
    
    def test_layer2_different_time_buckets(self, cache_service):
        """Test that different time buckets have separate cache entries."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        # Set for morning
        morning_time = datetime(2025, 11, 1, 8, 0)
        cache_service.set_traffic_duration(origin, dest, 2000, morning_time)
        
        # Try to get for evening (different bucket)
        evening_time = datetime(2025, 11, 1, 18, 0)
        result = cache_service.get_traffic_duration(origin, dest, evening_time)
        
        assert result is None  # Should be cache miss (different bucket)
    
    def test_layer2_different_days_of_week(self, cache_service):
        """Test that different days of week have separate cache entries."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        # Set for Friday
        friday = datetime(2025, 10, 31, 8, 0)  # Friday
        cache_service.set_traffic_duration(origin, dest, 2000, friday)
        
        # Try to get for Monday (same time bucket, different day)
        monday = datetime(2025, 11, 3, 8, 0)  # Monday
        result = cache_service.get_traffic_duration(origin, dest, monday)
        
        assert result is None  # Should be cache miss (different day)
    
    # Statistics Tests
    
    def test_cache_stats_tracking(self, cache_service):
        """Test cache statistics tracking."""
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        # Reset stats
        cache_service.reset_stats()
        
        # Layer 1: 1 miss, then 1 hit
        cache_service.get_base_distance(origin, dest)  # Miss
        cache_service.set_base_distance(origin, dest, 15000)
        cache_service.get_base_distance(origin, dest)  # Hit
        
        stats = cache_service.get_cache_stats()
        
        assert stats["layer1"]["hits"] == 1
        assert stats["layer1"]["misses"] == 1
        assert stats["layer1"]["total"] == 2
        assert stats["layer1"]["hit_rate"] == 50.0
    
    def test_cache_stats_hit_rate_calculation(self, cache_service):
        """Test hit rate calculation."""
        cache_service.reset_stats()
        
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        # Set distance
        cache_service.set_base_distance(origin, dest, 15000)
        
        # 3 hits
        for _ in range(3):
            cache_service.get_base_distance(origin, dest)
        
        stats = cache_service.get_cache_stats()
        
        assert stats["layer1"]["hits"] == 3
        assert stats["layer1"]["misses"] == 0
        assert stats["layer1"]["hit_rate"] == 100.0
    
    # Clear Cache Tests
    
    def test_clear_cache_pattern(self, cache_service):
        """Test clearing cache with pattern."""
        origin1 = (-6.2, 106.8)
        dest1 = (-6.3, 106.9)
        
        # Set some cache entries
        cache_service.set_base_distance(origin1, dest1, 15000)
        
        # Clear with pattern
        cache_service.clear_cache(pattern="distance:*")
        
        # Should be cleared
        result = cache_service.get_base_distance(origin1, dest1)
        assert result is None
    
    # Graceful Fallback Tests
    
    def test_disabled_cache_returns_none(self):
        """Test that disabled cache returns None gracefully."""
        # Create cache with mock Redis that fails ping
        mock_redis = Mock()
        mock_redis.ping.side_effect = Exception("Connection failed")
        
        cache = CacheService(redis_client=mock_redis)
        
        assert cache.enabled is False
        
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        
        # Should return None gracefully
        result = cache.get_base_distance(origin, dest)
        assert result is None
        
        # Set should return False
        success = cache.set_base_distance(origin, dest, 15000)
        assert success is False


class TestCacheServiceIntegration:
    """Integration tests with real Redis connection."""
    
    @pytest.fixture
    def cache_service(self):
        """Create real CacheService instance."""
        return CacheService()
    
    def test_real_redis_connection(self, cache_service):
        """Test real Redis connection with cloud instance."""
        assert cache_service.enabled is True
        print(f"\n✅ Redis connection successful!")
        print(f"   Host: {cache_service.redis_client.connection_pool.connection_kwargs.get('host')}")
        print(f"   Port: {cache_service.redis_client.connection_pool.connection_kwargs.get('port')}")
    
    def test_full_layer1_workflow(self, cache_service):
        """Test complete Layer 1 workflow with real Redis."""
        if not cache_service.enabled:
            pytest.skip("Redis not available")
        
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        distance = 15000
        
        # Clear any existing cache
        cache_service.clear_cache(pattern="distance:*")
        cache_service.reset_stats()
        
        # First get (miss)
        result = cache_service.get_base_distance(origin, dest)
        assert result is None
        
        # Set
        success = cache_service.set_base_distance(origin, dest, distance)
        assert success is True
        
        # Second get (hit)
        result = cache_service.get_base_distance(origin, dest)
        assert result == distance
        
        # Check stats
        stats = cache_service.get_cache_stats()
        assert stats["layer1"]["hits"] == 1
        assert stats["layer1"]["misses"] == 1
        
        print(f"\n✅ Layer 1 cache workflow successful!")
        print(f"   Stats: {stats['layer1']}")
    
    def test_full_layer2_workflow(self, cache_service):
        """Test complete Layer 2 workflow with real Redis."""
        if not cache_service.enabled:
            pytest.skip("Redis not available")
        
        origin = (-6.2, 106.8)
        dest = (-6.3, 106.9)
        duration = 1800
        departure_time = datetime.now()
        
        # Clear any existing cache
        cache_service.clear_cache(pattern="duration:*")
        cache_service.reset_stats()
        
        # First get (miss)
        result = cache_service.get_traffic_duration(origin, dest, departure_time)
        assert result is None
        
        # Set
        success = cache_service.set_traffic_duration(
            origin, dest, duration, departure_time
        )
        assert success is True
        
        # Second get (hit)
        result = cache_service.get_traffic_duration(origin, dest, departure_time)
        assert result == duration
        
        # Check stats
        stats = cache_service.get_cache_stats()
        assert stats["layer2"]["hits"] == 1
        assert stats["layer2"]["misses"] == 1
        
        print(f"\n✅ Layer 2 cache workflow successful!")
        print(f"   Stats: {stats['layer2']}")
        print(f"   Time bucket: {cache_service._get_time_bucket(departure_time)}")
        print(f"   TTL: {cache_service._get_dynamic_ttl(departure_time)} seconds")


if __name__ == "__main__":
    """Run tests directly."""
    pytest.main([__file__, "-v", "-s"])
