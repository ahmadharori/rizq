"""
Distance Matrix Service using Google Distance Matrix API.
Provides distance and duration data for route optimization.
"""
import googlemaps
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class DistanceService:
    """Service for calculating distance matrices using Google Distance Matrix API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Distance Service with Google Maps client.
        
        Args:
            api_key: Google Maps API key (defaults to settings.GOOGLE_MAPS_API_KEY)
        """
        self.api_key = api_key or settings.GOOGLE_MAPS_API_KEY
        if not self.api_key:
            raise ValueError("Google Maps API key is required")
        
        self.client = googlemaps.Client(key=self.api_key)
    
    def get_distance_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        mode: str = "driving",
        traffic_model: str = "best_guess",
        departure_time: Optional[datetime] = None
    ) -> Dict[str, any]:
        """
        Get distance matrix from Google Distance Matrix API.
        
        Args:
            origins: List of (lat, lng) tuples for origin points
            destinations: List of (lat, lng) tuples for destination points
            mode: Travel mode ('driving', 'walking', 'bicycling', 'transit')
            traffic_model: Traffic model ('best_guess', 'pessimistic', 'optimistic')
            departure_time: Departure time for traffic calculation (defaults to now)
        
        Returns:
            Dict with distance_matrix (meters), duration_matrix (seconds), and status
        
        Raises:
            ValueError: If API request fails or returns invalid data
        """
        try:
            # Format coordinates as strings for API
            origins_str = [f"{lat},{lng}" for lat, lng in origins]
            destinations_str = [f"{lat},{lng}" for lat, lng in destinations]
            
            # Use current time if not specified (for real-time traffic)
            if departure_time is None:
                departure_time = "now"
            
            logger.info(f"Requesting distance matrix for {len(origins)} origins and {len(destinations)} destinations")
            
            # Call Google Distance Matrix API
            result = self.client.distance_matrix(
                origins=origins_str,
                destinations=destinations_str,
                mode=mode,
                departure_time=departure_time,
                traffic_model=traffic_model
            )
            
            # Validate response
            if result["status"] != "OK":
                raise ValueError(f"Distance Matrix API error: {result['status']}")
            
            # Parse response into matrices
            distance_matrix = []
            duration_matrix = []
            
            for i, row in enumerate(result["rows"]):
                distance_row = []
                duration_row = []
                
                for j, element in enumerate(row["elements"]):
                    if element["status"] != "OK":
                        logger.warning(f"Element [{i}][{j}] status: {element['status']}")
                        # Use large value for unreachable locations
                        distance_row.append(999999)
                        duration_row.append(999999)
                    else:
                        # Extract distance in meters and duration in seconds
                        distance_row.append(element["distance"]["value"])
                        duration_row.append(element["duration"]["value"])
                
                distance_matrix.append(distance_row)
                duration_matrix.append(duration_row)
            
            logger.info("Distance matrix retrieved successfully")
            
            return {
                "distance_matrix": distance_matrix,
                "duration_matrix": duration_matrix,
                "status": "OK"
            }
            
        except googlemaps.exceptions.ApiError as e:
            logger.error(f"Google Maps API error: {e}")
            raise ValueError(f"Google Maps API error: {e}")
        except Exception as e:
            logger.error(f"Error getting distance matrix: {e}")
            raise ValueError(f"Error getting distance matrix: {e}")
    
    def calculate_combined_cost_matrix(
        self,
        distance_matrix: List[List[int]],
        duration_matrix: List[List[int]],
        distance_weight: float = 0.5,
        duration_weight: float = 0.5
    ) -> List[List[int]]:
        """
        Combine distance and duration matrices into single cost matrix.
        
        Args:
            distance_matrix: Distance matrix in meters
            duration_matrix: Duration matrix in seconds
            distance_weight: Weight for distance (0.0 to 1.0)
            duration_weight: Weight for duration (0.0 to 1.0)
        
        Returns:
            Combined cost matrix (weighted sum, normalized)
        """
        if abs(distance_weight + duration_weight - 1.0) > 0.01:
            raise ValueError("Weights must sum to 1.0")
        
        n = len(distance_matrix)
        cost_matrix = []
        
        for i in range(n):
            cost_row = []
            for j in range(n):
                # Normalize and combine (distance in km, duration in minutes)
                distance_km = distance_matrix[i][j] / 1000.0
                duration_min = duration_matrix[i][j] / 60.0
                
                # Combined cost (scaled to integer for OR-Tools)
                combined_cost = int(
                    (distance_weight * distance_km * 100) +
                    (duration_weight * duration_min * 100)
                )
                
                cost_row.append(combined_cost)
            
            cost_matrix.append(cost_row)
        
        return cost_matrix
