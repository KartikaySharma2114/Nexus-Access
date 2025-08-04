import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Association {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  role?: {
    id: string;
    name: string;
  };
  permission?: {
    id: string;
    name: string;
    resource: string;
    action: string;
  };
}

export interface AssociationFilters {
  roleId?: string;
  permissionId?: string;
}

// Query keys for consistent cache management
export const associationKeys = {
  all: ['associations'] as const,
  lists: () => [...associationKeys.all, 'list'] as const,
  list: (filters: AssociationFilters) =>
    [...associationKeys.lists(), filters] as const,
  matrix: () => [...associationKeys.all, 'matrix'] as const,
};

// Fetch associations with optional filters
export function useAssociations(filters: AssociationFilters = {}) {
  return useQuery({
    queryKey: associationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.roleId) params.append('roleId', filters.roleId);
      if (filters.permissionId)
        params.append('permissionId', filters.permissionId);

      const queryString = params.toString();
      const endpoint = queryString
        ? `/associations?${queryString}`
        : '/associations';

      return apiClient.get<{ associations: Association[]; total: number }>(
        endpoint
      );
    },
    staleTime: 1 * 60 * 1000, // 1 minute (associations change frequently)
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Fetch role-permission matrix for visualization
export function useAssociationMatrix() {
  return useQuery({
    queryKey: associationKeys.matrix(),
    queryFn: () =>
      apiClient.get<{
        roles: Array<{ id: string; name: string }>;
        permissions: Array<{
          id: string;
          name: string;
          resource: string;
          action: string;
        }>;
        associations: Array<{ role_id: string; permission_id: string }>;
      }>('/matrix'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create association mutation
export function useCreateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { role_id: string; permission_id: string }) =>
      apiClient.post<Association>('/associations', data),
    onSuccess: () => {
      // Invalidate associations and matrix data
      queryClient.invalidateQueries({ queryKey: associationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: associationKeys.matrix() });
    },
  });
}

// Delete association mutation
export function useDeleteAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { role_id: string; permission_id: string }) =>
      apiClient.delete(
        `/associations?role_id=${data.role_id}&permission_id=${data.permission_id}`
      ),
    onSuccess: () => {
      // Invalidate associations and matrix data
      queryClient.invalidateQueries({ queryKey: associationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: associationKeys.matrix() });
    },
  });
}

// Bulk create associations mutation
export function useBulkCreateAssociations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      associations: Array<{ role_id: string; permission_id: string }>;
    }) => apiClient.post('/associations/bulk', data),
    onSuccess: () => {
      // Invalidate all association-related queries
      queryClient.invalidateQueries({ queryKey: associationKeys.all });
    },
  });
}

// Bulk delete associations mutation
export function useBulkDeleteAssociations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      associations: Array<{ role_id: string; permission_id: string }>;
    }) => {
      // For bulk delete, we'll use POST with a different endpoint or pass as query params
      const params = new URLSearchParams();
      data.associations.forEach((assoc, index) => {
        params.append(`associations[${index}][role_id]`, assoc.role_id);
        params.append(
          `associations[${index}][permission_id]`,
          assoc.permission_id
        );
      });
      return apiClient.delete(`/associations/bulk?${params.toString()}`);
    },
    onSuccess: () => {
      // Invalidate all association-related queries
      queryClient.invalidateQueries({ queryKey: associationKeys.all });
    },
  });
}
