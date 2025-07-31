'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: string | Error | null;
  title?: string;
  variant?: 'default' | 'destructive' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDismiss?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  title = 'Error',
  variant = 'destructive',
  size = 'md',
  showIcon = true,
  showDismiss = false,
  showRetry = false,
  onRetry,
  onDismiss,
  className,
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-sm p-4',
    lg: 'text-base p-6',
  };

  return (
    <Alert variant={variant} className={cn(sizeClasses[size], className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {showIcon && (
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            {title && <div className="font-medium mb-1">{title}</div>}
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          {showRetry && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

interface InlineErrorProps {
  error: string | null;
  className?: string;
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <div className={cn('text-sm text-red-600 mt-1', className)}>{error}</div>
  );
}

interface FormErrorProps {
  errors: Record<string, string | undefined>;
  className?: string;
}

export function FormError({ errors, className }: FormErrorProps) {
  const errorEntries = Object.entries(errors).filter(([, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn('mb-4', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          {errorEntries.map(([field, error]) => (
            <div key={field} className="text-sm">
              <span className="font-medium capitalize">{field}:</span> {error}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
