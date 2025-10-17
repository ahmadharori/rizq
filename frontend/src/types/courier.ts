/**
 * Courier type definitions
 */

export interface Courier {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface CourierListItem {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface CourierCreate {
  name: string;
  phone: string;
}

export interface CourierUpdate {
  name: string;
  phone: string;
}

export interface CourierListResponse {
  items: CourierListItem[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface CourierListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: 'name' | 'phone' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkDeleteResponse {
  deleted_count: number;
}
