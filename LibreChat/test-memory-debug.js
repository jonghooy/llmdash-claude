#!/usr/bin/env node
/**
 * Test script to verify MCP memory update with debug logs
 * Run from LibreChat directory: node test-memory-debug.js
 */

// Set debugging environment variables
process.env.MEMORY_MCP_ENABLED = 'true';
process.env.MEMORY_MCP_URL = 'http://localhost:8001';

console.log('============================================');
console.log('MCP Memory Update Debug Test');
console.log('============================================');
console.log('MEMORY_MCP_ENABLED:', process.env.MEMORY_MCP_ENABLED);
console.log('MEMORY_MCP_URL:', process.env.MEMORY_MCP_URL);
console.log('');

// Import the MemoryUpdateTool with proper module aliasing
require('module-alias/register');
const MemoryUpdateTool = require('./api/app/clients/tools/MemoryUpdate');

async function testMemoryUpdate() {
  try {
    console.log('1. Creating MemoryUpdateTool instance...');
    const tool = new MemoryUpdateTool();

    console.log('2. Calling memory update for LLMDash...');
    const result = await tool._call({
      entityName: 'llmdash-test',
      content: `## Debug Test Update ${new Date().toISOString()}

This is a test update from the debug script.
- Testing MCP Direct Client
- Verifying memory persistence
- Debug logs enabled

If this appears in memory-storage/entities/llmdash-test.md, the MCP is working!`,
      operation: 'add'
    });

    console.log('\n3. Memory update result:', result);
    console.log('');
    console.log('============================================');
    console.log('TEST COMPLETED');
    console.log('============================================');

  } catch (error) {
    console.error('\nERROR during test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('Starting test...\n');
testMemoryUpdate().then(() => {
  console.log('\nTest finished. Check the logs above for MCP DEBUG messages.');
  console.log('Also check memory-storage/entities/llmdash-test.md for the new content.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});