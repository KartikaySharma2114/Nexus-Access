'use client';

import React, { ErrorInfo } from 'react';
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

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  level?: 'global' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    const newErrorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.setState({ errorId: newErrorId });
    console.error(`Error ID: ${newErrorId}`, error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
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

      const { level = 'global' } = this.props;
      const { error, errorId } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen bg-background/50">
          <Card className="w-full max-w-lg mx-4">
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
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <Bug className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-semibold">Error Details:</p>
                  <pre className="mt-2 text-sm whitespace-pre-wrap">
                    {error?.message || 'An unknown error occurred.'}
                  </pre>
                  {errorId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Error ID: {errorId}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={this.goHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.reloadPage}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
