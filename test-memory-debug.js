#!/usr/bin/env node
/**
 * Test script to verify MCP memory update with debug logs
 * This script simulates what happens when memory_update tool is called in chat
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

// Import the MemoryUpdateTool
const MemoryUpdateTool = require('./api/app/clients/tools/MemoryUpdate');

async function testMemoryUpdate() {
  try {
    console.log('1. Creating MemoryUpdateTool instance...');
    const tool = new MemoryUpdateTool();

    console.log('2. Calling memory update for LLMDash...');
    const result = await tool._call({
      entityName: 'llmdash',
      content: `## Test Update ${new Date().toISOString()}

This is a test update from the debug script.
- Testing MCP Direct Client
- Verifying memory persistence
- Debug logs enabled`,
      operation: 'add'
    });

    console.log('3. Memory update result:', result);
    console.log('');
    console.log('============================================');
    console.log('TEST COMPLETED');
    console.log('============================================');

  } catch (error) {
    console.error('ERROR during test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('Starting test...\n');
testMemoryUpdate().then(() => {
  console.log('\nTest finished. Check the logs above for MCP DEBUG messages.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});