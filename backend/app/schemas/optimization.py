"""
Schemas for optimization API endpoints.
Request and response models for TSP and CVRP optimization.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from uuid import UUID


class Location(BaseModel):
    """Geographic location coordinates."""
    lat: float = Field(..., description="Latitude", ge=-90, le=90)
    lng: float = Field(..., description="Longitude", ge=-180, le=180)
    
    class Config:
        json_schema_extra = {
            "example": {
                "lat": -6.200000,
                "lng": 106.816666
            }
        }


class TSPRequest(BaseModel):
    """Request model for TSP optimization."""
    recipient_ids: List[UUID] = Field(..., description="List of recipient UUIDs to visit", min_length=1)
    depot_location: Optional[Location] = Field(None, description="Depot location (optional, defaults to config)")
    timeout_seconds: Optional[int] = Field(None, description="Solver timeout in seconds", ge=1, le=300)
    
    @validator('recipient_ids')
    def validate_recipient_ids(cls, v):
        if len(v) < 1:
            raise ValueError('At least 1 recipient is required')
        if len(v) > 100:
            raise ValueError('Maximum 100 recipients allowed for TSP')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipient_ids": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "123e4567-e89b-12d3-a456-426614174001",
                    "123e4567-e89b-12d3-a456-426614174002"
                ],
                "depot_location": {
                    "lat": -6.200000,
                    "lng": 106.816666
                },
                "timeout_seconds": 5
            }
        }


class TSPResponse(BaseModel):
    """Response model for TSP optimization."""
    optimized_sequence: List[str] = Field(..., description="Optimized sequence of recipient IDs")
    total_distance_meters: int = Field(..., description="Total distance in meters")
    total_duration_seconds: int = Field(..., description="Total duration in seconds")
    num_stops: int = Field(..., description="Number of stops")
    
    class Config:
        json_schema_extra = {
            "example": {
                "optimized_sequence": [
                    "123e4567-e89b-12d3-a456-426614174001",
                    "123e4567-e89b-12d3-a456-426614174000",
                    "123e4567-e89b-12d3-a456-426614174002"
                ],
                "total_distance_meters": 15420,
                "total_duration_seconds": 2340,
                "num_stops": 3
            }
        }


class CVRPRequest(BaseModel):
    """Request model for CVRP optimization."""
    recipient_ids: List[UUID] = Field(..., description="List of recipient UUIDs to distribute", min_length=1)
    num_couriers: int = Field(..., description="Number of couriers available", ge=1, le=20)
    capacity_per_courier: int = Field(..., description="Maximum packages per courier", ge=1, le=100)
    depot_location: Optional[Location] = Field(None, description="Depot location (optional, defaults to config)")
    timeout_seconds: Optional[int] = Field(None, description="Solver timeout in seconds", ge=1, le=300)
    
    @validator('recipient_ids')
    def validate_recipient_ids(cls, v):
        if len(v) < 1:
            raise ValueError('At least 1 recipient is required')
        if len(v) > 200:
            raise ValueError('Maximum 200 recipients allowed for CVRP')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipient_ids": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "123e4567-e89b-12d3-a456-426614174001",
                    "123e4567-e89b-12d3-a456-426614174002",
                    "123e4567-e89b-12d3-a456-426614174003",
                    "123e4567-e89b-12d3-a456-426614174004"
                ],
                "num_couriers": 2,
                "capacity_per_courier": 20,
                "depot_location": {
                    "lat": -6.200000,
                    "lng": 106.816666
                },
                "timeout_seconds": 60
            }
        }


class RouteInfo(BaseModel):
    """Information about a single route in CVRP solution."""
    courier_index: int = Field(..., description="Courier index (0-based)")
    recipient_sequence: List[str] = Field(..., description="Sequence of recipient IDs for this courier")
    num_stops: int = Field(..., description="Number of stops in this route")
    total_load: int = Field(..., description="Total packages in this route")
    total_distance_meters: int = Field(..., description="Total distance in meters")
    total_duration_seconds: int = Field(..., description="Total duration in seconds")
    avg_distance_per_stop: float = Field(..., description="Average distance per stop in meters")
    efficiency_score: float = Field(..., description="Route efficiency score (0-100)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "courier_index": 0,
                "recipient_sequence": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "123e4567-e89b-12d3-a456-426614174001"
                ],
                "num_stops": 2,
                "total_load": 8,
                "total_distance_meters": 7500,
                "total_duration_seconds": 1200
            }
        }


class CVRPResponse(BaseModel):
    """Response model for CVRP optimization."""
    routes: List[RouteInfo] = Field(..., description="Optimized routes for each courier")
    num_routes: int = Field(..., description="Number of routes generated")
    total_distance_meters: int = Field(..., description="Total distance across all routes")
    total_duration_seconds: int = Field(..., description="Total duration across all routes")
    total_recipients: int = Field(..., description="Total number of recipients")
    
    # Route balance metrics
    route_balance_cv: float = Field(..., description="Route balance Coefficient of Variation (0-1, lower is better)")
    route_balance_status: str = Field(..., description="Balance status: Excellent/Good/Fair/Poor")
    avg_load_per_route: float = Field(..., description="Average load per route")
    max_load: int = Field(..., description="Maximum load in any route")
    min_load: int = Field(..., description="Minimum load in any route")
    
    class Config:
        json_schema_extra = {
            "example": {
                "routes": [
                    {
                        "courier_index": 0,
                        "recipient_sequence": [
                            "123e4567-e89b-12d3-a456-426614174000",
                            "123e4567-e89b-12d3-a456-426614174001"
                        ],
                        "num_stops": 2,
                        "total_load": 8,
                        "total_distance_meters": 7500,
                        "total_duration_seconds": 1200
                    },
                    {
                        "courier_index": 1,
                        "recipient_sequence": [
                            "123e4567-e89b-12d3-a456-426614174002",
                            "123e4567-e89b-12d3-a456-426614174003",
                            "123e4567-e89b-12d3-a456-426614174004"
                        ],
                        "num_stops": 3,
                        "total_load": 12,
                        "total_distance_meters": 9200,
                        "total_duration_seconds": 1580
                    }
                ],
                "num_routes": 2,
                "total_distance_meters": 16700,
                "total_duration_seconds": 2780,
                "total_recipients": 5
            }
        }


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "No solution found for CVRP. Try increasing capacity or number of couriers."
            }
        }
