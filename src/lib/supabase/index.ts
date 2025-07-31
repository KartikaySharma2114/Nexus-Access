// Client exports
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';

// Database operations
export * from './database';

// Authentication utilities
export * from './auth';

// Error handling
export * from './errors';

// Types
export type { Database } from '../types/database';
