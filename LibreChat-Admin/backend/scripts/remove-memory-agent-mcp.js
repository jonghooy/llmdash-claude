const mongoose = require('mongoose');
require('dotenv').config({ path: '../../LibreChat/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LibreChat';

async function removeMemoryAgentMCP() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const MCPServer = require('../src/models/MCPServer');

    // Delete Memory Agent MCP server
    const result = await MCPServer.findOneAndDelete({
      name: 'Memory Agent MCP'
    });

    if (result) {
      console.log('✅ memory-agent-mcp server removed from database');
      console.log('Removed server:', result.name);
    } else {
      console.log('❌ memory-agent-mcp server not found in database');
    }

    // List remaining MCP servers
    const remainingServers = await MCPServer.find({}, 'name isActive').lean();
    console.log('\n📋 Remaining MCP servers:');
    remainingServers.forEach(server => {
      console.log(`  - ${server.name} (${server.isActive ? 'Active' : 'Inactive'})`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeMemoryAgentMCP();