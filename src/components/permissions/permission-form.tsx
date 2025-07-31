'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';

// Form-specific schema that matches the form's expected types
const permissionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters'),
  description: z.string().optional(),
});
import type { Permission } from '@/lib/types';

interface PermissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission | null;
  onSuccess: () => void;
}

export function PermissionForm({
  isOpen,
  onClose,
  permission,
  onSuccess,
}: PermissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!permission;

  const form = useForm({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when dialog opens/closes or permission changes
  useEffect(() => {
    if (isOpen) {
      if (permission) {
        form.reset({
          name: permission.name,
          description: permission.description || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
        });
      }
      setError(null);
    }
  }, [isOpen, permission, form]);

  const onSubmit = async (data: { name: string; description?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditing
        ? `/api/permissions/${permission.id}`
        : '/api/permissions';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${isEditing ? 'update' : 'create'} permission`
        );
      }

      onSuccess();
    } catch (err) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} permission:`,
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? 'update' : 'create'} permission`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Permission' : 'Create Permission'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the permission details below.'
              : 'Create a new permission by filling out the form below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Permission Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., read_users, create_posts"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional description of what this permission allows"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Permission' : 'Create Permission'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
