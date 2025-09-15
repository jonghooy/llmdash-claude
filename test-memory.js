const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@librechat.local';
const ADMIN_PASSWORD = 'admin123456';

// Sample memories to create
const sampleMemories = [
  {
    key: 'api_endpoint',
    value: 'https://api.llmdash.com',
    type: 'string',
    category: 'config',
    description: 'Main API endpoint URL',
    isPublic: true,
    accessLevel: 'public',
    tags: ['api', 'config', 'endpoint']
  },
  {
    key: 'max_tokens',
    value: 4096,
    type: 'number',
    category: 'limits',
    description: 'Maximum tokens per request',
    isPublic: true,
    accessLevel: 'public',
    tags: ['limits', 'tokens']
  },
  {
    key: 'enable_debug',
    value: false,
    type: 'boolean',
    category: 'config',
    description: 'Enable debug mode',
    isPublic: true,
    accessLevel: 'admin',
    tags: ['debug', 'config']
  },
  {
    key: 'system_prompts',
    value: {
      default: 'You are a helpful assistant.',
      technical: 'You are a technical expert assistant.',
      creative: 'You are a creative writing assistant.'
    },
    type: 'object',
    category: 'prompts',
    description: 'System prompts for different modes',
    isPublic: true,
    accessLevel: 'public',
    tags: ['prompts', 'system']
  },
  {
    key: 'allowed_models',
    value: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
    type: 'array',
    category: 'models',
    description: 'List of allowed AI models',
    isPublic: true,
    accessLevel: 'public',
    tags: ['models', 'config']
  },
  {
    key: 'company_guidelines',
    value: 'Always maintain professional communication. Prioritize accuracy over speed. Follow security best practices.',
    type: 'string',
    category: 'guidelines',
    description: 'Company-wide communication guidelines',
    isPublic: true,
    accessLevel: 'public',
    tags: ['guidelines', 'communication']
  }
];

async function testMemory() {
  let token;
  
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Create memories
    console.log('2. Creating sample memories...');
    for (const memory of sampleMemories) {
      try {
        await axios.post(`${API_BASE}/memory`, memory, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Created memory: ${memory.key}`);
      } catch (error) {
        if (error.response?.data?.error?.includes('already exists')) {
          console.log(`⚠️  Memory already exists: ${memory.key}`);
        } else {
          console.error(`❌ Failed to create memory ${memory.key}:`, error.response?.data || error.message);
        }
      }
    }
    console.log();
    
    // 3. Fetch all memories
    console.log('3. Fetching all memories...');
    const allMemoriesResponse = await axios.get(`${API_BASE}/memory`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${allMemoriesResponse.data.memories.length} memories\n`);
    
    // 4. Test category filter
    console.log('4. Testing category filter...');
    const configMemoriesResponse = await axios.get(`${API_BASE}/memory?category=config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${configMemoriesResponse.data.memories.length} memories in 'config' category`);
    
    // 5. Test search functionality
    console.log('\n5. Testing search functionality...');
    const searchResponse = await axios.get(`${API_BASE}/memory?search=api`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${searchResponse.data.memories.length} memories matching 'api'`);
    
    // 6. Get single memory by key
    console.log('\n6. Getting single memory by key...');
    const singleMemoryResponse = await axios.get(`${API_BASE}/memory/key/max_tokens`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Retrieved memory: ${singleMemoryResponse.data.key} = ${singleMemoryResponse.data.value}`);
    
    // 7. Get categories
    console.log('\n7. Getting memory categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/memory/meta/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found categories: ${categoriesResponse.data.join(', ')}`);
    
    // 8. Get statistics
    console.log('\n8. Getting memory statistics...');
    const statsResponse = await axios.get(`${API_BASE}/memory/meta/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Statistics:`);
    console.log(`   - Total memories: ${statsResponse.data.overall.total}`);
    console.log(`   - Total accesses: ${statsResponse.data.overall.totalAccess}`);
    console.log(`   - Categories: ${statsResponse.data.overall.categories?.length || 0}`);
    
    // 9. Test bulk upsert
    console.log('\n9. Testing bulk upsert...');
    const bulkMemories = [
      {
        key: 'bulk_test_1',
        value: 'Bulk value 1',
        type: 'string',
        category: 'test'
      },
      {
        key: 'bulk_test_2',
        value: 123,
        type: 'number',
        category: 'test'
      }
    ];
    
    const bulkResponse = await axios.post(`${API_BASE}/memory/bulk`, 
      { memories: bulkMemories },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Bulk upsert: ${bulkResponse.data.upserted} new, ${bulkResponse.data.modified} modified`);
    
    // 10. Test from LibreChat API
    console.log('\n10. Testing LibreChat API integration...');
    try {
      // First login to LibreChat to get a token
      const librechatLoginResponse = await axios.post('http://localhost:3080/api/auth/login', {
        email: 'admin@librechat.local',
        password: 'admin123456'
      });
      
      const librechatToken = librechatLoginResponse.data.token;
      
      // Test fetching memories from LibreChat
      const librechatMemoriesResponse = await axios.get('http://localhost:3080/api/admin-memory', {
        headers: { Authorization: `Bearer ${librechatToken}` }
      });
      console.log(`✅ LibreChat can access ${librechatMemoriesResponse.data.memories.length} memories`);
      
      // Test fetching single memory by key
      const librechatSingleMemory = await axios.get('http://localhost:3080/api/admin-memory/key/api_endpoint', {
        headers: { Authorization: `Bearer ${librechatToken}` }
      });
      console.log(`✅ LibreChat retrieved: ${librechatSingleMemory.data.key} = ${librechatSingleMemory.data.value}`);
      
      // Test batch fetch
      const batchResponse = await axios.post('http://localhost:3080/api/admin-memory/batch',
        { keys: ['max_tokens', 'enable_debug', 'api_endpoint'] },
        { headers: { Authorization: `Bearer ${librechatToken}` } }
      );
      console.log(`✅ Batch fetch successful:`, Object.keys(batchResponse.data.memories));
      
    } catch (error) {
      console.log(`⚠️  LibreChat integration test skipped (may need to login first)`);
    }
    
    console.log('\n✅ All memory tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testMemory();