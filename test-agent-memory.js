#!/usr/bin/env node

const axios = require('axios');

async function testAgentMemory() {
  try {
    // First, login as the admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@librechat.local',
      password: 'Admin123456'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('Admin login successful, token:', adminToken.substring(0, 20) + '...');
    
    // Get user token for LibreChat
    console.log('\nGetting user token for LibreChat...');
    // This would normally be done through proper LibreChat login
    // For testing, we'll use a mock approach
    
    // Make a chat request to trigger the agent flow
    console.log('\nTesting chat with "팀 개발 규칙은?" question...');
    
    // Note: This is a simplified test - actual chat would go through SSE
    // but for testing the memory integration, we can check if the memory is being fetched
    
    const chatPayload = {
      text: '팀 개발 규칙은 무엇인가요?',
      conversationId: 'test-conv-' + Date.now(),
      endpoint: 'openAI',
      model: 'gpt-3.5-turbo',
      // Add other required fields
    };
    
    console.log('Chat payload:', chatPayload);
    
    // Check if memory endpoint is accessible
    console.log('\nChecking memory endpoint...');
    const memoryResponse = await axios.get('http://localhost:5001/api/memory', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Memory endpoint returned:', memoryResponse.data.length, 'memories');
    if (memoryResponse.data.length > 0) {
      console.log('First memory:', memoryResponse.data[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAgentMemory();