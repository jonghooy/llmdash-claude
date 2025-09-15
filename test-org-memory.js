const axios = require('axios');

async function testOrgMemory() {
  try {
    // Set environment variables for testing
    process.env.ADMIN_API_URL = 'http://localhost:5001';
    process.env.ENABLE_ORG_MEMORY = 'true';
    process.env.INTERNAL_API_KEY = 'sk-internal-api-key-for-service-communication-2025';

    // First, let's check if the admin backend is running and has memory data
    const adminResponse = await axios.get('http://localhost:5001/api/memory', {
      headers: {
        'X-API-Key': process.env.INTERNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        accessLevel: 'public'
      }
    });

    console.log('Admin Backend Memory Response:');
    console.log('Status:', adminResponse.status);
    console.log('Memories count:', adminResponse.data.memories?.length || 0);

    if (adminResponse.data.memories && adminResponse.data.memories.length > 0) {
      console.log('\nMemory items:');
      adminResponse.data.memories.forEach(memory => {
        const valueStr = typeof memory.value === 'string' ? memory.value : JSON.stringify(memory.value);
      console.log(`- [${memory.key}]: ${valueStr.substring(0, 50)}...`);
      });
    }

    // Test the OrgMemory service
    const { getOrgMemoryContext } = require('./LibreChat/api/server/services/OrgMemory');

    // Mock request object (no token needed now)
    const mockReq = {
      body: {
        text: '팀 개발 규칙이 뭐야'
      }
    };

    const context = await getOrgMemoryContext(mockReq);
    console.log('\n\nOrganization Memory Context:');
    console.log(context);
    
  } catch (error) {
    console.error('Error testing org memory:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOrgMemory();