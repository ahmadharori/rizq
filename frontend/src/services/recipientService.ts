/**
 * Recipient API Service
 * Handles all API calls related to recipients
 */

import api from './api';
import type {
  RecipientListResponse,
  Recipient,
  RecipientBase,
  RecipientFilters,
  RecipientStatusHistoryResponse
} from '@/types/recipient';

interface GetRecipientsParams extends RecipientFilters {
  page?: number;
  per_page?: number;
}

export const recipientService = {
  /**
   * Get paginated list of recipients with filters
   */
  getAll: async (params: GetRecipientsParams = {}): Promise<RecipientListResponse> => {
    const response = await api.get('/recipients', { params });
    return response.data;
  },

  /**
   * Get recipient detail by ID
   */
  getById: async (id: string): Promise<Recipient> => {
    const response = await api.get(`/recipients/${id}`);
    return response.data;
  },

  /**
   * Create new recipient
   */
  create: async (data: RecipientBase): Promise<Recipient> => {
    const response = await api.post('/recipients', data);
    return response.data;
  },

  /**
   * Update existing recipient
   */
  update: async (id: string, data: RecipientBase): Promise<Recipient> => {
    const response = await api.put(`/recipients/${id}`, data);
    return response.data;
  },

  /**
   * Soft delete single recipient
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/recipients/${id}`);
  },

  /**
   * Bulk soft delete recipients
   */
  bulkDelete: async (ids: string[]): Promise<{ deleted_count: number; message: string }> => {
    const response = await api.delete('/recipients/bulk/delete', {
      data: { ids }
    });
    return response.data;
  },

  /**
   * Get status history for a recipient
   */
  getHistory: async (id: string): Promise<RecipientStatusHistoryResponse> => {
    const response = await api.get(`/recipients/${id}/history`);
    return response.data;
  }
};
