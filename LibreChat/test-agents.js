const axios = require('axios');

async function testAgentManagement() {
  const adminApiUrl = 'http://localhost:5001';
  const internalApiKey = 'sk-internal-api-key-for-service-communication-2025';

  console.log('🤖 Testing Agent Management System\n');
  console.log('===========================================\n');

  try {
    // 1. Create a test agent
    console.log('1️⃣ Creating a new agent...');
    const agentData = {
      name: 'Coding Assistant',
      description: 'An AI agent specialized in helping with coding tasks',
      type: 'specialist',
      category: 'coding',
      systemPrompt: 'You are an expert programmer who helps with coding tasks. Be concise and provide working code examples.',
      instructions: 'Always explain your code and suggest best practices.',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      capabilities: {
        codeExecution: true,
        fileAccess: true,
        webSearch: false,
        imageGeneration: false,
        dataAnalysis: true
      },
      isPublic: true,
      isActive: true,
      tags: ['programming', 'development', 'debugging']
    };

    const createResponse = await axios.post(`${adminApiUrl}/api/agents`, agentData, {
      headers: {
        'X-API-Key': internalApiKey,
        'Content-Type': 'application/json'
      }
    });

    const createdAgent = createResponse.data;
    console.log(`   ✅ Agent created: ${createdAgent.name} (ID: ${createdAgent._id})`);

    // 2. Fetch all agents
    console.log('\n2️⃣ Fetching all agents...');
    const listResponse = await axios.get(`${adminApiUrl}/api/agents`, {
      headers: {
        'X-API-Key': internalApiKey
      }
    });

    console.log(`   Found ${listResponse.data.agents.length} agents:`);
    listResponse.data.agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type}, ${agent.category})`);
    });

    // 3. Test the agent
    console.log('\n3️⃣ Testing the agent...');
    const testResponse = await axios.post(
      `${adminApiUrl}/api/agents/${createdAgent._id}/test`,
      {},
      {
        headers: {
          'X-API-Key': internalApiKey
        }
      }
    );

    console.log('   Test Result:');
    console.log(`   - Status: ${testResponse.data.status}`);
    console.log(`   - Model: ${testResponse.data.model}`);
    console.log(`   - Tools Count: ${testResponse.data.toolsCount}`);
    console.log(`   - Capabilities:`, testResponse.data.capabilities);

    // 4. Get MCP servers and link to agent
    console.log('\n4️⃣ Linking MCP servers to agent...');
    const mcpResponse = await axios.get(`${adminApiUrl}/api/mcp-servers`, {
      headers: {
        'X-API-Key': internalApiKey
      },
      params: { isActive: true }
    });

    if (mcpResponse.data.servers.length > 0) {
      const mcpServerIds = mcpResponse.data.servers.map(s => s._id);

      const updateResponse = await axios.put(
        `${adminApiUrl}/api/agents/${createdAgent._id}`,
        {
          mcpServers: mcpServerIds
        },
        {
          headers: {
            'X-API-Key': internalApiKey
          }
        }
      );

      console.log(`   ✅ Linked ${mcpServerIds.length} MCP servers to agent`);

      // List the linked servers
      mcpResponse.data.servers.forEach(server => {
        console.log(`   - ${server.name}: ${server.tools?.length || 0} tools`);
      });
    }

    // 5. Get prompts and link to agent
    console.log('\n5️⃣ Linking prompts to agent...');
    const promptsResponse = await axios.get(`${adminApiUrl}/api/prompts`, {
      headers: {
        'X-API-Key': internalApiKey
      }
    });

    if (promptsResponse.data.prompts.length > 0) {
      const promptIds = promptsResponse.data.prompts.slice(0, 2).map(p => p._id);

      await axios.put(
        `${adminApiUrl}/api/agents/${createdAgent._id}`,
        {
          prompts: promptIds
        },
        {
          headers: {
            'X-API-Key': internalApiKey
          }
        }
      );

      console.log(`   ✅ Linked ${promptIds.length} prompts to agent`);
    }

    // 6. Get final agent configuration
    console.log('\n6️⃣ Final agent configuration:');
    const finalAgent = await axios.get(`${adminApiUrl}/api/agents/${createdAgent._id}`, {
      headers: {
        'X-API-Key': internalApiKey
      }
    });

    const agent = finalAgent.data;
    console.log(`
   📋 Agent Details:
   - Name: ${agent.name}
   - Type: ${agent.type}
   - Category: ${agent.category}
   - Model: ${agent.model}
   - Temperature: ${agent.temperature}
   - MCP Servers: ${agent.mcpServers?.length || 0}
   - Prompts: ${agent.prompts?.length || 0}
   - Tools: ${agent.tools?.length || 0}
   - Status: ${agent.isActive ? 'Active' : 'Inactive'}
   - Visibility: ${agent.isPublic ? 'Public' : 'Private'}
   `);

    console.log('\n✅ Agent Management System Test Complete!');
    console.log('\n📝 Summary:');
    console.log('- Agent model created and configured');
    console.log('- API endpoints working correctly');
    console.log('- MCP servers can be linked to agents');
    console.log('- Prompts can be connected to agents');
    console.log('- Agents ready for use in LibreChat');

    console.log('\n🚀 Next Steps:');
    console.log('1. Access Admin Dashboard at https://www.llmdash.com/admin/agents');
    console.log('2. Create and configure agents through the UI');
    console.log('3. Use agents in LibreChat conversations');

  } catch (error) {
    console.error('❌ Error testing agent management:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAgentManagement();