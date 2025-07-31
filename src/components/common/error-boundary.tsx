'use client';

import React from 'react';
import { RefreshCw, AlertTriangle, Home, Bug } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  level?: 'global' | 'section' | 'component';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging with context
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary?.name,
      errorBoundaryStack: errorInfo.errorBoundaryStack,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      level: this.props.level || 'global',
      errorId: this.state.errorId,
    };

    console.error('Error caught by boundary:', errorDetails);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, errorDetails);
    }

    this.setState({ errorInfo });
  }

  resetError = () => {
    this.retryCount++;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      const { level = 'global' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      // Different UI based on error level
      if (level === 'component') {
        return (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>This component encountered an error</span>
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.resetError}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        );
      }

      if (level === 'section') {
        return (
          <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">
                Section Error
              </h3>
            </div>
            <p className="text-red-700 mb-4">
              This section encountered an error and couldn&apos;t load properly.
            </p>
            <div className="flex space-x-2">
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.resetError}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.reloadPage}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        );
      }

      // Global error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-600">
                  Application Error
                </CardTitle>
              </div>
              <CardDescription>
                The application encountered an unexpected error. We apologize
                for the inconvenience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                <div className="font-medium mb-1">Error Details:</div>
                <div className="font-mono text-xs">
                  {this.state.error?.message || 'Unknown error occurred'}
                </div>
                {this.state.errorId && (
                  <div className="text-xs text-red-500 mt-2">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </div>

              {/* Recovery Options */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Recovery Options:
                </div>

                {canRetry && (
                  <Button
                    onClick={this.resetError}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts
                    left)
                  </Button>
                )}

                <Button
                  onClick={this.reloadPage}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.goHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              {/* Development Info */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                    <Bug className="inline h-4 w-4 mr-1" />
                    Developer Information
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <div className="mt-2 mb-2">
                          <strong>Component Stack:</strong>
                        </div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="text-xs text-gray-500 text-center">
                If this problem persists, please contact your system
                administrator
                {this.state.errorId &&
                  ` and provide the Error ID: ${this.state.errorId}`}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
