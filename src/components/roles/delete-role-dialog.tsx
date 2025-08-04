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
import type { Role } from '@/lib/types';

interface DeleteRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSuccess: () => void;
}

export function DeleteRoleDialog({
  isOpen,
  onClose,
  role,
  onSuccess,
}: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!role) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete role');
      }

      onSuccess();
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete role');
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

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Role</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete the role &quot;{role.name}&quot;?
            This action cannot be undone and will remove all permission
            associations and user assignments for this role.
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Role Details */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-sm text-muted-foreground">
                Name:
              </span>
              <div className="text-sm text-foreground">{role.name}</div>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">
                Created:
              </span>
              <div className="text-sm text-foreground">
                {new Date(role.created_at).toLocaleDateString('en-US', {
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

        {/* Warning about cascade deletion */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-medium mb-1">Cascade Effects:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All permission associations will be removed</li>
                <li>All user assignments to this role will be removed</li>
                <li>This may affect user access to system features</li>
              </ul>
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
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
