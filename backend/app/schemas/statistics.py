"""
Statistics schemas for dashboard metrics.
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class OverviewStatsResponse(BaseModel):
    """Overview statistics for dashboard cards."""
    total_recipients: int = Field(..., description="Total number of recipients")
    status_breakdown: Dict[str, int] = Field(..., description="Recipient count by status")
    total_active_couriers: int = Field(..., description="Number of active couriers")
    today_assignments: int = Field(..., description="Number of assignments created today")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_recipients": 150,
                "status_breakdown": {
                    "Unassigned": 30,
                    "Assigned": 50,
                    "Delivery": 40,
                    "Done": 25,
                    "Return": 5
                },
                "total_active_couriers": 12,
                "today_assignments": 8
            }
        }


class StatusDistributionItem(BaseModel):
    """Single status distribution item."""
    status: str = Field(..., description="Status name")
    count: int = Field(..., description="Number of recipients with this status")
    percentage: float = Field(..., description="Percentage of total")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "Done",
                "count": 25,
                "percentage": 16.67
            }
        }


class RecipientStatusDistribution(BaseModel):
    """Recipient status distribution for pie/donut chart."""
    data: List[StatusDistributionItem] = Field(..., description="Status distribution data")
    total: int = Field(..., description="Total number of recipients")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"status": "Unassigned", "count": 30, "percentage": 20.0},
                    {"status": "Assigned", "count": 50, "percentage": 33.33},
                    {"status": "Delivery", "count": 40, "percentage": 26.67},
                    {"status": "Done", "count": 25, "percentage": 16.67},
                    {"status": "Return", "count": 5, "percentage": 3.33}
                ],
                "total": 150
            }
        }


class DeliveryTrendItem(BaseModel):
    """Single day delivery trend data."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    delivered: int = Field(..., description="Number of packages delivered")
    returned: int = Field(..., description="Number of packages returned")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2025-01-01",
                "delivered": 45,
                "returned": 3
            }
        }


class DeliveryTrendResponse(BaseModel):
    """Delivery trend over time for line/area chart."""
    data: List[DeliveryTrendItem] = Field(..., description="Daily delivery data")
    period_days: int = Field(..., description="Number of days in the period")
    total_delivered: int = Field(..., description="Total delivered in period")
    total_returned: int = Field(..., description="Total returned in period")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"date": "2025-01-01", "delivered": 45, "returned": 3},
                    {"date": "2025-01-02", "delivered": 52, "returned": 2},
                    {"date": "2025-01-03", "delivered": 48, "returned": 1}
                ],
                "period_days": 7,
                "total_delivered": 315,
                "total_returned": 12
            }
        }


class CourierPerformanceItem(BaseModel):
    """Single courier performance data."""
    courier_id: str = Field(..., description="Courier UUID")
    courier_name: str = Field(..., description="Courier name")
    total_delivered: int = Field(..., description="Total packages delivered")
    total_assignments: int = Field(..., description="Number of assignments completed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "courier_id": "123e4567-e89b-12d3-a456-426614174000",
                "courier_name": "Budi Santoso",
                "total_delivered": 85,
                "total_assignments": 12
            }
        }


class CourierPerformanceResponse(BaseModel):
    """Courier performance ranking for bar chart."""
    data: List[CourierPerformanceItem] = Field(..., description="Courier performance data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "courier_id": "123e4567-e89b-12d3-a456-426614174000",
                        "courier_name": "Budi Santoso",
                        "total_delivered": 85,
                        "total_assignments": 12
                    },
                    {
                        "courier_id": "223e4567-e89b-12d3-a456-426614174001",
                        "courier_name": "Ahmad Rizki",
                        "total_delivered": 78,
                        "total_assignments": 10
                    }
                ]
            }
        }


class GeographicDistributionItem(BaseModel):
    """Single geographic distribution item."""
    province_name: str = Field(..., description="Province name")
    city_name: str = Field(..., description="City name")
    unassigned: int = Field(0, description="Count of unassigned recipients")
    assigned: int = Field(0, description="Count of assigned recipients")
    delivery: int = Field(0, description="Count of in-delivery recipients")
    done: int = Field(0, description="Count of completed recipients")
    return_count: int = Field(0, description="Count of returned recipients")
    total: int = Field(..., description="Total recipients in this city")
    
    class Config:
        json_schema_extra = {
            "example": {
                "province_name": "DKI Jakarta",
                "city_name": "Jakarta Selatan",
                "unassigned": 10,
                "assigned": 20,
                "delivery": 15,
                "done": 30,
                "return_count": 2,
                "total": 77
            }
        }


class GeographicDistributionResponse(BaseModel):
    """Geographic distribution by city for stacked bar chart."""
    data: List[GeographicDistributionItem] = Field(..., description="Geographic distribution data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "province_name": "DKI Jakarta",
                        "city_name": "Jakarta Selatan",
                        "unassigned": 10,
                        "assigned": 20,
                        "delivery": 15,
                        "done": 30,
                        "return_count": 2,
                        "total": 77
                    }
                ]
            }
        }


class RealtimeTodayResponse(BaseModel):
    """Real-time statistics for today."""
    in_delivery: int = Field(..., description="Packages currently in delivery")
    completed_today: int = Field(..., description="Packages completed today")
    active_assignments: int = Field(..., description="Active assignments today")
    avg_delivery_time_minutes: Optional[float] = Field(None, description="Average delivery time per package")
    completion_rate: float = Field(..., description="Completion rate percentage (0-100)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "in_delivery": 35,
                "completed_today": 42,
                "active_assignments": 8,
                "avg_delivery_time_minutes": 25.5,
                "completion_rate": 54.55
            }
        }
