/**
 * Statistics service for dashboard metrics API calls.
 */
import api from './api';
import type {
  OverviewStatsResponse,
  RecipientStatusDistribution,
  DeliveryTrendResponse,
  CourierPerformanceResponse,
  GeographicDistributionResponse,
  RealtimeTodayResponse,
} from '@/types/statistics';

const STATS_BASE_URL = '/stats';

export const statisticsService = {
  /**
   * Get overview statistics for dashboard cards.
   */
  getOverviewStats: async (): Promise<OverviewStatsResponse> => {
    const response = await api.get<OverviewStatsResponse>(
      `${STATS_BASE_URL}/overview`
    );
    return response.data;
  },

  /**
   * Get recipient status distribution for pie/donut chart.
   */
  getRecipientStatusDistribution: async (): Promise<RecipientStatusDistribution> => {
    const response = await api.get<RecipientStatusDistribution>(
      `${STATS_BASE_URL}/recipient-status`
    );
    return response.data;
  },

  /**
   * Get delivery trend over specified number of days.
   * @param days - Number of days (default: 7, range: 1-90)
   */
  getDeliveryTrend: async (days: number = 7): Promise<DeliveryTrendResponse> => {
    const response = await api.get<DeliveryTrendResponse>(
      `${STATS_BASE_URL}/delivery-trend`,
      { params: { days } }
    );
    return response.data;
  },

  /**
   * Get top courier performance ranking.
   * @param limit - Number of top couriers (default: 10, range: 1-50)
   */
  getCourierPerformance: async (
    limit: number = 10
  ): Promise<CourierPerformanceResponse> => {
    const response = await api.get<CourierPerformanceResponse>(
      `${STATS_BASE_URL}/courier-performance`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get geographic distribution of recipients by city.
   */
  getGeographicDistribution: async (): Promise<GeographicDistributionResponse> => {
    const response = await api.get<GeographicDistributionResponse>(
      `${STATS_BASE_URL}/geographic-distribution`
    );
    return response.data;
  },

  /**
   * Get real-time statistics for today.
   */
  getRealtimeToday: async (): Promise<RealtimeTodayResponse> => {
    const response = await api.get<RealtimeTodayResponse>(
      `${STATS_BASE_URL}/realtime-today`
    );
    return response.data;
  },
};
