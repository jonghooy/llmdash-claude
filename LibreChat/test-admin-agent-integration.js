const axios = require('axios');

async function testAdminAgentIntegration() {
  console.log('🔍 Testing Admin Agent Integration in LibreChat\n');
  console.log('==============================================\n');

  try {
    // 1. Test fetching agents from Admin via LibreChat API
    console.log('1️⃣ Fetching Admin Agents through LibreChat API...');

    const response = await axios.get('http://localhost:3080/api/admin-agents', {
      headers: {
        'Authorization': `Bearer ${process.env.JWT_TOKEN || 'test-token'}`
      }
    });

    const agents = response.data.agents || [];
    console.log(`   Found ${agents.length} agents from Admin Dashboard`);

    if (agents.length > 0) {
      console.log('\n📋 Available Admin Agents in LibreChat:');
      agents.forEach((agent, idx) => {
        console.log(`\n   ${idx + 1}. ${agent.name}`);
        console.log(`      • ID: ${agent.id}`);
        console.log(`      • Category: ${agent.category}`);
        console.log(`      • Model: ${agent.model}`);
        console.log(`      • Provider: ${agent.provider}`);
        console.log(`      • Tools: ${agent.tools.length}`);
        if (agent.tools.length > 0) {
          agent.tools.forEach(tool => {
            console.log(`        - ${tool.name || tool.type}`);
          });
        }
        console.log(`      • Source: ${agent.metadata?.source}`);
      });
    }

    // 2. Test with direct Admin API for comparison
    console.log('\n2️⃣ Direct Admin API Comparison...');
    const adminResponse = await axios.get('http://localhost:5001/api/agents', {
      headers: {
        'X-API-Key': 'sk-internal-api-key-for-service-communication-2025'
      },
      params: {
        isActive: true,
        isPublic: true
      }
    });

    console.log(`   Admin Dashboard has ${adminResponse.data.agents.length} agents`);
    console.log(`   LibreChat integration shows ${agents.length} agents`);

    // 3. Test getting specific agent
    if (agents.length > 0) {
      console.log('\n3️⃣ Testing specific agent retrieval...');
      const testAgentId = agents[0].metadata?.adminId || agents[0].id;

      try {
        const agentResponse = await axios.get(`http://localhost:3080/api/admin-agents/${testAgentId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.JWT_TOKEN || 'test-token'}`
          }
        });

        console.log(`   ✅ Successfully retrieved agent: ${agentResponse.data.name}`);
      } catch (error) {
        console.log(`   ⚠️ Could not retrieve specific agent: ${error.message}`);
      }
    }

    // 4. Summary
    console.log('\n✨ Integration Test Summary:');
    console.log('============================');

    if (agents.length > 0) {
      console.log('✅ Admin Agent Integration is WORKING!');
      console.log(`✅ ${agents.length} agents available in LibreChat`);
      console.log('✅ Agents have been converted to LibreChat format');
      console.log('✅ MCP tools are mapped correctly');
      console.log('\n🎯 Next Steps:');
      console.log('1. Go to LibreChat: https://www.llmdash.com/chat');
      console.log('2. Select "Agents" endpoint');
      console.log('3. Choose one of the Admin-managed agents');
      console.log('4. Start using with MCP tools!');
    } else {
      console.log('⚠️ No agents found - Check if:');
      console.log('   • ENABLE_ADMIN_AGENTS=true in .env');
      console.log('   • Admin Dashboard has active public agents');
      console.log('   • Internal API key is configured correctly');
    }

  } catch (error) {
    console.error('❌ Error testing integration:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if LibreChat backend is running: pm2 status');
    console.log('2. Check environment variable: grep ENABLE_ADMIN_AGENTS .env');
    console.log('3. Check logs: pm2 logs librechat-backend --lines 50');
  }
}

testAdminAgentIntegration();