import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  handleDatabaseError,
  formatAPIError,
  createAPIError,
} from '@/lib/supabase/errors';
import type { DatabaseError } from '@/lib/supabase/errors';

interface APIHandlerOptions {
  requireAuth?: boolean;
  validateBody?: z.ZodSchema<any>;
  validateQuery?: z.ZodSchema<any>;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

interface APIContext {
  request: NextRequest;
  params?: Record<string, string>;
  body?: any;
  query?: any;
  user?: any;
}

type APIHandler = (context: APIContext) => Promise<NextResponse>;

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user ID for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `rate_limit:${ip}`;
}

function checkRateLimit(
  request: NextRequest,
  options: { requests: number; windowMs: number }
): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < windowStart) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now });
    return true;
  }

  if (current.count >= options.requests) {
    return false;
  }

  current.count++;
  return true;
}

export function withErrorHandling(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ) => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      // Rate limiting
      if (options.rateLimit) {
        const allowed = checkRateLimit(request, options.rateLimit);
        if (!allowed) {
          return NextResponse.json(
            createAPIError('Too many requests', 429, {
              retryAfter: Math.ceil(options.rateLimit.windowMs / 1000),
            }),
            { status: 429 }
          );
        }
      }

      // Parse and validate request body
      let body;
      if (
        options.validateBody &&
        (method === 'POST' || method === 'PUT' || method === 'PATCH')
      ) {
        try {
          const rawBody = await request.json();
          const validation = options.validateBody.safeParse(rawBody);

          if (!validation.success) {
            return NextResponse.json(
              createAPIError('Invalid request body', 400, {
                validationErrors: validation.error.errors.map((err) => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code,
                })),
              }),
              { status: 400 }
            );
          }

          body = validation.data;
        } catch (error) {
          return NextResponse.json(
            createAPIError('Invalid JSON in request body', 400),
            { status: 400 }
          );
        }
      }

      // Parse and validate query parameters
      let query;
      if (options.validateQuery) {
        const searchParams = new URL(request.url).searchParams;
        const queryObject = Object.fromEntries(searchParams.entries());

        const validation = options.validateQuery.safeParse(queryObject);
        if (!validation.success) {
          return NextResponse.json(
            createAPIError('Invalid query parameters', 400, {
              validationErrors: validation.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
              })),
            }),
            { status: 400 }
          );
        }

        query = validation.data;
      }

      // TODO: Add authentication check if required
      // if (options.requireAuth) {
      //   const user = await getCurrentUser(request);
      //   if (!user) {
      //     return NextResponse.json(
      //       createAPIError('Authentication required', 401),
      //       { status: 401 }
      //     );
      //   }
      // }

      // Call the actual handler
      const apiContext: APIContext = {
        request,
        params: context?.params,
        body,
        query,
        // user,
      };

      const response = await handler(apiContext);

      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`${method} ${url} - ${response.status} (${duration}ms)`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error details
      console.error(`API Error in ${method} ${url}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString(),
      });

      // Handle different types of errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createAPIError('Validation failed', 400, {
            validationErrors: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          }),
          { status: 400 }
        );
      }

      // Handle database errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as DatabaseError;
        const statusCode = dbError.statusCode || 500;

        return NextResponse.json(
          formatAPIError(
            dbError.message,
            statusCode,
            {
              code: dbError.code,
              details: dbError.details,
              hint: dbError.hint,
              recoverable: dbError.recoverable,
            },
            url
          ),
          { status: statusCode }
        );
      }

      // Handle generic errors
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      const statusCode = 500;

      return NextResponse.json(
        formatAPIError(errorMessage, statusCode, undefined, url),
        { status: statusCode }
      );
    }
  };
}

// Utility function for consistent success responses
export function createSuccessResponse(
  data?: any,
  message?: string,
  statusCode: number = 200
) {
  const response: any = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status: statusCode });
}

// Utility function for handling async operations with error boundaries
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    console.error(`Safe async operation failed: ${message}`, error);
    return { data: null, error: message };
  }
}

// Utility for retrying operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
