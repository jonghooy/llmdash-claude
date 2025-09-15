const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@librechat.local';
const ADMIN_PASSWORD = 'admin123456';

// Sample MCP servers to create
const sampleMCPServers = [
  {
    name: 'File System MCP',
    description: 'MCP server for file system operations',
    version: '1.0.0',
    connectionType: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    category: 'utility',
    isActive: true,
    isPublic: true,
    config: {
      maxConcurrentConnections: 5,
      timeout: 30000,
      retryAttempts: 3
    }
  },
  {
    name: 'GitHub MCP',
    description: 'MCP server for GitHub integration',
    version: '1.0.0',
    connectionType: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    category: 'development',
    isActive: true,
    isPublic: true
  },
  {
    name: 'Web Search MCP',
    description: 'MCP server for web search capabilities',
    version: '1.0.0',
    connectionType: 'sse',
    url: 'https://mcp-web-search.example.com/sse',
    category: 'research',
    isActive: false,
    isPublic: false
  }
];

async function testMCPServers() {
  let token;
  
  try {
    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Create MCP servers
    console.log('📡 Creating sample MCP servers...');
    const createdServers = [];
    
    for (const server of sampleMCPServers) {
      try {
        const response = await axios.post(`${API_BASE}/mcp-servers`, server, {
          headers: { Authorization: `Bearer ${token}` }
        });
        createdServers.push(response.data);
        console.log(`✅ Created MCP server: ${server.name}`);
      } catch (error) {
        if (error.response?.data?.error?.includes('already exists')) {
          console.log(`⚠️  MCP server already exists: ${server.name}`);
          // Try to fetch the existing server
          const getResponse = await axios.get(`${API_BASE}/mcp-servers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const existing = getResponse.data.servers.find(s => s.name === server.name);
          if (existing) createdServers.push(existing);
        } else {
          console.error(`❌ Failed to create MCP server ${server.name}:`, error.response?.data || error.message);
        }
      }
    }
    console.log();
    
    // 3. Fetch all MCP servers
    console.log('📋 Fetching all MCP servers...');
    const allServersResponse = await axios.get(`${API_BASE}/mcp-servers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${allServersResponse.data.servers.length} MCP servers\n`);
    
    // Display servers
    console.log('📊 MCP Server List:');
    allServersResponse.data.servers.forEach(server => {
      console.log(`  - ${server.name} (${server.connectionType})`);
      console.log(`    Status: ${server.isActive ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`    Health: ${server.healthCheck.status}`);
      console.log(`    Category: ${server.category}`);
      console.log(`    Public: ${server.isPublic ? 'Yes' : 'No'}`);
      console.log(`    Tools: ${server.toolCount || 0}`);
      console.log();
    });
    
    // 4. Test connection for active servers
    console.log('🔧 Testing MCP server connections...');
    for (const server of createdServers) {
      if (server && server.isActive) {
        try {
          console.log(`  Testing ${server.name}...`);
          const testResponse = await axios.post(
            `${API_BASE}/mcp-servers/${server._id}/test`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (testResponse.data.success) {
            console.log(`  ✅ ${server.name}: Connection successful (${testResponse.data.responseTime}ms)`);
          } else {
            console.log(`  ❌ ${server.name}: Connection failed - ${testResponse.data.error}`);
          }
        } catch (error) {
          console.log(`  ❌ ${server.name}: Test failed - ${error.message}`);
        }
      }
    }
    console.log();
    
    // 5. Get statistics for a server
    if (createdServers.length > 0 && createdServers[0]) {
      console.log(`📈 Getting statistics for ${createdServers[0].name}...`);
      try {
        const statsResponse = await axios.get(
          `${API_BASE}/mcp-servers/${createdServers[0]._id}/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('  Statistics:');
        console.log(`    Total connections: ${statsResponse.data.stats.totalConnections}`);
        console.log(`    Successful: ${statsResponse.data.stats.successfulConnections}`);
        console.log(`    Failed: ${statsResponse.data.stats.failedConnections}`);
        console.log(`    Tool calls: ${statsResponse.data.stats.totalToolCalls}`);
        console.log(`    Health status: ${statsResponse.data.healthCheck.status}`);
        if (statsResponse.data.healthCheck.lastCheck) {
          console.log(`    Last health check: ${new Date(statsResponse.data.healthCheck.lastCheck).toLocaleString()}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not fetch stats: ${error.message}`);
      }
    }
    
    // 6. Test bulk operations
    console.log('\n🔄 Testing bulk operations...');
    const serverIds = createdServers.filter(s => s).map(s => s._id);
    
    if (serverIds.length > 0) {
      // Deactivate all
      const deactivateResponse = await axios.post(
        `${API_BASE}/mcp-servers/bulk/deactivate`,
        { serverIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Deactivated ${deactivateResponse.data.updated} servers`);
      
      // Reactivate all
      const activateResponse = await axios.post(
        `${API_BASE}/mcp-servers/bulk/activate`,
        { serverIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Activated ${activateResponse.data.updated} servers`);
    }
    
    console.log('\n✅ All MCP server tests completed successfully!');
    console.log('\n📌 You can now:');
    console.log('  1. Visit https://www.llmdash.com/admin to see the MCP Servers menu');
    console.log('  2. Manage MCP servers through the UI');
    console.log('  3. Test connections and view statistics');
    console.log('  4. Configure which servers are available to users');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure the admin backend is running and credentials are correct');
    }
    process.exit(1);
  }
}

// Run the test
testMCPServers();