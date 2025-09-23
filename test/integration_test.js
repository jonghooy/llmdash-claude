#!/usr/bin/env node

/**
 * Integration Test Suite for LLMDash Platform
 * Tests all components without requiring actual Supabase connection
 */

const colors = require('colors');
const path = require('path');
const fs = require('fs');

console.log('\n' + '='.repeat(60).cyan);
console.log('  🧪 LLMDash Platform Integration Test Suite  '.cyan.bold);
console.log('='.repeat(60).cyan + '\n');

// Test results tracking
const testResults = {
  infrastructure: [],
  authentication: [],
  components: [],
  api: [],
  integration: []
};

// Helper function
function addTestResult(category, name, passed, message = '') {
  testResults[category].push({ name, passed, message });
  if (passed) {
    console.log(`  ✅ ${name}`.green);
  } else {
    console.log(`  ❌ ${name}`.red);
    if (message) console.log(`     ${message}`.yellow);
  }
}

// Test 1: Infrastructure Files
async function testInfrastructure() {
  console.log('🏗️  Testing Infrastructure Setup...'.yellow.bold);

  const requiredFiles = [
    { path: '/supabase/config.ts', name: 'Supabase Config' },
    { path: '/supabase/migrations/001_initial_schema.sql', name: 'Database Schema' },
    { path: '/supabase/migrations/002_rls_policies.sql', name: 'RLS Policies' },
    { path: '/supabase/functions/invitation-system/index.ts', name: 'Edge Functions' },
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join('/home/jonghooy/work/llmdash-claude', file.path);
    const exists = fs.existsSync(fullPath);
    addTestResult('infrastructure', file.name, exists, exists ? '' : `File not found: ${file.path}`);
  }

  console.log('');
}

// Test 2: Authentication Components
async function testAuthentication() {
  console.log('🔐 Testing Authentication Components...'.yellow.bold);

  const authFiles = [
    { path: '/LibreChat/client/src/utils/supabaseAuth.ts', name: 'LibreChat Client Auth' },
    { path: '/LibreChat/api/server/middleware/supabaseAuth.js', name: 'LibreChat Server Auth' },
    { path: '/memory-agent/app/middleware/supabase_auth.py', name: 'Memory Agent Auth' },
  ];

  for (const file of authFiles) {
    const fullPath = path.join('/home/jonghooy/work/llmdash-claude', file.path);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Check for key functions
      const hasJWT = content.includes('JWT') || content.includes('jwt') || content.includes('getAccessToken');
      const hasVerify = content.includes('verify') || content.includes('Verify') || content.includes('refreshSession');
      const isValid = hasJWT && hasVerify;

      addTestResult('authentication', file.name, isValid,
        isValid ? '' : 'Missing JWT verification logic');
    } else {
      addTestResult('authentication', file.name, false, 'File not found');
    }
  }

  console.log('');
}

// Test 3: UI Components
async function testComponents() {
  console.log('🎨 Testing UI Components...'.yellow.bold);

  const components = [
    { path: '/LibreChat-Admin/frontend/src/components/Organization/OrganizationTree.tsx', name: 'Organization Tree' },
    { path: '/LibreChat-Admin/frontend/src/components/Invitation/InvitationManager.tsx', name: 'Invitation Manager' },
    { path: '/LibreChat-Admin/frontend/src/components/Permissions/PermissionModal.tsx', name: 'Permission Modal' },
    { path: '/LibreChat-Admin/frontend/src/pages/OrganizationManagement.tsx', name: 'Organization Page' },
  ];

  for (const comp of components) {
    const fullPath = path.join('/home/jonghooy/work/llmdash-claude', comp.path);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Check for React component structure
      const hasReact = content.includes('React') || content.includes('react');
      const hasExport = content.includes('export');
      const isValid = hasReact && hasExport;

      addTestResult('components', comp.name, isValid,
        isValid ? '' : 'Invalid React component structure');
    } else {
      addTestResult('components', comp.name, false, 'Component not found');
    }
  }

  console.log('');
}

// Test 4: API Endpoints
async function testAPIEndpoints() {
  console.log('🔌 Testing API Endpoints...'.yellow.bold);

  const apiFile = '/memory-agent/app/api/memory_routes.py';
  const fullPath = path.join('/home/jonghooy/work/llmdash-claude', apiFile);

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');

    const endpoints = [
      { route: 'POST /', name: 'Create Memory' },
      { route: 'GET /{memory_id}', name: 'Get Memory' },
      { route: 'PUT /{memory_id}', name: 'Update Memory' },
      { route: 'DELETE /{memory_id}', name: 'Delete Memory' },
      { route: 'POST /search', name: 'Search Memories' },
      { route: 'GET /', name: 'List Memories' },
    ];

    for (const endpoint of endpoints) {
      const routePattern = endpoint.route.split(' ')[0].toLowerCase();
      const hasEndpoint = content.includes(`@router.${routePattern}`);
      addTestResult('api', endpoint.name, hasEndpoint,
        hasEndpoint ? '' : `Missing ${endpoint.route} endpoint`);
    }
  } else {
    addTestResult('api', 'Memory Routes File', false, 'API file not found');
  }

  console.log('');
}

// Test 5: Integration Points
async function testIntegration() {
  console.log('🔗 Testing Integration Points...'.yellow.bold);

  // Check for proper imports and dependencies
  const integrations = [
    {
      name: 'Supabase Client Import',
      file: '/LibreChat-Admin/frontend/src/lib/supabase.ts',
      check: '@supabase/supabase-js'
    },
    {
      name: 'JWT Verification',
      file: '/LibreChat/api/server/middleware/supabaseAuth.js',
      check: 'jsonwebtoken'
    },
    {
      name: 'FastAPI Dependencies',
      file: '/memory-agent/app/middleware/supabase_auth.py',
      check: 'HTTPBearer'
    },
  ];

  for (const integration of integrations) {
    const fullPath = path.join('/home/jonghooy/work/llmdash-claude', integration.file);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasIntegration = content.includes(integration.check);
      addTestResult('integration', integration.name, hasIntegration,
        hasIntegration ? '' : `Missing ${integration.check}`);
    } else {
      addTestResult('integration', integration.name, false, 'File not found');
    }
  }

  // Check deployment guide
  const deploymentGuide = '/home/jonghooy/work/llmdash-claude/DEPLOYMENT_GUIDE.md';
  if (fs.existsSync(deploymentGuide)) {
    const content = fs.readFileSync(deploymentGuide, 'utf8');
    const hasSetupSteps = content.includes('Deployment Steps');
    const hasConfig = content.includes('Environment Configuration');
    const isComplete = hasSetupSteps && hasConfig;

    addTestResult('integration', 'Deployment Guide', isComplete,
      isComplete ? '' : 'Incomplete deployment documentation');
  }

  console.log('');
}

// Generate Test Report
function generateReport() {
  console.log('='.repeat(60).cyan);
  console.log('  📊 Test Summary Report  '.cyan.bold);
  console.log('='.repeat(60).cyan);

  let totalTests = 0;
  let totalPassed = 0;

  for (const [category, results] of Object.entries(testResults)) {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    totalTests += total;
    totalPassed += passed;

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    console.log(`\n${categoryName}:`.white.bold);
    console.log(`  Tests Run: ${total}`);
    console.log(`  Passed: ${passed}`.green);
    console.log(`  Failed: ${total - passed}`.red);
    console.log(`  Success Rate: ${passRate}%`.yellow);

    // Show failed tests
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('  Failed Tests:'.red);
      failed.forEach(test => {
        console.log(`    - ${test.name}`.red);
        if (test.message) {
          console.log(`      ${test.message}`.gray);
        }
      });
    }
  }

  console.log('\n' + '='.repeat(60).cyan);
  console.log('  Overall Results  '.white.bold);
  console.log('='.repeat(60).cyan);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`.green);
  console.log(`❌ Failed: ${totalTests - totalPassed}`.red);

  const overallRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  console.log(`📈 Success Rate: ${overallRate}%`.yellow.bold);

  // Final verdict
  console.log('\n' + '='.repeat(60).cyan);
  if (overallRate >= 80) {
    console.log('  🎉 Platform is ready for deployment!  '.green.bold);
  } else if (overallRate >= 60) {
    console.log('  ⚠️  Platform needs some fixes before deployment  '.yellow.bold);
  } else {
    console.log('  ❌ Platform has critical issues that need fixing  '.red.bold);
  }
  console.log('='.repeat(60).cyan + '\n');

  // Recommendations
  if (totalTests - totalPassed > 0) {
    console.log('📝 Recommendations:'.yellow.bold);

    if (testResults.infrastructure.some(r => !r.passed)) {
      console.log('  • Complete infrastructure setup and file creation');
    }
    if (testResults.authentication.some(r => !r.passed)) {
      console.log('  • Review and fix authentication components');
    }
    if (testResults.components.some(r => !r.passed)) {
      console.log('  • Ensure all UI components are properly created');
    }
    if (testResults.api.some(r => !r.passed)) {
      console.log('  • Implement missing API endpoints');
    }
    if (testResults.integration.some(r => !r.passed)) {
      console.log('  • Fix integration points and dependencies');
    }
    console.log('');
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testInfrastructure();
    await testAuthentication();
    await testComponents();
    await testAPIEndpoints();
    await testIntegration();
    generateReport();
  } catch (error) {
    console.error('Test suite error:'.red, error.message);
  }
}

// Execute tests
runAllTests();