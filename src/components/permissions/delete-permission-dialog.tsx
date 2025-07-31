'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Permission } from '@/lib/types';

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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Permission Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-sm text-gray-600">Name:</span>
              <div className="text-sm">{permission.name}</div>
            </div>
            {permission.description && (
              <div>
                <span className="font-medium text-sm text-gray-600">
                  Description:
                </span>
                <div className="text-sm">{permission.description}</div>
              </div>
            )}
            <div>
              <span className="font-medium text-sm text-gray-600">
                Created:
              </span>
              <div className="text-sm">
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
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
