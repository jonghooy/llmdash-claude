-- =====================================================
-- Setup Without Auth Constraint - Development Version
-- =====================================================

-- 1. Drop the foreign key constraint on profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Drop all policies first
DROP POLICY IF EXISTS "Allow all for authenticated" ON organizations;
DROP POLICY IF EXISTS "Allow all for authenticated" ON organizational_units;
DROP POLICY IF EXISTS "Allow all for authenticated" ON profiles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON invitations;
DROP POLICY IF EXISTS "Allow all for authenticated" ON resource_permissions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON audit_logs;

-- 3. Disable RLS temporarily
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 4. Clear existing data
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE resource_permissions CASCADE;
TRUNCATE TABLE invitations CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE organizational_units CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- 5. Insert Organizations
INSERT INTO organizations (id, name, slug, description, subscription_tier, max_users, max_storage_gb) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'LLMDash Inc', 'llmdash-inc', 'The main LLMDash organization', 'enterprise', 500, 1000),
  ('550e8400-e29b-41d4-a716-446655440002', 'Demo Company', 'demo-company', 'A demo organization for testing', 'pro', 50, 100),
  ('550e8400-e29b-41d4-a716-446655440003', 'Startup Corp', 'startup-corp', 'A small startup using LLMDash', 'starter', 10, 20);

-- 6. Insert Organizational Units
INSERT INTO organizational_units (id, organization_id, parent_id, name, description) VALUES
  -- LLMDash Inc departments
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Engineering', 'Engineering Department'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Product', 'Product Management'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Sales', 'Sales Department'),
  -- Engineering sub-teams
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Frontend', 'Frontend Development Team'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Backend', 'Backend Development Team'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'DevOps', 'DevOps Team'),
  -- Demo Company departments
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Development', 'Development Team'),
  ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Marketing', 'Marketing Team'),
  ('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Support', 'Customer Support');

-- 7. Insert Profiles (without auth.users constraint)
INSERT INTO profiles (id, organization_id, organizational_unit_id, username, full_name, email, role, department, job_title, status) VALUES
  -- LLMDash Inc users
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'john_doe', 'John Doe', 'john@llmdash.com', 'super_admin', 'Engineering', 'CTO', 'active'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'jane_smith', 'Jane Smith', 'jane@llmdash.com', 'org_admin', 'Product', 'VP of Product', 'active'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'bob_wilson', 'Bob Wilson', 'bob@llmdash.com', 'member', 'Engineering', 'Senior Frontend Engineer', 'active'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'alice_chen', 'Alice Chen', 'alice@llmdash.com', 'member', 'Engineering', 'Backend Engineer', 'active'),
  -- Demo Company users
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'demo_admin', 'Demo Admin', 'admin@demo.com', 'org_admin', 'Development', 'Tech Lead', 'active'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'demo_user', 'Demo User', 'user@demo.com', 'member', 'Development', 'Developer', 'active');

-- 8. Insert Sample Invitations
INSERT INTO invitations (organization_id, organizational_unit_id, email, role, invited_by, status, token) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'newdev@example.com', 'member', '770e8400-e29b-41d4-a716-446655440001', 'pending', 'invite_token_001'),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'salesrep@example.com', 'member', '770e8400-e29b-41d4-a716-446655440002', 'pending', 'invite_token_002'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440008', 'marketer@example.com', 'member', '770e8400-e29b-41d4-a716-446655440005', 'pending', 'invite_token_003');

-- 9. Insert Sample Resource Permissions
INSERT INTO resource_permissions (organization_id, resource_id, resource_type, grantee_id, grantee_type, permission_level, granted_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'memory', '770e8400-e29b-41d4-a716-446655440001', 'user', 'admin', '770e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 'file', '660e8400-e29b-41d4-a716-446655440004', 'organizational_unit', 'viewer', '770e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', 'agent', '770e8400-e29b-41d4-a716-446655440003', 'user', 'editor', '770e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440004', 'memory', '770e8400-e29b-41d4-a716-446655440005', 'user', 'admin', '770e8400-e29b-41d4-a716-446655440005');

-- 10. Insert Sample Audit Logs
INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, details) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'user_login', NULL, NULL, '{"ip": "192.168.1.1", "browser": "Chrome"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'memory_created', 'memory', '880e8400-e29b-41d4-a716-446655440001', '{"title": "Project Documentation"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'invitation_sent', 'invitation', NULL, '{"email": "newdev@example.com"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'file_uploaded', 'file', '880e8400-e29b-41d4-a716-446655440002', '{"filename": "design_specs.pdf", "size": 2048576}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'organization_updated', 'organization', '550e8400-e29b-41d4-a716-446655440002', '{"field": "max_users", "old_value": 10, "new_value": 50}'::jsonb);

-- 11. Re-enable RLS with permissive policies for development
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations for development)
CREATE POLICY "Allow all operations" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON organizational_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON invitations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON resource_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 12. Verify results
SELECT 'Setup Results:' as message;
SELECT '==============' as separator;
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'organizational_units', COUNT(*) FROM organizational_units
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'invitations', COUNT(*) FROM invitations
UNION ALL
SELECT 'resource_permissions', COUNT(*) FROM resource_permissions
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ SETUP COMPLETE WITHOUT AUTH CONSTRAINT!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Successfully created:';
    RAISE NOTICE '  • 3 Organizations';
    RAISE NOTICE '  • 9 Organizational Units';
    RAISE NOTICE '  • 6 User Profiles';
    RAISE NOTICE '  • 3 Invitations';
    RAISE NOTICE '  • 4 Resource Permissions';
    RAISE NOTICE '  • 5 Audit Logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Accounts (for reference):';
    RAISE NOTICE '  • john@llmdash.com (Super Admin)';
    RAISE NOTICE '  • jane@llmdash.com (Org Admin)';
    RAISE NOTICE '  • admin@demo.com (Demo Admin)';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Auth constraint removed for development.';
    RAISE NOTICE 'Users will need to be created in auth.users separately.';
    RAISE NOTICE '=========================================';
END $$;