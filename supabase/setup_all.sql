-- =====================================================
-- Complete Supabase Setup Script for LLMDash Platform
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Drop existing tables if they exist (for clean setup)
-- =====================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS resource_permissions CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizational_units CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
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
CREATE TABLE organizational_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    path TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, parent_id, name)
);

-- Create indexes
CREATE INDEX idx_org_units_organization ON organizational_units(organization_id);
CREATE INDEX idx_org_units_parent ON organizational_units(parent_id);
CREATE INDEX idx_org_units_path ON organizational_units USING GIN (path);

-- =====================================================
-- 3. PROFILES TABLE (Extended User Information)
-- =====================================================
CREATE TABLE profiles (
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

-- Create indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_org_unit ON profiles(organizational_unit_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- 4. INVITATIONS TABLE
-- =====================================================
CREATE TABLE invitations (
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
    UNIQUE(organization_id, email, status)
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
CREATE TABLE resource_permissions (
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
    UNIQUE(resource_id, resource_type, grantee_id, grantee_type)
);

-- Create indexes
CREATE INDEX idx_permissions_organization ON resource_permissions(organization_id);
CREATE INDEX idx_permissions_resource ON resource_permissions(resource_id, resource_type);
CREATE INDEX idx_permissions_grantee ON resource_permissions(grantee_id, grantee_type);
CREATE INDEX idx_permissions_level ON resource_permissions(permission_level);

-- =====================================================
-- 6. AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
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

-- Create indexes
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

-- Apply triggers
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

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Create a demo organization
INSERT INTO organizations (name, slug, description, subscription_tier, max_users, max_storage_gb)
VALUES
    ('Demo Company', 'demo-company', 'A demo organization for testing', 'pro', 50, 100),
    ('LLMDash Inc', 'llmdash-inc', 'The main LLMDash organization', 'enterprise', 500, 1000);

-- Get the organization IDs
DO $$
DECLARE
    demo_org_id UUID;
    llmdash_org_id UUID;
    eng_dept_id UUID;
    sales_dept_id UUID;
BEGIN
    -- Get organization IDs
    SELECT id INTO demo_org_id FROM organizations WHERE slug = 'demo-company';
    SELECT id INTO llmdash_org_id FROM organizations WHERE slug = 'llmdash-inc';

    -- Create organizational units for Demo Company
    INSERT INTO organizational_units (organization_id, name, description)
    VALUES
        (demo_org_id, 'Engineering', 'Engineering Department')
    RETURNING id INTO eng_dept_id;

    INSERT INTO organizational_units (organization_id, name, description)
    VALUES
        (demo_org_id, 'Sales', 'Sales Department')
    RETURNING id INTO sales_dept_id;

    -- Create sub-units
    INSERT INTO organizational_units (organization_id, parent_id, name, description)
    VALUES
        (demo_org_id, eng_dept_id, 'Frontend Team', 'Frontend development team'),
        (demo_org_id, eng_dept_id, 'Backend Team', 'Backend development team'),
        (demo_org_id, sales_dept_id, 'Enterprise Sales', 'Enterprise sales team');

    -- Create organizational units for LLMDash Inc
    INSERT INTO organizational_units (organization_id, name, description)
    VALUES
        (llmdash_org_id, 'Product', 'Product Development'),
        (llmdash_org_id, 'Operations', 'Operations & DevOps'),
        (llmdash_org_id, 'Customer Success', 'Customer Success Team');
END $$;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Org admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
        )
    );

-- Profiles policies
CREATE POLICY "Users can view profiles in their org" ON profiles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR id = auth.uid()
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Organizational units policies
CREATE POLICY "Users can view org units" ON organizational_units
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Invitations policies
CREATE POLICY "Org admins can manage invitations" ON invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
        )
    );

-- Resource permissions policies
CREATE POLICY "Users can view permissions in their org" ON resource_permissions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Audit logs policies
CREATE POLICY "Users can view audit logs for their org" ON audit_logs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Tables created: organizations, organizational_units, profiles, invitations, resource_permissions, audit_logs';
    RAISE NOTICE 'Sample data inserted: 2 organizations with departments';
    RAISE NOTICE 'RLS policies enabled for all tables';
END $$;