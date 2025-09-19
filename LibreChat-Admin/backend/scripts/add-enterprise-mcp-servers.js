const mongoose = require('mongoose');
require('dotenv').config({ path: '../../LibreChat/.env' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LibreChat';

async function addEnterpriseMCPServers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Load the MCPServer model
    const MCPServer = require('../src/models/MCPServer');

    // Define Enterprise MCP Servers
    const enterpriseMCPs = [
      {
        name: 'Memory Enterprise',
        description: 'Enterprise-grade memory management system with multi-tenancy support, Wiki links, and knowledge graph capabilities',
        version: '2.0.0',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/request',
        headers: new Map([
          ['Content-Type', 'application/json']
        ]),
        tools: [
          {
            name: 'memory_search',
            description: 'Search knowledge base for information',
            category: 'search'
          },
          {
            name: 'memory_create',
            description: 'Create new knowledge entry',
            category: 'database'
          },
          {
            name: 'memory_update',
            description: 'Update existing knowledge entry',
            category: 'database'
          },
          {
            name: 'memory_delete',
            description: 'Delete knowledge entry',
            category: 'database'
          },
          {
            name: 'memory_list',
            description: 'List knowledge entries',
            category: 'database'
          },
          {
            name: 'wiki_link_extract',
            description: 'Extract Wiki links from text',
            category: 'other'
          },
          {
            name: 'wiki_link_graph',
            description: 'Generate Wiki link knowledge graph',
            category: 'other'
          }
        ],
        isActive: true,
        isPublic: true,
        category: 'research',
        tags: ['memory', 'enterprise', 'multi-tenant', 'knowledge-graph', 'wiki'],
        icon: '🧠',
        config: {
          maxConcurrentConnections: 50,
          timeout: 60000,
          retryAttempts: 3,
          retryDelay: 1000,
          autoReconnect: true
        }
      },
      {
        name: 'Memory Enterprise - Project Alpha',
        description: 'Memory Enterprise instance for Project Alpha team',
        version: '2.0.0',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/request',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['X-Tenant-ID', 'project-alpha'],
          ['X-User-ID', 'dev-team']
        ]),
        tools: [
          { name: 'memory_search', description: 'Search Project Alpha knowledge base', category: 'search' },
          { name: 'memory_create', description: 'Create Project Alpha knowledge', category: 'database' },
          { name: 'memory_update', description: 'Update Project Alpha knowledge', category: 'database' },
          { name: 'memory_delete', description: 'Delete Project Alpha knowledge', category: 'database' },
          { name: 'memory_list', description: 'List Project Alpha knowledge', category: 'database' }
        ],
        isActive: true,
        isPublic: false,
        category: 'custom',
        tags: ['project-alpha', 'team-knowledge'],
        icon: '🚀'
      },
      {
        name: 'Memory Enterprise - Backend Team',
        description: 'Memory Enterprise for Backend team documentation and knowledge',
        version: '2.0.0',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/request',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['X-Tenant-ID', 'backend-team'],
          ['X-Namespace', 'api-docs']
        ]),
        tools: [
          { name: 'memory_search', description: 'Search API documentation', category: 'search' },
          { name: 'memory_create', description: 'Create API documentation', category: 'database' },
          { name: 'wiki_link_graph', description: 'Generate API knowledge graph', category: 'other' }
        ],
        isActive: true,
        isPublic: false,
        category: 'development',
        tags: ['backend', 'api', 'documentation'],
        icon: '⚙️'
      },
      {
        name: 'Memory Enterprise - Frontend Team',
        description: 'Memory Enterprise for Frontend team UI components and patterns',
        version: '2.0.0',
        connectionType: 'sse',
        url: 'http://localhost:8005/mcp/request',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['X-Tenant-ID', 'frontend-team'],
          ['X-Namespace', 'ui-components']
        ]),
        tools: [
          { name: 'memory_search', description: 'Search UI component docs', category: 'search' },
          { name: 'memory_create', description: 'Document UI components', category: 'database' },
          { name: 'wiki_link_extract', description: 'Extract component relationships', category: 'other' }
        ],
        isActive: true,
        isPublic: false,
        category: 'creative',
        tags: ['frontend', 'ui', 'components'],
        icon: '🎨'
      }
    ];

    // Process each Enterprise MCP server
    for (const mcpData of enterpriseMCPs) {
      try {
        // Check if server already exists
        const existingServer = await MCPServer.findOne({ name: mcpData.name });

        if (existingServer) {
          console.log(`📝 Updating existing server: ${mcpData.name}`);
          Object.assign(existingServer, mcpData);
          await existingServer.save();
        } else {
          console.log(`✨ Creating new server: ${mcpData.name}`);
          const newServer = new MCPServer({
            ...mcpData,
            stats: {
              totalConnections: 0,
              successfulConnections: 0,
              failedConnections: 0,
              totalToolCalls: 0
            },
            healthCheck: {
              enabled: true,
              interval: 300000,
              status: 'unknown'
            }
          });
          await newServer.save();
        }

        console.log(`✅ ${mcpData.name} registered successfully`);
      } catch (error) {
        console.error(`❌ Error processing ${mcpData.name}:`, error.message);
      }
    }

    // Also add additional specialized MCP servers
    const additionalMCPs = [
      {
        name: 'Code Documentation MCP',
        description: 'Automated code documentation generator with inline comments and API docs',
        version: '1.0.0',
        connectionType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-code-docs'],
        tools: [
          { name: 'generate_docs', description: 'Generate documentation from code', category: 'other' },
          { name: 'extract_comments', description: 'Extract inline comments', category: 'other' },
          { name: 'create_api_spec', description: 'Create OpenAPI specification', category: 'api' }
        ],
        isActive: false,
        isPublic: true,
        category: 'development',
        tags: ['documentation', 'code', 'api'],
        icon: '📚'
      },
      {
        name: 'Database Query MCP',
        description: 'Direct database query execution and schema management',
        version: '1.0.0',
        connectionType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-database'],
        tools: [
          { name: 'execute_query', description: 'Execute SQL query', category: 'database' },
          { name: 'schema_info', description: 'Get database schema information', category: 'database' },
          { name: 'migrate', description: 'Run database migrations', category: 'database' }
        ],
        isActive: false,
        isPublic: false,
        category: 'data',
        tags: ['database', 'sql', 'query'],
        icon: '🗄️'
      },
      {
        name: 'Slack Integration MCP',
        description: 'Slack workspace integration for team communication and notifications',
        version: '1.0.0',
        connectionType: 'sse',
        url: 'http://localhost:8006/mcp/slack',
        tools: [
          { name: 'send_message', description: 'Send Slack message', category: 'communication' },
          { name: 'search_messages', description: 'Search Slack history', category: 'search' },
          { name: 'create_channel', description: 'Create Slack channel', category: 'communication' }
        ],
        isActive: false,
        isPublic: false,
        category: 'communication',
        tags: ['slack', 'chat', 'notification'],
        icon: '💬'
      }
    ];

    // Process additional MCPs
    for (const mcpData of additionalMCPs) {
      try {
        const existingServer = await MCPServer.findOne({ name: mcpData.name });

        if (!existingServer) {
          console.log(`✨ Creating additional server: ${mcpData.name}`);
          const newServer = new MCPServer({
            ...mcpData,
            env: mcpData.env || new Map(),
            headers: mcpData.headers || new Map(),
            stats: {
              totalConnections: 0,
              successfulConnections: 0,
              failedConnections: 0,
              totalToolCalls: 0
            },
            healthCheck: {
              enabled: true,
              interval: 300000,
              status: 'unknown'
            },
            config: {
              maxConcurrentConnections: 10,
              timeout: 30000,
              retryAttempts: 3,
              retryDelay: 1000,
              autoReconnect: true
            }
          });
          await newServer.save();
          console.log(`✅ ${mcpData.name} created successfully`);
        } else {
          console.log(`⏭️  ${mcpData.name} already exists, skipping`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${mcpData.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary of registered MCP servers:');
    const allServers = await MCPServer.find({}, 'name isActive category').sort('name');
    console.log('┌─────────────────────────────────────────┬──────────┬──────────────┐');
    console.log('│ Server Name                             │ Status   │ Category     │');
    console.log('├─────────────────────────────────────────┼──────────┼──────────────┤');
    allServers.forEach(server => {
      const name = server.name.padEnd(39);
      const status = server.isActive ? '✅ Active' : '⏸️  Inactive';
      const category = server.category.padEnd(12);
      console.log(`│ ${name} │ ${status} │ ${category} │`);
    });
    console.log('└─────────────────────────────────────────┴──────────┴──────────────┘');

    console.log('\n✅ All Enterprise MCP servers have been registered in Admin Dashboard');
    console.log('You can now manage them at: https://www.llmdash.com/admin/mcp-servers');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addEnterpriseMCPServers();