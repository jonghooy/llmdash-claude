#!/usr/bin/env node

/**
 * Automated Supabase Setup Runner
 * This script guides through the complete setup process
 */

const { createClient } = require('@supabase/supabase-js');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n' + '='.repeat(60).cyan);
console.log('  🚀 LLMDash Supabase Complete Setup  '.cyan.bold);
console.log('='.repeat(60).cyan + '\n');

// Setup status tracker
const setupStatus = {
  tables: false,
  rls: false,
  auth: false,
  sampleData: false,
  functions: false
};

// Step 1: Check current status
async function checkCurrentStatus() {
  console.log('📊 Checking current Supabase status...'.yellow.bold);

  const tables = [
    'organizations',
    'organizational_units',
    'profiles',
    'invitations',
    'resource_permissions',
    'audit_logs'
  ];

  let allTablesExist = true;
  let totalRows = 0;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error && error.message.includes('not found')) {
        console.log(`  ❌ ${table} - Not found`.red);
        allTablesExist = false;
      } else if (error) {
        console.log(`  ⚠️ ${table} - ${error.message}`.yellow);
      } else {
        console.log(`  ✅ ${table} - Ready (${count || 0} rows)`.green);
        totalRows += (count || 0);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - Error`.red);
      allTablesExist = false;
    }
  }

  setupStatus.tables = allTablesExist;
  setupStatus.sampleData = totalRows > 0;

  return allTablesExist;
}

// Step 2: Display SQL instructions
function displaySQLInstructions() {
  console.log('\n📝 Manual Setup Required:'.yellow.bold);
  console.log('='.repeat(60).yellow);

  console.log('\n1. Go to Supabase SQL Editor:'.cyan);
  console.log('   https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql'.blue.underline);

  console.log('\n2. Copy and run the complete setup SQL:'.cyan);
  console.log('   File: /home/jonghooy/work/llmdash-claude/supabase/setup_all.sql');

  console.log('\n3. The SQL script will:'.cyan);
  console.log('   • Create all 6 required tables');
  console.log('   • Set up proper indexes and constraints');
  console.log('   • Enable RLS (Row Level Security)');
  console.log('   • Create RLS policies');
  console.log('   • Insert sample data (2 organizations with departments)');

  console.log('\n4. After running SQL, configure Authentication:'.cyan);
  console.log('   https://app.supabase.com/project/qctdaaezghvqnbpghinr/auth/providers'.blue.underline);
  console.log('   • Enable Email/Password authentication');
  console.log('   • (Optional) Configure Google OAuth');
  console.log('   • (Optional) Configure GitHub OAuth');

  console.log('\n' + '='.repeat(60).yellow);
}

// Step 3: Test authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Setup...'.yellow.bold);

  try {
    // Check if we can access auth
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('  ✅ Active session found'.green);
      setupStatus.auth = true;
    } else {
      console.log('  ℹ️ No active session (anonymous access)'.blue);
    }

    // Try to check auth settings
    const testEmail = 'test@example.com';
    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test'
    });

    if (error && error.message.includes('Invalid login')) {
      console.log('  ✅ Auth endpoint is responding'.green);
      setupStatus.auth = true;
    } else if (error) {
      console.log(`  ⚠️ Auth status: ${error.message}`.yellow);
    }
  } catch (err) {
    console.log('  ❌ Auth check failed'.red);
  }
}

// Step 4: Create test user (if tables exist)
async function createTestUser() {
  if (!setupStatus.tables) {
    console.log('\n⚠️ Skipping test user creation (tables not ready)'.yellow);
    return;
  }

  console.log('\n👤 Creating test user...'.yellow.bold);

  try {
    // First check if we have any organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError || !orgs || orgs.length === 0) {
      console.log('  ⚠️ No organizations found. Run SQL setup first.'.yellow);
      return;
    }

    const orgId = orgs[0].id;
    console.log(`  ℹ️ Using organization: ${orgs[0].name}`.blue);

    // Try to create a test profile
    const testProfile = {
      id: 'test-user-' + Date.now(),
      organization_id: orgId,
      email: 'admin@llmdash.com',
      username: 'admin',
      full_name: 'Test Administrator',
      role: 'org_admin',
      status: 'active'
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(testProfile)
      .select();

    if (error) {
      console.log(`  ⚠️ Could not create test profile: ${error.message}`.yellow);
    } else {
      console.log('  ✅ Test admin profile ready'.green);
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`.red);
  }
}

// Step 5: Display Edge Functions setup
function displayEdgeFunctionsInfo() {
  console.log('\n⚡ Edge Functions Setup (Optional):'.yellow.bold);
  console.log('='.repeat(60).yellow);

  console.log('\n1. Install Supabase CLI:'.cyan);
  console.log('   npm install -g supabase');

  console.log('\n2. Login to Supabase:'.cyan);
  console.log('   supabase login');

  console.log('\n3. Link your project:'.cyan);
  console.log('   supabase link --project-ref qctdaaezghvqnbpghinr');

  console.log('\n4. Deploy invitation system function:'.cyan);
  console.log('   supabase functions deploy invitation-system');

  console.log('\n' + '='.repeat(60).yellow);
}

// Step 6: Generate summary report
function generateReport() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('  📊 Setup Status Report  '.cyan.bold);
  console.log('='.repeat(60).cyan);

  const statusIcon = (status) => status ? '✅' : '❌';

  console.log('\nCore Components:'.white.bold);
  console.log(`  ${statusIcon(setupStatus.tables)} Database Tables`.white);
  console.log(`  ${statusIcon(setupStatus.rls)} RLS Policies`.white);
  console.log(`  ${statusIcon(setupStatus.auth)} Authentication`.white);
  console.log(`  ${statusIcon(setupStatus.sampleData)} Sample Data`.white);
  console.log(`  ${statusIcon(setupStatus.functions)} Edge Functions`.white);

  const completedCount = Object.values(setupStatus).filter(s => s).length;
  const totalCount = Object.keys(setupStatus).length;
  const percentage = ((completedCount / totalCount) * 100).toFixed(0);

  console.log(`\nOverall Progress: ${completedCount}/${totalCount} (${percentage}%)`.yellow.bold);

  if (percentage === '100') {
    console.log('\n🎉 Congratulations! Your Supabase setup is complete!'.green.bold);
  } else if (percentage >= '60') {
    console.log('\n👍 Good progress! Follow the instructions above to complete setup.'.yellow.bold);
  } else {
    console.log('\n📋 Please follow the SQL setup instructions above.'.yellow.bold);
  }

  console.log('\n' + '='.repeat(60).cyan);
}

// Step 7: Quick access links
function displayQuickLinks() {
  console.log('\n🔗 Quick Access Links:'.yellow.bold);
  console.log('='.repeat(60).yellow);

  const links = [
    { name: 'Dashboard', url: 'https://app.supabase.com/project/qctdaaezghvqnbpghinr' },
    { name: 'SQL Editor', url: 'https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql' },
    { name: 'Table Editor', url: 'https://app.supabase.com/project/qctdaaezghvqnbpghinr/editor' },
    { name: 'Authentication', url: 'https://app.supabase.com/project/qctdaaezghvqnbpghinr/auth/users' },
    { name: 'API Docs', url: 'https://app.supabase.com/project/qctdaaezghvqnbpghinr/api' },
  ];

  links.forEach(link => {
    console.log(`${link.name}:`.cyan);
    console.log(`  ${link.url}`.blue.underline);
  });

  console.log('\n' + '='.repeat(60).yellow);
}

// Main runner
async function main() {
  // Check current status
  const tablesExist = await checkCurrentStatus();

  // Test authentication
  await testAuthentication();

  // If tables don't exist, show instructions
  if (!tablesExist) {
    displaySQLInstructions();
  } else {
    console.log('\n✅ All tables are present!'.green.bold);

    // Try to create test user
    await createTestUser();
  }

  // Show Edge Functions info
  displayEdgeFunctionsInfo();

  // Generate report
  generateReport();

  // Display quick links
  displayQuickLinks();

  console.log('\n💡 Next Steps:'.yellow.bold);
  if (!setupStatus.tables) {
    console.log('1. Run the SQL setup script in Supabase SQL Editor');
  }
  if (!setupStatus.auth) {
    console.log('2. Enable Email/Password authentication in Supabase Dashboard');
  }
  if (!setupStatus.sampleData) {
    console.log('3. The SQL script will create sample data automatically');
  }
  console.log('4. Configure OAuth providers (optional)');
  console.log('5. Deploy Edge Functions (optional)');

  console.log('\n✨ Run this script again after completing the setup to verify!'.cyan.bold);
}

// Run the setup
main().catch(console.error);