import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RoleFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query keys for consistent cache management
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: RoleFilters) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

// Fetch roles with optional filters
export function useRoles(filters: RoleFilters = {}) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const endpoint = queryString ? `/roles?${queryString}` : '/roles';

      return apiClient.get<{ roles: Role[]; total: number }>(endpoint);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single role by ID
export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => apiClient.get<Role>(`/roles/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Role, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.post<Role>('/roles', data),
    onSuccess: () => {
      // Invalidate and refetch roles list
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

// Update role mutation
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Role> & { id: string }) =>
      apiClient.put<Role>(`/roles/${id}`, data),
    onSuccess: (data) => {
      // Update the specific role in cache
      queryClient.setQueryData(roleKeys.detail(data.id), data);
      // Invalidate roles list to reflect changes
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/roles/${id}`),
    onSuccess: (_, id) => {
      // Remove the role from cache
      queryClient.removeQueries({ queryKey: roleKeys.detail(id) });
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}
