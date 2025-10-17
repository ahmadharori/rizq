/**
 * Courier API service
 * Handles all courier-related API calls
 */
import api from './api';
import type {
  Courier,
  CourierListResponse,
  CourierListParams,
  CourierCreate,
  CourierUpdate,
  BulkDeleteRequest,
  BulkDeleteResponse,
} from '@/types/courier';

/**
 * Get list of couriers with pagination and filters
 */
export const getCouriers = async (params: CourierListParams = {}): Promise<CourierListResponse> => {
  const response = await api.get('/couriers', { params });
  return response.data;
};

/**
 * Get a single courier by ID
 */
export const getCourier = async (id: string): Promise<Courier> => {
  const response = await api.get(`/couriers/${id}`);
  return response.data;
};

/**
 * Create a new courier
 */
export const createCourier = async (data: CourierCreate): Promise<Courier> => {
  const response = await api.post('/couriers', data);
  return response.data;
};

/**
 * Update an existing courier
 */
export const updateCourier = async (id: string, data: CourierUpdate): Promise<Courier> => {
  const response = await api.put(`/couriers/${id}`, data);
  return response.data;
};

/**
 * Delete a courier (soft delete)
 */
export const deleteCourier = async (id: string): Promise<void> => {
  await api.delete(`/couriers/${id}`);
};

/**
 * Bulk delete couriers (soft delete)
 */
export const bulkDeleteCouriers = async (data: BulkDeleteRequest): Promise<BulkDeleteResponse> => {
  const response = await api.delete('/couriers/bulk/delete', { data });
  return response.data;
};
