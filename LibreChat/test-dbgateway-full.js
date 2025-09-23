/**
 * Test script for dbGateway with all repositories
 */

require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, 'api') });

async function testDbGateway() {
  console.log('Testing Database Gateway with all repositories...\n');
  console.log('USE_DB_GATEWAY:', process.env.USE_DB_GATEWAY);

  try {
    // Connect to database
    const { connectDb, getRepository } = require('~/db');
    await connectDb();
    console.log('✅ Database connected successfully\n');

    // Test each repository
    const repositories = [
      'User',
      'Message',
      'Conversation',
      'File',
      'Transaction',
      'Agent',
      'Prompt',
      'Token',
      'Session'
    ];

    const results = {};

    for (const repoName of repositories) {
      try {
        const repo = await getRepository(repoName);

        // Try to count documents
        let count;
        if (repo.count) {
          count = await repo.count({});
        } else if (repo.countDocuments) {
          count = await repo.countDocuments({});
        } else {
          // Try to find with limit 1 to test
          const items = await repo.find({}, { limit: 1 });
          count = `tested (found ${items.length} items)`;
        }

        results[repoName] = { status: 'success', count };
        console.log(`✅ ${repoName} repository: ${count} documents`);
      } catch (error) {
        results[repoName] = { status: 'error', error: error.message };
        console.log(`❌ ${repoName} repository: ${error.message}`);
      }
    }

    console.log('\n=== Summary ===');
    const successful = Object.values(results).filter(r => r.status === 'success').length;
    const failed = Object.values(results).filter(r => r.status === 'error').length;

    console.log(`Successful: ${successful}/${repositories.length}`);
    console.log(`Failed: ${failed}/${repositories.length}`);

    if (failed === 0) {
      console.log('\n🎉 All repositories are working with dbGateway!');
    } else {
      console.log('\n⚠️ Some repositories failed. Check the errors above.');
    }

    // Test specific operations
    console.log('\n=== Testing Specific Operations ===');

    // Test User repository methods
    const userRepo = await getRepository('User');
    if (userRepo.findByEmail) {
      const testUser = await userRepo.findByEmail('test@example.com');
      console.log(`✅ User.findByEmail: ${testUser ? 'Found' : 'Not found'}`);
    }

    // Test Token repository methods
    const tokenRepo = await getRepository('Token');
    if (tokenRepo.findToken) {
      // Use a valid ObjectId format for testing
      const testToken = await tokenRepo.findToken({ email: 'test@example.com' });
      console.log(`✅ Token.findToken: ${testToken ? 'Found' : 'Not found'}`);
    }

    // Test Session repository methods
    const sessionRepo = await getRepository('Session');
    if (sessionRepo.countActiveSessions) {
      // Use a valid ObjectId (24 hex chars)
      const activeSessions = await sessionRepo.countActiveSessions('507f1f77bcf86cd799439011');
      console.log(`✅ Session.countActiveSessions: ${activeSessions} active sessions`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testDbGateway();