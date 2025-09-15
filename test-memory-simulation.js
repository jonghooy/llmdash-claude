const { getOrgMemoryContext } = require('./LibreChat/api/server/services/OrgMemory');

async function simulateMemoryInChat() {
  // Set environment variables
  process.env.ADMIN_API_URL = 'http://localhost:5001';
  process.env.ENABLE_ORG_MEMORY = 'true';
  process.env.INTERNAL_API_KEY = 'sk-internal-api-key-for-service-communication-2025';

  console.log('=== Memory Simulation Test ===\n');

  // Test 1: Question about team development rules
  console.log('🔍 Test 1: Question about team development rules');
  console.log('User input: "우리 팀 개발 규칙이 뭐야?"');

  const mockReq1 = {
    body: {
      text: '우리 팀 개발 규칙이 뭐야?'
    }
  };

  const context1 = await getOrgMemoryContext(mockReq1);
  console.log('\n📋 Memory context that would be added to the conversation:');
  console.log(context1);
  console.log('\n---\n');

  // Test 2: Question about company information
  console.log('🔍 Test 2: Question about company information');
  console.log('User input: "LLMDash가 뭐하는 회사야?"');

  const mockReq2 = {
    body: {
      text: 'LLMDash가 뭐하는 회사야?'
    }
  };

  const context2 = await getOrgMemoryContext(mockReq2);
  console.log('\n📋 Memory context that would be added to the conversation:');
  console.log(context2);
  console.log('\n---\n');

  // Test 3: Tech stack question
  console.log('🔍 Test 3: Question about tech stack');
  console.log('User input: "우리가 사용하는 기술 스택이 뭐야?"');

  const mockReq3 = {
    body: {
      text: '우리가 사용하는 기술 스택이 뭐야?'
    }
  };

  const context3 = await getOrgMemoryContext(mockReq3);
  console.log('\n📋 Memory context that would be added to the conversation:');
  console.log(context3);

  console.log('\n=== Summary of Available Knowledge ===');
  console.log('The memory system contains the following information:');
  console.log('• Team development rules (both team_rules and team_dev_rules)');
  console.log('• Company information about LLMDash');
  console.log('• Technology stack details');
  console.log('• API configuration');
  console.log('• Company guidelines');
  console.log('• Allowed AI models');
  console.log('• System prompts');

  console.log('\n✅ Memory simulation completed!');
  console.log('\nHow it works:');
  console.log('1. When a user sends a message to LibreChat');
  console.log('2. The OrgMemory service fetches relevant memories from admin backend');
  console.log('3. These memories are formatted as context and prepended to the conversation');
  console.log('4. The AI model receives both the user question and organizational knowledge');
  console.log('5. The AI can then answer using the stored organizational information');
}

simulateMemoryInChat().catch(console.error);