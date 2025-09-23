#!/usr/bin/env node

/**
 * Execute SQL directly via Supabase JS SDK
 * This script will insert sample data into the database
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertSampleData() {
  console.log('📦 Inserting Sample Data...\n');

  try {
    // 1. Create Organizations
    console.log('Creating organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .insert([
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
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Startup Corp',
          slug: 'startup-corp',
          description: 'A small startup using LLMDash',
          subscription_tier: 'starter',
          max_users: 10,
          max_storage_gb: 20
        }
      ])
      .select();

    if (orgError) {
      if (orgError.message.includes('duplicate key')) {
        console.log('✅ Organizations already exist');
      } else {
        throw orgError;
      }
    } else {
      console.log(`✅ Created ${orgs.length} organizations`);
    }

    // 2. Create Organizational Units for LLMDash Inc
    console.log('\nCreating organizational units...');
    const { data: units, error: unitsError } = await supabase
      .from('organizational_units')
      .insert([
        // LLMDash Inc departments
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: null,
          name: 'Engineering',
          description: 'Engineering Department'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: null,
          name: 'Product',
          description: 'Product Management'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440003',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: null,
          name: 'Sales',
          description: 'Sales Department'
        }
      ])
      .select();

    if (unitsError && !unitsError.message.includes('duplicate key')) {
      console.log('⚠️ Some units may already exist');
    } else {
      console.log(`✅ Created ${units?.length || 0} organizational units`);
    }

    // 3. Create sub-teams
    console.log('\nCreating sub-teams...');
    const { data: subTeams, error: subTeamsError } = await supabase
      .from('organizational_units')
      .insert([
        {
          id: '660e8400-e29b-41d4-a716-446655440004',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'Frontend',
          description: 'Frontend Development Team'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440005',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'Backend',
          description: 'Backend Development Team'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440006',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'DevOps',
          description: 'DevOps Team'
        }
      ])
      .select();

    if (subTeamsError && !subTeamsError.message.includes('duplicate key')) {
      console.log('⚠️ Some sub-teams may already exist');
    } else {
      console.log(`✅ Created ${subTeams?.length || 0} sub-teams`);
    }

    // 4. Create Demo Company departments
    console.log('\nCreating Demo Company departments...');
    const { data: demoDepts, error: demoDeptsError } = await supabase
      .from('organizational_units')
      .insert([
        {
          id: '660e8400-e29b-41d4-a716-446655440007',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          parent_id: null,
          name: 'Development',
          description: 'Development Team'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440008',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          parent_id: null,
          name: 'Marketing',
          description: 'Marketing Team'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440009',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          parent_id: null,
          name: 'Support',
          description: 'Customer Support'
        }
      ])
      .select();

    if (demoDeptsError && !demoDeptsError.message.includes('duplicate key')) {
      console.log('⚠️ Some Demo Company departments may already exist');
    } else {
      console.log(`✅ Created ${demoDepts?.length || 0} Demo Company departments`);
    }

    // 5. Create Sample Profiles
    console.log('\nCreating user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .insert([
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
          id: '770e8400-e29b-41d4-a716-446655440003',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440004',
          username: 'bob_wilson',
          full_name: 'Bob Wilson',
          email: 'bob@llmdash.com',
          role: 'member',
          department: 'Engineering',
          job_title: 'Senior Frontend Engineer',
          status: 'active'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440004',
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440005',
          username: 'alice_chen',
          full_name: 'Alice Chen',
          email: 'alice@llmdash.com',
          role: 'member',
          department: 'Engineering',
          job_title: 'Backend Engineer',
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
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440006',
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440007',
          username: 'demo_user',
          full_name: 'Demo User',
          email: 'user@demo.com',
          role: 'member',
          department: 'Development',
          job_title: 'Developer',
          status: 'active'
        }
      ])
      .select();

    if (profilesError && !profilesError.message.includes('duplicate key')) {
      console.log('⚠️ Some profiles may already exist');
    } else {
      console.log(`✅ Created ${profiles?.length || 0} user profiles`);
    }

    // 6. Create Sample Invitations
    console.log('\nCreating invitations...');
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .insert([
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440004',
          email: 'newdev@example.com',
          role: 'member',
          invited_by: '770e8400-e29b-41d4-a716-446655440001',
          status: 'pending',
          token: 'invite_token_001'
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440003',
          email: 'salesrep@example.com',
          role: 'member',
          invited_by: '770e8400-e29b-41d4-a716-446655440002',
          status: 'pending',
          token: 'invite_token_002'
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          organizational_unit_id: '660e8400-e29b-41d4-a716-446655440008',
          email: 'marketer@example.com',
          role: 'member',
          invited_by: '770e8400-e29b-41d4-a716-446655440005',
          status: 'pending',
          token: 'invite_token_003'
        }
      ])
      .select();

    if (invitationsError && !invitationsError.message.includes('duplicate key')) {
      console.log('⚠️ Some invitations may already exist');
    } else {
      console.log(`✅ Created ${invitations?.length || 0} invitations`);
    }

    // 7. Create Sample Resource Permissions
    console.log('\nCreating resource permissions...');
    const { data: permissions, error: permissionsError } = await supabase
      .from('resource_permissions')
      .insert([
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          resource_id: '880e8400-e29b-41d4-a716-446655440001',
          resource_type: 'memory',
          grantee_id: '770e8400-e29b-41d4-a716-446655440001',
          grantee_type: 'user',
          permission_level: 'admin',
          granted_by: '770e8400-e29b-41d4-a716-446655440001'
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          resource_id: '880e8400-e29b-41d4-a716-446655440002',
          resource_type: 'file',
          grantee_id: '660e8400-e29b-41d4-a716-446655440004',
          grantee_type: 'organizational_unit',
          permission_level: 'viewer',
          granted_by: '770e8400-e29b-41d4-a716-446655440001'
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          resource_id: '880e8400-e29b-41d4-a716-446655440003',
          resource_type: 'agent',
          grantee_id: '770e8400-e29b-41d4-a716-446655440003',
          grantee_type: 'user',
          permission_level: 'editor',
          granted_by: '770e8400-e29b-41d4-a716-446655440002'
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          resource_id: '880e8400-e29b-41d4-a716-446655440004',
          resource_type: 'memory',
          grantee_id: '770e8400-e29b-41d4-a716-446655440005',
          grantee_type: 'user',
          permission_level: 'admin',
          granted_by: '770e8400-e29b-41d4-a716-446655440005'
        }
      ])
      .select();

    if (permissionsError && !permissionsError.message.includes('duplicate key')) {
      console.log('⚠️ Some permissions may already exist');
    } else {
      console.log(`✅ Created ${permissions?.length || 0} resource permissions`);
    }

    // 8. Create Sample Audit Logs
    console.log('\nCreating audit logs...');
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .insert([
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '770e8400-e29b-41d4-a716-446655440001',
          action: 'user_login',
          resource_type: null,
          resource_id: null,
          details: { ip: '192.168.1.1', browser: 'Chrome' }
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '770e8400-e29b-41d4-a716-446655440001',
          action: 'memory_created',
          resource_type: 'memory',
          resource_id: '880e8400-e29b-41d4-a716-446655440001',
          details: { title: 'Project Documentation' }
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '770e8400-e29b-41d4-a716-446655440002',
          action: 'invitation_sent',
          resource_type: 'invitation',
          resource_id: null,
          details: { email: 'newdev@example.com' }
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '770e8400-e29b-41d4-a716-446655440003',
          action: 'file_uploaded',
          resource_type: 'file',
          resource_id: '880e8400-e29b-41d4-a716-446655440002',
          details: { filename: 'design_specs.pdf', size: 2048576 }
        },
        {
          organization_id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: '770e8400-e29b-41d4-a716-446655440005',
          action: 'organization_updated',
          resource_type: 'organization',
          resource_id: '550e8400-e29b-41d4-a716-446655440002',
          details: { field: 'max_users', old_value: 10, new_value: 50 }
        }
      ])
      .select();

    if (logsError && !logsError.message.includes('duplicate key')) {
      console.log('⚠️ Some audit logs may already exist');
    } else {
      console.log(`✅ Created ${logs?.length || 0} audit logs`);
    }

    console.log('\n===========================================');
    console.log('✅ Sample Data Insertion Complete!');
    console.log('===========================================');
    console.log('\nCreated:');
    console.log('  • 3 Organizations');
    console.log('  • 9 Organizational Units (Departments/Teams)');
    console.log('  • 6 User Profiles');
    console.log('  • 3 Pending Invitations');
    console.log('  • 4 Resource Permissions');
    console.log('  • 5 Audit Log Entries');
    console.log('\nTest Accounts:');
    console.log('  • Super Admin: john@llmdash.com');
    console.log('  • Org Admin: jane@llmdash.com');
    console.log('  • Demo Admin: admin@demo.com');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Error inserting data:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Run the insertion
insertSampleData();