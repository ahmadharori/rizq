/**
 * Region Service
 * API calls for fetching provinces and cities
 */

import api from './api';
import type { Province, City } from '@/types/region';

export const regionService = {
  /**
   * Get all provinces
   */
  getProvinces: async (): Promise<Province[]> => {
    const response = await api.get<Province[]>('/regions/provinces');
    return response.data;
  },

  /**
   * Get cities, optionally filtered by province
   */
  getCities: async (provinceId?: string): Promise<City[]> => {
    const params = provinceId ? { province_id: provinceId } : {};
    const response = await api.get<City[]>('/regions/cities', { params });
    return response.data;
  }
};
