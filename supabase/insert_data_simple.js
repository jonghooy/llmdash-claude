const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI3NTc1MywiZXhwIjoyMDczODUxNzUzfQ.IEqWg9l9zKD1SyslGZU-_SJt8AxpQ2tyA53mNqmx-kk';

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function insertData() {
  console.log('🚀 Inserting data with service role key...\n');

  try {
    // 1. Insert Organizations
    console.log('1. Creating organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'LLMDash Inc',
          slug: 'llmdash-inc',
          description: 'The main LLMDash organization',
          subscription_tier: 'enterprise',
          max_users: 500,
          max_storage_gb: 1000
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Demo Company',
          slug: 'demo-company',
          description: 'A demo organization for testing',
          subscription_tier: 'pro',
          max_users: 50,
          max_storage_gb: 100
        }
      ])
      .select();

    if (orgError) {
      console.log('❌ Organizations error:', orgError.message);
    } else {
      console.log(`✅ Organizations: ${orgs?.length || 0} created/updated`);
    }

    // 2. Insert Organizational Units
    console.log('\n2. Creating organizational units...');
    const { data: units, error: unitsError } = await supabase
      .from('organizational_units')
      .upsert([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Engineering',
          description: 'Engineering Department'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Product',
          description: 'Product Management'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440007',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Development',
          description: 'Development Team'
        }
      ])
      .select();

    if (unitsError) {
      console.log('❌ Org units error:', unitsError.message);
    } else {
      console.log(`✅ Organizational units: ${units?.length || 0} created/updated`);
    }

    // 3. Insert Profiles
    console.log('\n3. Creating user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440001',
          username: 'john_doe',
          full_name: 'John Doe',
          email: 'john@llmdash.com',
          role: 'super_admin',
          department: 'Engineering',
          job_title: 'CTO',
          status: 'active'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440002',
          username: 'jane_smith',
          full_name: 'Jane Smith',
          email: 'jane@llmdash.com',
          role: 'org_admin',
          department: 'Product',
          job_title: 'VP of Product',
          status: 'active'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440005',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440007',
          username: 'demo_admin',
          full_name: 'Demo Admin',
          email: 'admin@demo.com',
          role: 'org_admin',
          department: 'Development',
          job_title: 'Tech Lead',
          status: 'active'
        }
      ])
      .select();

    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log(`✅ Profiles: ${profiles?.length || 0} created/updated`);
    }

    // 4. Verify data
    console.log('\n📊 Verifying inserted data...\n');

    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { count: unitCount } = await supabase.from('organizational_units').select('*', { count: 'exact', head: true });
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    console.log(`Organizations: ${orgCount || 0} rows`);
    console.log(`Organizational Units: ${unitCount || 0} rows`);
    console.log(`Profiles: ${profileCount || 0} rows`);

    console.log('\n✅ Data insertion complete!');
    console.log('\nTest accounts created:');
    console.log('  • Super Admin: john@llmdash.com');
    console.log('  • Org Admin: jane@llmdash.com');
    console.log('  • Demo Admin: admin@demo.com');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

insertData();