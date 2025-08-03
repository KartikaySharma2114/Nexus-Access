/**
 * Validation middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ErrorHandler } from '../error-utils';
import { handleValidationError } from '../api-error-handler';

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
  skipValidation?: boolean;
  sanitizeInput?: boolean;
  logValidationErrors?: boolean;
}

export interface ValidatedRequest extends NextRequest {
  validatedData: {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
  };
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware(options: ValidationOptions) {
  return async function validationMiddleware(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse | null> {
    if (options.skipValidation) {
      return null; // Continue to next middleware/handler
    }

    const errorHandler = ErrorHandler.getInstance();
    const validatedData: any = {};

    try {
      // Validate request body
      if (options.body) {
        let body;
        try {
          const contentType = request.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            body = await request.json();
          } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
          } else {
            body = {};
          }
        } catch (error) {
          return handleValidationError(
            { body: ['Invalid request body format'] },
            {
              url: request.url,
              userAgent: request.headers.get('user-agent') || undefined,
            }
          );
        }

        if (options.sanitizeInput) {
          body = sanitizeObject(body);
        }

        const bodyResult = options.body.safeParse(body);
        if (!bodyResult.success) {
          const errors = formatZodErrors(bodyResult.error);
          if (options.logValidationErrors) {
            errorHandler.handleValidationError(errors, {
              url: request.url,
              component: 'ValidationMiddleware',
              action: 'validateBody',
            });
          }
          return handleValidationError(errors);
        }
        validatedData.body = bodyResult.data;
      }

      // Validate query parameters
      if (options.query) {
        const url = new URL(request.url);
        const query = Object.fromEntries(url.searchParams.entries());

        // Convert string values to appropriate types
        let processedQuery = processQueryParams(query);

        if (options.sanitizeInput) {
          processedQuery = sanitizeObject(processedQuery);
        }

        const queryResult = options.query.safeParse(processedQuery);
        if (!queryResult.success) {
          const errors = formatZodErrors(queryResult.error);
          if (options.logValidationErrors) {
            errorHandler.handleValidationError(errors, {
              url: request.url,
              component: 'ValidationMiddleware',
              action: 'validateQuery',
            });
          }
          return handleValidationError(errors);
        }
        validatedData.query = queryResult.data;
      }

      // Validate route parameters
      if (options.params && context?.params) {
        if (options.sanitizeInput) {
          context.params = sanitizeObject(context.params);
        }

        const paramsResult = options.params.safeParse(context.params);
        if (!paramsResult.success) {
          const errors = formatZodErrors(paramsResult.error);
          if (options.logValidationErrors) {
            errorHandler.handleValidationError(errors, {
              url: request.url,
              component: 'ValidationMiddleware',
              action: 'validateParams',
            });
          }
          return handleValidationError(errors);
        }
        validatedData.params = paramsResult.data;
      }

      // Validate headers
      if (options.headers) {
        const headers = Object.fromEntries(request.headers.entries());

        const headersResult = options.headers.safeParse(headers);
        if (!headersResult.success) {
          const errors = formatZodErrors(headersResult.error);
          if (options.logValidationErrors) {
            errorHandler.handleValidationError(errors, {
              url: request.url,
              component: 'ValidationMiddleware',
              action: 'validateHeaders',
            });
          }
          return handleValidationError(errors);
        }
        validatedData.headers = headersResult.data;
      }

      // Attach validated data to request
      (request as ValidatedRequest).validatedData = validatedData;

      return null; // Continue to next middleware/handler
    } catch (error) {
      const structuredError = errorHandler.handleErrorSync(error, {
        url: request.url,
        component: 'ValidationMiddleware',
        action: 'validation',
      });

      return NextResponse.json(
        {
          error: 'Validation middleware error',
          message: structuredError.userMessage,
          timestamp: structuredError.timestamp,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Format Zod validation errors into a more user-friendly format
 */
function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    const key = path || 'root';

    if (!errors[key]) {
      errors[key] = [];
    }

    errors[key].push(issue.message);
  });

  return errors;
}

/**
 * Process query parameters and convert string values to appropriate types
 */
function processQueryParams(query: Record<string, string>): Record<string, any> {
  const processed: Record<string, any> = {};

  for (const [key, value] of Object.entries(query)) {
    // Handle boolean values
    if (value === 'true') {
      processed[key] = true;
    } else if (value === 'false') {
      processed[key] = false;
    }
    // Handle numeric values
    else if (/^\d+$/.test(value)) {
      processed[key] = parseInt(value, 10);
    } else if (/^\d*\.\d+$/.test(value)) {
      processed[key] = parseFloat(value);
    }
    // Handle array values (comma-separated)
    else if (value.includes(',')) {
      processed[key] = value.split(',').map(v => v.trim());
    }
    // Handle null/undefined
    else if (value === 'null') {
      processed[key] = null;
    } else if (value === 'undefined') {
      processed[key] = undefined;
    }
    // Keep as string
    else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Sanitize object by removing potentially dangerous content
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string input
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate request body only
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware({
    body: schema,
    sanitizeInput: true,
    logValidationErrors: true,
  });
}

/**
 * Validate query parameters only
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware({
    query: schema,
    sanitizeInput: true,
    logValidationErrors: true,
  });
}

/**
 * Validate route parameters only
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware({
    params: schema,
    sanitizeInput: true,
    logValidationErrors: true,
  });
}

/**
 * Validate headers only
 */
export function validateHeaders<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware({
    headers: schema,
    logValidationErrors: true,
  });
}

/**
 * Create a combined validation middleware
 */
export function validate(options: ValidationOptions) {
  return createValidationMiddleware({
    ...options,
    sanitizeInput: options.sanitizeInput ?? true,
    logValidationErrors: options.logValidationErrors ?? true,
  });
}

/**
 * Higher-order function to wrap API handlers with validation
 */
export function withValidation<R>(
  validationOptions: ValidationOptions,
  handler: (request: NextRequest, context: any) => Promise<R>
) {
  return async function validatedHandler(request: NextRequest, context: any): Promise<R> {
    
    const validationMiddleware = createValidationMiddleware(validationOptions);
    const validationResult = await validationMiddleware(request, context);
    
    if (validationResult) {
      // Validation failed, return error response
      return validationResult as R;
    }
    
    // Validation passed, call original handler
    return handler(request, context);
  };
}

/**
 * Utility to extract validated data from request
 */
export function getValidatedData(request: NextRequest) {
  return (request as ValidatedRequest).validatedData || {};
}

/**
 * Type-safe helper to get validated body
 */
export function getValidatedBody<T>(request: NextRequest): T {
  const data = getValidatedData(request);
  return data.body as T;
}

/**
 * Type-safe helper to get validated query
 */
export function getValidatedQuery<T>(request: NextRequest): T {
  const data = getValidatedData(request);
  return data.query as T;
}

/**
 * Type-safe helper to get validated params
 */
export function getValidatedParams<T>(request: NextRequest): T {
  const data = getValidatedData(request);
  return data.params as T;
}

/**
 * Type-safe helper to get validated headers
 */
export function getValidatedHeaders<T>(request: NextRequest): T {
  const data = getValidatedData(request);
  return data.headers as T;
}