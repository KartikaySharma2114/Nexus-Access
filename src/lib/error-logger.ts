/**
 * Structured error logging utilities
 */

import type { StructuredError, ErrorContext } from './error-utils';

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  errorId?: string;
  userId?: string;
  sessionId?: string;
  context?: ErrorContext;
  metadata?: Record<string, unknown>;
}

export interface ErrorReporter {
  name: string;
  report: (error: StructuredError) => Promise<void> | void;
  enabled: boolean;
}

/**
 * Enhanced error logger with multiple output targets
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private reporters: ErrorReporter[] = [];
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private constructor() {
    // Add default console reporter
    this.addReporter({
      name: 'console',
      enabled: true,
      report: this.consoleReporter.bind(this),
    });

    // Add browser storage reporter for client-side errors
    if (typeof window !== 'undefined') {
      this.addReporter({
        name: 'localStorage',
        enabled: true,
        report: this.localStorageReporter.bind(this),
      });
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Add error reporter
   */
  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  /**
   * Remove error reporter
   */
  removeReporter(name: string): void {
    this.reporters = this.reporters.filter((r) => r.name !== name);
  }

  /**
   * Enable/disable reporter
   */
  setReporterEnabled(name: string, enabled: boolean): void {
    const reporter = this.reporters.find((r) => r.name === name);
    if (reporter) {
      reporter.enabled = enabled;
    }
  }

  /**
   * Log structured error
   */
  async logError(error: StructuredError): Promise<void> {
    const logEntry: LogEntry = {
      level: this.getLogLevel(error.type),
      message: `[${error.type}] ${error.id}: ${error.message}`,
      timestamp: error.timestamp,
      errorId: error.id,
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      context: error.context,
      metadata: {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        recoverable: error.recoverable,
        userMessage: error.userMessage,
        stack: error.stack,
        details: error.details,
      },
    };

    // Add to buffer
    this.addToBuffer(logEntry);

    // Report to all enabled reporters
    const reportPromises = this.reporters
      .filter((reporter) => reporter.enabled)
      .map(async (reporter) => {
        try {
          await reporter.report(error);
        } catch (reportError) {
          console.error(`Reporter ${reporter.name} failed:`, reportError);
        }
      });

    await Promise.allSettled(reportPromises);
  }

  /**
   * Get log level based on error type
   */
  private getLogLevel(errorType: string): 'error' | 'warn' | 'info' | 'debug' {
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
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Console reporter
   */
  private consoleReporter(error: StructuredError): void {
    const logData = {
      errorId: error.id,
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      recoverable: error.recoverable,
      timestamp: error.timestamp,
    };

    const logMessage = `[${error.type}] ${error.id}: ${error.message}`;

    switch (this.getLogLevel(error.type)) {
      case 'error':
        console.error(logMessage, logData);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      case 'debug':
        console.debug(logMessage, logData);
        break;
    }
  }

  /**
   * Local storage reporter for client-side error persistence
   */
  private localStorageReporter(error: StructuredError): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const storageKey = 'error_logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const errorLog = {
        id: error.id,
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        timestamp: error.timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: error.context,
      };

      existingLogs.push(errorLog);

      // Keep only last 50 errors
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(recentLogs));
    } catch (storageError) {
      console.warn('Failed to store error in localStorage:', storageError);
    }
  }

  /**
   * Create external service reporter (e.g., Sentry, LogRocket)
   */
  createExternalReporter(
    name: string,
    reportFunction: (error: StructuredError) => Promise<void> | void
  ): ErrorReporter {
    return {
      name,
      enabled: true,
      report: reportFunction,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    recent: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const stats = {
      total: this.logBuffer.length,
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      recent: 0,
    };

    this.logBuffer.forEach((entry) => {
      // Count by level
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;

      // Count recent errors (last hour)
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime > oneHourAgo) {
        stats.recent++;
      }

      // Count by type (from metadata)
      const errorType = entry.metadata?.type as string;
      if (errorType) {
        stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
      }
    });

    return stats;
  }
}

/**
 * Convenience function to get error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  return ErrorLogger.getInstance();
}

/**
 * Setup error reporting for external services
 */
export function setupErrorReporting(): void {
  const logger = ErrorLogger.getInstance();

  // Example: Add Sentry reporter (if Sentry is configured)
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    logger.addReporter({
      name: 'sentry',
      enabled: true,
      report: (error: StructuredError) => {
        (window as any).Sentry.captureException(new Error(error.message), {
          tags: {
            errorId: error.id,
            errorType: error.type,
          },
          extra: {
            userMessage: error.userMessage,
            context: error.context,
            details: error.details,
          },
          level: error.type === 'SYSTEM_ERROR' ? 'error' : 'warning',
        });
      },
    });
  }

  // Example: Add custom API reporter for server-side logging
  if (typeof window !== 'undefined') {
    logger.addReporter({
      name: 'api',
      enabled: process.env.NODE_ENV === 'production',
      report: async (error: StructuredError) => {
        try {
          await fetch('/api/errors', {
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
            }),
          });
        } catch (reportError) {
          console.warn('Failed to report error to API:', reportError);
        }
      },
    });
  }
}
