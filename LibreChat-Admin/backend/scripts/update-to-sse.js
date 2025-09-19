const mongoose = require('mongoose');
require('dotenv').config({ path: '../../LibreChat/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LibreChat';

async function updateToSSE() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const MCPServer = require('../src/models/MCPServer');

    // Update Memory Enterprise servers to use SSE
    const updates = [
      {
        name: 'Memory Enterprise',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/sse/stream',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Accept', 'text/event-stream']
        ])
      },
      {
        name: 'Memory Enterprise - Project Alpha',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/sse/stream',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Accept', 'text/event-stream'],
          ['X-Tenant-ID', 'project-alpha'],
          ['X-User-ID', 'dev-team']
        ])
      },
      {
        name: 'Memory Enterprise - Backend Team',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/sse/stream',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Accept', 'text/event-stream'],
          ['X-Tenant-ID', 'backend-team'],
          ['X-User-ID', 'backend-dev']
        ])
      },
      {
        name: 'Memory Enterprise - Frontend Team',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/sse/stream',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Accept', 'text/event-stream'],
          ['X-Tenant-ID', 'frontend-team'],
          ['X-User-ID', 'frontend-dev']
        ])
      }
    ];

    for (const update of updates) {
      const result = await MCPServer.findOneAndUpdate(
        { name: update.name },
        {
          $set: {
            connectionType: update.connectionType,
            url: update.url,
            headers: update.headers
          },
          $unset: {
            command: 1,
            args: 1,
            env: 1
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated ${update.name} to use SSE at ${update.url}`);
      } else {
        console.log(`❌ ${update.name} not found`);
      }
    }

    console.log('\n✅ All Memory Enterprise servers updated to use SSE');
    console.log('SSE endpoint: /mcp/sse/stream');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateToSSE();