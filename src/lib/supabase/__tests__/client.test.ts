/**
 * @jest-environment jsdom
 */

import { createClient } from '../client';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

describe('Supabase Client', () => {
  beforeEach(() => {
    // Mock environment variables
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key];
    });
  });

  it('should create a client with valid environment variables', () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.supabaseUrl).toBe(mockEnv.NEXT_PUBLIC_SUPABASE_URL);
    expect(client.supabaseKey).toBe(mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });

  it('should throw an error when environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => createClient()).toThrow('Missing Supabase environment variables');
  });

  it('should throw an error when URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => createClient()).toThrow('Missing Supabase environment variables');
  });

  it('should throw an error when anon key is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => createClient()).toThrow('Missing Supabase environment variables');
  });
});