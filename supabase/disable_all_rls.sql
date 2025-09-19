-- =====================================================
-- Completely Disable RLS - Development Only
-- =====================================================

-- Drop ALL policies on ALL tables
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizational_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resource_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Grant full access to authenticated role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'organizational_units', 'profiles', 'invitations', 'resource_permissions', 'audit_logs')
ORDER BY tablename;

-- Check data counts
SELECT 'Data Summary:' as message;
SELECT '=============' as separator;
SELECT 'organizations' as table_name, COUNT(*) as row_count FROM organizations
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
    RAISE NOTICE '✅ RLS COMPLETELY DISABLED!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ WARNING: Row Level Security is now OFF';
    RAISE NOTICE 'This configuration is for DEVELOPMENT ONLY';
    RAISE NOTICE 'All data is accessible without restrictions';
    RAISE NOTICE '';
    RAISE NOTICE 'Data should now be accessible via:';
    RAISE NOTICE '  • Supabase JS Client';
    RAISE NOTICE '  • REST API';
    RAISE NOTICE '  • PostgREST';
    RAISE NOTICE '=========================================';
END $$;