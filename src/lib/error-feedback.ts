/**
 * Error feedback system for user-friendly error reporting and recovery
 */

import { ErrorHandler, type StructuredError, type ErrorContext } from './error-utils';
import { 
  toastErrorFromError, 
  toastNetworkError, 
  toastValidationError,
  toastWarning,
  toastInfo,
} from '@/hooks/use-toast';

export interface ErrorFeedbackOptions {
  showToast?: boolean;
  toastDuration?: number;
  logError?: boolean;
  reportError?: boolean;
  showRecoveryOptions?: boolean;
  customMessage?: string;
  context?: ErrorContext;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface ErrorFeedbackResult {
  errorId: string;
  userMessage: string;
  recoveryActions: RecoveryAction[];
  canRetry: boolean;
}

/**
 * Enhanced error feedback system
 */
export class ErrorFeedbackSystem {
  private static instance: ErrorFeedbackSystem;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): ErrorFeedbackSystem {
    if (!ErrorFeedbackSystem.instance) {
      ErrorFeedbackSystem.instance = new ErrorFeedbackSystem();
    }
    return ErrorFeedbackSystem.instance;
  }

  /**
   * Handle error with comprehensive user feedback
   */
  async handleError(
    error: unknown,
    options: ErrorFeedbackOptions = {}
  ): Promise<ErrorFeedbackResult> {
    const {
      showToast = true,
      logError = true,
      reportError = false,
      showRecoveryOptions = true,
      customMessage,
      context,
    } = options;

    // Process error through centralized handler
    const structuredError = logError 
      ? await this.errorHandler.handleError(error, context)
      : this.errorHandler.processError(error, context);

    // Show toast notification
    if (showToast) {
      this.showErrorToast(structuredError, customMessage);
    }

    // Report error if enabled
    if (reportError) {
      await this.reportError(structuredError);
    }

    // Generate recovery actions
    const recoveryActions = showRecoveryOptions 
      ? this.generateRecoveryActions(structuredError)
      : [];

    return {
      errorId: structuredError.id,
      userMessage: customMessage || structuredError.userMessage,
      recoveryActions,
      canRetry: structuredError.recoverable,
    };
  }

  /**
   * Show appropriate toast notification based on error type
   */
  private showErrorToast(error: StructuredError, customMessage?: string): void {
    const message = customMessage || error.userMessage;

    switch (error.type) {
      case 'NETWORK_ERROR':
        toastNetworkError(error, {
          title: 'Connection Problem',
          description: message,
        });
        break;

      case 'VALIDATION_ERROR':
        toastValidationError(message, {
          title: 'Invalid Input',
        });
        break;

      case 'AUTHENTICATION_ERROR':
        toastWarning(message, {
          title: 'Authentication Required',
        });
        break;

      case 'AUTHORIZATION_ERROR':
        toastWarning(message, {
          title: 'Access Denied',
        });
        break;

      case 'BUSINESS_LOGIC_ERROR':
        toastInfo(message, {
          title: 'Action Not Allowed',
        });
        break;

      default:
        toastErrorFromError(error, {
          title: 'Error',
          description: message,
        });
    }
  }

  /**
   * Generate contextual recovery actions based on error type
   */
  private generateRecoveryActions(error: StructuredError): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (error.type) {
      case 'NETWORK_ERROR':
        actions.push(
          {
            label: 'Retry',
            action: () => window.location.reload(),
          },
          {
            label: 'Check Connection',
            action: () => this.checkNetworkConnection(),
            variant: 'outline',
          }
        );
        break;

      case 'AUTHENTICATION_ERROR':
        actions.push(
          {
            label: 'Login Again',
            action: () => this.redirectToLogin(),
          },
          {
            label: 'Refresh Session',
            action: () => this.refreshSession(),
            variant: 'outline',
          }
        );
        break;

      case 'AUTHORIZATION_ERROR':
        actions.push(
          {
            label: 'Go Back',
            action: () => window.history.back(),
            variant: 'outline',
          },
          {
            label: 'Contact Support',
            action: () => this.contactSupport(error),
            variant: 'outline',
          }
        );
        break;

      case 'VALIDATION_ERROR':
        actions.push(
          {
            label: 'Try Again',
            action: () => {}, // Will be handled by the form
            variant: 'outline',
          }
        );
        break;

      default:
        if (error.recoverable) {
          actions.push(
            {
              label: 'Retry',
              action: () => window.location.reload(),
            },
            {
              label: 'Report Issue',
              action: () => this.reportError(error),
              variant: 'outline',
            }
          );
        }
    }

