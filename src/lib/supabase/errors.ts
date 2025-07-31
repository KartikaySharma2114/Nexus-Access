import type { PostgrestError } from '@supabase/supabase-js';

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

export function handleDatabaseError(error: PostgrestError): DatabaseError {
  const dbError = new Error(error.message) as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;

  // Provide user-friendly error messages for common errors
  switch (error.code) {
    case '23505': // unique_violation
      if (error.details?.includes('permissions_name_key')) {
        dbError.message = 'A permission with this name already exists';
      } else if (error.details?.includes('roles_name_key')) {
        dbError.message = 'A role with this name already exists';
      } else {
        dbError.message = 'This record already exists';
      }
      break;
    case '23503': // foreign_key_violation
      dbError.message =
        'Cannot delete this record because it is referenced by other records';
      break;
    case '42501': // insufficient_privilege
      dbError.message = 'You do not have permission to perform this action';
      break;
    case 'PGRST116': // not_found
      dbError.message = 'The requested record was not found';
      break;
    default:
      // Keep the original error message for unknown errors
      break;
  }

  return dbError;
}

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
