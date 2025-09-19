#!/usr/bin/env node
/**
 * Test Node.js MCP stdio client
 */

const { getMCPClient } = require('./LibreChat/api/server/services/MCPStdioClient');

async function testMCPClient() {
  console.log('='.repeat(60));
  console.log('Node.js MCP Stdio Client Test');
  console.log('='.repeat(60));

  try {
    // 1. Initialize MCP client
    console.log('\n1. Starting MCP client...');
    const mcpClient = getMCPClient();
    await mcpClient.start();
    console.log('✅ MCP client started successfully');

    // 2. List available tools
    console.log('\n2. Listing available tools...');
    const tools = await mcpClient.listTools();
    console.log('Available tools:', tools.map(t => t.name));

    // 3. List memories
    console.log('\n3. Listing memories...');
    const memories = await mcpClient.listMemories();
    console.log('Memory files:', memories.files);

    // 4. Add memory
    console.log('\n4. Adding memory to llmdash entity...');
    const currentTime = new Date().toISOString();
    const content = `
## Node.js MCP Test Update - ${currentTime}

**Launch Date**: December 3rd, 2024 (Updated via Node.js MCP Client)

### Test Results
- Node.js stdio MCP client: ✅ WORKING
- Tool listing: ✅ SUCCESS
- Memory listing: ✅ SUCCESS
- Memory update: ✅ SUCCESS

Updated at: ${currentTime}
`;

    const result = await mcpClient.addMemory('llmdash', content);
    console.log('✅ Memory added successfully:', result);

    // 5. Search for the update
    console.log('\n5. Searching for update...');
    const searchResult = await mcpClient.searchMemory('December 3rd');
    console.log('Search result:', searchResult);

    // 6. Stop the client
    console.log('\n6. Stopping MCP client...');
    await mcpClient.stop();
    console.log('✅ MCP client stopped');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete - Node.js MCP Client Working!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPClient();