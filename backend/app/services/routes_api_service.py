"""
Google Routes API v2 Service for Route Optimization.
Implements Compute Route Matrix with 2-layer caching and batching.
"""
import requests
import logging
import time
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from app.config import settings
from app.utils.cache_service import CacheService

logger = logging.getLogger(__name__)


class RoutesAPIService:
    """
    Service for Google Routes API v2 (Compute Route Matrix).
    
    Supports:
    - Essentials mode (no traffic, 625 element limit)
    - Pro mode (with traffic, 100 element limit)
    - 2-layer caching via CacheService
    - Automatic batching for large requests
    """
    
    # API limits
    ESSENTIALS_MAX_ELEMENTS = 625  # No traffic
    PRO_MAX_ELEMENTS = 100         # With traffic
    
    # API endpoint
    BASE_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        cache_service: Optional[CacheService] = None
    ):
        """
        Initialize Routes API Service.
        
        Args:
            api_key: Google Maps API key (defaults to settings.GOOGLE_MAPS_API_KEY)
            cache_service: CacheService instance (creates new if None)
        """
        self.api_key = api_key or settings.GOOGLE_MAPS_API_KEY
        if not self.api_key:
            logger.warning("Google Maps API key not provided. Routes API calls will fail.")
        
        self.cache_service = cache_service or CacheService()
        self.timeout = settings.ROUTES_API_TIMEOUT
    
    def compute_route_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        use_traffic: bool = False,
        departure_time: Optional[datetime] = None
    ) -> Dict:
        """
        Compute route matrix using Google Routes API v2.
        
        Automatically handles:
        - Caching (Layer 1 for distance, Layer 2 for traffic duration)
        - Batching (if request exceeds element limits)
        - Fallback to Euclidean distance if API fails
        
        Args:
            origins: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            use_traffic: Whether to include traffic data (Pro mode)
            departure_time: Departure time for traffic calculation (defaults to now)
            
        Returns:
            Dict with distance_matrix and duration_matrix (in meters and seconds)
        """
        if not origins or not destinations:
            raise ValueError("origins and destinations cannot be empty")
        
        n_origins = len(origins)
        n_destinations = len(destinations)
        total_elements = n_origins * n_destinations
        
        # Determine max elements based on mode
        max_elements = self.PRO_MAX_ELEMENTS if use_traffic else self.ESSENTIALS_MAX_ELEMENTS
        
        logger.info(
            f"Computing route matrix: {n_origins} origins × {n_destinations} destinations "
            f"= {total_elements} elements (mode: {'Pro' if use_traffic else 'Essentials'}, "
            f"limit: {max_elements})"
        )
        
        # Check if batching is needed
        if total_elements > max_elements:
            logger.info(f"Total elements ({total_elements}) exceeds limit ({max_elements}). Using batching.")
            return self._compute_with_batching(
                origins, destinations, use_traffic, departure_time, max_elements
            )
        
        # Single request (no batching needed)
        return self._compute_single_request(
            origins, destinations, use_traffic, departure_time
        )
    
    def _compute_single_request(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        use_traffic: bool,
        departure_time: Optional[datetime]
    ) -> Dict:
        """
        Compute route matrix with single API request.
        Uses cache when available.
        
        Args:
            origins: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            use_traffic: Whether to include traffic
            departure_time: Departure time for traffic
            
        Returns:
            Dict with distance_matrix and duration_matrix
        """
        n_origins = len(origins)
        n_destinations = len(destinations)
        
        # Initialize result matrices
        distance_matrix = [[0] * n_destinations for _ in range(n_origins)]
        duration_matrix = [[0] * n_destinations for _ in range(n_origins)]
        
        # Track cache hits/misses
        cache_hits = 0
        cache_misses = []  # List of (i, j) indices that need API call
        
        # Check cache for each origin-destination pair
        for i, origin in enumerate(origins):
            for j, destination in enumerate(destinations):
                # Try Layer 1 cache (base distance)
                cached_distance = self.cache_service.get_base_distance(origin, destination)
                
                if use_traffic and cached_distance is not None:
                    # Try Layer 2 cache (traffic duration)
                    cached_duration = self.cache_service.get_traffic_duration(
                        origin, destination, departure_time
                    )
                    
                    if cached_duration is not None:
                        # Both distance and duration cached
                        distance_matrix[i][j] = cached_distance
                        duration_matrix[i][j] = cached_duration
                        cache_hits += 1
                    else:
                        # Only distance cached, need to fetch duration
                        cache_misses.append((i, j))
                elif cached_distance is not None and not use_traffic:
                    # Distance cached and traffic not needed
                    distance_matrix[i][j] = cached_distance
                    # Estimate duration from distance (60 km/h average)
                    duration_matrix[i][j] = int(cached_distance / 60000 * 3600)
                    cache_hits += 1
                else:
                    # Cache miss
                    cache_misses.append((i, j))
        
        if cache_hits > 0:
            logger.info(f"Cache hits: {cache_hits}/{n_origins * n_destinations} pairs")
        
        # If all pairs cached, return immediately
        if not cache_misses:
            logger.info("All pairs served from cache!")
            return {
                "distance_matrix": distance_matrix,
                "duration_matrix": duration_matrix,
                "status": "OK"
            }
        
        # Fetch missing pairs from Routes API
        logger.info(f"Fetching {len(cache_misses)} pairs from Routes API")
        
        try:
            # Call Routes API
            api_response = self._call_routes_api(
                origins, destinations, use_traffic, departure_time
            )
            
            # Parse response and update matrices
            for element in api_response:
                origin_idx = element.get("originIndex")
                dest_idx = element.get("destinationIndex")
                
                if element.get("status") == "OK":
                    distance = element.get("distanceMeters", 0)
                    duration_str = element.get("duration", "0s")
                    duration = int(duration_str.rstrip('s'))
                    
                    distance_matrix[origin_idx][dest_idx] = distance
                    duration_matrix[origin_idx][dest_idx] = duration
                    
                    # Cache the results
                    origin = origins[origin_idx]
                    destination = destinations[dest_idx]
                    
                    # Always cache base distance (Layer 1)
                    self.cache_service.set_base_distance(origin, destination, distance)
                    
                    # Cache traffic duration if Pro mode (Layer 2)
                    if use_traffic:
                        self.cache_service.set_traffic_duration(
                            origin, destination, duration, departure_time
                        )
                else:
                    # API error for this pair, use Euclidean fallback
                    logger.warning(
                        f"Routes API error for pair ({origin_idx}, {dest_idx}): "
                        f"{element.get('status')}"
                    )
                    distance = self._calculate_euclidean_distance(
                        origins[origin_idx], destinations[dest_idx]
                    )
                    distance_matrix[origin_idx][dest_idx] = distance
                    duration_matrix[origin_idx][dest_idx] = int(distance / 60000 * 3600)
            
            return {
                "distance_matrix": distance_matrix,
                "duration_matrix": duration_matrix,
                "status": "OK"
            }
            
        except Exception as e:
            logger.error(f"Routes API request failed: {e}")
            # Fallback to Euclidean distance for all missing pairs
            for i, j in cache_misses:
                distance = self._calculate_euclidean_distance(origins[i], destinations[j])
                distance_matrix[i][j] = distance
                duration_matrix[i][j] = int(distance / 60000 * 3600)
            
            return {
                "distance_matrix": distance_matrix,
                "duration_matrix": duration_matrix,
                "status": "FALLBACK"
            }
    
    def _call_routes_api(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        use_traffic: bool,
        departure_time: Optional[datetime]
    ) -> List[Dict]:
        """
        Call Google Routes API v2 (Compute Route Matrix).
        
        Args:
            origins: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            use_traffic: Whether to use traffic data
            departure_time: Departure time for traffic
            
        Returns:
            List of route matrix elements
        """
        # Build request payload
        payload = {
            "origins": [
                {
                    "waypoint": {
                        "location": {
                            "latLng": {
                                "latitude": lat,
                                "longitude": lng
                            }
                        }
                    }
                }
                for lat, lng in origins
            ],
            "destinations": [
                {
                    "waypoint": {
                        "location": {
                            "latLng": {
                                "latitude": lat,
                                "longitude": lng
                            }
                        }
                    }
                }
                for lat, lng in destinations
            ],
            "travelMode": "DRIVE"
        }
        
        # Set routing preference based on traffic mode
        if use_traffic:
            payload["routingPreference"] = "TRAFFIC_AWARE"
            # Set departure time (default to now)
            if departure_time is None:
                departure_time = datetime.now()
            payload["departureTime"] = departure_time.isoformat() + "Z"
        else:
            payload["routingPreference"] = "TRAFFIC_UNAWARE"
        
        # Headers
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status"
        }
        
        # Make API request
        logger.debug(f"Calling Routes API: {len(origins)} origins, {len(destinations)} destinations")
        
        response = requests.post(
            self.BASE_URL,
            json=payload,
            headers=headers,
            timeout=self.timeout
        )
        
        response.raise_for_status()
        
        # Parse response - Routes API returns array directly
        data = response.json()
        return data  # Already a list of route matrix elements
    
    def _compute_with_batching(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        use_traffic: bool,
        departure_time: Optional[datetime],
        max_elements: int
    ) -> Dict:
        """
        Compute route matrix with automatic batching.
        
        Args:
            origins: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            use_traffic: Whether to use traffic
            departure_time: Departure time for traffic
            max_elements: Maximum elements per batch
            
        Returns:
            Dict with complete distance_matrix and duration_matrix
        """
        n_origins = len(origins)
        n_destinations = len(destinations)
        
        # Initialize full result matrices
        full_distance_matrix = [[0] * n_destinations for _ in range(n_origins)]
        full_duration_matrix = [[0] * n_destinations for _ in range(n_origins)]
        
        # Calculate batch size
        # Strategy: Keep all origins, batch destinations
        max_dests_per_batch = max_elements // n_origins
        
        logger.info(f"Batching: {n_destinations} destinations into batches of {max_dests_per_batch}")
        
        # Process in batches
        for batch_start in range(0, n_destinations, max_dests_per_batch):
            batch_end = min(batch_start + max_dests_per_batch, n_destinations)
            dest_batch = destinations[batch_start:batch_end]
            
            logger.info(f"Processing batch: destinations [{batch_start}:{batch_end}]")
            
            # Compute this batch
            batch_result = self._compute_single_request(
                origins, dest_batch, use_traffic, departure_time
            )
            
            # Merge results into full matrices
            for i in range(n_origins):
                for j in range(len(dest_batch)):
                    full_distance_matrix[i][batch_start + j] = batch_result["distance_matrix"][i][j]
                    full_duration_matrix[i][batch_start + j] = batch_result["duration_matrix"][i][j]
            
            # Rate limiting: sleep between batches
            if batch_end < n_destinations:
                time.sleep(0.1)  # 100ms delay between batches
        
        logger.info("Batching complete!")
        
        return {
            "distance_matrix": full_distance_matrix,
            "duration_matrix": full_duration_matrix,
            "status": "OK"
        }
    
    def _calculate_euclidean_distance(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float]
    ) -> int:
        """
        Calculate Euclidean distance between two points (fallback).
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            
        Returns:
            Distance in meters
        """
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lng1 = origin
        lat2, lng2 = destination
        
        # Haversine formula
        R = 6371000  # Earth radius in meters
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lng = radians(lng2 - lng1)
        
        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return int(distance)
