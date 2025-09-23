-- Initial Schema Migration for LLMDash Platform
-- Created: 2025-09-19

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier TEXT DEFAULT 'free',
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- =====================================================
-- 2. ORGANIZATIONAL_UNITS TABLE (Hierarchy)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizational_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0, -- 0: root, 1: department, 2: team, etc.
    path TEXT[], -- Array storing the hierarchy path for easier queries
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique names within the same parent
    UNIQUE(organization_id, parent_id, name)
);

-- Create indexes for hierarchy queries
CREATE INDEX idx_org_units_organization ON organizational_units(organization_id);
CREATE INDEX idx_org_units_parent ON organizational_units(parent_id);
CREATE INDEX idx_org_units_path ON organizational_units USING GIN (path);

-- =====================================================
-- 3. PROFILES TABLE (Extended User Information)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    organizational_unit_id UUID REFERENCES organizational_units(id) ON DELETE SET NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'org_admin', 'member')),
    department TEXT,
    job_title TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_org_unit ON profiles(organizational_unit_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- 4. INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    organizational_unit_id UUID REFERENCES organizational_units(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('org_admin', 'member')),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate pending invitations
    UNIQUE(organization_id, email, status) WHERE status = 'pending'
);

-- Create indexes
CREATE INDEX idx_invitations_organization ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);

-- =====================================================
-- 5. RESOURCE_PERMISSIONS TABLE (ACL)
-- =====================================================
CREATE TABLE IF NOT EXISTS resource_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('memory', 'file', 'agent', 'chat')),
    grantee_id UUID NOT NULL,
    grantee_type TEXT NOT NULL CHECK (grantee_type IN ('user', 'organizational_unit', 'organization')),
    permission_level TEXT NOT NULL CHECK (permission_level IN ('viewer', 'editor', 'admin')),
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Prevent duplicate permissions
    UNIQUE(resource_id, resource_type, grantee_id, grantee_type)
);

-- Create indexes for permission lookups
CREATE INDEX idx_permissions_organization ON resource_permissions(organization_id);
CREATE INDEX idx_permissions_resource ON resource_permissions(resource_id, resource_type);
CREATE INDEX idx_permissions_grantee ON resource_permissions(grantee_id, grantee_type);
CREATE INDEX idx_permissions_level ON resource_permissions(permission_level);

-- =====================================================
-- 6. AUDIT_LOGS TABLE (Track All Actions)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_units_updated_at BEFORE UPDATE ON organizational_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update organizational unit paths
CREATE OR REPLACE FUNCTION update_org_unit_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = ARRAY[NEW.id::text];
        NEW.level = 0;
    ELSE
        SELECT path || NEW.id::text, level + 1
        INTO NEW.path, NEW.level
        FROM organizational_units
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_unit_path_trigger
    BEFORE INSERT OR UPDATE ON organizational_units
    FOR EACH ROW EXECUTE FUNCTION update_org_unit_path();

-- Function to validate invitation expiry
CREATE OR REPLACE FUNCTION validate_invitation_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        IF NOW() > OLD.expires_at THEN
            RAISE EXCEPTION 'Invitation has expired';
        END IF;
        NEW.accepted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_invitation_trigger
    BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION validate_invitation_expiry();