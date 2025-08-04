'use client';

import React, { ErrorInfo } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Home,
  Bug,
  Copy,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ErrorHandler, type ErrorContext } from '@/lib/error-utils';
import { useToast } from '@/hooks/use-toast';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  level?: 'global' | 'section' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableErrorReporting?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isDetailsOpen: boolean;
  isReporting: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorHandler: ErrorHandler;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isDetailsOpen: false,
      isReporting: false,
    };
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Generate error ID and handle error
    const context: ErrorContext = {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        level: this.props.level || 'component',
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    };

    const structuredError = this.errorHandler.handleErrorSync(error, context);
    this.setState({ errorId: structuredError.id });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      isDetailsOpen: false,
      isReporting: false,
    });
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

  copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state;
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(errorDetails, null, 2)
      );
      // Show success toast (would need toast context)
      console.log('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  reportError = async () => {
    if (!this.props.enableErrorReporting) return;

    this.setState({ isReporting: true });

    try {
      const { error, errorInfo, errorId } = this.state;
      const errorReport = {
        errorId,
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        level: this.props.level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Send error report to API
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      console.log('Error report sent successfully');
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ isDetailsOpen: !prev.isDetailsOpen }));
  };

  getErrorSuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      suggestions.push('Try logging in again');
      suggestions.push('Contact support if the problem persists');
    }

    if (message.includes('not found') || message.includes('404')) {
      suggestions.push('The requested resource may have been moved or deleted');
      suggestions.push('Try navigating back to the home page');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache and cookies');
      suggestions.push('Contact support if the problem continues');
    }

    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      const {
        level = 'global',
        showErrorDetails = true,
        enableErrorReporting = true,
      } = this.props;
      const { error, errorInfo, errorId, isDetailsOpen, isReporting } =
        this.state;

      const suggestions = error ? this.getErrorSuggestions(error) : [];

      return (
        <div className="flex items-center justify-center min-h-screen bg-background/50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-destructive">
                <AlertTriangle className="w-8 h-8 mr-3" />
                {level === 'global'
                  ? 'A Critical Error Occurred'
                  : 'An Error Occurred'}
              </CardTitle>
              <CardDescription>
                {level === 'global'
                  ? "We're sorry, but the application has encountered a serious problem."
                  : 'This part of the application has encountered a problem.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-semibold">Error Message:</p>
                  <p className="mt-1">
                    {error?.message || 'An unknown error occurred.'}
                  </p>
                  {errorId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Error ID: {errorId}
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              {suggestions.length > 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Suggested Solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {showErrorDetails && (
                <Collapsible
                  open={isDetailsOpen}
                  onOpenChange={this.toggleDetails}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {isDetailsOpen ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Technical Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Show Technical Details
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <Alert>
                      <Bug className="w-4 h-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-2">Stack Trace:</p>
                        <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded overflow-auto max-h-40">
                          {error?.stack || 'No stack trace available'}
                        </pre>
                        {errorInfo?.componentStack && (
                          <>
                            <p className="font-semibold mt-4 mb-2">
                              Component Stack:
                            </p>
                            <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded overflow-auto max-h-40">
                              {errorInfo.componentStack}
                            </pre>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="flex flex-wrap gap-2 pt-4">
                <Button onClick={this.resetError} className="flex-1 min-w-0">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button variant="outline" onClick={this.reloadPage}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                <Button variant="outline" onClick={this.goHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>

                {showErrorDetails && (
                  <Button variant="outline" onClick={this.copyErrorDetails}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Details
                  </Button>
                )}

                {enableErrorReporting && (
                  <Button
                    variant="outline"
                    onClick={this.reportError}
                    disabled={isReporting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isReporting ? 'Reporting...' : 'Report Error'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error boundary usage
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
