/**
 * Type definitions for Recipient domain
 */

export enum RecipientStatus {
  UNASSIGNED = 'Unassigned',
  ASSIGNED = 'Assigned',
  DELIVERY = 'Delivery',
  DONE = 'Done',
  RETURN = 'Return'
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Province {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  province_id: number;
}

export interface RecipientBase {
  name: string;
  phone: string;
  address: string;
  province_id: number;
  city_id: number;
  location: Location;
  num_packages: number;
}

export interface Recipient extends RecipientBase {
  id: string;
  status: RecipientStatus;
  province: Province;
  city: City;
  created_at: string;
  updated_at: string;
}

export interface RecipientListItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: RecipientStatus;
  province: Province;
  city: City;
  num_packages: number;
  location: Location;
}

export interface PaginationMetadata {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface RecipientListResponse {
  items: RecipientListItem[];
  pagination: PaginationMetadata;
}

export interface RecipientFilters {
  search?: string;
  status?: RecipientStatus;
  province_id?: number;
  city_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface StatusHistoryItem {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by_username: string | null;
}

export interface RecipientStatusHistoryResponse {
  recipient_id: string;
  history: StatusHistoryItem[];
}
