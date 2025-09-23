const fetch = require('node-fetch');

const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

async function testAPI() {
  console.log('🔍 Testing Supabase API directly...\n');

  const tables = ['organizations', 'organizational_units', 'profiles', 'invitations', 'resource_permissions', 'audit_logs'];

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=5`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table}: ${data.length} rows found`);
        if (data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 150)}...`);
        }
      } else {
        const error = await response.text();
        console.log(`❌ ${table}: ${response.status} - ${error.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('If you see data above, the setup was successful!');
  console.log('The RLS error might be a client SDK issue.');
}

testAPI().catch(console.error);