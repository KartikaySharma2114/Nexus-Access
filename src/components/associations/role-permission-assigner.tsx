'use client';

import { useState, useEffect } from 'react';
import { Role, Permission, RolePermission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Minus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RolePermissionAssignerProps {
  selectedRole?: Role;
  onRoleSelect?: (role: Role | null) => void;
  className?: string;
}

export function RolePermissionAssigner({
  selectedRole,
  onRoleSelect,
  className,
}: RolePermissionAssignerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [associations, setAssociations] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRole, setCurrentRole] = useState<Role | null>(
    selectedRole || null
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentRole(selectedRole || null);
  }, [selectedRole]);

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

  const handleRoleSelect = (role: Role) => {
    setCurrentRole(role);
    onRoleSelect?.(role);
  };

  const getRolePermissions = (roleId: string): string[] => {
    return associations
      .filter((assoc) => assoc.role_id === roleId)
      .map((assoc) => assoc.permission_id);
  };

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    return associations.some(
      (assoc) =>
        assoc.role_id === roleId && assoc.permission_id === permissionId
    );
  };

  const togglePermission = async (permissionId: string) => {
    if (!currentRole) return;

    setUpdatingPermission(permissionId);

    try {
      const hasExistingAssociation = hasPermission(
        currentRole.id,
        permissionId
      );

      if (hasExistingAssociation) {
        // Remove association
        const response = await fetch(
          `/api/associations?role_id=${currentRole.id}&permission_id=${permissionId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to remove permission');
        }

        // Update local state
        setAssociations((prev) =>
          prev.filter(
            (assoc) =>
              !(
                assoc.role_id === currentRole.id &&
                assoc.permission_id === permissionId
              )
          )
        );
      } else {
        // Add association
        const response = await fetch('/api/associations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role_id: currentRole.id,
            permission_id: permissionId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to assign permission');
        }

        const result = await response.json();

        // Update local state
        setAssociations((prev) => [...prev, result.data]);
      }
    } catch (err) {
      console.error('Error toggling permission:', err);
      setError('Failed to update permission assignment');
    } finally {
      setUpdatingPermission(null);
    }
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
          Loading role permission assigner...
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
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-muted-foreground">No roles available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Button
                  key={role.id}
                  variant={currentRole?.id === role.id ? 'default' : 'outline'}
                  onClick={() => handleRoleSelect(role)}
                  className="mb-2"
                >
                  {role.name}
                  <Badge variant="secondary" className="ml-2">
                    {getRolePermissions(role.id).length}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Assignment */}
      {currentRole && (
        <Card>
          <CardHeader>
            <CardTitle>
              Assign Permissions to &quot;{currentRole.name}&quot;
            </CardTitle>
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
                  const isAssigned = hasPermission(
                    currentRole.id,
                    permission.id
                  );
                  const isUpdating = updatingPermission === permission.id;

                  return (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/80 dark:hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {permission.name}
                          </h4>
                          {isAssigned && (
                            <Badge variant="default" className="text-xs">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={isAssigned ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => togglePermission(permission.id)}
                        disabled={isUpdating}
                        className="ml-4"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isAssigned ? (
                          <>
                            <Minus className="h-4 w-4 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Assign
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {getRolePermissions(currentRole.id).length} of{' '}
                {permissions.length} permissions assigned
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
