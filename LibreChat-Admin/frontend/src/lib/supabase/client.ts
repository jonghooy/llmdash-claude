/**
 * Supabase Client Configuration
 * Centralizes all Supabase client initialization and configuration
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qctdaaezghvqnbpghinr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'llmdash-admin'
    }
  }
});

// Helper functions for common operations
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () =>
    supabase.auth.signOut(),

  getSession: () =>
    supabase.auth.getSession(),

  getUser: () =>
    supabase.auth.getUser(),

  onAuthStateChange: (callback: (event: any, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback)
};

// Database helpers with explicit typing
export const db = {
  organizations: () => supabase.from('organizations'),
  organizational_units: () => supabase.from('organizational_units'),
  profiles: () => supabase.from('profiles'),
  invitations: () => supabase.from('invitations'),
  resource_permissions: () => supabase.from('resource_permissions'),
  audit_logs: () => supabase.from('audit_logs')
} as const;