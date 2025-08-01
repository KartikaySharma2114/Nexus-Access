/**
 * Security utilities for input sanitization and validation
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize permission/role names
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
    .substring(0, 100); // Limit length
}

/**
 * Rate limiting store (in-memory for simplicity)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting check
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // Reset or initialize
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Generate secure audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLog(
  action: string,
  resource: string,
  options: {
    userId?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    action: sanitizeInput(action),
    resource: sanitizeInput(resource),
    userId: options.userId ? sanitizeInput(options.userId) : undefined,
    resourceId: options.resourceId
      ? sanitizeInput(options.resourceId)
      : undefined,
    details: options.details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent ? sanitizeInput(options.userAgent) : undefined,
  };
}

/**
 * Log audit entry (in production, this would go to a secure logging service)
 */
export function logAuditEntry(entry: AuditLogEntry): void {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('AUDIT:', JSON.stringify(entry, null, 2));
  }

  // In production, send to secure logging service
  // This could be sent to services like DataDog, Splunk, etc.
}

/**
 * Validate session and extract user info
 */
export function validateSession(session: any): {
  valid: boolean;
  userId?: string;
  email?: string;
} {
  if (!session?.user?.id) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: session.user.id,
    email: session.user.email,
  };
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
} as const;
