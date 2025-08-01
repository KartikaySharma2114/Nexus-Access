/**
 * API Error handling utilities for server-side operations
 */

import { NextResponse } from 'next/server';

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
 * Handle database errors and convert to user-friendly messages
 */
export function handleDatabaseError(error: DatabaseErrorInfo): APIErrorResponse {
  const timestamp = new Date().toISOString();
  
  // Provide user-friendly error messages for common database errors
  switch (error.code) {
    case '23505': // unique_violation
      return {
        error: 'Duplicate entry',
        message: 'A record with this information already exists',
        details: error.details,
        code: error.code,
        statusCode: 409,
        timestamp,
      };
    case '23503': // foreign_key_violation
      return {
        error: 'Reference constraint violation',
        message: 'Cannot delete this record because it is referenced by other records',
        details: error.details,
        code: error.code,
        statusCode: 409,
        timestamp,
      };
    case '42501': // insufficient_privilege
      return {
        error: 'Access denied',
        message: 'You do not have permission to perform this action',
        details: error.details,
        code: error.code,
        statusCode: 403,
        timestamp,
      };
    case 'PGRST116': // not_found
      return {
        error: 'Not found',
        message: 'The requested record was not found',
        details: error.details,
        code: error.code,
        statusCode: 404,
        timestamp,
      };
    default:
      return {
        error: 'Database error',
        message: error.message || 'An unexpected database error occurred',
        details: error.details,
        code: error.code,
        statusCode: 500,
        timestamp,
      };
  }
}

/**
 * Create a standardized API error response
 */
export function createAPIErrorResponse(
  message: string,
  statusCode: number = 500,
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
      message: 'This item cannot be deleted because it is being used elsewhere.',
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
      message: 'The provided information is not valid. Please check your input.',
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
 * Handle validation errors
 */
export function handleValidationError(
  errors: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      message: 'The provided data is invalid',
      details: errors,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: 'Authentication failed',
      message,
      statusCode: 401,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      error: 'Authorization failed',
      message,
      statusCode: 403,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}