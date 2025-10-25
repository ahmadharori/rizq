/**
 * Assignment Type Definitions
 */

export interface AssignmentListItem {
  id: string;
  name: string;
  courier_id: string;
  courier_name: string;
  total_recipients: number;
  total_distance_meters: number | null;
  total_duration_seconds: number | null;
  created_at: string;
}

export interface PaginationMetadata {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface AssignmentListResponse {
  items: AssignmentListItem[];
  pagination: PaginationMetadata;
}

export interface AssignmentFilters {
  search?: string;
  courier_id?: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface RecipientWithSequence {
  id: string;
  name: string;
  phone: string;
  address: string;
  num_packages: number;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  province: {
    id: number;
    name: string;
  };
  city: {
    id: number;
    name: string;
  };
  sequence_order: number;
  distance_from_previous_meters: number | null;
  duration_from_previous_seconds: number | null;
}

export interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentDetail {
  id: string;
  name: string;
  courier: CourierInfo;
  route_data: any | null;
  total_distance_meters: number | null;
  total_duration_seconds: number | null;
  recipients: RecipientWithSequence[];
  created_at: string;
  updated_at: string;
}
