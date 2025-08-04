/**
 * Client-side error handling utilities
 */

export interface ClientError {
  message: string;
  code?: string | number;
  statusCode?: number;
  details?: unknown;
  recoverable?: boolean;
  timestamp?: string;
  errorId?: string;
  context?: string;
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export type ErrorType =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'DATABASE_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'SYSTEM_ERROR'
  | 'UNKNOWN_ERROR';

export interface StructuredError {
  id: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string | number;
  statusCode?: number;
  details?: unknown;
  context?: ErrorContext;
  timestamp: string;
  recoverable: boolean;
  stack?: string;
}

/**
 * Parse API error response and return user-friendly error
 * @deprecated Use ErrorHandler.getInstance().processError() instead
 */
export function parseAPIError(error: unknown): ClientError {
  const errorHandler = ErrorHandler.getInstance();
  const structuredError = errorHandler.processError(error);

  return {
    message: structuredError.userMessage,
    code: structuredError.code,
    statusCode: structuredError.statusCode,
    details: structuredError.details,
    recoverable: structuredError.recoverable,
    timestamp: structuredError.timestamp,
    errorId: structuredError.id,
    context: structuredError.context?.component,
  };
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  const errorHandler = ErrorHandler.getInstance();
  const structuredError = errorHandler.processError(error);
  return structuredError.userMessage;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const errorHandler = ErrorHandler.getInstance();
  const structuredError = errorHandler.processError(error);
  return structuredError.recoverable;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(
  error: unknown,
  context?: string
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';

  if (error instanceof Error) {
    return `${timestamp}${contextStr} ${error.name}: ${error.message}\n${error.stack}`;
  }

  return `${timestamp}${contextStr} ${JSON.stringify(error, null, 2)}`;
}

/**
 * Safe error logging that won't throw
 */
export function logError(error: unknown, context?: string): void {
  try {
    const formattedError = formatErrorForLogging(error, context);
    console.error(formattedError);
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Centralized Error Handler Class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReporters: Array<(error: StructuredError) => void> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Add error reporter (e.g., for external logging services)
   */
  addReporter(reporter: (error: StructuredError) => void): void {
    this.errorReporters.push(reporter);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Determine error type from error object
   */
  private determineErrorType(error: unknown): ErrorType {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;

      // Check for explicit error names first
      if (errorObj.name === 'ValidationError') return 'VALIDATION_ERROR';
      if (errorObj.name === 'AuthenticationError')
        return 'AUTHENTICATION_ERROR';
      if (errorObj.name === 'AuthorizationError') return 'AUTHORIZATION_ERROR';
      if (errorObj.name === 'DatabaseError') return 'DATABASE_ERROR';

      // Check status codes
      if (errorObj.statusCode === 401) return 'AUTHENTICATION_ERROR';
      if (errorObj.statusCode === 403) return 'AUTHORIZATION_ERROR';
      if (errorObj.statusCode === 400 || errorObj.statusCode === 422)
        return 'VALIDATION_ERROR';

      // Check database error codes
      if (
        errorObj.code &&
        typeof errorObj.code === 'string' &&
        errorObj.code.startsWith('23')
      ) {
        return 'DATABASE_ERROR';
      }
    }

    if (error instanceof Error) {
      if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
      if (error.name === 'AuthenticationError') return 'AUTHENTICATION_ERROR';
      if (error.name === 'AuthorizationError') return 'AUTHORIZATION_ERROR';
      if (error.name === 'DatabaseError') return 'DATABASE_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly message based on error type and details
   */
  private getUserFriendlyMessage(error: unknown, errorType: ErrorType): string {
    const errorMessages: Record<ErrorType, string> = {
      NETWORK_ERROR:
        'Network connection failed. Please check your internet connection and try again.',
      VALIDATION_ERROR:
        'The information provided is not valid. Please check your input and try again.',
      AUTHENTICATION_ERROR: 'Please log in to continue.',
      AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
      DATABASE_ERROR:
        'A data error occurred. Please try again or contact support if the problem persists.',
      BUSINESS_LOGIC_ERROR:
        'This action cannot be completed due to business rules. Please review your request.',
      SYSTEM_ERROR:
        'A system error occurred. Please try again later or contact support.',
      UNKNOWN_ERROR:
        'An unexpected error occurred. Please try again or contact support if the problem persists.',
    };

    // Try to extract specific message from error object
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.message && typeof errorObj.message === 'string') {
        // For API errors, use the provided user-friendly message
        if (errorObj.statusCode && errorObj.message !== errorObj.error) {
          return errorObj.message;
        }
      }
    }

    return errorMessages[errorType];
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(errorType: ErrorType, statusCode?: number): boolean {
    // Non-recoverable errors
    if (errorType === 'AUTHORIZATION_ERROR') return false;
    if (statusCode === 403) return false;

    // Authentication errors are recoverable (user can log in)
    if (errorType === 'AUTHENTICATION_ERROR') return true;

    // Most other errors are recoverable
    return true;
  }

  /**
   * Process and structure an error
   */
  processError(error: unknown, context?: ErrorContext): StructuredError {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    const errorType = this.determineErrorType(error);

    let message = 'Unknown error';
    let code: string | number | undefined;
    let statusCode: number | undefined;
    let details: unknown;
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      message =
        (errorObj.message as string) || (errorObj.error as string) || message;
      code = errorObj.code as string | number;
      statusCode = errorObj.statusCode as number;
      details = errorObj.details;
    }

    const userMessage = this.getUserFriendlyMessage(error, errorType);
    const recoverable = this.isRecoverable(errorType, statusCode);

    const structuredError: StructuredError = {
      id: errorId,
      type: errorType,
      message,
      userMessage,
      code,
      statusCode,
      details,
      context,
      timestamp,
      recoverable,
      stack,
    };

    return structuredError;
  }

  /**
   * Handle error with logging and reporting
   */
  async handleError(
    error: unknown,
    context?: ErrorContext
  ): Promise<StructuredError> {
    const structuredError = this.processError(error, context);

    // Log error using the centralized logger
    try {
      const { getErrorLogger } = await import('./error-logger');
      const logger = getErrorLogger();
      await logger.logError(structuredError);
    } catch (loggerError) {
      // Fallback to basic logging if error logger fails
      this.logStructuredError(structuredError);
    }

    // Report to legacy reporters for backward compatibility
    this.errorReporters.forEach((reporter) => {
      try {
        reporter(structuredError);
      } catch (reportingError) {
        console.error('Error reporter failed:', reportingError);
      }
    });

    return structuredError;
  }

  /**
   * Synchronous version of handleError for cases where async is not possible
   */
  handleErrorSync(error: unknown, context?: ErrorContext): StructuredError {
    const structuredError = this.processError(error, context);

    // Log error synchronously
    this.logStructuredError(structuredError);

    // Report to external services
    this.errorReporters.forEach((reporter) => {
      try {
        reporter(structuredError);
      } catch (reportingError) {
        console.error('Error reporter failed:', reportingError);
      }
    });

    return structuredError;
  }

  /**
   * Log structured error with proper formatting
   */
  private logStructuredError(error: StructuredError): void {
    const logLevel = this.getLogLevel(error.type);
    const logMessage = `[${error.type}] ${error.id}: ${error.message}`;

    const logData = {
      errorId: error.id,
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      timestamp: error.timestamp,
      recoverable: error.recoverable,
      stack: error.stack,
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  /**
   * Determine log level based on error type
   */
  private getLogLevel(
    errorType: ErrorType
  ): 'error' | 'warn' | 'info' | 'debug' {
    switch (errorType) {
      case 'SYSTEM_ERROR':
      case 'DATABASE_ERROR':
        return 'error';
      case 'BUSINESS_LOGIC_ERROR':
      case 'UNKNOWN_ERROR':
        return 'warn';
      case 'VALIDATION_ERROR':
      case 'NETWORK_ERROR':
        return 'info';
      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
        return 'debug';
      default:
        return 'info';
    }
  }

  /**
   * Create error context from browser environment
   */
  static createBrowserContext(
    component?: string,
    action?: string
  ): ErrorContext {
    if (typeof window === 'undefined') {
      return { component, action };
    }

    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      component,
      action,
      sessionId: sessionStorage.getItem('sessionId') || undefined,
    };
  }

  /**
   * Handle network errors specifically
   */
  handleNetworkError(error: unknown, context?: ErrorContext): StructuredError {
    const networkContext = {
      ...context,
      metadata: {
        ...context?.metadata,
        networkStatus:
          typeof navigator !== 'undefined'
            ? navigator.onLine
              ? 'online'
              : 'offline'
            : 'unknown',
        connectionType:
          typeof navigator !== 'undefined'
            ? (navigator as any).connection?.effectiveType || 'unknown'
            : 'unknown',
      },
    };

    return this.handleErrorSync(error, networkContext);
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationError(
    errors: Record<string, string[]> | string,
    context?: ErrorContext
  ): StructuredError {
    const validationError = {
      name: 'ValidationError',
      message: typeof errors === 'string' ? errors : 'Validation failed',
      details: typeof errors === 'object' ? errors : undefined,
    };

    return this.handleErrorSync(validationError, context);
  }
}
