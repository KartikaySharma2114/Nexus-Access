'use client';

import React from 'react';
import {
  RefreshCw,
  Home,
  AlertTriangle,
  Bug,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorRecoveryProps {
  error: Error;
  resetError?: () => void;
  level?: 'global' | 'section' | 'component';
  showDetails?: boolean;
  customActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

export function ErrorRecovery({
  error,
  resetError,
  level = 'component',
  showDetails = false,
  customActions = [],
}: ErrorRecoveryProps) {
  const [showFullError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;

  const handleRetry = () => {
    if (resetError && retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      resetError();
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const getErrorSuggestions = (error: Error): string[] => {
    const message = error.message.toLowerCase();
    const suggestions: string[] = [];

    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      suggestions.push('Try logging out and back in');
      suggestions.push('Contact your administrator for access');
    }

    if (message.includes('not found') || message.includes('404')) {
      suggestions.push('The item may have been moved or deleted');
      suggestions.push('Try navigating back to the main page');
    }

    if (message.includes('timeout')) {
      suggestions.push('The request took too long to complete');
      suggestions.push('Try again with a smaller data set');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  };

  const suggestions = getErrorSuggestions(error);
  const canRetry = resetError && retryCount < maxRetries;

  if (level === 'component') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium mb-1">Component Error</div>
            <div className="text-sm">{error.message}</div>
          </div>
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-2 shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry ({maxRetries - retryCount} left)
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <CardTitle className="text-red-600">
            {level === 'global' ? 'Application Error' : 'Section Error'}
          </CardTitle>
        </div>
        <CardDescription>
          {level === 'global'
            ? 'The application encountered an unexpected error.'
            : "This section encountered an error and couldn't load properly."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Message */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-medium text-red-800 mb-2">Error Details:</div>
          <div className="text-sm text-red-700 font-mono">{error.message}</div>
        </div>

        {/* Suggestions */}
        <div>
          <div className="font-medium text-gray-800 mb-2">
            What you can try:
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-2">
          <div className="font-medium text-gray-800 mb-2">
            Recovery Options:
          </div>

          <div className="flex flex-wrap gap-2">
            {canRetry && (
              <Button onClick={handleRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again ({maxRetries - retryCount} attempts left)
              </Button>
            )}

            <Button onClick={handleReload} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            {level === 'global' && (
              <Button onClick={handleGoHome} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}

            {/* Custom Actions */}
            {customActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                variant={action.variant || 'outline'}
                size="sm"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="text-sm text-gray-500">
            Retry attempts: {retryCount} of {maxRetries}
          </div>
        )}

        {/* Developer Information */}
        {(showDetails || process.env.NODE_ENV === 'development') && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Technical Details
              <span className="ml-2 text-xs text-gray-400">
                (Click to {showFullError ? 'hide' : 'show'})
              </span>
            </summary>

            {showFullError && (
              <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
                <div className="mb-2">
                  <strong>Error Name:</strong> {error.name}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.stack && (
                  <>
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                </div>
              </div>
            )}
          </details>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          If this problem persists, please contact your system administrator or
          <a
            href="mailto:support@example.com"
            className="text-blue-600 hover:underline ml-1"
          >
            report the issue
            <ExternalLink className="inline h-3 w-3 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
