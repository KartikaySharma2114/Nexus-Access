import type { PostgrestError } from '@supabase/supabase-js';

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  statusCode?: number;
  userMessage?: string;
  recoverable?: boolean;
}

export interface APIError {
  error: string;
  message?: string;
  details?: any;
  code?: string | number;
  statusCode: number;
  timestamp?: string;
  path?: string;
}

export function handleDatabaseError(error: PostgrestError): DatabaseError {
  const dbError = new Error(error.message) as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  dbError.recoverable = true; // Most database errors are recoverable

  // Provide user-friendly error messages for common errors
  switch (error.code) {
    case '23505': // unique_violation
      if (error.details?.includes('permissions_name_key')) {
        dbError.message = 'A permission with this name already exists';
        dbError.userMessage = 'Please choose a different permission name.';
        dbError.statusCode = 409;
      } else if (error.details?.includes('roles_name_key')) {
        dbError.message = 'A role with this name already exists';
        dbError.userMessage = 'Please choose a different role name.';
        dbError.statusCode = 409;
      } else {
        dbError.message = 'This record already exists';
        dbError.userMessage =
          'A record with these details already exists. Please modify your input.';
        dbError.statusCode = 409;
      }
      break;
    case '23503': // foreign_key_violation
      dbError.message =
        'Cannot delete this record because it is referenced by other records';
      dbError.userMessage =
        'This item cannot be deleted because it is being used elsewhere. Remove all references first.';
      dbError.statusCode = 409;
      break;
    case '42501': // insufficient_privilege
      dbError.message = 'You do not have permission to perform this action';
      dbError.userMessage =
        'Access denied. Please contact your administrator if you believe this is an error.';
      dbError.statusCode = 403;
      dbError.recoverable = false;
      break;
    case 'PGRST116': // not_found
      dbError.message = 'The requested record was not found';
      dbError.userMessage =
        'The item you are looking for no longer exists or has been moved.';
      dbError.statusCode = 404;
      break;
    case '23514': // check_violation
      dbError.message = 'Data validation failed';
      dbError.userMessage =
        'The provided data does not meet the required format or constraints.';
      dbError.statusCode = 400;
      break;
    case '08006': // connection_failure
      dbError.message = 'Database connection failed';
      dbError.userMessage =
        'Unable to connect to the database. Please try again in a moment.';
      dbError.statusCode = 503;
      break;
    case '53300': // too_many_connections
      dbError.message = 'Too many database connections';
      dbError.userMessage =
        'The system is currently busy. Please try again in a few moments.';
      dbError.statusCode = 503;
      break;
    default:
      // Keep the original error message for unknown errors
      dbError.statusCode = 500;
      dbError.userMessage =
        'An unexpected database error occurred. Please try again.';
      break;
  }

  return dbError;
}

export function createAPIError(
  message: string,
  statusCode: number = 500,
  details?: any,
  code?: string | number
): APIError {
  return {
    error: message,
    message: getUserFriendlyMessage(message, statusCode),
    details,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

export function getUserFriendlyMessage(
  error: string,
  statusCode: number
): string {
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
    {
      pattern: /timeout|connection/i,
      message: 'The request timed out. Please try again.',
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
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'An internal server error occurred. Please try again.';
    case 502:
      return 'The server is temporarily unavailable. Please try again.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

export function formatAPIResponse(
  data?: any,
  message?: string,
  statusCode: number = 200
) {
  const response: any = {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return response;
}

export function formatAPIError(
  error: string | Error,
  statusCode: number = 500,
  details?: any,
  path?: string
): APIError {
  const message = error instanceof Error ? error.message : error;

  return {
    error: message,
    message: getUserFriendlyMessage(message, statusCode),
    details,
    statusCode,
    timestamp: new Date().toISOString(),
    path,
  };
}

// Type guards
export function isDuplicateError(error: DatabaseError): boolean {
  return error.code === '23505';
}

export function isForeignKeyError(error: DatabaseError): boolean {
  return error.code === '23503';
}

export function isPermissionError(error: DatabaseError): boolean {
  return error.code === '42501';
}

export function isNotFoundError(error: DatabaseError): boolean {
  return error.code === 'PGRST116';
}

export function isConnectionError(error: DatabaseError): boolean {
  return error.code === '08006' || error.code === '53300';
}

export function isValidationError(error: DatabaseError): boolean {
  return error.code === '23514';
}

// Error recovery suggestions
export function getRecoverySuggestions(error: DatabaseError): string[] {
  const suggestions: string[] = [];

  if (isDuplicateError(error)) {
    suggestions.push('Try using a different name');
    suggestions.push('Check if a similar item already exists');
  }

  if (isForeignKeyError(error)) {
    suggestions.push('Remove all references to this item first');
    suggestions.push('Check which other items are using this');
  }

  if (isPermissionError(error)) {
    suggestions.push('Contact your administrator for access');
    suggestions.push('Try logging out and back in');
  }

  if (isNotFoundError(error)) {
    suggestions.push('Refresh the page to see current data');
    suggestions.push('Check if the item was moved or deleted');
  }

  if (isConnectionError(error)) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try again in a few moments');
    suggestions.push('Contact support if the problem persists');
  }

  if (suggestions.length === 0) {
    suggestions.push('Try refreshing the page');
    suggestions.push('Contact support if the problem continues');
  }

  return suggestions;
}
