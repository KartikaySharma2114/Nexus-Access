/**
 * Client-side error handling utilities
 */

export interface ClientError {
  message: string;
  code?: string | number;
  statusCode?: number;
  details?: unknown;
  recoverable?: boolean;
}

/**
 * Parse API error response and return user-friendly error
 */
export function parseAPIError(error: unknown): ClientError {
  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      recoverable: true,
    };
  }

  // Handle API response errors
  if (error && typeof error === 'object' && ('error' in error || 'message' in error)) {
    const apiError = error as Record<string, unknown>;
    return {
      message: (apiError.message as string) || (apiError.error as string),
      code: apiError.code as string | number,
      statusCode: (apiError.statusCode as number) || 500,
      details: apiError.details,
      recoverable: (apiError.statusCode as number) !== 403 && (apiError.statusCode as number) !== 401,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message,
      recoverable: true,
    };
  }

  // Fallback for unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    recoverable: true,
  };
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  const clientError = parseAPIError(error);
  return clientError.message;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const clientError = parseAPIError(error);
  return clientError.recoverable !== false;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown, context?: string): string {
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
