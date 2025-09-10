const https = require('https');

const data = JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Say "Hello from admin panel keys!" if you can read this.' }
  ],
  endpoint: 'openAI',
  conversationId: null,
  parentMessageId: '00000000-0000-0000-0000-000000000000'
});

const options = {
  hostname: 'www.llmdash.com',
  port: 443,
  path: '/chat/api/ask/openAI',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Cookie': 'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjY2YWJjNjFkYWU5YzRmMzJlZDIzOGEiLCJpYXQiOjE3MzY0MDM5NjksImV4cCI6MTczNzAwODc2OX0.xBZa_kS1U-QvT3pYlupCGb-MRaHwkbm0Gl7jCJQBIaI'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();