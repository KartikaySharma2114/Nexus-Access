import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionFilters {
  search?: string;
  resource?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query keys for consistent cache management
export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  list: (filters: PermissionFilters) =>
    [...permissionKeys.lists(), filters] as const,
  details: () => [...permissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...permissionKeys.details(), id] as const,
};

// Fetch permissions with optional filters
export function usePermissions(filters: PermissionFilters = {}) {
  return useQuery({
    queryKey: permissionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const endpoint = queryString
        ? `/permissions?${queryString}`
        : '/permissions';

      return apiClient.get<{ permissions: Permission[]; total: number }>(
        endpoint
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single permission by ID
export function usePermission(id: string) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: () => apiClient.get<Permission>(`/permissions/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create permission mutation
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.post<Permission>('/permissions', data),
    onSuccess: () => {
      // Invalidate and refetch permissions list
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
    },
  });
}

// Update permission mutation
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Permission> & { id: string }) =>
      apiClient.put<Permission>(`/permissions/${id}`, data),
    onSuccess: (data) => {
      // Update the specific permission in cache
      queryClient.setQueryData(permissionKeys.detail(data.id), data);
      // Invalidate permissions list to reflect changes
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
    },
  });
}

// Delete permission mutation
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/permissions/${id}`),
    onSuccess: (_, id) => {
      // Remove the permission from cache
      queryClient.removeQueries({ queryKey: permissionKeys.detail(id) });
      // Invalidate permissions list
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
    },
  });
}
