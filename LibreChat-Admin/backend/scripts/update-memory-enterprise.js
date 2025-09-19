const mongoose = require('mongoose');
require('dotenv').config({ path: '../../LibreChat/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LibreChat';

async function updateMemoryEnterprise() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const MCPServer = require('../src/models/MCPServer');

    // Update Memory Enterprise servers to use stdio bridge
    const updates = [
      {
        name: 'Memory Enterprise',
        connectionType: 'stdio',
        command: 'node',
        args: ['/home/jonghooy/work/llmdash-claude/mem-enterprise-bridge/mcp-bridge.js'],
        env: new Map([
          ['MCP_SERVER_URL', 'http://localhost:8005/mcp'],
          ['TENANT_ID', 'default'],
          ['USER_ID', 'system']
        ]),
        // Remove URL since we're using stdio now
        url: undefined
      },
      {
        name: 'Memory Enterprise - Project Alpha',
        connectionType: 'stdio',
        command: 'node',
        args: ['/home/jonghooy/work/llmdash-claude/mem-enterprise-bridge/mcp-bridge.js'],
        env: new Map([
          ['MCP_SERVER_URL', 'http://localhost:8005/mcp'],
          ['TENANT_ID', 'project-alpha'],
          ['USER_ID', 'dev-team']
        ]),
        url: undefined
      },
      {
        name: 'Memory Enterprise - Backend Team',
        connectionType: 'stdio',
        command: 'node',
        args: ['/home/jonghooy/work/llmdash-claude/mem-enterprise-bridge/mcp-bridge.js'],
        env: new Map([
          ['MCP_SERVER_URL', 'http://localhost:8005/mcp'],
          ['TENANT_ID', 'backend-team'],
          ['USER_ID', 'backend-dev']
        ]),
        url: undefined
      },
      {
        name: 'Memory Enterprise - Frontend Team',
        connectionType: 'stdio',
        command: 'node',
        args: ['/home/jonghooy/work/llmdash-claude/mem-enterprise-bridge/mcp-bridge.js'],
        env: new Map([
          ['MCP_SERVER_URL', 'http://localhost:8005/mcp'],
          ['TENANT_ID', 'frontend-team'],
          ['USER_ID', 'frontend-dev']
        ]),
        url: undefined
      }
    ];

    for (const update of updates) {
      const result = await MCPServer.findOneAndUpdate(
        { name: update.name },
        {
          $set: {
            connectionType: update.connectionType,
            command: update.command,
            args: update.args,
            env: update.env
          },
          $unset: {
            url: 1,
            headers: 1
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated ${update.name} to use stdio bridge`);
      } else {
        console.log(`❌ ${update.name} not found`);
      }
    }

    console.log('\n✅ All Memory Enterprise servers updated to use stdio bridge');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateMemoryEnterprise();