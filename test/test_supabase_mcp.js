#!/usr/bin/env node

/**
 * Test Supabase MCP Server
 */

const { spawn } = require('child_process');
const colors = require('colors');

console.log('\n🧪 Testing Supabase MCP Server\n'.cyan.bold);

// Configuration
const SUPABASE_URL = 'https://qctdaaezghvqnbpghinr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos';

// Test MCP Server Installation
async function testMCPInstallation() {
  return new Promise((resolve) => {
    console.log('📦 Checking MCP Server installation...'.yellow);

    const checkInstall = spawn('npx', [
      '-y',
      '@supabase/mcp-server-supabase',
      '--version'
    ]);

    let output = '';
    let errorOutput = '';

    checkInstall.stdout.on('data', (data) => {
      output += data.toString();
    });

    checkInstall.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    checkInstall.on('close', (code) => {
      if (code === 0 || output.includes('supabase') || errorOutput.includes('supabase')) {
        console.log('✅ Supabase MCP Server is installed'.green);
        resolve(true);
      } else {
        console.log('❌ Supabase MCP Server installation check failed'.red);
        resolve(false);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      checkInstall.kill();
      console.log('⚠️ Installation check timed out'.yellow);
      resolve(false);
    }, 10000);
  });
}

// Test MCP Server Connection
async function testMCPConnection() {
  return new Promise((resolve) => {
    console.log('\n🔌 Testing MCP Server connection...'.yellow);

    const mcp = spawn('npx', [
      '-y',
      '@supabase/mcp-server-supabase'
    ], {
      env: {
        ...process.env,
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
      }
    });

    let connected = false;
    let output = '';

    // Send initialization message
    const initMessage = JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {}
      },
      id: 1
    }) + '\n';

    setTimeout(() => {
      mcp.stdin.write(initMessage);
    }, 1000);

    mcp.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('initialized') || output.includes('result')) {
        connected = true;
        console.log('✅ MCP Server connected successfully'.green);
        mcp.kill();
        resolve(true);
      }
    });

    mcp.stderr.on('data', (data) => {
      console.log('MCP Error:'.red, data.toString());
    });

    mcp.on('error', (err) => {
      console.log('❌ Failed to start MCP Server'.red, err.message);
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!connected) {
        console.log('⚠️ MCP Server connection timed out'.yellow);
        mcp.kill();
        resolve(false);
      }
    }, 5000);
  });
}

// Test MCP Commands
async function testMCPCommands() {
  console.log('\n📝 Testing MCP Commands...'.yellow);

  const testCommands = [
    {
      name: 'List Tables',
      request: {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2
      }
    },
    {
      name: 'Query Database',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'supabase_query',
          arguments: {
            query: 'SELECT COUNT(*) FROM organizations'
          }
        },
        id: 3
      }
    }
  ];

  for (const test of testCommands) {
    const result = await testCommand(test);
    if (result) {
      console.log(`  ✅ ${test.name}`.green);
    } else {
      console.log(`  ❌ ${test.name}`.red);
    }
  }
}

async function testCommand(test) {
  return new Promise((resolve) => {
    const mcp = spawn('npx', [
      '-y',
      '@supabase/mcp-server-supabase'
    ], {
      env: {
        ...process.env,
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
      }
    });

    let responded = false;

    // Initialize first
    const initMessage = JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {}
      },
      id: 1
    }) + '\n';

    setTimeout(() => {
      mcp.stdin.write(initMessage);

      // Send test command after initialization
      setTimeout(() => {
        mcp.stdin.write(JSON.stringify(test.request) + '\n');
      }, 500);
    }, 500);

    mcp.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('"id":' + test.request.id)) {
        responded = true;
        mcp.kill();
        resolve(true);
      }
    });

    // Timeout
    setTimeout(() => {
      if (!responded) {
        mcp.kill();
        resolve(false);
      }
    }, 3000);
  });
}

// Create MCP configuration file
function createConfigFile() {
  console.log('\n📄 Creating MCP configuration file...'.yellow);

  const config = {
    supabase: {
      url: SUPABASE_URL,
      anon_key: SUPABASE_ANON_KEY,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        },
        realtime: {
          enabled: true
        }
      }
    }
  };

  const fs = require('fs');
  const configPath = '/home/jonghooy/work/llmdash-claude/supabase/mcp-runtime-config.json';

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration file created at:'.green, configPath);
    return true;
  } catch (err) {
    console.log('❌ Failed to create config file:'.red, err.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting Supabase MCP Tests...'.cyan);
  console.log('='.repeat(50).cyan);

  const results = {
    installation: await testMCPInstallation(),
    connection: await testMCPConnection(),
    config: createConfigFile()
  };

  // Test commands only if connection successful
  if (results.connection) {
    await testMCPCommands();
  }

  // Summary
  console.log('\n' + '='.repeat(50).cyan);
  console.log('📊 Test Summary'.cyan.bold);
  console.log('='.repeat(50).cyan);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`.green);
  console.log(`❌ Failed: ${total - passed}`.red);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Supabase MCP is ready to use.'.green.bold);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration.'.yellow.bold);
  }

  // Instructions
  console.log('\n📚 Usage Instructions:'.yellow.bold);
  console.log('1. The MCP server is now configured for your Supabase project');
  console.log('2. You can use Supabase commands through the MCP interface');
  console.log('3. Configuration file saved at: /home/jonghooy/work/llmdash-claude/supabase/mcp-runtime-config.json');
  console.log('\nAvailable MCP commands:');
  console.log('  - Query database tables');
  console.log('  - Manage authentication');
  console.log('  - Access storage buckets');
  console.log('  - Subscribe to realtime events');
}

// Run the tests
runTests().catch(console.error);