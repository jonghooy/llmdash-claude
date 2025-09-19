-- =====================================================
-- Insert Sample Data for LLMDash Platform
-- Run this after creating tables
-- =====================================================

-- Clear existing data (optional - remove if you want to keep existing data)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE resource_permissions CASCADE;
TRUNCATE TABLE invitations CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE organizational_units CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- =====================================================
-- 1. Create Organizations
-- =====================================================
INSERT INTO organizations (id, name, slug, description, subscription_tier, max_users, max_storage_gb) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'LLMDash Inc', 'llmdash-inc', 'The main LLMDash organization', 'enterprise', 500, 1000),
  ('550e8400-e29b-41d4-a716-446655440002', 'Demo Company', 'demo-company', 'A demo organization for testing', 'pro', 50, 100),
  ('550e8400-e29b-41d4-a716-446655440003', 'Startup Corp', 'startup-corp', 'A small startup using LLMDash', 'starter', 10, 20);

-- =====================================================
-- 2. Create Organizational Units (Departments/Teams)
-- =====================================================

-- LLMDash Inc departments
INSERT INTO organizational_units (id, organization_id, parent_id, name, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Engineering', 'Engineering Department'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Product', 'Product Management'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Sales', 'Sales Department');

-- Engineering sub-teams
INSERT INTO organizational_units (id, organization_id, parent_id, name, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Frontend', 'Frontend Development Team'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Backend', 'Backend Development Team'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'DevOps', 'DevOps Team');

-- Demo Company departments
INSERT INTO organizational_units (id, organization_id, parent_id, name, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Development', 'Development Team'),
  ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Marketing', 'Marketing Team'),
  ('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Support', 'Customer Support');

-- =====================================================
-- 3. Create Sample Users/Profiles
-- =====================================================

-- Note: In production, these would be created when users sign up via Supabase Auth
-- For testing, we're creating placeholder profiles

-- LLMDash Inc users
INSERT INTO profiles (id, organization_id, organizational_unit_id, username, full_name, email, role, department, job_title, status) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'john_doe', 'John Doe', 'john@llmdash.com', 'super_admin', 'Engineering', 'CTO', 'active'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'jane_smith', 'Jane Smith', 'jane@llmdash.com', 'org_admin', 'Product', 'VP of Product', 'active'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'bob_wilson', 'Bob Wilson', 'bob@llmdash.com', 'member', 'Engineering', 'Senior Frontend Engineer', 'active'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'alice_chen', 'Alice Chen', 'alice@llmdash.com', 'member', 'Engineering', 'Backend Engineer', 'active');

-- Demo Company users
INSERT INTO profiles (id, organization_id, organizational_unit_id, username, full_name, email, role, department, job_title, status) VALUES
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'demo_admin', 'Demo Admin', 'admin@demo.com', 'org_admin', 'Development', 'Tech Lead', 'active'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'demo_user', 'Demo User', 'user@demo.com', 'member', 'Development', 'Developer', 'active');

-- =====================================================
-- 4. Create Sample Invitations
-- =====================================================
INSERT INTO invitations (organization_id, organizational_unit_id, email, role, invited_by, status, token) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'newdev@example.com', 'member', '770e8400-e29b-41d4-a716-446655440001', 'pending', 'invite_token_001'),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'salesrep@example.com', 'member', '770e8400-e29b-41d4-a716-446655440002', 'pending', 'invite_token_002'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440008', 'marketer@example.com', 'member', '770e8400-e29b-41d4-a716-446655440005', 'pending', 'invite_token_003');

-- =====================================================
-- 5. Create Sample Resource Permissions
-- =====================================================

-- Create some sample memory resources with permissions
INSERT INTO resource_permissions (organization_id, resource_id, resource_type, grantee_id, grantee_type, permission_level, granted_by) VALUES
  -- John (super admin) has admin access to a memory
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'memory', '770e8400-e29b-41d4-a716-446655440001', 'user', 'admin', '770e8400-e29b-41d4-a716-446655440001'),

  -- Frontend team has viewer access to a shared document
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 'file', '660e8400-e29b-41d4-a716-446655440004', 'organizational_unit', 'viewer', '770e8400-e29b-41d4-a716-446655440001'),

  -- Bob has editor access to a specific agent
  ('550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', 'agent', '770e8400-e29b-41d4-a716-446655440003', 'user', 'editor', '770e8400-e29b-41d4-a716-446655440002'),

  -- Demo company admin has admin access to their resources
  ('550e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440004', 'memory', '770e8400-e29b-41d4-a716-446655440005', 'user', 'admin', '770e8400-e29b-41d4-a716-446655440005');

-- =====================================================
-- 6. Create Sample Audit Logs
-- =====================================================
INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, details) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'user_login', NULL, NULL, '{"ip": "192.168.1.1", "browser": "Chrome"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'memory_created', 'memory', '880e8400-e29b-41d4-a716-446655440001', '{"title": "Project Documentation"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'invitation_sent', 'invitation', NULL, '{"email": "newdev@example.com"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'file_uploaded', 'file', '880e8400-e29b-41d4-a716-446655440002', '{"filename": "design_specs.pdf", "size": 2048576}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'organization_updated', 'organization', '550e8400-e29b-41d4-a716-446655440002', '{"field": "max_users", "old_value": 10, "new_value": 50}'::jsonb);

-- =====================================================
-- Verification Query
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Sample Data Inserted Successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  • 3 Organizations';
  RAISE NOTICE '  • 9 Organizational Units (Departments/Teams)';
  RAISE NOTICE '  • 6 User Profiles';
  RAISE NOTICE '  • 3 Pending Invitations';
  RAISE NOTICE '  • 4 Resource Permissions';
  RAISE NOTICE '  • 5 Audit Log Entries';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Accounts:';
  RAISE NOTICE '  • Super Admin: john@llmdash.com';
  RAISE NOTICE '  • Org Admin: jane@llmdash.com';
  RAISE NOTICE '  • Demo Admin: admin@demo.com';
  RAISE NOTICE '';
END $$;

-- Show summary
SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Organizational Units', COUNT(*) FROM organizational_units
UNION ALL
SELECT 'Profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'Invitations', COUNT(*) FROM invitations
UNION ALL
SELECT 'Permissions', COUNT(*) FROM resource_permissions
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs
ORDER BY table_name;