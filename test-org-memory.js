#!/usr/bin/env node

/**
 * Test OrgMemory service directly
 */

// Set environment variables
process.env.ENABLE_MEMORY_SERVICE = 'true';
process.env.MEMORY_MCP_URL = 'http://localhost:8001';

const { getOrgMemoryContext } = require('./LibreChat/api/server/services/OrgMemory');

async function testOrgMemory() {
  console.log('Testing OrgMemory service...\n');

  // Simulate a request with text
  const mockReq = {
    body: {
      text: 'Tell me about LLMDash project and its features'
    }
  };

  try {
    console.log('Calling getOrgMemoryContext with text:', mockReq.body.text);
    const context = await getOrgMemoryContext(mockReq);

    if (context) {
      console.log('\n✅ Memory context retrieved successfully!');
      console.log('Context length:', context.length);
      console.log('\n--- Memory Context ---');
      console.log(context);
      console.log('--- End Context ---\n');
    } else {
      console.log('❌ No memory context returned');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testOrgMemory().catch(console.error);
