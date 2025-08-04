'use client';

import { useState, useEffect } from 'react';
import { Role, Permission, RolePermission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Plus, Minus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BulkAssignmentToolProps {
  className?: string;
}

export function BulkAssignmentTool({ className }: BulkAssignmentToolProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [associations, setAssociations] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(new Set());
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = () => {
    if (!selectedRole) return;

    const filteredPermissionIds = filteredPermissions.map((p) => p.id);
    setSelectedPermissions(new Set(filteredPermissionIds));
  };

  const handleSelectNone = () => {
    setSelectedPermissions(new Set());
  };

  const handleSelectAssigned = () => {
    if (!selectedRole) return;

    const assignedPermissions = filteredPermissions
      .filter((p) => hasPermission(selectedRole.id, p.id))
      .map((p) => p.id);
    setSelectedPermissions(new Set(assignedPermissions));
  };

  const handleSelectUnassigned = () => {
    if (!selectedRole) return;

    const unassignedPermissions = filteredPermissions
      .filter((p) => !hasPermission(selectedRole.id, p.id))
      .map((p) => p.id);
    setSelectedPermissions(new Set(unassignedPermissions));
  };

  const handleBulkAssign = async () => {
    if (!selectedRole || selectedPermissions.size === 0) return;

    setBulkOperationLoading(true);
    try {
      const response = await fetch('/api/associations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRole.id,
          permission_ids: Array.from(selectedPermissions),
          operation: 'assign',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk assign permissions');
      }

      // Reload data to get updated associations
      await loadData();
      setSelectedPermissions(new Set());
    } catch (err) {
      console.error('Error bulk assigning permissions:', err);
      setError('Failed to bulk assign permissions');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkUnassign = async () => {
    if (!selectedRole || selectedPermissions.size === 0) return;

    setBulkOperationLoading(true);
    try {
      const response = await fetch('/api/associations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRole.id,
          permission_ids: Array.from(selectedPermissions),
          operation: 'unassign',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk unassign permissions');
      }

      // Reload data to get updated associations
      await loadData();
      setSelectedPermissions(new Set());
    } catch (err) {
      console.error('Error bulk unassigning permissions:', err);
      setError('Failed to bulk unassign permissions');
    } finally {
      setBulkOperationLoading(false);
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
          Loading bulk assignment tool...
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
          <CardTitle>Bulk Permission Assignment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a role and multiple permissions to assign or unassign in bulk
          </p>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-muted-foreground">No roles available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Button
                  key={role.id}
                  variant={selectedRole?.id === role.id ? 'default' : 'outline'}
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

      {/* Permission Selection */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>
              Select Permissions for &quot;{selectedRole.name}&quot;
            </CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Select None
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAssigned}
                >
                  Select Assigned
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectUnassigned}
                >
                  Select Unassigned
                </Button>
              </div>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPermissions.map((permission) => {
                  const isAssigned = hasPermission(
                    selectedRole.id,
                    permission.id
                  );
                  const isSelected = selectedPermissions.has(permission.id);

                  return (
                    <div
                      key={permission.id}
                      className={`flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 dark:bg-primary/20'
                          : 'hover:bg-muted/80 dark:hover:bg-muted/20'
                      }`}
                      onClick={() => handlePermissionToggle(permission.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/50 dark:border-muted-foreground/70'
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">
                              {permission.name}
                            </h4>
                            {isAssigned && (
                              <Badge variant="default" className="text-xs">
                                Currently Assigned
                              </Badge>
                            )}
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

            {/* Bulk Actions */}
            {selectedPermissions.size > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedPermissions.size} permissions selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkAssign}
                      disabled={bulkOperationLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {bulkOperationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Bulk Assign
                    </Button>
                    <Button
                      onClick={handleBulkUnassign}
                      disabled={bulkOperationLoading}
                      variant="destructive"
                    >
                      {bulkOperationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Minus className="h-4 w-4 mr-2" />
                      )}
                      Bulk Unassign
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
