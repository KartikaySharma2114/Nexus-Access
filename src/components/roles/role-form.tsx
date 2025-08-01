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
import { useToast } from '@/components/ui/toast';
import { z } from 'zod';
import type { Role } from '@/lib/types';

// Form-specific schema that matches the form's expected types
const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
});

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: () => void;
}

export function RoleForm({ isOpen, onClose, role, onSuccess }: RoleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const isEditing = !!role;

  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (isOpen) {
      if (role) {
        form.reset({
          name: role.name,
        });
      } else {
        form.reset({
          name: '',
        });
      }
      setError(null);
    }
  }, [isOpen, role, form]);

  const onSubmit = async (data: { name: string }) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditing ? `/api/roles/${role.id}` : '/api/roles';
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
          result.error || `Failed to ${isEditing ? 'update' : 'create'} role`
        );
      }

      // Show success toast
      const successMessage =
        result.message ||
        `Role ${isEditing ? 'updated' : 'created'} successfully`;

      addToast({
        title: 'Success',
        description: successMessage,
        variant: 'success',
      });

      onSuccess();
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} role:`, err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? 'update' : 'create'} role`
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
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the role details below.'
              : 'Create a new role by filling out the form below.'}
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

            {/* Role Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Admin, Editor, Viewer"
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
                {isEditing ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
