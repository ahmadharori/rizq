"""
Statistics service for dashboard metrics aggregation.
"""
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func, and_, case, cast, Date
from sqlalchemy.orm import Session

from app.models.recipient import Recipient, RecipientStatus
from app.models.courier import Courier
from app.models.assignment import Assignment, AssignmentRecipient, StatusHistory
from app.models.region import Province, City
from app.schemas.statistics import (
    OverviewStatsResponse,
    StatusDistributionItem,
    RecipientStatusDistribution,
    DeliveryTrendItem,
    DeliveryTrendResponse,
    CourierPerformanceItem,
    CourierPerformanceResponse,
    GeographicDistributionItem,
    GeographicDistributionResponse,
    RealtimeTodayResponse,
)


class StatisticsService:
    """Service for calculating dashboard statistics."""

    def __init__(self, db: Session):
        self.db = db

    def get_overview_stats(self) -> OverviewStatsResponse:
        """Get overview statistics for dashboard cards."""
        # Total recipients (excluding soft-deleted)
        total_recipients = (
            self.db.query(func.count(Recipient.id))
            .filter(Recipient.is_deleted == False)
            .scalar()
        ) or 0

        # Status breakdown
        status_counts = (
            self.db.query(Recipient.status, func.count(Recipient.id))
            .filter(Recipient.is_deleted == False)
            .group_by(Recipient.status)
            .all()
        )
        status_breakdown = {status: count for status, count in status_counts}

        # Ensure all statuses are present (even if count is 0)
        for status in RecipientStatus:
            if status.value not in status_breakdown:
                status_breakdown[status.value] = 0

        # Total active couriers
        total_active_couriers = (
            self.db.query(func.count(Courier.id))
            .filter(Courier.is_deleted == False)
            .scalar()
        ) or 0

        # Today's assignments
        today = date.today()
        today_assignments = (
            self.db.query(func.count(Assignment.id))
            .filter(
                and_(
                    func.date(Assignment.created_at) == today,
                    Assignment.is_deleted == False,
                )
            )
            .scalar()
        ) or 0

        return OverviewStatsResponse(
            total_recipients=total_recipients,
            status_breakdown=status_breakdown,
            total_active_couriers=total_active_couriers,
            today_assignments=today_assignments,
        )

    def get_recipient_status_distribution(self) -> RecipientStatusDistribution:
        """Get recipient status distribution for pie/donut chart."""
        # Get status counts
        status_counts = (
            self.db.query(Recipient.status, func.count(Recipient.id))
            .filter(Recipient.is_deleted == False)
            .group_by(Recipient.status)
            .all()
        )

        total = sum(count for _, count in status_counts)

        # Calculate percentages
        data = []
        for status, count in status_counts:
            percentage = (count / total * 100) if total > 0 else 0
            data.append(
                StatusDistributionItem(
                    status=status, count=count, percentage=round(percentage, 2)
                )
            )

        # Ensure all statuses are present
        existing_statuses = {item.status for item in data}
        for status in RecipientStatus:
            if status.value not in existing_statuses:
                data.append(
                    StatusDistributionItem(status=status.value, count=0, percentage=0.0)
                )

        return RecipientStatusDistribution(data=data, total=total)

    def get_delivery_trend(self, days: int = 7) -> DeliveryTrendResponse:
        """Get delivery trend over specified number of days."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        # Query status history for "Done" and "Return" transitions
        status_changes = (
            self.db.query(
                cast(StatusHistory.changed_at, Date).label("date"),
                StatusHistory.new_status,
                func.count(StatusHistory.id).label("count"),
            )
            .filter(
                and_(
                    cast(StatusHistory.changed_at, Date) >= start_date,
                    cast(StatusHistory.changed_at, Date) <= end_date,
                    StatusHistory.new_status.in_(
                        [RecipientStatus.DONE.value, RecipientStatus.RETURN.value]
                    ),
                )
            )
            .group_by(cast(StatusHistory.changed_at, Date), StatusHistory.new_status)
            .all()
        )

        # Build data structure with all dates in range
        date_data: Dict[str, Dict[str, int]] = {}
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            date_data[date_str] = {"delivered": 0, "returned": 0}
            current_date += timedelta(days=1)

        # Fill in actual data
        total_delivered = 0
        total_returned = 0
        for change_date, status, count in status_changes:
            date_str = change_date.strftime("%Y-%m-%d")
            if status == RecipientStatus.DONE.value:
                date_data[date_str]["delivered"] = count
                total_delivered += count
            elif status == RecipientStatus.RETURN.value:
                date_data[date_str]["returned"] = count
                total_returned += count

        # Convert to list of items
        data = [
            DeliveryTrendItem(
                date=date_str, delivered=values["delivered"], returned=values["returned"]
            )
            for date_str, values in sorted(date_data.items())
        ]

        return DeliveryTrendResponse(
            data=data,
            period_days=days,
            total_delivered=total_delivered,
            total_returned=total_returned,
        )

    def get_courier_performance(self, limit: int = 10) -> CourierPerformanceResponse:
        """Get top courier performance by packages delivered."""
        # Query to get courier performance
        performance = (
            self.db.query(
                Courier.id,
                Courier.name,
                func.count(AssignmentRecipient.id).label("total_delivered"),
                func.count(func.distinct(Assignment.id)).label("total_assignments"),
            )
            .join(Assignment, Assignment.courier_id == Courier.id)
            .join(
                AssignmentRecipient,
                AssignmentRecipient.assignment_id == Assignment.id,
            )
            .join(Recipient, Recipient.id == AssignmentRecipient.recipient_id)
            .filter(
                and_(
                    Courier.is_deleted == False,
                    Assignment.is_deleted == False,
                    Recipient.status == RecipientStatus.DONE.value,
                )
            )
            .group_by(Courier.id, Courier.name)
            .order_by(func.count(AssignmentRecipient.id).desc())
            .limit(limit)
            .all()
        )

        data = [
            CourierPerformanceItem(
                courier_id=str(courier_id),
                courier_name=courier_name,
                total_delivered=total_delivered,
                total_assignments=total_assignments,
            )
            for courier_id, courier_name, total_delivered, total_assignments in performance
        ]

        return CourierPerformanceResponse(data=data)

    def get_geographic_distribution(self) -> GeographicDistributionResponse:
        """Get geographic distribution of recipients by city."""
        # Query recipients grouped by city with status breakdown
        distribution = (
            self.db.query(
                Province.name.label("province_name"),
                City.name.label("city_name"),
                func.sum(
                    case((Recipient.status == RecipientStatus.UNASSIGNED.value, 1), else_=0)
                ).label("unassigned"),
                func.sum(
                    case((Recipient.status == RecipientStatus.ASSIGNED.value, 1), else_=0)
                ).label("assigned"),
                func.sum(
                    case((Recipient.status == RecipientStatus.DELIVERY.value, 1), else_=0)
                ).label("delivery"),
                func.sum(
                    case((Recipient.status == RecipientStatus.DONE.value, 1), else_=0)
                ).label("done"),
                func.sum(
                    case((Recipient.status == RecipientStatus.RETURN.value, 1), else_=0)
                ).label("return_count"),
                func.count(Recipient.id).label("total"),
            )
            .join(Province, Province.id == Recipient.province_id)
            .join(City, City.id == Recipient.city_id)
            .filter(Recipient.is_deleted == False)
            .group_by(Province.name, City.name)
            .order_by(func.count(Recipient.id).desc())
            .all()
        )

        data = [
            GeographicDistributionItem(
                province_name=province_name,
                city_name=city_name,
                unassigned=unassigned or 0,
                assigned=assigned or 0,
                delivery=delivery or 0,
                done=done or 0,
                return_count=return_count or 0,
                total=total or 0,
            )
            for (
                province_name,
                city_name,
                unassigned,
                assigned,
                delivery,
                done,
                return_count,
                total,
            ) in distribution
        ]

        return GeographicDistributionResponse(data=data)

    def get_realtime_today(self) -> RealtimeTodayResponse:
        """Get real-time statistics for today."""
        today = date.today()

        # Packages currently in delivery
        in_delivery = (
            self.db.query(func.count(Recipient.id))
            .filter(
                and_(
                    Recipient.status == RecipientStatus.DELIVERY.value,
                    Recipient.is_deleted == False,
                )
            )
            .scalar()
        ) or 0

        # Packages completed today (transitioned to "Done" today)
        completed_today = (
            self.db.query(func.count(func.distinct(StatusHistory.recipient_id)))
            .filter(
                and_(
                    func.date(StatusHistory.changed_at) == today,
                    StatusHistory.new_status == RecipientStatus.DONE.value,
                )
            )
            .scalar()
        ) or 0

        # Active assignments today
        active_assignments = (
            self.db.query(func.count(Assignment.id))
            .filter(
                and_(
                    func.date(Assignment.created_at) == today,
                    Assignment.is_deleted == False,
                )
            )
            .scalar()
        ) or 0

        # Calculate completion rate based on active packages
        # Total = packages in delivery + packages completed today
        total_today = in_delivery + completed_today
        completion_rate = (completed_today / total_today * 100) if total_today > 0 else 0.0

        # Average delivery time (simplified - time between assignment creation and completion)
        # This is a basic implementation; more sophisticated tracking would need additional fields
        avg_delivery_time = None  # Placeholder for now, can be enhanced later

        return RealtimeTodayResponse(
            in_delivery=in_delivery,
            completed_today=completed_today,
            active_assignments=active_assignments,
            avg_delivery_time_minutes=avg_delivery_time,
            completion_rate=round(completion_rate, 2),
        )
