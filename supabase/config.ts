// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://qctdaaezghvqnbpghinr.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos',
  // Service role key는 환경 변수로 관리 (보안)
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

// Database Tables
export const TABLES = {
  ORGANIZATIONS: 'organizations',
  ORGANIZATIONAL_UNITS: 'organizational_units',
  INVITATIONS: 'invitations',
  PROFILES: 'profiles',
  RESOURCE_PERMISSIONS: 'resource_permissions'
} as const;

// Permission Levels
export const PERMISSION_LEVELS = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin'
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MEMBER: 'member'
} as const;

// Invitation Status
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

// Resource Types
export const RESOURCE_TYPES = {
  MEMORY: 'memory',
  FILE: 'file',
  AGENT: 'agent',
  CHAT: 'chat'
} as const;

// Grantee Types
export const GRANTEE_TYPES = {
  USER: 'user',
  ORGANIZATIONAL_UNIT: 'organizational_unit',
  ORGANIZATION: 'organization'
} as const;