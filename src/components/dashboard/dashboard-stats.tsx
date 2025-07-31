'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, Users, Link2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  counts: {
    permissions: number;
    roles: number;
    associations: number;
  };
  recentActivity: {
    permissions: Array<{
      id: string;
      name: string;
      created_at: string;
    }>;
    roles: Array<{
      id: string;
      name: string;
      created_at: string;
    }>;
  };
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const result = await response.json();
        setStats(result.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard statistics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.permissions}</div>
            <p className="text-xs text-muted-foreground">
              System actions available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.roles}</div>
            <p className="text-xs text-muted-foreground">
              User role types defined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Associations
            </CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.counts.associations}
            </div>
            <p className="text-xs text-muted-foreground">
              Role-permission links
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Permissions</CardTitle>
            <CardDescription>
              Latest permissions added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.permissions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{permission.name}</span>
                    <Badge variant="secondary">
                      {formatDate(permission.created_at)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No permissions created yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Roles</CardTitle>
            <CardDescription>Latest roles added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.roles.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{role.name}</span>
                    <Badge variant="secondary">
                      {formatDate(role.created_at)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No roles created yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
