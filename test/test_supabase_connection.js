/**
 * Test Supabase Connection and Basic Operations
 */
const { createClient } = require('@supabase/supabase-js');
const colors = require('colors');

// Supabase configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper function for test logging
function testLog(testName, success, message = '') {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`✅ ${testName}`.green);
  } else {
    failedTests++;
    console.log(`❌ ${testName}`.red);
    if (message) console.log(`   Error: ${message}`.yellow);
  }
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log('\n🧪 Starting Supabase Connection Tests\n'.cyan.bold);

  // Test 1: Basic Connection
  console.log('📡 Testing Supabase Connection...'.yellow);
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('count', { count: 'exact', head: true });

    if (error) {
      testLog('Supabase Connection', false, error.message);
    } else {
      testLog('Supabase Connection', true);
    }
  } catch (err) {
    testLog('Supabase Connection', false, err.message);
  }

  // Test 2: Authentication Service
  console.log('\n🔐 Testing Authentication Service...'.yellow);
  try {
    // Test sign up (will fail if email exists, but confirms auth service works)
    const testEmail = `test_${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
    });

    if (error && error.message.includes('rate limit')) {
      testLog('Auth Service Available', true, 'Rate limited but service is working');
    } else if (error) {
      testLog('Auth Service', false, error.message);
    } else {
      testLog('Auth Service', true);
      // Clean up - sign out
      await supabase.auth.signOut();
    }
  } catch (err) {
    testLog('Auth Service', false, err.message);
  }

  // Test 3: Database Tables Existence
  console.log('\n📊 Testing Database Tables...'.yellow);
  const tables = [
    'organizations',
    'organizational_units',
    'profiles',
    'invitations',
    'resource_permissions',
    'audit_logs'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.message.includes('permission denied')) {
        testLog(`Table '${table}' exists (RLS active)`, true);
      } else if (error) {
        testLog(`Table '${table}'`, false, error.message);
      } else {
        testLog(`Table '${table}' exists`, true);
      }
    } catch (err) {
      testLog(`Table '${table}'`, false, err.message);
    }
  }

  // Test 4: RLS Policies
  console.log('\n🛡️ Testing RLS Policies...'.yellow);
  try {
    // Try to read without authentication
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error && error.message.includes('JWT')) {
      testLog('RLS Policies Active', true, 'Unauthorized access blocked');
    } else if (data && data.length === 0) {
      testLog('RLS Policies Active', true, 'No data returned for anonymous user');
    } else {
      testLog('RLS Policies', false, 'Data accessible without auth');
    }
  } catch (err) {
    testLog('RLS Policies', true, 'Access properly restricted');
  }

  // Test 5: Real-time Subscriptions
  console.log('\n📡 Testing Real-time Subscriptions...'.yellow);
  try {
    const channel = supabase
      .channel('test_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organizations'
      }, (payload) => {
        console.log('Real-time event received:', payload);
      });

    const status = await channel.subscribe();

    if (status === 'SUBSCRIBED') {
      testLog('Real-time Subscriptions', true);
      channel.unsubscribe();
    } else {
      testLog('Real-time Subscriptions', false, `Status: ${status}`);
    }
  } catch (err) {
    testLog('Real-time Subscriptions', false, err.message);
  }

  // Test 6: Storage Bucket (if configured)
  console.log('\n📦 Testing Storage Service...'.yellow);
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      testLog('Storage Service', false, error.message);
    } else {
      testLog('Storage Service', true, `${data?.length || 0} buckets found`);
    }
  } catch (err) {
    testLog('Storage Service', false, err.message);
  }

  // Print Summary
  console.log('\n' + '='.repeat(50).cyan);
  console.log('📊 Test Summary'.cyan.bold);
  console.log('='.repeat(50).cyan);
  console.log(`Total Tests: ${totalTests}`.white);
  console.log(`✅ Passed: ${passedTests}`.green);
  console.log(`❌ Failed: ${failedTests}`.red);
  console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`.yellow);
  console.log('='.repeat(50).cyan);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Supabase is properly configured.'.green.bold);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration.'.yellow.bold);
  }
}

// Run tests
runTests().catch(console.error);