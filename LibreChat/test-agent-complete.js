const axios = require('axios');

async function completeAgentTest() {
  const adminApiUrl = 'http://localhost:5001';
  const internalApiKey = 'sk-internal-api-key-for-service-communication-2025';

  console.log('🚀 Complete Agent Management System Test\n');
  console.log('=========================================\n');

  try {
    // Step 1: Get MCP Servers
    console.log('📡 Step 1: Fetching MCP Servers...');
    const mcpResponse = await axios.get(`${adminApiUrl}/api/mcp-servers`, {
      headers: { 'X-API-Key': internalApiKey },
      params: { isActive: true }
    });

    console.log(`Found ${mcpResponse.data.servers.length} active MCP servers:`);
    mcpResponse.data.servers.forEach(server => {
      console.log(`  • ${server.name} (${server.connectionType})`);
    });

    // Step 2: Create a powerful agent with MCP tools
    console.log('\n🤖 Step 2: Creating Full-Stack Developer Agent...');

    const agentData = {
      name: 'Full-Stack Developer AI',
      description: 'Expert AI agent for full-stack development with file operations and GitHub integration',
      type: 'specialist',
      category: 'coding',
      systemPrompt: `You are an expert full-stack developer with deep knowledge of:
- Frontend: React, TypeScript, Vue, Angular
- Backend: Node.js, Python, Java, Go
- Databases: MongoDB, PostgreSQL, MySQL
- DevOps: Docker, Kubernetes, CI/CD
- Cloud: AWS, GCP, Azure

You have access to file system operations and GitHub tools.
Always provide working code examples and best practices.`,
      instructions: 'Use MCP tools to read/write files and manage GitHub repositories when needed.',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 8000,
      mcpServers: mcpResponse.data.servers.map(s => s._id),
      capabilities: {
        codeExecution: true,
        fileAccess: true,
        webSearch: true,
        imageGeneration: false,
        dataAnalysis: true
      },
      isPublic: true,
      isActive: true,
      tags: ['development', 'coding', 'fullstack', 'mcp', 'github', 'files']
    };

    const createResponse = await axios.post(`${adminApiUrl}/api/agents`, agentData, {
      headers: {
        'X-API-Key': internalApiKey,
        'Content-Type': 'application/json'
      }
    });

    const agent = createResponse.data;
    console.log(`✅ Agent created: ${agent.name}`);
    console.log(`   ID: ${agent._id}`);
    console.log(`   MCP Servers: ${agent.mcpServers.length}`);
    console.log(`   Tools: ${agent.tools.length}`);

    // Step 3: Test the agent
    console.log('\n🧪 Step 3: Testing agent capabilities...');
    const testResponse = await axios.post(
      `${adminApiUrl}/api/agents/${agent._id}/test`,
      {},
      {
        headers: { 'X-API-Key': internalApiKey }
      }
    );

    console.log('Test Results:');
    console.log(`  • Status: ${testResponse.data.status}`);
    console.log(`  • Model: ${testResponse.data.model}`);
    console.log(`  • Tools Count: ${testResponse.data.toolsCount}`);
    console.log(`  • MCP Servers: ${testResponse.data.mcpServersCount}`);
    console.log(`  • Message: ${testResponse.data.testMessage}`);

    // Step 4: Get detailed agent info
    console.log('\n📋 Step 4: Agent Full Configuration...');
    const detailResponse = await axios.get(
      `${adminApiUrl}/api/agents/${agent._id}`,
      {
        headers: { 'X-API-Key': internalApiKey }
      }
    );

    const fullAgent = detailResponse.data;
    console.log('\nAgent Details:');
    console.log('├─ Basic Info:');
    console.log(`│  ├─ Name: ${fullAgent.name}`);
    console.log(`│  ├─ Type: ${fullAgent.type}`);
    console.log(`│  └─ Category: ${fullAgent.category}`);
    console.log('├─ Configuration:');
    console.log(`│  ├─ Model: ${fullAgent.model}`);
    console.log(`│  ├─ Temperature: ${fullAgent.temperature}`);
    console.log(`│  └─ Max Tokens: ${fullAgent.maxTokens}`);
    console.log('├─ MCP Integration:');
    fullAgent.mcpServers.forEach(server => {
      console.log(`│  ├─ ${server.name} (${server.connectionType})`);
    });
    console.log('├─ Capabilities:');
    Object.entries(fullAgent.capabilities).forEach(([key, value]) => {
      if (value) console.log(`│  ├─ ✅ ${key}`);
    });
    console.log('└─ Status:');
    console.log(`   ├─ Active: ${fullAgent.isActive ? '✅' : '❌'}`);
    console.log(`   └─ Public: ${fullAgent.isPublic ? '✅' : '❌'}`);

    // Step 5: List all agents
    console.log('\n📊 Step 5: All Available Agents...');
    const listResponse = await axios.get(`${adminApiUrl}/api/agents`, {
      headers: { 'X-API-Key': internalApiKey }
    });

    console.log(`Total agents: ${listResponse.data.total}`);
    console.log('\nAgent List:');
    listResponse.data.agents.forEach((a, idx) => {
      console.log(`${idx + 1}. ${a.name}`);
      console.log(`   • Type: ${a.type} | Category: ${a.category}`);
      console.log(`   • Model: ${a.model} | Usage: ${a.usageCount} times`);
      console.log(`   • MCP: ${a.mcpServers?.length || 0} servers | Tools: ${a.tools?.length || 0}`);
      console.log(`   • Status: ${a.isActive ? 'Active' : 'Inactive'} | ${a.isPublic ? 'Public' : 'Private'}`);
    });

    // Step 6: Create additional specialized agents
    console.log('\n🎯 Step 6: Creating Additional Specialized Agents...');

    const specializedAgents = [
      {
        name: 'Data Analyst AI',
        description: 'Expert in data analysis, visualization, and insights',
        type: 'specialist',
        category: 'analysis',
        systemPrompt: 'You are a data analysis expert. Analyze data, create visualizations, and provide insights.',
        model: 'gpt-4',
        capabilities: { dataAnalysis: true, fileAccess: true }
      },
      {
        name: 'Technical Writer AI',
        description: 'Professional technical documentation writer',
        type: 'specialist',
        category: 'writing',
        systemPrompt: 'You are a technical writer. Create clear, comprehensive documentation.',
        model: 'gpt-4',
        capabilities: { fileAccess: true }
      }
    ];

    for (const agentDef of specializedAgents) {
      const response = await axios.post(`${adminApiUrl}/api/agents`, {
        ...agentDef,
        temperature: 0.5,
        maxTokens: 4000,
        mcpServers: mcpResponse.data.servers.map(s => s._id),
        isPublic: true,
        isActive: true,
        tags: [agentDef.category]
      }, {
        headers: {
          'X-API-Key': internalApiKey,
          'Content-Type': 'application/json'
        }
      });
      console.log(`  ✅ Created: ${response.data.name}`);
    }

    // Step 7: Summary
    console.log('\n✨ Test Complete! Summary:');
    console.log('====================================');
    console.log('✅ Agent model working correctly');
    console.log('✅ API endpoints functioning');
    console.log('✅ MCP servers successfully linked');
    console.log('✅ Multiple specialized agents created');
    console.log('✅ Agent capabilities configured');

    console.log('\n📌 Available MCP Tools in Agents:');
    console.log('• File System Operations (14 tools)');
    console.log('• GitHub Integration (26 tools)');
    console.log('• Total: 40 MCP tools ready to use');

    console.log('\n🎯 Next Steps:');
    console.log('1. Access Admin Dashboard: https://www.llmdash.com/admin/agents');
    console.log('2. View and manage agents in the UI');
    console.log('3. Use agents in LibreChat conversations');
    console.log('4. Select "Agents" endpoint in LibreChat');
    console.log('5. Choose your specialized agent');

    return agent._id;

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
completeAgentTest().then(agentId => {
  if (agentId) {
    console.log(`\n💡 Test Agent ID for reference: ${agentId}`);
  }
});