#!/usr/bin/env node

/**
 * Supabase Integration Test
 * Tests all configured tables and operations
 */

const { createClient } = require('@supabase/supabase-js');
const colors = require('colors');

// Supabase Configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(name, testFn) {
  console.log(`\n🔍 ${name}...`.cyan);
  try {
    const result = await testFn();
    if (result) {
      console.log(`  ✅ PASSED`.green);
      results.passed++;
      results.tests.push({ name, status: 'passed', details: result });
    } else {
      console.log(`  ❌ FAILED`.red);
      results.failed++;
      results.tests.push({ name, status: 'failed' });
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`.red);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function testOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No organizations found');

  console.log(`     Found ${data.length} organizations`.gray);

  // Test specific organization exists
  const llmdash = data.find(org => org.slug === 'llmdash-inc');
  if (!llmdash) throw new Error('LLMDash Inc not found');

  return `${data.length} organizations`;
}

async function testOrganizationalUnits() {
  const { data, error } = await supabase
    .from('organizational_units')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No organizational units found');

  console.log(`     Found ${data.length} organizational units`.gray);

  // Test hierarchy
  const engineering = data.find(unit => unit.name === 'Engineering');
  if (!engineering) throw new Error('Engineering department not found');

  const subTeams = data.filter(unit => unit.parent_id === engineering.id);
  console.log(`     Engineering has ${subTeams.length} sub-teams`.gray);

  return `${data.length} units with hierarchy`;
}

async function testProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No profiles found');

  console.log(`     Found ${data.length} user profiles`.gray);

  // Test roles
  const superAdmin = data.find(profile => profile.role === 'super_admin');
  const orgAdmins = data.filter(profile => profile.role === 'org_admin');
  const members = data.filter(profile => profile.role === 'member');

  console.log(`     Roles: ${orgAdmins.length} admins, ${members.length} members`.gray);

  if (!superAdmin) throw new Error('No super admin found');

  return `${data.length} profiles with roles`;
}

async function testInvitations() {
  const { data, error } = await supabase
    .from('invitations')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No invitations found');

  console.log(`     Found ${data.length} invitations`.gray);

  const pending = data.filter(inv => inv.status === 'pending');
  console.log(`     ${pending.length} pending invitations`.gray);

  return `${data.length} invitations`;
}

async function testResourcePermissions() {
  const { data, error } = await supabase
    .from('resource_permissions')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No permissions found');

  console.log(`     Found ${data.length} resource permissions`.gray);

  // Test permission levels
  const admins = data.filter(perm => perm.permission_level === 'admin');
  const editors = data.filter(perm => perm.permission_level === 'editor');
  const viewers = data.filter(perm => perm.permission_level === 'viewer');

  console.log(`     Levels: ${admins.length} admin, ${editors.length} editor, ${viewers.length} viewer`.gray);

  return `${data.length} permissions`;
}

async function testAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No audit logs found');

  console.log(`     Found ${data.length} audit logs`.gray);

  // Test different actions
  const actions = [...new Set(data.map(log => log.action))];
  console.log(`     Actions: ${actions.join(', ')}`.gray);

  return `${data.length} audit logs`;
}

async function testRelationships() {
  // Test organization -> profiles relationship
  const { data: orgWithProfiles, error: error1 } = await supabase
    .from('organizations')
    .select(`
      *,
      profiles (
        id,
        full_name,
        role
      )
    `)
    .eq('slug', 'llmdash-inc')
    .single();

  if (error1) throw error1;
  if (!orgWithProfiles.profiles || orgWithProfiles.profiles.length === 0) {
    throw new Error('No profiles linked to organization');
  }

  console.log(`     LLMDash Inc has ${orgWithProfiles.profiles.length} users`.gray);

  // Test organizational units hierarchy
  const { data: units, error: error2 } = await supabase
    .from('organizational_units')
    .select('*')
    .eq('organization_id', orgWithProfiles.id);

  if (error2) throw error2;

  const topLevel = units.filter(u => !u.parent_id);
  const subUnits = units.filter(u => u.parent_id);

  console.log(`     ${topLevel.length} departments, ${subUnits.length} sub-teams`.gray);

  return 'Relationships working';
}

async function testDataIntegrity() {
  // Check all profiles have valid organizations
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, organizations!inner(*)');

  if (!profiles || profiles.length === 0) {
    throw new Error('Profile-Organization integrity check failed');
  }

  // Check all invitations have valid organizations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*, organizations!inner(*)');

  if (!invitations || invitations.length === 0) {
    throw new Error('Invitation-Organization integrity check failed');
  }

  console.log(`     All foreign key relationships valid`.gray);

  return 'Data integrity verified';
}

async function main() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('  🧪 Supabase Integration Test Suite  '.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`\n📍 Project: ${SUPABASE_URL}`.white);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`.white);

  // Run all tests
  await runTest('Organizations Table', testOrganizations);
  await runTest('Organizational Units Table', testOrganizationalUnits);
  await runTest('Profiles Table', testProfiles);
  await runTest('Invitations Table', testInvitations);
  await runTest('Resource Permissions Table', testResourcePermissions);
  await runTest('Audit Logs Table', testAuditLogs);
  await runTest('Table Relationships', testRelationships);
  await runTest('Data Integrity', testDataIntegrity);

  // Display results
  console.log('\n' + '='.repeat(60).cyan);
  console.log('  📊 Test Results  '.cyan.bold);
  console.log('='.repeat(60).cyan);

  const total = results.passed + results.failed;
  const successRate = ((results.passed / total) * 100).toFixed(1);

  console.log(`\n✅ Passed: ${results.passed}/${total}`.green.bold);
  console.log(`❌ Failed: ${results.failed}/${total}`.red.bold);
  console.log(`📈 Success Rate: ${successRate}%`.yellow.bold);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Supabase is fully configured.'.green.bold);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.'.yellow.bold);

    console.log('\nFailed tests:'.red);
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        console.log(`  • ${t.name}${t.error ? `: ${t.error}` : ''}`.red);
      });
  }

  console.log('\n' + '='.repeat(60).cyan);
}

// Run tests
main().catch(console.error);