const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@librechat.local',
      password: 'Admin123456'
    });
    console.log('Login Success:', response.data);
  } catch (error) {
    console.error('Login Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLogin();