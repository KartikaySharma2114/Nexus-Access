import { createClient as createServerClient } from './server';
import { createClient as createBrowserClient } from './client';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  // Add any additional user properties if needed
}

// Server-side auth functions
export async function getUser(isServer = false): Promise<AuthUser | null> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

export async function getSession(isServer = false) {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

// Client-side auth functions
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function signUp(email: string, password: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function signOut() {
  const supabase = createBrowserClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  if (error) {
    throw new Error(error.message);
  }
}

// Check if user is authenticated
export async function isAuthenticated(isServer = false): Promise<boolean> {
  const user = await getUser(isServer);
  return user !== null;
}

// Check if user is admin (for now, all authenticated users are admins)
export async function isAdmin(isServer = false): Promise<boolean> {
  return await isAuthenticated(isServer);
}