    return actions;
  }

  /**
   * Check network connection status
   */
  private async checkNetworkConnection(): Promise<void> {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        toastInfo('Connection restored. You can try again now.', {
          title: 'Connection OK',
        });
      } else {
        toastWarning('Server is not responding. Please try again later.', {
          title: 'Server Issue',
        });
      }
    } catch (error) {
      toastWarning('Unable to connect to the server. Please check your internet connection.', {
        title: 'Connection Failed',
      });
    }
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }

  /**
   * Attempt to refresh user session
   */
  private async refreshSession(): Promise<void> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toastInfo('Session refreshed successfully.', {
          title: 'Session Restored',
        });
        // Optionally reload the page or retry the failed action
        setTimeout(() => window.location.reload(), 1000);
      } else {
        this.redirectToLogin();
      }
    } catch (error) {
      toastWarning('Unable to refresh session. Please login again.', {
        title: 'Session Refresh Failed',
      });
      this.redirectToLogin();
    }
  }

  /**
   * Open support contact form or redirect
   */
  private contactSupport(error: StructuredError): void {
    const subject = encodeURIComponent(`Error Report: ${error.id}`);
    const body = encodeURIComponent(
      `Error ID: ${error.id}\n` +
      `Error Type: ${error.type}\n` +
      `Message: ${error.message}\n` +
      `Timestamp: ${error.timestamp}\n` +
      `URL: ${window.location.href}\n\n` +
      `Please describe what you were doing when this error occurred:`
    );

    // Try to open email client
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  }

  /**
   * Report error to backend service
   */
  private async reportError(error: StructuredError): Promise<void> {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: error.id,
          type: error.type,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      toastInfo('Error report sent successfully. Thank you for helping us improve!', {
        title: 'Report Sent',
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      toastWarning('Unable to send error report. Please try contacting support directly.', {
        title: 'Report Failed',
      });
    }
  }

  /**
   * Handle form validation errors specifically
   */
  handleValidationErrors(
    errors: Record<string, string[]>,
    options: ErrorFeedbackOptions = {}
  ): ErrorFeedbackResult {
    const errorMessage = this.formatValidationErrors(errors);
    
    if (options.showToast !== false) {
      toastValidationError(errorMessage, {
        title: 'Please correct the following errors:',
      });
    }

    return {
      errorId: `validation_${Date.now()}`,
      userMessage: errorMessage,
      recoveryActions: [],
      canRetry: true,
    };
  }

  /**
   * Format validation errors for display
   */
  private formatValidationErrors(errors: Record<string, string[]>): string {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${fieldName}: ${messages.join(', ')}`;
      })
      .join('\n');

    return errorMessages || 'Please check your input and try again.';
  }

  /**
   * Handle network-specific errors with retry logic
   */
  async handleNetworkError(
    error: unknown,
    retryFunction?: () => Promise<void>,
    options: ErrorFeedbackOptions = {}
  ): Promise<ErrorFeedbackResult> {
    const result = await this.handleError(error, {
      ...options,
      showRecoveryOptions: true,
    });

    // Add retry action if provided
    if (retryFunction && result.canRetry) {
      result.recoveryActions.unshift({
        label: 'Retry Now',
        action: retryFunction,
      });
    }

    return result;
  }

  /**
   * Show success feedback
   */
  showSuccess(message: string, title?: string): void {
    toastInfo(message, { title: title || 'Success' });
  }

  /**
   * Show warning feedback
   */
  showWarning(message: string, title?: string): void {
    toastWarning(message, { title: title || 'Warning' });
  }

  /**
   * Show info feedback
   */
  showInfo(message: string, title?: string): void {
    toastInfo(message, { title: title || 'Information' });
  }
}

// Export singleton instance
export const errorFeedback = ErrorFeedbackSystem.getInstance();

// Convenience functions
export const handleError = errorFeedback.handleError.bind(errorFeedback);
export const handleValidationErrors = errorFeedback.handleValidationErrors.bind(errorFeedback);
export const handleNetworkError = errorFeedback.handleNetworkError.bind(errorFeedback);
export const showSuccess = errorFeedback.showSuccess.bind(errorFeedback);
export const showWarning = errorFeedback.showWarning.bind(errorFeedback);
export const showInfo = errorFeedback.showInfo.bind(errorFeedback);