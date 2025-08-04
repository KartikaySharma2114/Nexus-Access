/**
 * API Error handling utilities for server-side operations
 */

import { NextResponse } from 'next/server';
import { ErrorHandler, type ErrorContext } from './error-utils';
import { getErrorLogger } from './error-logger';

export interface APIErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  code?: string | number;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface DatabaseErrorInfo {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

/**
 * Enhanced database error mapping with more comprehensive coverage
 */
const DATABASE_ERROR_MAPPINGS: Record<
  string,
  { message: string; statusCode: number; userMessage: string }
> = {
  // Constraint violations
  '23505': {
    message: 'Duplicate entry',
    statusCode: 409,
    userMessage:
      'A record with this information already exists. Please use different values.',
  },
  '23503': {
    message: 'Reference constraint violation',
    statusCode: 409,
    userMessage:
      'Cannot delete this record because it is being used by other records.',
  },
  '23502': {
    message: 'Not null violation',
    statusCode: 400,
    userMessage:
      'Required information is missing. Please fill in all required fields.',
  },
  '23514': {
    message: 'Check constraint violation',
    statusCode: 400,
    userMessage: 'The provided data does not meet the required criteria.',
  },

  // Permission errors
  '42501': {
    message: 'Insufficient privilege',
    statusCode: 403,
    userMessage: 'You do not have permission to perform this action.',
  },
  '42601': {
    message: 'Syntax error',
    statusCode: 500,
    userMessage:
      'A system error occurred. Please try again or contact support.',
  },

  // Connection and system errors
  '08000': {
    message: 'Connection exception',
    statusCode: 503,
    userMessage: 'Database connection failed. Please try again in a moment.',
  },
  '08003': {
    message: 'Connection does not exist',
    statusCode: 503,
    userMessage:
      'Database connection lost. Please refresh the page and try again.',
  },
  '08006': {
    message: 'Connection failure',
    statusCode: 503,
    userMessage: 'Unable to connect to the database. Please try again later.',
  },

  // PostgREST specific errors
  PGRST116: {
    message: 'Not found',
    statusCode: 404,
    userMessage: 'The requested record was not found.',
  },
  PGRST301: {
    message: 'Parsing error',
    statusCode: 400,
    userMessage: 'Invalid request format. Please check your input.',
  },
  PGRST302: {
    message: 'Invalid range',
    statusCode: 400,
    userMessage: 'Invalid data range specified.',
  },

  // Supabase specific errors
  SUPABASE_AUTH_ERROR: {
    message: 'Authentication error',
    statusCode: 401,
    userMessage: 'Authentication failed. Please log in again.',
  },
  SUPABASE_PERMISSION_ERROR: {
    message: 'Permission denied',
    statusCode: 403,
    userMessage: 'You do not have permission to access this resource.',
  },
};

/**
 * Handle database errors and convert to user-friendly messages
 */
export function _handleDatabaseError(
  error: DatabaseErrorInfo
): APIErrorResponse {
  const timestamp = new Date().toISOString();
  const errorCode = error.code || 'UNKNOWN';

  // Get mapping for known error codes
  const mapping = DATABASE_ERROR_MAPPINGS[errorCode];

  if (mapping) {
    return {
      error: mapping.message,
      message: mapping.userMessage,
      details: error.details,
      code: error.code,
      statusCode: mapping.statusCode,
      timestamp,
    };
  }

  // Handle unknown database errors
  return {
    error: 'Database error',
    message:
      error.message ||
      'An unexpected database error occurred. Please try again or contact support.',
    details: error.details,
    code: error.code,
    statusCode: 500,
    timestamp,
  };
}

/**
 * Create a standardized API error response with centralized error handling
 */
export function createAPIErrorResponse(
  error: unknown,
  statusCode?: number,
  context?: ErrorContext
): NextResponse {
  const errorHandler = ErrorHandler.getInstance();
  const structuredError = errorHandler.handleErrorSync(error, context);

  const errorResponse: APIErrorResponse = {
    error: structuredError.message,
    message: structuredError.userMessage,
    details: structuredError.details,
    code: structuredError.code,
    statusCode: statusCode || structuredError.statusCode || 500,
    timestamp: structuredError.timestamp,
    path: context?.url,
  };

  return NextResponse.json(errorResponse, {
    status: errorResponse.statusCode,
  });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createAPIErrorResponse with error object instead
 */
export function createLegacyAPIErrorResponse(
  message: string,
  statusCode = 500,
  details?: unknown,
  code?: string | number
): NextResponse {
  const errorResponse: APIErrorResponse = {
    error: message,
    message: getUserFriendlyMessage(message, statusCode),
    details,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Get user-friendly message based on error and status code
 */
function getUserFriendlyMessage(error: string, statusCode: number): string {
  // Map common error patterns to user-friendly messages
  const errorPatterns = [
    {
      pattern: /duplicate key|already exists/i,
      message: 'This item already exists. Please choose a different name.',
    },
    {
      pattern: /foreign key|referenced by/i,
      message:
        'This item cannot be deleted because it is being used elsewhere.',
    },
    {
      pattern: /not found|does not exist/i,
      message: 'The requested item could not be found.',
    },
    {
      pattern: /permission denied|insufficient privilege/i,
      message: 'You do not have permission to perform this action.',
    },
    {
      pattern: /validation|invalid/i,
      message:
        'The provided information is not valid. Please check your input.',
    },
  ];

  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(error)) {
      return message;
    }
  }

  // Default messages based on status code
  switch (statusCode) {
    case 400:
      return 'The request contains invalid data. Please check your input.';
    case 401:
      return 'You need to log in to perform this action.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'The provided data could not be processed.';
    case 500:
      return 'An internal server error occurred. Please try again.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Handle validation errors with centralized error handling
 */
export function handleValidationError(
  errors: Record<string, string[]> | string,
  context?: ErrorContext
): NextResponse {
  const errorHandler = ErrorHandler.getInstance();
  const validationError = errorHandler.handleValidationError(errors, context);

  return NextResponse.json(
    {
      error: validationError.message,
      message: validationError.userMessage,
      details: validationError.details,
      statusCode: 400,
      timestamp: validationError.timestamp,
    },
    { status: 400 }
  );
}

/**
 * Handle authentication errors with centralized error handling
 */
export function handleAuthError(
  message = 'Authentication required',
  context?: ErrorContext
): NextResponse {
  const authError = {
    name: 'AuthenticationError',
    message,
    statusCode: 401,
  };

  return createAPIErrorResponse(authError, 401, context);
}

/**
 * Handle authorization errors with centralized error handling
 */
export function handleAuthorizationError(
  message = 'Access denied',
  context?: ErrorContext
): NextResponse {
  const authzError = {
    name: 'AuthorizationError',
    message,
    statusCode: 403,
  };

  return createAPIErrorResponse(authzError, 403, context);
}

/**
 * Handle database errors with centralized error handling
 */
export function handleDatabaseError(
  error: DatabaseErrorInfo,
  context?: ErrorContext
): NextResponse {
  const dbError = {
    name: 'DatabaseError',
    message: error.message,
    code: error.code,
    details: error.details,
  };

  return createAPIErrorResponse(dbError, undefined, context);
}

/**
 * Handle network errors with centralized error handling
 */
export function handleNetworkError(
  error: unknown,
  context?: ErrorContext
): NextResponse {
  const errorHandler = ErrorHandler.getInstance();
  const networkError = errorHandler.handleNetworkError(error, context);

  return NextResponse.json(
    {
      error: networkError.message,
      message: networkError.userMessage,
      details: networkError.details,
      statusCode: networkError.statusCode || 503,
      timestamp: networkError.timestamp,
    },
    { status: networkError.statusCode || 503 }
  );
}
