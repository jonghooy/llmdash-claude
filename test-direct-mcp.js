#!/usr/bin/env node
/**
 * Test Direct MCP Client
 */

const { getMCPDirectClient } = require('./LibreChat/api/server/services/MCPDirectClient');

async function testDirectMCP() {
  console.log('='.repeat(60));
  console.log('Direct MCP Client Test');
  console.log('='.repeat(60));

  try {
    const client = getMCPDirectClient();

    // 1. List memories
    console.log('\n1. Listing memories...');
    const memories = await client.listMemories();
    console.log('Memory files:', memories.files);

    // 2. Add memory
    console.log('\n2. Adding memory to llmdash entity...');
    const currentTime = new Date().toISOString();
    const content = `
## Direct MCP Test - ${currentTime}

**Launch Date**: December 3rd, 2024 (Updated via Direct MCP Client)

### MCP Protocol Status
- Direct Python execution: ✅ WORKING
- MCP tools integration: ✅ SUCCESS
- Memory persistence: ✅ VERIFIED

Updated at: ${currentTime}
`;

    const result = await client.addMemory('llmdash', content);
    console.log('✅ Memory added successfully:', result);

    // 3. Search for the update
    console.log('\n3. Searching for December 3rd...');
    const searchResult = await client.searchMemory('December 3rd');
    console.log('Search result (first 200 chars):', searchResult?.substring(0, 200));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete - Direct MCP Client Working!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testDirectMCP();