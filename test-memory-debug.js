#!/usr/bin/env node

/**
 * Memory System Debug Test Script
 * Tests the flow from Admin memory creation to Chat memory retrieval
 */

const axios = require('axios');

// Configuration
const ADMIN_API_URL = 'http://localhost:5001';
const LIBRECHAT_API_URL = 'http://localhost:3080';

// Test credentials
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';  // Set this or use login to get token

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function loginAdmin() {
  try {
    logSection('STEP 1: Admin Login');
    
    const response = await axios.post(`${ADMIN_API_URL}/api/auth/login`, {
      email: 'admin@librechat.local',
      password: 'Admin123456'
    });
    
    const token = response.data.token;
    log(`✓ Admin logged in successfully`, 'green');
    log(`Token: ${token.substring(0, 30)}...`, 'cyan');
    
    return token;
  } catch (error) {
    log(`✗ Admin login failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    throw error;
  }
}

async function createMemory(token) {
  try {
    logSection('STEP 2: Create Memory in Admin');
    
    const memoryData = {
      key: 'team_dev_rules',
      value: '팀 개발 규칙: 1. 모든 코드는 TypeScript로 작성한다. 2. 커밋 메시지는 한글로 작성한다. 3. PR 리뷰는 2명 이상이 진행한다. 4. 테스트 커버리지는 80% 이상 유지한다.',
      category: 'development',
      type: 'string',  // Changed from 'rule' to 'string' (valid enum value)
      description: '팀 개발 규칙과 가이드라인',
      accessLevel: 'public',
      tags: ['development', 'rules', 'team'],
      organizationId: 'default',
      teamId: 'dev-team'
    };
    
    log('Creating memory with data:', 'yellow');
    console.log(JSON.stringify(memoryData, null, 2));
    
    const response = await axios.post(
      `${ADMIN_API_URL}/api/memory`,
      memoryData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log(`✓ Memory created successfully`, 'green');
    log(`Memory ID: ${response.data._id}`, 'cyan');
    log(`Memory Key: ${response.data.key}`, 'cyan');
    
    return response.data;
  } catch (error) {
    log(`✗ Memory creation failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    throw error;
  }
}

async function fetchMemoryFromAdmin(token) {
  try {
    logSection('STEP 3: Fetch Memory from Admin API');
    
    const response = await axios.get(
      `${ADMIN_API_URL}/api/memory`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log(`✓ Memories fetched from Admin`, 'green');
    log(`Total memories: ${response.data.memories.length}`, 'cyan');
    
    // Display all public memories
    const publicMemories = response.data.memories.filter(m => 
      m.accessLevel === 'public' && m.isActive
    );
    
    log(`\nPublic Active Memories (${publicMemories.length}):`, 'yellow');
    publicMemories.forEach(mem => {
      console.log(`  - ${mem.key}: ${mem.value.substring(0, 50)}...`);
    });
    
    return response.data.memories;
  } catch (error) {
    log(`✗ Failed to fetch memories: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    throw error;
  }
}

async function testOrgMemoryService(token) {
  try {
    logSection('STEP 4: Test OrgMemory Service Directly');
    
    // Direct test of the OrgMemory service
    const OrgMemory = require('./LibreChat/api/server/services/OrgMemory');
    
    log('Testing fetchOrgMemories function...', 'yellow');
    const memories = await OrgMemory.fetchOrgMemories(token);
    
    log(`✓ OrgMemory.fetchOrgMemories result:`, 'green');
    console.log(JSON.stringify(memories, null, 2));
    
    log('\nTesting formatMemoriesAsSystemMessage...', 'yellow');
    const systemMessage = OrgMemory.formatMemoriesAsSystemMessage(memories);
    
    log(`✓ System message generated:`, 'green');
    console.log(systemMessage);
    
    return { memories, systemMessage };
  } catch (error) {
    log(`✗ OrgMemory service test failed: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

async function checkLibreChatIntegration(token) {
  try {
    logSection('STEP 5: Check LibreChat Integration');
    
    log('Note: This step requires LibreChat to be running', 'yellow');
    log('Check the LibreChat logs for [OrgMemory] entries', 'yellow');
    
    // Simulate a chat request to trigger memory loading
    log('\nTo test in LibreChat:', 'cyan');
    log('1. Go to https://www.llmdash.com/chat', 'cyan');
    log('2. Send a message asking about "팀 개발 규칙"', 'cyan');
    log('3. Check the backend logs for memory loading', 'cyan');
    
    return true;
  } catch (error) {
    log(`✗ LibreChat integration check failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  try {
    console.clear();
    log('MEMORY SYSTEM DEBUG TEST', 'bright');
    log('========================\n', 'bright');
    
    // Step 1: Login to Admin
    const adminToken = ADMIN_TOKEN || await loginAdmin();
    
    // Step 2: Create a test memory
    await createMemory(adminToken);
    
    // Step 3: Fetch memories from Admin API
    await fetchMemoryFromAdmin(adminToken);
    
    // Step 4: Test OrgMemory service directly
    await testOrgMemoryService(adminToken);
    
    // Step 5: Instructions for LibreChat testing
    await checkLibreChatIntegration(adminToken);
    
    logSection('TEST COMPLETE');
    log('✓ All steps completed. Check the logs above for any issues.', 'green');
    log('\nIMPORTANT: Check the backend logs for detailed debug information:', 'yellow');
    log('- Admin backend: pm2 logs admin-backend', 'cyan');
    log('- LibreChat backend: pm2 logs librechat-backend', 'cyan');
    
  } catch (error) {
    logSection('TEST FAILED');
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();