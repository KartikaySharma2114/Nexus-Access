'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorDisplay } from '@/components/common/error-display';
import { z } from 'zod';
import { createPermissionSchema } from '@/lib/validations';
import type { Permission } from '@/lib/types';

interface PermissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission | null;
  onSuccess: () => void;
}

interface APIError {
  error: string;
  message?: string;
  details?: unknown;
  statusCode?: number;
}

export function PermissionForm({
  isOpen,
  onClose,
  permission,
  onSuccess,
}: PermissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const isEditing = !!permission;

  const form = useForm({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onChange', // Enable real-time validation
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
      setSuccess(null);
      setRetryCount(0);
    }
  }, [isOpen, permission, form]);

  const handleAPIError = (error: APIError): string => {
    // Handle different types of API errors
    if (error.statusCode === 409) {
      return (
        error.message ||
        'This permission name already exists. Please choose a different name.'
      );
    }

    if (error.statusCode === 400) {
      if (
        error.details &&
        typeof error.details === 'object' &&
        'validationErrors' in error.details
      ) {
        const validationErrors = (
          error.details.validationErrors as Array<{
            field: string;
            message: string;
          }>
        )
          .map((err) => `${err.field}: ${err.message}`)
          .join(', ');
        return `Validation failed: ${validationErrors}`;
      }
      return error.message || 'Invalid data provided. Please check your input.';
    }

    if (error.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (error.statusCode >= 500) {
      return 'Server error occurred. Please try again in a moment.';
    }

    return error.message || error.error || 'An unexpected error occurred.';
  };

  const onSubmit = async (data: z.infer<typeof createPermissionSchema>) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

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
        throw result as APIError;
      }

      // Show success message
      const successMessage =
        result.message ||
        `Permission ${isEditing ? 'updated' : 'created'} successfully`;
      setSuccess(successMessage);

      // Close dialog after a brief delay to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} permission:`,
        err
      );

      const errorMessage = handleAPIError(err as APIError);
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    form.handleSubmit(onSubmit)();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const canRetry = retryCount < maxRetries && !loading;

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
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <ErrorDisplay
                error={error}
                title="Form Error"
                showRetry={canRetry}
                onRetry={handleRetry}
                showDismiss
                onDismiss={() => setError(null)}
              />
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
                      className={
                        form.formState.errors.name ? 'border-red-500' : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && !form.formState.errors.name && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Valid permission name
                    </div>
                  )}
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

            {/* Retry Information */}
            {retryCount > 0 && retryCount < maxRetries && (
              <div className="text-xs text-gray-500">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </div>
            )}

            {retryCount >= maxRetries && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Maximum retry attempts reached. Please refresh the page and
                  try again.
                </AlertDescription>
              </Alert>
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
                type="submit"
                disabled={loading || !form.formState.isValid || !!success}
              >
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
