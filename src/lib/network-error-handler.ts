/**
 * Network error handling with retry logic and exponential backoff
 */

import { ErrorHandler, type ErrorContext } from './error-utils';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  timeout?: number;
}

export interface NetworkRequestOptions extends RequestInit {
  retry?: RetryOptions;
  timeout?: number;
  validateResponse?: (response: Response) => boolean;
  parseResponse?:
    | 'json'
    | 'text'
    | 'blob'
    | 'arrayBuffer'
    | 'formData'
    | 'none';
}

export interface NetworkResponse<T = any> {
  data: T;
  response: Response;
  fromCache?: boolean;
  retryCount?: number;
  totalTime?: number;
}

export interface NetworkError extends Error {
  code: string;
  status?: number;
  response?: Response;
  retryCount?: number;
  isNetworkError: boolean;
  isTimeout: boolean;
  isRetryable: boolean;
}

/**
 * Network status detection and monitoring
 */
export class NetworkStatusMonitor {
  private static instance: NetworkStatusMonitor;
  private isOnline: boolean = true;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private connectionType: string = 'unknown';
  private effectiveType: string = 'unknown';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.updateConnectionInfo();
      this.setupEventListeners();
    }
  }

  static getInstance(): NetworkStatusMonitor {
    if (!NetworkStatusMonitor.instance) {
      NetworkStatusMonitor.instance = new NetworkStatusMonitor();
    }
    return NetworkStatusMonitor.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener(
        'change',
        this.handleConnectionChange.bind(this)
      );
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.updateConnectionInfo();
    this.notifyListeners(true);
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners(false);
  }

  private handleConnectionChange(): void {
    this.updateConnectionInfo();
  }

  private updateConnectionInfo(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      this.connectionType = connection.type || 'unknown';
      this.effectiveType = connection.effectiveType || 'unknown';
    }
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  getStatus(): {
    isOnline: boolean;
    connectionType: string;
    effectiveType: string;
  } {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      effectiveType: this.effectiveType,
    };
  }

  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const cleanup = this.addListener((isOnline) => {
        if (isOnline) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(true);
        }
      });
    });
  }
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export class NetworkClient {
  private static instance: NetworkClient;
  private errorHandler: ErrorHandler;
  private networkMonitor: NetworkStatusMonitor;
  private requestCache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  > = new Map();

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.networkMonitor = NetworkStatusMonitor.getInstance();
  }

  static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  /**
   * Enhanced fetch with retry logic
   */
  async fetch<T = any>(
    url: string,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const startTime = Date.now();
    const {
      retry = {},
      timeout = 30000,
      validateResponse,
      parseResponse = 'json',
      ...fetchOptions
    } = options;

    const retryOptions: Required<RetryOptions> = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: this.defaultRetryCondition,
      onRetry: () => {},
      timeout: timeout,
      ...retry,
    };

    let lastError: unknown;
    let retryCount = 0;

    // Check cache first
    const cacheKey = this.getCacheKey(url, fetchOptions);
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      return {
        data: cachedResponse.data,
        response: new Response(JSON.stringify(cachedResponse.data)),
        fromCache: true,
        retryCount: 0,
        totalTime: Date.now() - startTime,
      };
    }

    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        // Check network status before attempting request
        const networkStatus = this.networkMonitor.getStatus();
        if (!networkStatus.isOnline) {
          throw this.createNetworkError(
            'Network is offline',
            'NETWORK_OFFLINE',
            0,
            undefined,
            attempt
          );
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          retryOptions.timeout
        );

        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Validate response if validator provided
          if (validateResponse && !validateResponse(response)) {
            throw this.createNetworkError(
              'Response validation failed',
              'VALIDATION_ERROR',
              response.status,
              response,
              attempt
            );
          }

          // Handle HTTP errors
          if (!response.ok) {
            throw this.createNetworkError(
              `HTTP ${response.status}: ${response.statusText}`,
              'HTTP_ERROR',
              response.status,
              response,
              attempt
            );
          }

          // Parse response
          let data: T;
          switch (parseResponse) {
            case 'json':
              data = await response.json();
              break;
            case 'text':
              data = (await response.text()) as T;
              break;
            case 'blob':
              data = (await response.blob()) as T;
              break;
            case 'arrayBuffer':
              data = (await response.arrayBuffer()) as T;
              break;
            case 'formData':
              data = (await response.formData()) as T;
              break;
            case 'none':
              data = undefined as T;
              break;
            default:
              data = await response.json();
          }

          // Cache successful response
          this.setCache(cacheKey, data, 5 * 60 * 1000); // 5 minutes default TTL

          return {
            data,
            response,
            fromCache: false,
            retryCount: attempt,
            totalTime: Date.now() - startTime,
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (controller.signal.aborted) {
            throw this.createNetworkError(
              'Request timeout',
              'TIMEOUT',
              0,
              undefined,
              attempt
            );
          }

          throw fetchError;
        }
      } catch (error) {
        lastError = error;
        retryCount = attempt;

        // Don't retry on the last attempt
        if (attempt === retryOptions.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!retryOptions.retryCondition(error, attempt)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(
          retryOptions.baseDelay,
          attempt,
          retryOptions.backoffFactor,
          retryOptions.maxDelay,
          retryOptions.jitter
        );

        // Notify about retry
        retryOptions.onRetry(error, attempt + 1, delay);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    // Handle final error
    const networkError = this.createNetworkError(
      lastError instanceof Error ? lastError.message : 'Network request failed',
      'REQUEST_FAILED',
      0,
      undefined,
      retryCount
    );

    // Log error with context
    const context: ErrorContext = {
      url,
      component: 'NetworkClient',
      action: 'fetch',
      metadata: {
        retryCount,
        totalTime: Date.now() - startTime,
        networkStatus: this.networkMonitor.getStatus(),
      },
    };

    this.errorHandler.handleNetworkError(networkError, context);
    throw networkError;
  }

  /**
   * GET request with retry logic
   */
  async get<T = any>(
    url: string,
    options: Omit<NetworkRequestOptions, 'method'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request with retry logic
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.fetch<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * PUT request with retry logic
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.fetch<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * DELETE request with retry logic
   */
  async delete<T = any>(
    url: string,
    options: Omit<NetworkRequestOptions, 'method'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.fetch<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request with retry logic
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.fetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * Default retry condition
   */
  private defaultRetryCondition(error: unknown, attempt: number): boolean {
    if (error instanceof Error) {
      const networkError = error as NetworkError;

      // Don't retry client errors (4xx)
      if (
        networkError.status &&
        networkError.status >= 400 &&
        networkError.status < 500
      ) {
        return false;
      }

      // Retry network errors, timeouts, and server errors
      return (
        Boolean(networkError.isNetworkError) ||
        Boolean(networkError.isTimeout) ||
        Boolean(networkError.status && networkError.status >= 500)
      );
    }

    return true;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(
    baseDelay: number,
    attempt: number,
    backoffFactor: number,
    maxDelay: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffFactor, attempt);
    delay = Math.min(delay, maxDelay);

    if (jitter) {
      // Add random jitter (±25%)
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(delay, 0);
  }

  /**
   * Create a network error with consistent structure
   */
  private createNetworkError(
    message: string,
    code: string,
    status?: number,
    response?: Response,
    retryCount?: number
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.name = 'NetworkError';
    error.code = code;
    error.status = status;
    error.response = response;
    error.retryCount = retryCount;
    error.isNetworkError = true;
    error.isTimeout = code === 'TIMEOUT';
    error.isRetryable = this.defaultRetryCondition(error, 0);

    return error;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cache management
   */
  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body || '';
    return `${method}:${url}:${headers}:${body}`;
  }

  private getFromCache(key: string): { data: any } | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { data: cached.data };
    }

    if (cached) {
      this.requestCache.delete(key);
    }

    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up old cache entries periodically
    if (this.requestCache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Get network statistics
   */
  getStats(): {
    cacheSize: number;
    networkStatus: ReturnType<NetworkStatusMonitor['getStatus']>;
  } {
    return {
      cacheSize: this.requestCache.size,
      networkStatus: this.networkMonitor.getStatus(),
    };
  }
}

/**
 * Convenience functions for common network operations
 */
export const networkClient = NetworkClient.getInstance();
export const networkMonitor = NetworkStatusMonitor.getInstance();

// Export convenience methods
export const fetchWithRetry = networkClient.fetch.bind(networkClient);
export const get = networkClient.get.bind(networkClient);
export const post = networkClient.post.bind(networkClient);
export const put = networkClient.put.bind(networkClient);
export const del = networkClient.delete.bind(networkClient);
export const patch = networkClient.patch.bind(networkClient);
