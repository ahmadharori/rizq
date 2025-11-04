import api from './api';
import type { 
  AssignmentListResponse, 
  AssignmentFilters, 
  AssignmentDetail 
} from '@/types/assignment';

/**
 * Assignment Service
 * Handles API calls for assignment operations
 */

export interface CreateAssignmentRecipientRequest {
  recipient_id: string;
  sequence_order: number;
  distance_from_previous_meters?: number;
  duration_from_previous_seconds?: number;
}

export interface CreateAssignmentRequest {
  name: string;
  courier_id: string;
  route_data?: any;
  total_distance_meters?: number;
  total_duration_seconds?: number;
  recipients: CreateAssignmentRecipientRequest[];
}

export interface Assignment {
  id: string;
  name: string;
  courier_id: string;
  route_data?: any;
  total_distance_meters?: number;
  total_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface BulkAssignmentCreateRequest {
  assignments: CreateAssignmentRequest[];
}

/**
 * Create a single assignment with recipients
 */
export const createAssignment = async (
  data: CreateAssignmentRequest
): Promise<Assignment> => {
  const response = await api.post('/assignments', data);
  return response.data;
};

/**
 * Create multiple assignments at once (for Rekomendasi mode)
 */
export const createBulkAssignments = async (
  data: BulkAssignmentCreateRequest
): Promise<Assignment[]> => {
  const response = await api.post('/assignments/bulk', data);
  return response.data;
};

/**
 * Get paginated list of assignments with filters
 */
export const getAll = async (
  filters: AssignmentFilters & { page: number; per_page: number }
): Promise<AssignmentListResponse> => {
  const params = new URLSearchParams();
  params.append('page', filters.page.toString());
  params.append('per_page', filters.per_page.toString());
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  if (filters.courier_id) {
    params.append('courier_id', filters.courier_id);
  }
  
  params.append('sort_by', filters.sort_by);
  params.append('sort_order', filters.sort_order);
  
  const response = await api.get(`/assignments?${params.toString()}`);
  return response.data;
};

/**
 * Get assignment by ID with full details
 */
export const getDetail = async (id: string): Promise<AssignmentDetail> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data;
};

/**
 * Legacy: Get assignment by ID with recipients (kept for backward compatibility)
 */
export const getAssignment = async (id: string): Promise<Assignment> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data;
};

/**
 * Update assignment
 */
export const updateAssignment = async (
  assignmentId: string,
  data: {
    name?: string;
    recipients?: Array<{
      recipient_id: string;
      sequence_order: number;
      distance_from_previous_meters?: number;
      duration_from_previous_seconds?: number;
    }>;
    total_distance_meters?: number;
    total_duration_seconds?: number;
  }
): Promise<Assignment> => {
  const response = await api.put(`/assignments/${assignmentId}`, data);
  return response.data;
};

/**
 * Update single recipient status
 */
export const updateRecipientStatus = async (
  assignmentId: string,
  recipientId: string,
  status: string,
  notes?: string
): Promise<any> => {
  const response = await api.patch(
    `/assignments/${assignmentId}/recipients/${recipientId}/status`,
    { status, notes }
  );
  return response.data;
};

/**
 * Bulk update recipient status
 */
export const bulkUpdateRecipientStatus = async (
  assignmentId: string,
  recipientIds: string[],
  status: string,
  notes?: string
): Promise<any> => {
  const response = await api.patch(
    `/assignments/${assignmentId}/recipients/status/bulk`,
    { recipient_ids: recipientIds, status, notes }
  );
  return response.data;
};

/**
 * Get recipient status history
 */
export const getRecipientStatusHistory = async (
  assignmentId: string,
  recipientId: string
): Promise<{
  recipient_id: string;
  recipient_name: string;
  history: Array<{
    id: string;
    old_status: string | null;
    new_status: string;
    changed_by_username: string;
    changed_at: string;
  }>;
}> => {
  const response = await api.get(
    `/assignments/${assignmentId}/recipients/${recipientId}/history`
  );
  return response.data;
};

/**
 * Delete assignment
 */
export const deleteAssignment = async (
  assignmentId: string
): Promise<{ success: boolean; message: string; reverted_recipients_count: number }> => {
  const response = await api.delete(`/assignments/${assignmentId}`);
  return response.data;
};

export const assignmentService = {
  createAssignment,
  createBulkAssignments,
  getAll,
  getDetail,
  getAssignment,
  updateAssignment,
  updateRecipientStatus,
  bulkUpdateRecipientStatus,
  getRecipientStatusHistory,
  deleteAssignment
};
