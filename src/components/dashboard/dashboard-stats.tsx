'use client';

import { memo, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, Users, Link2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStats, dashboardKeys } from '@/hooks/api';

// Memoized loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized error component with retry functionality
const ErrorDisplay = memo(
  ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load dashboard statistics: {error}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
);

ErrorDisplay.displayName = 'ErrorDisplay';

export const DashboardStats = memo(() => {
  const queryClient = useQueryClient();
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useDashboardStats();

  const handleRefresh = useCallback(async () => {
    try {
      console.log('Refresh button clicked');
      // First invalidate the query to mark it as stale
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      // Then force a refetch
      await refetch();
      console.log('Dashboard refresh completed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [queryClient, refetch]);

  // Memoized date formatter with error handling
  const formatDate = useCallback((dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }, []);

  // Memoized stats cards data with comprehensive null safety
  const statsCards = useMemo(() => {
    // Provide default values even when stats is null/undefined
    const safeStats = stats || {
      totalPermissions: 0,
      totalRoles: 0,
      totalAssociations: 0,
      recentActivity: [],
    };

    return [
      {
        title: 'Total Permissions',
        value:
          Number.isInteger(safeStats.totalPermissions) &&
          safeStats.totalPermissions >= 0
            ? safeStats.totalPermissions
            : 0,
        description: 'System actions available',
        icon: Shield,
      },
      {
        title: 'Total Roles',
        value:
          Number.isInteger(safeStats.totalRoles) && safeStats.totalRoles >= 0
            ? safeStats.totalRoles
            : 0,
        description: 'User role types defined',
        icon: Users,
      },
      {
        title: 'Active Associations',
        value:
          Number.isInteger(safeStats.totalAssociations) &&
          safeStats.totalAssociations >= 0
            ? safeStats.totalAssociations
            : 0,
        description: 'Role-permission links',
        icon: Link2,
      },
    ];
  }, [stats]);

  // Memoized recent activity with null safety
  const recentActivity = useMemo(() => {
    if (!stats || !Array.isArray(stats.recentActivity)) {
      return [];
    }

    // Filter out invalid activity items and ensure they have required properties
    return stats.recentActivity.filter(
      (activity) =>
        activity &&
        typeof activity === 'object' &&
        typeof activity.id === 'string' &&
        activity.id.trim() !== '' &&
        typeof activity.description === 'string' &&
        activity.description.trim() !== '' &&
        typeof activity.timestamp === 'string' &&
        activity.timestamp.trim() !== '' &&
        [
          'role_created',
          'permission_created',
          'association_created',
          'association_deleted',
        ].includes(activity.type)
    );
  }, [stats]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={handleRefresh} />;
  }

  // Handle case where data is successfully fetched but all values are zero
  const hasAnyData =
    stats &&
    (stats.totalPermissions > 0 ||
      stats.totalRoles > 0 ||
      stats.totalAssociations > 0 ||
      (stats.recentActivity && stats.recentActivity.length > 0));

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dashboard Statistics
          </h2>
          <p className="text-muted-foreground">Overview of your RBAC system</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform ${isFetching ? 'animate-spin' : ''}`}
          />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state message when database is empty */}
      {!hasAnyData && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                No data found
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Your RBAC system appears to be empty. Start by creating some
                permissions and roles to see statistics here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest system activity and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {recentActivity.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <span className="font-medium text-sm">
                    {activity.description}
                  </span>
                  <Badge variant="secondary">
                    {formatDate(activity.timestamp)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">
                No recent activity found
              </p>
              <p className="text-xs text-muted-foreground">
                Activity will appear here when you create permissions, roles, or
                associations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
