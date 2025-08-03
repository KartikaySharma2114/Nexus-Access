'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Permission, Role } from '@/lib/types';

interface DeletePermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
  onSuccess: () => void;
}

export function DeletePermissionDialog({
  isOpen,
  onClose,
  permission,
  onSuccess,
}: DeletePermissionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [associatedRoles, setAssociatedRoles] = useState<Role[]>([]);
  const [checkingRoles, setCheckingRoles] = useState(false);

  // Check for associated roles when dialog opens
  useEffect(() => {
    if (isOpen && permission) {
      checkAssociatedRoles();
    }
  }, [isOpen, permission]);

  const checkAssociatedRoles = async () => {
    if (!permission) return;

    try {
      setCheckingRoles(true);
      
      // Get role associations for this permission
      const associationsResponse = await fetch('/api/associations');
      const associationsData = await associationsResponse.json();
      
      if (associationsResponse.ok) {
        const permissionAssociations = associationsData.data.filter(
          (assoc: any) => assoc.permission_id === permission.id
        );
        
        if (permissionAssociations.length > 0) {
          // Get role details
          const rolesResponse = await fetch('/api/roles');
          const rolesData = await rolesResponse.json();
          
          if (rolesResponse.ok) {
            const roleIds = permissionAssociations.map((assoc: any) => assoc.role_id);
            const roles = rolesData.data.filter((role: Role) => roleIds.includes(role.id));
            setAssociatedRoles(roles);
          }
        }
      }
    } catch (err) {
      console.error('Error checking associated roles:', err);
    } finally {
      setCheckingRoles(false);
    }
  };

  const handleDelete = async () => {
    if (!permission) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/permissions/${permission.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete permission');
      }

      onSuccess();
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete permission'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setAssociatedRoles([]);
      onClose();
    }
  };

  if (!permission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Permission</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete the permission &quot;
            {permission.name}&quot;? This action cannot be undone and will
            remove all role associations with this permission.
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Permission Details */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-sm text-muted-foreground">Name:</span>
              <div className="text-sm text-foreground">{permission.name}</div>
            </div>
            {permission.description && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">
                  Description:
                </span>
                <div className="text-sm text-foreground">{permission.description}</div>
              </div>
            )}
            <div>
              <span className="font-medium text-sm text-muted-foreground">
                Created:
              </span>
              <div className="text-sm text-foreground">
                {new Date(permission.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Show associated roles if any */}
        {checkingRoles ? (
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Checking role associations...</span>
            </div>
          </div>
        ) : associatedRoles.length > 0 ? (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                  Cannot Delete - Permission In Use
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  This permission is currently assigned to the following roles. Remove all role assignments first:
                </div>
                <div className="flex flex-wrap gap-2">
                  {associatedRoles.map((role) => (
                    <Badge key={role.id} variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-green-800 dark:text-green-200">
                This permission is not assigned to any roles and can be safely deleted.
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || associatedRoles.length > 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
