"""
Redis Cache Service for Route Optimization.
Implements 2-layer caching strategy for cost efficiency.
"""
import redis
import json
import hashlib
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, time
from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """
    2-Layer Redis caching service for route optimization.
    
    Layer 1: Base Distance Cache (static, 30 days TTL)
    - Caches distance in meters between two points
    - Key format: distance:static:{hash}
    
    Layer 2: Traffic Duration Cache (dynamic, 15-60 min TTL)
    - Caches duration with traffic consideration
    - Key format: duration:traffic:{hash}
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize cache service.
        
        Args:
            redis_client: Optional Redis client instance (creates new if None)
        """
        self.redis_client = redis_client or self._create_redis_client()
        self.enabled = self._check_redis_connection()
        
        # Cache statistics
        self.stats = {
            "layer1_hits": 0,
            "layer1_misses": 0,
            "layer2_hits": 0,
            "layer2_misses": 0
        }
    
    def _create_redis_client(self) -> redis.Redis:
        """Create Redis client from settings."""
        try:
            # For Redis Cloud with SSL/TLS
            if settings.REDIS_SSL:
                client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    username=settings.REDIS_USERNAME if settings.REDIS_USERNAME else None,
                    password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                    db=settings.REDIS_DB,
                    ssl=True,
                    ssl_cert_reqs='none',  # String 'none' instead of None
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
            else:
                # For local Redis without SSL
                client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    username=settings.REDIS_USERNAME if settings.REDIS_USERNAME else None,
                    password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
            return client
        except Exception as e:
            logger.error(f"Failed to create Redis client: {e}")
            return None
    
    def _check_redis_connection(self) -> bool:
        """Check if Redis is available."""
        if not self.redis_client:
            logger.warning("Redis client not initialized. Caching disabled.")
            return False
        
        try:
            self.redis_client.ping()
            logger.info("Redis connection successful")
            return True
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
            return False
    
    def _generate_hash(self, *args) -> str:
        """
        Generate consistent hash from arguments.
        
        Args:
            *args: Variable arguments to hash
            
        Returns:
            SHA256 hash string
        """
        content = ":".join(str(arg) for arg in args)
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _get_time_bucket(self, dt: Optional[datetime] = None) -> str:
        """
        Get time bucket for traffic caching.
        
        Buckets:
        - peak_morning: 07:00-09:00
        - business: 09:00-17:00
        - peak_evening: 17:00-19:00
        - offpeak: 19:00-07:00
        
        Args:
            dt: Datetime to bucket (defaults to now)
            
        Returns:
            Time bucket string
        """
        if dt is None:
            dt = datetime.now()
        
        current_time = dt.time()
        
        if time(7, 0) <= current_time < time(9, 0):
            return "peak_morning"
        elif time(9, 0) <= current_time < time(17, 0):
            return "business"
        elif time(17, 0) <= current_time < time(19, 0):
            return "peak_evening"
        else:
            return "offpeak"
    
    def _get_dynamic_ttl(self, dt: Optional[datetime] = None) -> int:
        """
        Calculate dynamic TTL based on time of day.
        
        TTL values:
        - Peak hours (7-9am, 5-7pm): 15 minutes (900s)
        - Business hours (9am-5pm): 30 minutes (1800s)
        - Off-peak: 60 minutes (3600s)
        
        Args:
            dt: Datetime for TTL calculation (defaults to now)
            
        Returns:
            TTL in seconds
        """
        time_bucket = self._get_time_bucket(dt)
        
        ttl_map = {
            "peak_morning": 900,    # 15 min
            "peak_evening": 900,    # 15 min
            "business": 1800,       # 30 min
            "offpeak": 3600         # 60 min
        }
        
        return ttl_map.get(time_bucket, 1800)
    
    # Layer 1: Base Distance Cache (Static)
    
    def get_base_distance(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float]
    ) -> Optional[int]:
        """
        Get cached base distance between two points.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            
        Returns:
            Distance in meters, or None if not cached
        """
        if not self.enabled:
            return None
        
        try:
            key = f"distance:static:{self._generate_hash(origin, destination)}"
            value = self.redis_client.get(key)
            
            if value:
                self.stats["layer1_hits"] += 1
                return int(value)
            else:
                self.stats["layer1_misses"] += 1
                return None
        except Exception as e:
            logger.error(f"Error getting base distance from cache: {e}")
            return None
    
    def set_base_distance(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        distance_meters: int
    ) -> bool:
        """
        Cache base distance between two points.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            distance_meters: Distance in meters
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            key = f"distance:static:{self._generate_hash(origin, destination)}"
            ttl = 30 * 24 * 60 * 60  # 30 days
            self.redis_client.setex(key, ttl, distance_meters)
            return True
        except Exception as e:
            logger.error(f"Error setting base distance in cache: {e}")
            return False
    
    # Layer 2: Traffic Duration Cache (Dynamic)
    
    def get_traffic_duration(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        departure_time: Optional[datetime] = None
    ) -> Optional[int]:
        """
        Get cached traffic-aware duration.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            departure_time: Departure time (defaults to now)
            
        Returns:
            Duration in seconds, or None if not cached
        """
        if not self.enabled:
            return None
        
        try:
            if departure_time is None:
                departure_time = datetime.now()
            
            time_bucket = self._get_time_bucket(departure_time)
            day_of_week = departure_time.strftime("%A")  # Monday, Tuesday, etc.
            
            key = f"duration:traffic:{self._generate_hash(origin, destination, time_bucket, day_of_week)}"
            value = self.redis_client.get(key)
            
            if value:
                self.stats["layer2_hits"] += 1
                return int(value)
            else:
                self.stats["layer2_misses"] += 1
                return None
        except Exception as e:
            logger.error(f"Error getting traffic duration from cache: {e}")
            return None
    
    def set_traffic_duration(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        duration_seconds: int,
        departure_time: Optional[datetime] = None
    ) -> bool:
        """
        Cache traffic-aware duration with dynamic TTL.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            duration_seconds: Duration in seconds
            departure_time: Departure time (defaults to now)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            if departure_time is None:
                departure_time = datetime.now()
            
            time_bucket = self._get_time_bucket(departure_time)
            day_of_week = departure_time.strftime("%A")
            
            key = f"duration:traffic:{self._generate_hash(origin, destination, time_bucket, day_of_week)}"
            ttl = self._get_dynamic_ttl(departure_time)
            
            self.redis_client.setex(key, ttl, duration_seconds)
            return True
        except Exception as e:
            logger.error(f"Error setting traffic duration in cache: {e}")
            return False
    
    # Statistics
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dict with hit/miss rates and totals
        """
        layer1_total = self.stats["layer1_hits"] + self.stats["layer1_misses"]
        layer2_total = self.stats["layer2_hits"] + self.stats["layer2_misses"]
        
        layer1_hit_rate = (
            self.stats["layer1_hits"] / layer1_total * 100 
            if layer1_total > 0 else 0
        )
        layer2_hit_rate = (
            self.stats["layer2_hits"] / layer2_total * 100 
            if layer2_total > 0 else 0
        )
        
        return {
            "enabled": self.enabled,
            "layer1": {
                "hits": self.stats["layer1_hits"],
                "misses": self.stats["layer1_misses"],
                "total": layer1_total,
                "hit_rate": round(layer1_hit_rate, 2)
            },
            "layer2": {
                "hits": self.stats["layer2_hits"],
                "misses": self.stats["layer2_misses"],
                "total": layer2_total,
                "hit_rate": round(layer2_hit_rate, 2)
            }
        }
    
    def reset_stats(self):
        """Reset cache statistics."""
        self.stats = {
            "layer1_hits": 0,
            "layer1_misses": 0,
            "layer2_hits": 0,
            "layer2_misses": 0
        }
    
    def clear_cache(self, pattern: Optional[str] = None):
        """
        Clear cache entries.
        
        Args:
            pattern: Optional pattern to match keys (e.g., 'distance:*')
                    If None, clears all cache entries
        """
        if not self.enabled:
            logger.warning("Cannot clear cache: Redis not available")
            return
        
        try:
            if pattern:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                    logger.info(f"Cleared {len(keys)} cache entries matching '{pattern}'")
            else:
                self.redis_client.flushdb()
                logger.info("Cleared entire cache database")
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
