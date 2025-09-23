#!/usr/bin/env node

/**
 * Supabase Helper Script
 * Direct interaction with Supabase without MCP
 */

const { createClient } = require('@supabase/supabase-js');
const colors = require('colors');

// Supabase Configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper class for Supabase operations
class SupabaseHelper {
  constructor() {
    this.client = supabase;
  }

  // Database operations
  async listTables() {
    console.log('📊 Available Tables:'.cyan);
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
        const { count, error } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error && error.message.includes('not found')) {
          console.log(`  ❌ ${table} - Not created`.red);
        } else if (error) {
          console.log(`  ⚠️ ${table} - ${error.message}`.yellow);
        } else {
          console.log(`  ✅ ${table} - Ready (${count || 0} rows)`.green);
        }
      } catch (err) {
        console.log(`  ❌ ${table} - Error: ${err.message}`.red);
      }
    }
  }

  // Create tables (SQL migration helper)
  getSQLMigrations() {
    console.log('\n📝 SQL Migrations to Run:'.cyan);
    console.log('Copy and execute these in Supabase SQL Editor:'.yellow);
    console.log('\n1. Navigate to: https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql');
    console.log('2. Run the migrations from:');
    console.log('   - /supabase/migrations/001_initial_schema.sql');
    console.log('   - /supabase/migrations/002_rls_policies.sql\n');
  }

  // Test authentication
  async testAuth() {
    console.log('\n🔐 Testing Authentication:'.cyan);

    try {
      // Test anonymous access
      const { data: { session } } = await this.client.auth.getSession();
      if (session) {
        console.log('  ✅ Active session found'.green);
      } else {
        console.log('  ℹ️ No active session (anonymous access)'.blue);
      }

      // Test sign up capability
      const testEmail = `test_${Date.now()}@example.com`;
      const { data, error } = await this.client.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!'
      });

      if (error && error.message.includes('not enabled')) {
        console.log('  ⚠️ Email auth not enabled - Enable in Supabase Dashboard'.yellow);
      } else if (error) {
        console.log(`  ❌ Auth test failed: ${error.message}`.red);
      } else {
        console.log('  ✅ Authentication service working'.green);
      }
    } catch (err) {
      console.log(`  ❌ Auth error: ${err.message}`.red);
    }
  }

  // Create sample data
  async createSampleData() {
    console.log('\n📦 Creating Sample Data:'.cyan);

    // Check if tables exist first
    const { error: checkError } = await this.client
      .from('organizations')
      .select('*')
      .limit(1);

    if (checkError && checkError.message.includes('not found')) {
      console.log('  ❌ Tables not found. Please run migrations first.'.red);
      this.getSQLMigrations();
      return;
    }

    // Try to create a sample organization
    try {
      const { data, error } = await this.client
        .from('organizations')
        .insert({
          name: 'Demo Company',
          slug: 'demo-company',
          description: 'Sample organization for testing',
          subscription_tier: 'free',
          max_users: 10,
          max_storage_gb: 10
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ Failed to create organization: ${error.message}`.red);
      } else {
        console.log(`  ✅ Created organization: ${data.name}`.green);
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`.red);
    }
  }

  // Display connection info
  showInfo() {
    console.log('\n📌 Supabase Project Information:'.cyan.bold);
    console.log('='.repeat(50).cyan);
    console.log(`Project URL: ${SUPABASE_URL}`.white);
    console.log(`Project Ref: qctdaaezghvqnbpghinr`.white);
    console.log(`Dashboard: https://app.supabase.com/project/qctdaaezghvqnbpghinr`.yellow);
    console.log('='.repeat(50).cyan);
  }

  // Interactive menu
  async runInteractive() {
    console.log('\n🚀 Supabase Helper Tool'.cyan.bold);
    console.log('='.repeat(50).cyan);

    this.showInfo();

    // Run diagnostics
    await this.listTables();
    await this.testAuth();

    console.log('\n📚 Next Steps:'.yellow.bold);
    console.log('1. If tables are missing, run the SQL migrations in Supabase Dashboard');
    console.log('2. Enable Email/Password authentication in Authentication > Providers');
    console.log('3. Configure OAuth providers (Google, GitHub) if needed');
    console.log('4. Set up Edge Functions for advanced features');

    console.log('\n💡 Quick Links:'.yellow.bold);
    console.log('SQL Editor: https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql'.blue);
    console.log('Table Editor: https://app.supabase.com/project/qctdaaezghvqnbpghinr/editor'.blue);
    console.log('Authentication: https://app.supabase.com/project/qctdaaezghvqnbpghinr/auth/users'.blue);
    console.log('API Docs: https://app.supabase.com/project/qctdaaezghvqnbpghinr/api'.blue);
  }
}

// Command line interface
async function main() {
  const helper = new SupabaseHelper();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await helper.runInteractive();
  } else {
    switch (args[0]) {
      case 'tables':
        await helper.listTables();
        break;
      case 'auth':
        await helper.testAuth();
        break;
      case 'sample':
        await helper.createSampleData();
        break;
      case 'info':
        helper.showInfo();
        break;
      case 'migrations':
        helper.getSQLMigrations();
        break;
      default:
        console.log('Usage: node supabase-helper.js [command]'.yellow);
        console.log('Commands:');
        console.log('  tables    - List database tables');
        console.log('  auth      - Test authentication');
        console.log('  sample    - Create sample data');
        console.log('  info      - Show project information');
        console.log('  migrations - Show migration instructions');
        console.log('  (no args) - Run interactive diagnostics');
    }
  }
}

// Run the helper
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other scripts
module.exports = SupabaseHelper;