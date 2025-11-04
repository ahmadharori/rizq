/**
 * Statistics types for dashboard metrics.
 */

export interface OverviewStatsResponse {
  total_recipients: number;
  status_breakdown: Record<string, number>;
  total_active_couriers: number;
  today_assignments: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface RecipientStatusDistribution {
  data: StatusDistributionItem[];
  total: number;
}

export interface DeliveryTrendItem {
  date: string;
  delivered: number;
  returned: number;
}

export interface DeliveryTrendResponse {
  data: DeliveryTrendItem[];
  period_days: number;
  total_delivered: number;
  total_returned: number;
}

export interface CourierPerformanceItem {
  courier_id: string;
  courier_name: string;
  total_delivered: number;
  total_assignments: number;
}

export interface CourierPerformanceResponse {
  data: CourierPerformanceItem[];
}

export interface GeographicDistributionItem {
  province_name: string;
  city_name: string;
  unassigned: number;
  assigned: number;
  delivery: number;
  done: number;
  return_count: number;
  total: number;
}

export interface GeographicDistributionResponse {
  data: GeographicDistributionItem[];
}

export interface RealtimeTodayResponse {
  in_delivery: number;
  completed_today: number;
  active_assignments: number;
  avg_delivery_time_minutes: number | null;
  completion_rate: number;
}
