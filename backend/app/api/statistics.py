"""
Statistics API endpoints for dashboard metrics.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.services.statistics_service import StatisticsService
from app.schemas.statistics import (
    OverviewStatsResponse,
    RecipientStatusDistribution,
    DeliveryTrendResponse,
    CourierPerformanceResponse,
    GeographicDistributionResponse,
    RealtimeTodayResponse,
)

router = APIRouter()


@router.get("/overview", response_model=OverviewStatsResponse)
def get_overview_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get overview statistics for dashboard cards.
    
    Returns:
    - Total recipients
    - Status breakdown
    - Total active couriers
    - Today's assignments count
    """
    service = StatisticsService(db)
    return service.get_overview_stats()


@router.get("/recipient-status", response_model=RecipientStatusDistribution)
def get_recipient_status_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get recipient status distribution for pie/donut chart.
    
    Returns distribution of recipients across all statuses with percentages.
    """
    service = StatisticsService(db)
    return service.get_recipient_status_distribution()


@router.get("/delivery-trend", response_model=DeliveryTrendResponse)
def get_delivery_trend(
    days: int = Query(7, ge=1, le=90, description="Number of days to retrieve (1-90)"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get delivery trend over specified number of days.
    
    Parameters:
    - days: Number of days to retrieve (default: 7, range: 1-90)
    
    Returns daily delivery and return counts.
    """
    service = StatisticsService(db)
    return service.get_delivery_trend(days=days)


@router.get("/courier-performance", response_model=CourierPerformanceResponse)
def get_courier_performance(
    limit: int = Query(10, ge=1, le=50, description="Number of top couriers (1-50)"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get top courier performance ranking.
    
    Parameters:
    - limit: Number of top couriers to retrieve (default: 10, range: 1-50)
    
    Returns couriers ranked by total packages delivered.
    """
    service = StatisticsService(db)
    return service.get_courier_performance(limit=limit)


@router.get("/geographic-distribution", response_model=GeographicDistributionResponse)
def get_geographic_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get geographic distribution of recipients by city.
    
    Returns recipient count breakdown by city and status.
    """
    service = StatisticsService(db)
    return service.get_geographic_distribution()


@router.get("/realtime-today", response_model=RealtimeTodayResponse)
def get_realtime_today(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get real-time statistics for today.
    
    Returns:
    - Packages currently in delivery
    - Packages completed today
    - Active assignments
    - Completion rate
    """
    service = StatisticsService(db)
    return service.get_realtime_today()
