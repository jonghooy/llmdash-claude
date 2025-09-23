// Supabase Client for Admin Dashboard
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../../../supabase/config';

// Initialize Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Auth helper functions
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with OAuth provider
  async signInWithProvider(provider: 'google' | 'github' | 'microsoft') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign up new user
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },
};

// Database helper functions
export const db = {
  // Organizations
  organizations: {
    async get(id: string) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    async list() {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async create(org: any) {
      const { data, error } = await supabase
        .from('organizations')
        .insert(org)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      return { error };
    },
  },

  // Organizational Units
  organizationalUnits: {
    async getByOrganization(organizationId: string) {
      const { data, error } = await supabase
        .from('organizational_units')
        .select('*')
        .eq('organization_id', organizationId)
        .order('level', { ascending: true })
        .order('name', { ascending: true });
      return { data, error };
    },

    async create(unit: any) {
      const { data, error } = await supabase
        .from('organizational_units')
        .insert(unit)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('organizational_units')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('organizational_units')
        .delete()
        .eq('id', id);
      return { error };
    },
  },

  // Profiles
  profiles: {
    async get(id: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (name, slug),
          organizational_units (name)
        `)
        .eq('id', id)
        .single();
      return { data, error };
    },

    async getByOrganization(organizationId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizational_units (name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },
  },

  // Invitations
  invitations: {
    async getByOrganization(organizationId: string) {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organizational_units (name),
          profiles!invited_by (full_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async create(invitation: any) {
      const { data, error } = await supabase
        .from('invitations')
        .insert(invitation)
        .select()
        .single();
      return { data, error };
    },

    async cancel(id: string) {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      return { error };
    },

    async validateToken(token: string) {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organizations (name, slug, logo_url)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();
      return { data, error };
    },
  },

  // Resource Permissions
  permissions: {
    async getByResource(resourceId: string, resourceType: string) {
      const { data, error } = await supabase
        .from('resource_permissions')
        .select(`
          *,
          profiles!grantee_id (full_name, email),
          organizational_units!grantee_id (name)
        `)
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType);
      return { data, error };
    },

    async grant(permission: any) {
      const { data, error } = await supabase
        .from('resource_permissions')
        .insert(permission)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('resource_permissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async revoke(id: string) {
      const { error } = await supabase
        .from('resource_permissions')
        .delete()
        .eq('id', id);
      return { error };
    },
  },

  // Audit Logs
  auditLogs: {
    async getByOrganization(organizationId: string, limit = 100) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!user_id (full_name, email)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return { data, error };
    },

    async create(log: any) {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(log)
        .select()
        .single();
      return { data, error };
    },
  },
};

// Real-time subscription helpers
export const realtime = {
  // Subscribe to organization changes
  subscribeToOrganization(organizationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`organization:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to invitations
  subscribeToInvitations(organizationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`invitations:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to permissions
  subscribeToPermissions(resourceId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`permissions:${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_permissions',
          filter: `resource_id=eq.${resourceId}`,
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from channel
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

// Edge Function helpers
export const functions = {
  // Invitation system
  async createInvitation(data: any) {
    const { data: result, error } = await supabase.functions.invoke('invitation-system', {
      body: { action: 'create', data },
    });
    return { data: result, error };
  },

  async validateInvitation(token: string) {
    const { data: result, error } = await supabase.functions.invoke('invitation-system', {
      body: { action: 'validate', data: { token } },
    });
    return { data: result, error };
  },

  async acceptInvitation(token: string, userData: any) {
    const { data: result, error } = await supabase.functions.invoke('invitation-system', {
      body: { action: 'accept', data: { token, ...userData } },
    });
    return { data: result, error };
  },

  async sendInvitationEmail(invitationId: string) {
    const { data: result, error } = await supabase.functions.invoke('invitation-system', {
      body: { action: 'send_email', data: { invitation_id: invitationId } },
    });
    return { data: result, error };
  },
};

// Export types
export type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  settings?: any;
  subscription_tier?: string;
  max_users?: number;
  max_storage_gb?: number;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id?: string;
  organizational_unit_id?: string;
  username?: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role: 'super_admin' | 'org_admin' | 'member';
  department?: string;
  job_title?: string;
  phone?: string;
  preferences?: any;
  status: 'active' | 'inactive' | 'suspended';
  last_active_at?: string;
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  organization_id: string;
  organizational_unit_id?: string;
  email: string;
  role: 'org_admin' | 'member';
  token: string;
  invited_by?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  metadata?: any;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
};