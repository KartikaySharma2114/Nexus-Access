'use client';

import { useState, useEffect } from 'react';

import { Role, Permission, RolePermission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X } from 'lucide-react';

interface AssociationMatrixProps {
  className?: string;
}

interface MatrixData {
  roles: Role[];
  permissions: Permission[];
  associations: RolePermission[];
}

export function AssociationMatrix({ className }: AssociationMatrixProps) {
  const [data, setData] = useState<MatrixData>({
    roles: [],
    permissions: [],
    associations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingAssociation, setUpdatingAssociation] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles, permissions, and associations in parallel
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

      setData({
        roles: rolesData.data || [],
        permissions: permissionsData.data || [],
        associations: associationsData.data || [],
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load association data');
    } finally {
      setLoading(false);
    }
  };

  const hasAssociation = (roleId: string, permissionId: string): boolean => {
    return data.associations.some(
      (assoc) =>
        assoc.role_id === roleId && assoc.permission_id === permissionId
    );
  };

  const toggleAssociation = async (roleId: string, permissionId: string) => {
    const associationKey = `${roleId}-${permissionId}`;
    setUpdatingAssociation(associationKey);

    try {
      const hasExistingAssociation = hasAssociation(roleId, permissionId);

      if (hasExistingAssociation) {
        // Remove association
        const response = await fetch(
          `/api/associations?role_id=${roleId}&permission_id=${permissionId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to remove association');
        }

        // Update local state
        setData((prev) => ({
          ...prev,
          associations: prev.associations.filter(
            (assoc) =>
              !(
                assoc.role_id === roleId && assoc.permission_id === permissionId
              )
          ),
        }));
      } else {
        // Add association
        const response = await fetch('/api/associations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role_id: roleId,
            permission_id: permissionId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create association');
        }

        const result = await response.json();

        // Update local state
        setData((prev) => ({
          ...prev,
          associations: [...prev.associations, result.data],
        }));
      }
    } catch (err) {
      console.error('Error toggling association:', err);
      setError('Failed to update association');
    } finally {
      setUpdatingAssociation(null);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading association matrix...
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Role-Permission Association Matrix</CardTitle>
        <p className="text-sm text-gray-600">
          Click on cells to toggle associations between roles and permissions
        </p>
      </CardHeader>
      <CardContent>
        {data.roles.length === 0 || data.permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No roles or permissions found.</p>
            <p className="text-sm">Create some roles and permissions first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left font-medium">
                    Role / Permission
                  </th>
                  {data.permissions.map((permission) => (
                    <th
                      key={permission.id}
                      className="border p-2 bg-gray-50 text-center font-medium min-w-[120px]"
                      title={permission.description || permission.name}
                    >
                      <div className="truncate">{permission.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.roles.map((role) => (
                  <tr key={role.id}>
                    <td className="border p-2 bg-gray-50 font-medium">
                      {role.name}
                    </td>
                    {data.permissions.map((permission) => {
                      const associationKey = `${role.id}-${permission.id}`;
                      const isAssociated = hasAssociation(
                        role.id,
                        permission.id
                      );
                      const isUpdating = updatingAssociation === associationKey;

                      return (
                        <td
                          key={permission.id}
                          className="border p-1 text-center"
                        >
                          <Button
                            variant={isAssociated ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() =>
                              toggleAssociation(role.id, permission.id)
                            }
                            disabled={isUpdating}
                            title={
                              isAssociated
                                ? `Remove ${permission.name} from ${role.name}`
                                : `Assign ${permission.name} to ${role.name}`
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isAssociated ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3 opacity-30" />
                            )}
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="w-4 h-4 p-0">
              <Check className="h-2 w-2" />
            </Badge>
            <span>Associated</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-4 h-4 p-0">
              <X className="h-2 w-2 opacity-30" />
            </Badge>
            <span>Not Associated</span>
          </div>
          <div className="ml-auto">
            Total Associations: {data.associations.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
