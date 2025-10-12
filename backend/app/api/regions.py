"""
Regions API
Endpoints for fetching provinces and cities data
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.region import Province, City
from app.schemas.region import RegionResponse

router = APIRouter()


@router.get("/provinces", response_model=List[RegionResponse])
async def get_provinces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all provinces (non-deleted only)
    
    Returns:
        List of provinces with id and name
    """
    provinces = db.query(Province).filter(
        Province.is_deleted == False
    ).order_by(Province.name).all()
    
    return provinces


@router.get("/cities", response_model=List[RegionResponse])
async def get_cities(
    province_id: Optional[int] = Query(None, description="Filter cities by province ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all cities, optionally filtered by province
    
    Args:
        province_id: Optional province ID to filter cities
        
    Returns:
        List of cities with id and name
    """
    query = db.query(City).filter(City.is_deleted == False)
    
    if province_id:
        query = query.filter(City.province_id == province_id)
    
    cities = query.order_by(City.name).all()
    
    return cities
