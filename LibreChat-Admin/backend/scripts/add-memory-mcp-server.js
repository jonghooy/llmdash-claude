const mongoose = require('mongoose');
require('dotenv').config({ path: '../../LibreChat/.env' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LibreChat';

async function addMemoryAgentMCP() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Load the MCPServer model
    const MCPServer = require('../src/models/MCPServer');

    // Check if memory-agent-mcp already exists
    const existingServer = await MCPServer.findOne({ name: 'Memory Agent MCP' });
    if (existingServer) {
      console.log('Memory Agent MCP already exists. Updating...');

      // Update existing server
      existingServer.description = 'Memory management system with vLLM backend for persistent user and entity memory';
      existingServer.command = '/home/jonghooy/work/llmdash-claude/mem-agent-mcp/.venv/bin/python';
      existingServer.args = ['/home/jonghooy/work/llmdash-claude/mem-agent-mcp/mcp_client_vllm.py'];
      existingServer.isActive = true;
      existingServer.isPublic = true;
      existingServer.tools = [
        {
          name: 'query_with_memory',
          description: 'Query vLLM with memory context',
          category: 'api'
        },
        {
          name: 'search_memory',
          description: 'Search memory files for specific information',
          category: 'search'
        },
        {
          name: 'list_memories',
          description: 'List all memory files',
          category: 'file'
        },
        {
          name: 'read_memory_file',
          description: 'Read the raw content of a specific memory file',
          category: 'file'
        },
        {
          name: 'add_memory',
          description: 'Add new memory to the system',
          category: 'database'
        },
        {
          name: 'update_user_memory',
          description: 'Update user information',
          category: 'database'
        },
        {
          name: 'get_vllm_status',
          description: 'Get vLLM server status',
          category: 'system'
        }
      ];

      await existingServer.save();
      console.log('Memory Agent MCP updated successfully');
    } else {
      // Create new MCP server entry
      const memoryAgentMCP = new MCPServer({
        name: 'Memory Agent MCP',
        description: 'Memory management system with vLLM backend for persistent user and entity memory',
        version: '1.0.0',
        connectionType: 'stdio',
        command: '/home/jonghooy/work/llmdash-claude/mem-agent-mcp/.venv/bin/python',
        args: ['/home/jonghooy/work/llmdash-claude/mem-agent-mcp/mcp_client_vllm.py'],
        env: new Map([
          ['PYTHONUNBUFFERED', '1'],
          ['FASTMCP_DISABLE_SPLASH', '1'],
          ['NO_COLOR', '1']
        ]),
        tools: [
          {
            name: 'query_with_memory',
            description: 'Query vLLM with memory context',
            category: 'api'
          },
          {
            name: 'search_memory',
            description: 'Search memory files for specific information',
            category: 'search'
          },
          {
            name: 'list_memories',
            description: 'List all memory files',
            category: 'file'
          },
          {
            name: 'read_memory_file',
            description: 'Read the raw content of a specific memory file',
            category: 'file'
          },
          {
            name: 'add_memory',
            description: 'Add new memory to the system',
            category: 'database'
          },
          {
            name: 'update_user_memory',
            description: 'Update user information',
            category: 'database'
          },
          {
            name: 'get_vllm_status',
            description: 'Get vLLM server status',
            category: 'system'
          }
        ],
        resources: [],
        prompts: [],
        isActive: true,
        isPublic: true,
        organization: null,
        teams: [],
        allowedUsers: [],
        stats: {
          totalConnections: 0,
          successfulConnections: 0,
          failedConnections: 0,
          totalToolCalls: 0
        },
        healthCheck: {
          enabled: true,
          interval: 300000, // 5 minutes
          status: 'unknown'
        },
        config: {
          maxConcurrentConnections: 10,
          timeout: 60000, // 60 seconds
          retryAttempts: 3,
          retryDelay: 1000,
          autoReconnect: true
        },
        tags: ['memory', 'vllm', 'ai', 'persistence'],
        category: 'utility',
        icon: '🧠',
        documentation: 'https://github.com/jonghooy/llmdash-claude/tree/main/mem-agent-mcp'
      });

      await memoryAgentMCP.save();
      console.log('Memory Agent MCP created successfully');
    }

    // Also add file_system_mcp and github_mcp if they don't exist
    const fileSystemMCP = await MCPServer.findOne({ name: 'File System MCP' });
    if (!fileSystemMCP) {
      const newFileSystemMCP = new MCPServer({
        name: 'File System MCP',
        description: 'File system access and management tools',
        version: '1.0.0',
        connectionType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/jonghooy/work'],
        tools: [
          { name: 'read_file', description: 'Read file content', category: 'file' },
          { name: 'write_file', description: 'Write file content', category: 'file' },
          { name: 'list_directory', description: 'List directory contents', category: 'file' },
          { name: 'create_directory', description: 'Create new directory', category: 'file' },
          { name: 'move_file', description: 'Move or rename file', category: 'file' },
          { name: 'search_files', description: 'Search for files', category: 'search' }
        ],
        isActive: true,
        isPublic: true,
        category: 'development',
        tags: ['filesystem', 'files', 'directories'],
        icon: '📁'
      });
      await newFileSystemMCP.save();
      console.log('File System MCP created successfully');
    }

    const githubMCP = await MCPServer.findOne({ name: 'GitHub MCP' });
    if (!githubMCP) {
      const newGithubMCP = new MCPServer({
        name: 'GitHub MCP',
        description: 'GitHub repository management and collaboration tools',
        version: '1.0.0',
        connectionType: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        tools: [
          { name: 'create_repository', description: 'Create new repository', category: 'api' },
          { name: 'create_issue', description: 'Create new issue', category: 'api' },
          { name: 'create_pull_request', description: 'Create pull request', category: 'api' },
          { name: 'search_repositories', description: 'Search repositories', category: 'search' },
          { name: 'search_code', description: 'Search code in repositories', category: 'search' }
        ],
        isActive: true,
        isPublic: true,
        category: 'development',
        tags: ['github', 'git', 'version-control', 'collaboration'],
        icon: '🐙'
      });
      await newGithubMCP.save();
      console.log('GitHub MCP created successfully');
    }

    console.log('\n✅ All MCP servers have been registered in Admin Dashboard');
    console.log('You can now manage them at: https://www.llmdash.com/admin/mcp-servers');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addMemoryAgentMCP();