import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
  totalRoles: number;
  totalPermissions: number;
  totalAssociations: number;
  recentActivity: Array<{
    id: string;
    type:
      | 'role_created'
      | 'permission_created'
      | 'association_created'
      | 'association_deleted';
    description: string;
    timestamp: string;
  }>;
}

// Query keys for consistent cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// Fetch dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      try {
        // Add a timestamp to prevent caching issues
        const timestamp = Date.now();
        console.log('Fetching dashboard stats at:', timestamp);

        // The API route returns { data: DashboardStats }
        // The NetworkClient returns { data: T } where T is the parsed JSON
        // The ApiClient extracts response.data, so we get { data: DashboardStats } directly
        const response = await apiClient.get<{ data: DashboardStats }>(
          `/dashboard/stats?t=${timestamp}`
        );

        // Validate the response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format: expected object');
        }

        // The response should have a 'data' property containing our DashboardStats
        if (!('data' in response) || !response.data) {
          throw new Error('Invalid response format: missing data property');
        }

        const stats = response.data;

        // Validate the stats structure and provide defaults for missing fields
        const validatedStats: DashboardStats = {
          totalPermissions:
            typeof stats.totalPermissions === 'number'
              ? stats.totalPermissions
              : 0,
          totalRoles:
            typeof stats.totalRoles === 'number' ? stats.totalRoles : 0,
          totalAssociations:
            typeof stats.totalAssociations === 'number'
              ? stats.totalAssociations
              : 0,
          recentActivity: Array.isArray(stats.recentActivity)
            ? stats.recentActivity.filter(
                (activity) =>
                  activity &&
                  typeof activity === 'object' &&
                  typeof activity.id === 'string' &&
                  typeof activity.description === 'string' &&
                  typeof activity.timestamp === 'string' &&
                  [
                    'role_created',
                    'permission_created',
                    'association_created',
                    'association_deleted',
                  ].includes(activity.type)
              )
            : [],
        };

        console.log('Dashboard stats fetched:', validatedStats);
        return validatedStats;
      } catch (error) {
        console.error('Dashboard stats fetch error:', error);
        // Re-throw with more context for better error handling
        if (error instanceof Error) {
          throw new Error(
            `Failed to fetch dashboard statistics: ${error.message}`
          );
        }
        throw new Error('Failed to fetch dashboard statistics: Unknown error');
      }
    },
    staleTime: 0, // Always consider data stale for manual refresh to work properly
    gcTime: 0, // Don't cache at all to ensure fresh data
    refetchInterval: false, // Disable automatic refetching to avoid conflicts with manual refresh
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Disable automatic refetch on window focus
  });
}
