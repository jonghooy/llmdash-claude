/**
 * Database Types
 * Generated types for Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          settings: Json
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          max_users: number
          max_storage_gb: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      organizational_units: {
        Row: {
          id: string
          organization_id: string
          parent_id: string | null
          name: string
          description: string | null
          level: number
          path: string[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizational_units']['Row'], 'id' | 'created_at' | 'updated_at' | 'level' | 'path'>
        Update: Partial<Database['public']['Tables']['organizational_units']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          organizational_unit_id: string | null
          username: string | null
          full_name: string | null
          email: string
          avatar_url: string | null
          role: 'super_admin' | 'org_admin' | 'member'
          department: string | null
          job_title: string | null
          phone: string | null
          preferences: Json
          status: 'active' | 'inactive' | 'suspended'
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          organizational_unit_id: string | null
          email: string
          role: 'org_admin' | 'member'
          token: string
          invited_by: string | null
          status: 'pending' | 'accepted' | 'expired' | 'cancelled'
          metadata: Json
          expires_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invitations']['Row'], 'id' | 'created_at' | 'updated_at' | 'token'>
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
      resource_permissions: {
        Row: {
          id: string
          organization_id: string
          resource_id: string
          resource_type: 'memory' | 'file' | 'agent' | 'chat'
          grantee_id: string
          grantee_type: 'user' | 'organizational_unit' | 'organization'
          permission_level: 'viewer' | 'editor' | 'admin'
          granted_by: string | null
          granted_at: string
          expires_at: string | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['resource_permissions']['Row'], 'id' | 'granted_at'>
        Update: Partial<Database['public']['Tables']['resource_permissions']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}