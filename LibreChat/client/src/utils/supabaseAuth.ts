// Supabase Authentication Provider for LibreChat
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
  },
});

// Auth state management
export class SupabaseAuthProvider {
  private static instance: SupabaseAuthProvider;
  private session: Session | null = null;
  private user: User | null = null;
  private profile: any = null;
  private listeners: Set<(session: Session | null) => void> = new Set();

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): SupabaseAuthProvider {
    if (!SupabaseAuthProvider.instance) {
      SupabaseAuthProvider.instance = new SupabaseAuthProvider();
    }
    return SupabaseAuthProvider.instance;
  }

  private async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.handleSessionChange(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.handleSessionChange(session);
    });
  }

  private async handleSessionChange(session: Session | null) {
    this.session = session;
    this.user = session?.user || null;

    if (session?.user) {
      // Load user profile
      await this.loadUserProfile(session.user.id);
    } else {
      this.profile = null;
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(session));
  }

  private async loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            id,
            name,
            slug,
            settings
          ),
          organizational_units (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (!error && data) {
        this.profile = data;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Public methods
  public async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  public async signInWithSSO(provider: 'google' | 'github' | 'azure') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/chat/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  public async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  }

  public async acceptInvitation(token: string, userData: any) {
    // First validate the invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select(`
        *,
        organizations (name, slug)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Sign up or sign in the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: userData.password,
      options: {
        data: {
          invitation_token: token,
          ...userData,
        },
      },
    });

    if (authError) throw authError;

    // The Edge Function will handle profile creation
    return { auth: authData, invitation };
  }

  public async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local state
    this.session = null;
    this.user = null;
    this.profile = null;
  }

  public async refreshSession() {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  }

  public getSession(): Session | null {
    return this.session;
  }

  public getUser(): User | null {
    return this.user;
  }

  public getProfile(): any {
    return this.profile;
  }

  public getAccessToken(): string | null {
    return this.session?.access_token || null;
  }

  public isAuthenticated(): boolean {
    return !!this.session;
  }

  public hasRole(role: string): boolean {
    return this.profile?.role === role;
  }

  public isOrgAdmin(): boolean {
    return this.profile?.role === 'org_admin' || this.profile?.role === 'super_admin';
  }

  public getOrganizationId(): string | null {
    return this.profile?.organization_id || null;
  }

  // Subscribe to auth changes
  public subscribe(listener: (session: Session | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Convert Supabase JWT to LibreChat format
  public async getLibreChatToken(): Promise<string | null> {
    if (!this.session) return null;

    // Create a token that LibreChat backend can understand
    // This includes user info and organization context
    const payload = {
      sub: this.user?.id,
      email: this.user?.email,
      organizationId: this.profile?.organization_id,
      organizationSlug: this.profile?.organizations?.slug,
      role: this.profile?.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(new Date(this.session.expires_at!).getTime() / 1000),
    };

    // Return the Supabase access token
    // The backend will validate this with Supabase
    return this.session.access_token;
  }
}

// Export singleton instance
export const authProvider = SupabaseAuthProvider.getInstance();

// React Hook for auth state
import * as React from 'react';

export function useSupabaseAuth() {
  const [session, setSession] = React.useState<Session | null>(authProvider.getSession());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(false);

    const unsubscribe = authProvider.subscribe((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  return {
    session,
    user: authProvider.getUser(),
    profile: authProvider.getProfile(),
    loading,
    signIn: authProvider.signIn.bind(authProvider),
    signInWithSSO: authProvider.signInWithSSO.bind(authProvider),
    signUp: authProvider.signUp.bind(authProvider),
    signOut: authProvider.signOut.bind(authProvider),
    isAuthenticated: authProvider.isAuthenticated(),
    isOrgAdmin: authProvider.isOrgAdmin(),
  };
}

// Axios interceptor for API requests
export function setupAxiosInterceptor(axios: any) {
  // Add auth token to requests
  axios.interceptors.request.use(
    async (config: any) => {
      const token = await authProvider.getLibreChatToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add organization context
      const orgId = authProvider.getOrganizationId();
      if (orgId) {
        config.headers['X-Organization-Id'] = orgId;
      }

      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Handle auth errors
  axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        // Try to refresh token
        try {
          await authProvider.refreshSession();
          // Retry original request
          return axios.request(error.config);
        } catch {
          // Refresh failed, sign out
          await authProvider.signOut();
          window.location.href = '/chat/login';
        }
      }
      return Promise.reject(error);
    }
  );
}