const axios = require('axios');

async function testDashboardAPI() {
  try {
    // First login to get token
    console.log('Logging in to get token...');
    const loginResponse = await axios.post('https://www.llmdash.com/admin/api/auth/login', {
      email: 'admin@librechat.local',
      password: 'Admin123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtained successfully\n');
    
    // Get dashboard overview
    console.log('Fetching dashboard overview...');
    const overviewResponse = await axios.get('https://www.llmdash.com/admin/api/dashboard/overview', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = overviewResponse.data;
    
    console.log('=== Dashboard Overview Data ===\n');
    
    console.log('Users:');
    console.log(`  Total: ${data.users.total}`);
    console.log(`  Active (24h): ${data.users.active}`);
    console.log(`  New Today: ${data.users.new}`);
    
    console.log('\nMessages:');
    console.log(`  Total: ${data.messages.total}`);
    console.log(`  Today: ${data.messages.today}`);
    
    console.log('\nTokens:');
    console.log(`  Total: ${data.tokens.total}`);
    console.log(`  Today: ${data.tokens.today}`);
    
    console.log('\nCosts:');
    console.log(`  Today: $${data.costs?.today?.toFixed(2) || '0.00'}`);
    console.log(`  Month: $${data.costs?.month?.toFixed(2) || '0.00'}`);
    console.log(`  Trend: ${data.costs?.trend?.toFixed(2) || '0.00'}%`);
    
    console.log('\nModels Used:');
    if (data.models && Object.keys(data.models).length > 0) {
      Object.entries(data.models).forEach(([model, count]) => {
        console.log(`  ${model}: ${count} messages`);
      });
    } else {
      console.log('  No model usage data');
    }
    
    // Get metrics
    console.log('\n=== Real-time Metrics ===\n');
    const metricsResponse = await axios.get('https://www.llmdash.com/admin/api/dashboard/metrics', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const metrics = metricsResponse.data;
    console.log('Real-time Metrics:');
    console.log(`  Messages/min: ${metrics.messagesPerMinute || 0}`);
    console.log(`  Active Sessions: ${metrics.activeSessions || 0}`);
    console.log(`  Avg Response Time: ${metrics.avgResponseTime || 0}ms`);
    console.log(`  System Load: ${metrics.systemLoad?.toFixed(2) || 0}%`);
    
    // Verify data consistency
    console.log('\n=== Data Verification ===\n');
    
    // Connect to MongoDB directly to verify
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('LibreChat');
    
    const actualUsers = await db.collection('users').countDocuments();
    const actualMessages = await db.collection('messages').countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actualTodayMessages = await db.collection('messages').countDocuments({
      createdAt: { $gte: today }
    });
    
    console.log('Database vs API Comparison:');
    console.log(`  Users: DB=${actualUsers}, API=${data.users.total} ${actualUsers === data.users.total ? '✅' : '❌'}`);
    console.log(`  Messages: DB=${actualMessages}, API=${data.messages.total} ${actualMessages === data.messages.total ? '✅' : '❌'}`);
    console.log(`  Today Messages: DB=${actualTodayMessages}, API=${data.messages.today} ${actualTodayMessages === data.messages.today ? '✅' : '❌'}`);
    
    await client.close();
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDashboardAPI();