"""
Optimization API endpoints for TSP and CVRP route optimization.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
import logging

from app.schemas.optimization import (
    TSPRequest, TSPResponse,
    CVRPRequest, CVRPResponse,
    ErrorResponse
)
from app.services.optimization_service import OptimizationService
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/optimize", tags=["optimization"])


class DistanceMatrixLegsRequest(BaseModel):
    """Request for leg-by-leg distance matrix calculation."""
    recipient_ids: List[UUID]


class DistanceMatrixLeg(BaseModel):
    """Single leg distance/duration."""
    distance_meters: int
    duration_seconds: int


class DistanceMatrixLegsResponse(BaseModel):
    """Response with sequential leg distances."""
    legs: List[DistanceMatrixLeg]


@router.post(
    "/tsp",
    response_model=TSPResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Optimization failed"}
    },
    summary="Solve TSP (Traveling Salesman Problem)",
    description="""
    Optimize route for a single courier using TSP algorithm.
    
    **Use Case**: Manual mode - when user has already grouped recipients
    and needs optimal visiting sequence.
    
    **Algorithm**: Google OR-Tools with GUIDED_LOCAL_SEARCH metaheuristic
    
    **Performance**: Target <5 seconds for up to 25 recipients
    """
)
async def optimize_tsp(
    request: TSPRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
) -> TSPResponse:
    """
    Solve Traveling Salesman Problem for single courier.
    
    Args:
        request: TSP request with recipient_ids and optional depot location
        current_user: Authenticated user (required)
    
    Returns:
        TSPResponse with optimized sequence and metrics
    
    Raises:
        HTTPException: If optimization fails or invalid input
    """
    try:
        logger.info(f"TSP request from user {current_user.username}: {len(request.recipient_ids)} recipients")
        
        # Extract depot location if provided
        depot_location = None
        if request.depot_location:
            depot_location = (request.depot_location.lat, request.depot_location.lng)
        
        # Create optimization service
        optimizer = OptimizationService()
        
        # Solve TSP
        result = optimizer.solve_tsp(
            recipient_ids=request.recipient_ids,
            depot_location=depot_location,
            timeout_seconds=request.timeout_seconds
        )
        
        logger.info(f"TSP solved successfully: {result['num_stops']} stops, {result['total_distance_meters']}m")
        
        return TSPResponse(**result)
        
    except ValueError as e:
        logger.error(f"TSP validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"TSP optimization failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post(
    "/cvrp",
    response_model=CVRPResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Optimization failed"}
    },
    summary="Solve CVRP (Capacitated Vehicle Routing Problem)",
    description="""
    Optimize route distribution for multiple couriers using CVRP algorithm.
    
    **Use Case**: Rekomendasi mode - when system automatically distributes
    recipients to couriers based on capacity constraints.
    
    **Algorithm**: Google OR-Tools with capacity constraints and GUIDED_LOCAL_SEARCH
    
    **Performance**: Target <60 seconds for up to 100 recipients
    
    **Constraints**:
    - Each courier has maximum capacity (packages)
    - All couriers start from depot
    - No return to depot required (Open VRP)
    """
)
async def optimize_cvrp(
    request: CVRPRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
) -> CVRPResponse:
    """
    Solve Capacitated Vehicle Routing Problem for multiple couriers.
    
    Args:
        request: CVRP request with recipient_ids, num_couriers, and capacity
        current_user: Authenticated user (required)
    
    Returns:
        CVRPResponse with optimized routes per courier and metrics
    
    Raises:
        HTTPException: If optimization fails or invalid input
    """
    try:
        logger.info(
            f"CVRP request from user {current_user.username}: "
            f"{len(request.recipient_ids)} recipients, "
            f"{request.num_couriers} couriers, "
            f"capacity {request.capacity_per_courier}"
        )
        
        # Extract depot location if provided
        depot_location = None
        if request.depot_location:
            depot_location = (request.depot_location.lat, request.depot_location.lng)
        
        # Create optimization service
        optimizer = OptimizationService()
        
        # Solve CVRP
        result = optimizer.solve_cvrp(
            recipient_ids=request.recipient_ids,
            num_couriers=request.num_couriers,
            capacity_per_courier=request.capacity_per_courier,
            depot_location=depot_location,
            timeout_seconds=request.timeout_seconds
        )
        
        logger.info(
            f"CVRP solved successfully: {result['num_routes']} routes, "
            f"{result['total_distance_meters']}m, "
            f"{result['total_duration_seconds']}s"
        )
        
        return CVRPResponse(**result)
        
    except ValueError as e:
        logger.error(f"CVRP validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"CVRP optimization failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post(
    "/distance-matrix-legs",
    response_model=DistanceMatrixLegsResponse,
    summary="Calculate leg-by-leg distances for sequential route"
)
async def calculate_distance_matrix_legs(
    request: DistanceMatrixLegsRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
) -> DistanceMatrixLegsResponse:
    """
    Calculate leg-by-leg distance and duration for a sequential route.
    
    Given a list of recipient IDs in order, calculates:
    - Distance from depot to first recipient
    - Distance from recipient[i] to recipient[i+1] for all sequential pairs
    
    Returns array of legs where:
    - legs[0] = depot → recipient[0]
    - legs[1] = recipient[0] → recipient[1]
    - legs[i] = recipient[i-1] → recipient[i]
    """
    try:
        service = OptimizationService()
        
        # Get recipient locations
        recipient_locations = service.get_recipient_locations(
            request.recipient_ids,
            db_session=db
        )
        
        # Build full locations list: [depot, recipient1, recipient2, ...]
        depot_location = (settings.DEPOT_LAT, settings.DEPOT_LNG)
        all_locations = [depot_location] + recipient_locations
        
        # Get distance matrix
        matrix_data = service.distance_service.get_distance_matrix(
            origins=all_locations,
            destinations=all_locations
        )
        
        # Extract sequential legs
        legs = []
        for i in range(len(request.recipient_ids)):
            # From depot (index 0) or previous recipient (index i) 
            # to current recipient (index i+1)
            from_idx = i
            to_idx = i + 1
            
            legs.append(DistanceMatrixLeg(
                distance_meters=matrix_data["distance_matrix"][from_idx][to_idx],
                duration_seconds=matrix_data["duration_matrix"][from_idx][to_idx]
            ))
        
        return DistanceMatrixLegsResponse(legs=legs)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Distance matrix calculation failed: {str(e)}"
        )
