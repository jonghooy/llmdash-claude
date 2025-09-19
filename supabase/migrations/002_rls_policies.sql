-- Row Level Security (RLS) Policies for LLMDash Platform
-- Created: 2025-09-19

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('org_admin', 'super_admin')
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin'
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission for a resource
CREATE OR REPLACE FUNCTION has_resource_permission(
    p_resource_id UUID,
    p_resource_type TEXT,
    p_permission_level TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_org_unit_id UUID;
    v_permission_exists BOOLEAN;
BEGIN
    -- Get current user info
    SELECT id, organizational_unit_id
    INTO v_user_id, v_org_unit_id
    FROM profiles
    WHERE id = auth.uid();

    -- Check direct user permission
    SELECT EXISTS (
        SELECT 1
        FROM resource_permissions
        WHERE resource_id = p_resource_id
        AND resource_type = p_resource_type
        AND grantee_id = v_user_id
        AND grantee_type = 'user'
        AND (
            permission_level = p_permission_level
            OR permission_level = 'admin'
            OR (permission_level = 'editor' AND p_permission_level = 'viewer')
        )
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_permission_exists;

    IF v_permission_exists THEN
        RETURN TRUE;
    END IF;

    -- Check organizational unit permission
    IF v_org_unit_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM resource_permissions
            WHERE resource_id = p_resource_id
            AND resource_type = p_resource_type
            AND grantee_id = v_org_unit_id
            AND grantee_type = 'organizational_unit'
            AND (
                permission_level = p_permission_level
                OR permission_level = 'admin'
                OR (permission_level = 'editor' AND p_permission_level = 'viewer')
            )
            AND (expires_at IS NULL OR expires_at > NOW())
        ) INTO v_permission_exists;
    END IF;

    RETURN v_permission_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. ORGANIZATIONS POLICIES
-- =====================================================

-- View: Users can view their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT
    USING (
        id = get_user_organization_id()
        OR is_super_admin()
    );

-- Update: Only org admins can update their organization
CREATE POLICY "Org admins can update their organization" ON organizations
    FOR UPDATE
    USING (
        (id = get_user_organization_id() AND is_org_admin())
        OR is_super_admin()
    );

-- Insert: Only super admins can create organizations
CREATE POLICY "Super admins can create organizations" ON organizations
    FOR INSERT
    WITH CHECK (is_super_admin());

-- Delete: Only super admins can delete organizations
CREATE POLICY "Super admins can delete organizations" ON organizations
    FOR DELETE
    USING (is_super_admin());

-- =====================================================
-- 2. ORGANIZATIONAL_UNITS POLICIES
-- =====================================================

-- View: Users can view units in their organization
CREATE POLICY "Users can view org units" ON organizational_units
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        OR is_super_admin()
    );

-- Insert: Org admins can create units
CREATE POLICY "Org admins can create org units" ON organizational_units
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- Update: Org admins can update units
CREATE POLICY "Org admins can update org units" ON organizational_units
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- Delete: Org admins can delete units
CREATE POLICY "Org admins can delete org units" ON organizational_units
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- =====================================================
-- 3. PROFILES POLICIES
-- =====================================================

-- View: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in same org" ON profiles
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        OR id = auth.uid()
        OR is_super_admin()
    );

-- Update: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND organization_id = get_user_organization_id()
    );

-- Update: Org admins can update profiles in their org
CREATE POLICY "Org admins can update org profiles" ON profiles
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- Insert: Handled by auth trigger or admin
CREATE POLICY "System can create profiles" ON profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        OR is_super_admin()
    );

-- =====================================================
-- 4. INVITATIONS POLICIES
-- =====================================================

-- View: Users can view invitations for their organization
CREATE POLICY "Org members can view invitations" ON invitations
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        OR email = (SELECT email FROM profiles WHERE id = auth.uid())
        OR is_super_admin()
    );

-- Insert: Org admins can create invitations
CREATE POLICY "Org admins can create invitations" ON invitations
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- Update: Org admins can update invitations
CREATE POLICY "Org admins can update invitations" ON invitations
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- Update: Users can accept their own invitation
CREATE POLICY "Users can accept own invitation" ON invitations
    FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    )
    WITH CHECK (
        status = 'accepted'
    );

-- Delete: Org admins can delete invitations
CREATE POLICY "Org admins can delete invitations" ON invitations
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND is_org_admin()
        OR is_super_admin()
    );

-- =====================================================
-- 5. RESOURCE_PERMISSIONS POLICIES
-- =====================================================

-- View: Users can view permissions in their organization
CREATE POLICY "Users can view permissions" ON resource_permissions
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        OR is_super_admin()
    );

-- Insert: Users with admin permission can grant permissions
CREATE POLICY "Resource admins can grant permissions" ON resource_permissions
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND (
            has_resource_permission(resource_id, resource_type, 'admin')
            OR is_org_admin()
            OR is_super_admin()
        )
    );

-- Update: Resource admins can update permissions
CREATE POLICY "Resource admins can update permissions" ON resource_permissions
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND (
            has_resource_permission(resource_id, resource_type, 'admin')
            OR is_org_admin()
            OR is_super_admin()
        )
    );

-- Delete: Resource admins can revoke permissions
CREATE POLICY "Resource admins can revoke permissions" ON resource_permissions
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND (
            has_resource_permission(resource_id, resource_type, 'admin')
            OR is_org_admin()
            OR is_super_admin()
        )
    );

-- =====================================================
-- 6. AUDIT_LOGS POLICIES
-- =====================================================

-- View: Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs" ON audit_logs
    FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        OR is_super_admin()
    );

-- Insert: System can create audit logs
CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        OR is_super_admin()
    );

-- No update or delete allowed on audit logs
-- Audit logs are immutable