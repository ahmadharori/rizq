import api from './api';
import type { PreviewAssignment } from '@/types/wizard';

// Request/Response types matching backend schemas
interface TSPRequest {
  recipient_ids: string[];
  depot_location?: { lat: number; lng: number };
  timeout_seconds?: number;
}

interface TSPResponse {
  optimized_sequence: string[];
  total_distance_meters: number;
  total_duration_seconds: number;
  num_stops: number;
}

interface CVRPRequest {
  recipient_ids: string[];
  num_couriers: number;
  capacity_per_courier: number;
  depot_location?: { lat: number; lng: number };
  timeout_seconds?: number;
}

interface RouteInfo {
  courier_index: number;
  recipient_sequence: string[];
  num_stops: number;
  total_load: number;
  total_distance_meters: number;
  total_duration_seconds: number;
  avg_distance_per_stop: number;
  efficiency_score: number;
}

interface CVRPResponse {
  routes: RouteInfo[];
  num_routes: number;
  total_distance_meters: number;
  total_duration_seconds: number;
  total_recipients: number;
  route_balance_cv: number;
  route_balance_status: string;
  avg_load_per_route: number;
  max_load: number;
  min_load: number;
}

/**
 * Run TSP optimization for a single group of recipients
 */
export const runTSP = async (
  recipientIds: string[],
  depotLocation?: { lat: number; lng: number }
): Promise<TSPResponse> => {
  const request: TSPRequest = {
    recipient_ids: recipientIds,
    timeout_seconds: 5,
  };

  if (depotLocation) {
    request.depot_location = depotLocation;
  }

  const response = await api.post<TSPResponse>('/optimize/tsp', request);
  return response.data;
};

/**
 * Run TSP for multiple manual groups
 * Returns PreviewAssignments with optimized sequences
 */
export const runTSPForGroups = async (
  groups: Array<{ id: string; name: string; recipientIds: string[]; courierId?: string }>,
  depotLocation?: { lat: number; lng: number }
): Promise<PreviewAssignment[]> => {

  // Run TSP for each group in parallel
  const promises = groups.map(async (group) => {
    if (group.recipientIds.length === 0) {
      return null;
    }

    try {
      const result = await runTSP(group.recipientIds, depotLocation);

      return {
        id: group.id,
        name: group.name,
        courierId: group.courierId || '',
        recipientIds: result.optimized_sequence,
        routeData: {
          totalDistanceMeters: result.total_distance_meters,
          totalDurationSeconds: result.total_duration_seconds,
        },
      };
    } catch (error) {
      console.error(`TSP failed for group ${group.name}:`, error);
      // Return unoptimized group on error
      return {
        id: group.id,
        name: group.name,
        courierId: group.courierId || '',
        recipientIds: group.recipientIds,
        routeData: undefined,
      };
    }
  });

  const results = await Promise.all(promises);

  // Filter out null results and return
  return results.filter((r): r is PreviewAssignment => r !== null);
};

/**
 * Run CVRP optimization for automatic courier assignment
 */
export const runCVRP = async (
  recipientIds: string[],
  numCouriers: number,
  capacityPerCourier: number,
  depotLocation?: { lat: number; lng: number }
): Promise<CVRPResponse> => {
  const request: CVRPRequest = {
    recipient_ids: recipientIds,
    num_couriers: numCouriers,
    capacity_per_courier: capacityPerCourier,
    timeout_seconds: 60,
  };

  if (depotLocation) {
    request.depot_location = depotLocation;
  }

  const response = await api.post<CVRPResponse>('/optimize/cvrp', request);
  return response.data;
};

/**
 * Convert CVRP response to PreviewAssignments
 */
export const convertCVRPToAssignments = (
  cvrpResponse: CVRPResponse,
  selectedCourierIds: string[]
): PreviewAssignment[] => {
  return cvrpResponse.routes.map((route, index) => {
    const courierId = selectedCourierIds[route.courier_index] || '';
    
    return {
      id: `preview-${Date.now()}-${index}`,
      name: `Rute ${index + 1}`,
      courierId,
      recipientIds: route.recipient_sequence,
      routeData: {
        totalDistanceMeters: route.total_distance_meters,
        totalDurationSeconds: route.total_duration_seconds,
      },
    };
  });
};

/**
 * Format distance for display (meters to km)
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format duration for display (seconds to hours/minutes)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate total packages for a set of recipient IDs
 */
export const calculateTotalPackages = (
  recipientIds: string[],
  recipients: Array<{ id: string; num_packages: number }>
): number => {
  return recipientIds.reduce((sum, id) => {
    const recipient = recipients.find(r => r.id === id);
    return sum + (recipient?.num_packages || 0);
  }, 0);
};

/**
 * Calculate leg-by-leg distance and duration for a sequential route
 * Uses Google Distance Matrix API via backend
 */
export const calculateRouteLegDistances = async (
  recipientIds: string[]
): Promise<Array<{ distanceMeters: number; durationSeconds: number }>> => {
  if (recipientIds.length === 0) {
    return [];
  }

  // Call backend distance matrix API
  const response = await api.post<{
    legs: Array<{
      distance_meters: number;
      duration_seconds: number;
    }>;
  }>('/optimize/distance-matrix-legs', {
    recipient_ids: recipientIds,
  });

  return response.data.legs.map(leg => ({
    distanceMeters: leg.distance_meters,
    durationSeconds: leg.duration_seconds,
  }));
};

const optimizationService = {
  runTSP,
  runTSPForGroups,
  runCVRP,
  convertCVRPToAssignments,
  calculateRouteLegDistances,
  formatDistance,
  formatDuration,
  calculateTotalPackages,
};

export default optimizationService;
