'use client';

import { useState, useEffect } from 'react';
import { Role, Permission, RolePermission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PermissionRoleViewerProps {
  selectedPermission?: Permission;
  onPermissionSelect?: (permission: Permission | null) => void;
  className?: string;
}

export function PermissionRoleViewer({
  selectedPermission,
  onPermissionSelect,
  className,
}: PermissionRoleViewerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [associations, setAssociations] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(
    selectedPermission || null
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPermission(selectedPermission || null);
  }, [selectedPermission]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesResponse, permissionsResponse, associationsResponse] =
        await Promise.all([
          fetch('/api/roles'),
          fetch('/api/permissions'),
          fetch('/api/associations'),
        ]);

      if (
        !rolesResponse.ok ||
        !permissionsResponse.ok ||
        !associationsResponse.ok
      ) {
        throw new Error('Failed to load data');
      }

      const [rolesData, permissionsData, associationsData] = await Promise.all([
        rolesResponse.json(),
        permissionsResponse.json(),
        associationsResponse.json(),
      ]);

      setRoles(rolesData.data || []);
      setPermissions(permissionsData.data || []);
      setAssociations(associationsData.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionSelect = (permission: Permission) => {
    setCurrentPermission(permission);
    onPermissionSelect?.(permission);
  };

  const getPermissionRoles = (permissionId: string): Role[] => {
    const roleIds = associations
      .filter((assoc) => assoc.permission_id === permissionId)
      .map((assoc) => assoc.role_id);

    return roles.filter((role) => roleIds.includes(role.id));
  };

  const getPermissionRoleCount = (permissionId: string): number => {
    return associations.filter((assoc) => assoc.permission_id === permissionId)
      .length;
  };

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (permission.description &&
        permission.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading permission role viewer...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Permission</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPermissions.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No permissions match your search'
                : 'No permissions available'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPermissions.map((permission) => {
                const roleCount = getPermissionRoleCount(permission.id);
                const isSelected = currentPermission?.id === permission.id;

                return (
                  <div
                    key={permission.id}
                    className={`p-3 border border-border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'hover:bg-muted/80 dark:hover:bg-muted/20'
                    }`}
                    onClick={() => handlePermissionSelect(permission)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{permission.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {roleCount} roles
                          </Badge>
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Display */}
      {currentPermission && (
        <Card>
          <CardHeader>
            <CardTitle>
              Roles with &quot;{currentPermission.name}&quot; Permission
            </CardTitle>
            {currentPermission.description && (
              <p className="text-sm text-muted-foreground">
                {currentPermission.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {(() => {
              const permissionRoles = getPermissionRoles(currentPermission.id);

              if (permissionRoles.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No roles have this permission assigned
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Use the Role Permission Assigner to assign this permission
                      to roles
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {permissionRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    >
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">
                          {role.name}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Created{' '}
                          {new Date(role.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-600 dark:bg-green-700">
                        Assigned
                      </Badge>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      This permission is assigned to {permissionRoles.length} of{' '}
                      {roles.length} total roles
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {permissions.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Permissions</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {
                  permissions.filter((p) => getPermissionRoleCount(p.id) > 0)
                    .length
                }
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Assigned Permissions</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {
                  permissions.filter((p) => getPermissionRoleCount(p.id) === 0)
                    .length
                }
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">
                Unassigned Permissions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
