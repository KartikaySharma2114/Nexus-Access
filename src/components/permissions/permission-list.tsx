'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading';
import { SearchBar } from '@/components/ui/search-input';
import { useToast } from '@/components/ui/toast';
import { PermissionForm } from './permission-form';
import { DeletePermissionDialog } from './delete-permission-dialog';
import { createClient } from '@/lib/supabase/client';
import type { Permission } from '@/lib/types';

interface PermissionListProps {
  className?: string;
}

export function PermissionList({ className }: PermissionListProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const supabase = createClient();

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }

      const response = await fetch(`/api/permissions?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch permissions');
      }

      setPermissions(result.data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Set up real-time subscription
  useEffect(() => {
    fetchPermissions();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('permissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permissions',
        },
        () => {
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPermissions, supabase]);

  const handleCreatePermission = () => {
    setSelectedPermission(null);
    setIsFormOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsFormOpen(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPermission(null);
    fetchPermissions();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setSelectedPermission(null);
    fetchPermissions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permissions</CardTitle>
            <Button onClick={handleCreatePermission}>
              <Plus className="h-4 w-4 mr-2" />
              Create Permission
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search permissions..."
            showResults={true}
            resultCount={permissions.length}
            isSearching={loading}
            className="mb-4"
          />

          <LoadingState
            isLoading={loading}
            error={error}
            isEmpty={permissions.length === 0}
            loadingMessage="Loading permissions..."
            emptyMessage={
              searchQuery
                ? 'No permissions found matching your search.'
                : 'No permissions created yet.'
            }
          >
            {permissions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {permission.name}
                      </TableCell>
                      <TableCell>
                        {permission.description || (
                          <span className="text-gray-400 italic">
                            No description
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(permission.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPermission(permission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePermission(permission)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </LoadingState>
        </CardContent>
      </Card>

      {/* Permission Form Modal */}
      <PermissionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        permission={selectedPermission}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePermissionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        permission={selectedPermission}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
