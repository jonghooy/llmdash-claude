const { spawn } = require('child_process');
const axios = require('axios');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const EventSource = require('eventsource');

// Custom SSE Transport for MCP
class SSEClientTransport {
  constructor(config) {
    this.streamUrl = config.streamUrl;
    this.messageUrl = config.messageUrl;
    this.env = config.env || {};
    this.eventSource = null;
    this.messageHandlers = new Map();
    this.messageId = 0;
  }

  async start() {
    console.log(`[SSEClientTransport] Connecting to ${this.streamUrl}`);

    // Create EventSource connection
    this.eventSource = new EventSource(this.streamUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    // Set up event handlers
    this.eventSource.onopen = () => {
      console.log('[SSEClientTransport] SSE connection opened');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[SSEClientTransport] Received:', JSON.stringify(message));

        // Handle response messages
        if (message.id && this.messageHandlers.has(message.id)) {
          const handler = this.messageHandlers.get(message.id);
          this.messageHandlers.delete(message.id);

          if (message.error) {
            handler.reject(new Error(message.error.message || 'Unknown error'));
          } else {
            handler.resolve(message.result);
          }
        }

        // Handle server notifications
        if (message.method && this.onmessage) {
          this.onmessage(message);
        }
      } catch (error) {
        console.error('[SSEClientTransport] Error parsing message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[SSEClientTransport] SSE error:', error);
      if (this.onerror) {
        this.onerror(error);
      }
    };

    // Initialize the connection
    await this.send({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {},
        clientInfo: {
          name: 'librechat-client',
          version: '1.0.0'
        },
        env: this.env
      },
      id: this.messageId++
    });
  }

  async send(message) {
    return new Promise((resolve, reject) => {
      const messageId = message.id || this.messageId++;
      message.id = messageId;

      // Store the handler for this message
      if (message.method !== 'notifications/initialized') {
        this.messageHandlers.set(messageId, { resolve, reject });

        // Set timeout
        setTimeout(() => {
          if (this.messageHandlers.has(messageId)) {
            this.messageHandlers.delete(messageId);
            reject(new Error('Request timeout'));
          }
        }, 30000); // 30 second timeout
      }

      console.log(`[SSEClientTransport] Sending to ${this.messageUrl}:`, JSON.stringify(message));

      // Send message via POST to message endpoint
      axios.post(this.messageUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (message.method === 'notifications/initialized') {
          resolve(response.data);
        }
        // For other messages, wait for SSE response
      })
      .catch(error => {
        console.error('[SSEClientTransport] Error sending message:', error.message);
        if (this.messageHandlers.has(messageId)) {
          this.messageHandlers.delete(messageId);
        }
        reject(error);
      });
    });
  }

  async close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.messageHandlers.clear();
  }
}

class MCPService {
  constructor() {
    this.clients = new Map();
    this.adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5001';
    this.internalApiKey = process.env.INTERNAL_API_KEY;
  }

  /**
   * Fetch available MCP servers from admin backend
   */
  async getAvailableServers() {
    try {
      if (!this.internalApiKey) {
        console.log('[MCPService] No internal API key configured');
        return [];
      }

      const response = await axios.get(`${this.adminApiUrl}/api/mcp-servers`, {
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json'
        }
      });

      // Filter for active and public servers
      const servers = response.data.servers || [];
      return servers.filter(s => s.isActive && s.isPublic);
    } catch (error) {
      console.error('[MCPService] Error fetching MCP servers:', error.message);
      return [];
    }
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(serverId) {
    try {
      // Check if already connected
      if (this.clients.has(serverId)) {
        return this.clients.get(serverId);
      }

      // Get server configuration
      const servers = await this.getAvailableServers();
      const server = servers.find(s => s._id === serverId);
      
      if (!server) {
        throw new Error(`MCP server ${serverId} not found or not available`);
      }

      console.log(`[MCPService] Connecting to MCP server: ${server.name}`);

      if (server.connectionType === 'stdio') {
        // Create stdio transport
        const transport = new StdioClientTransport({
          command: server.command,
          args: server.args || [],
          env: server.env instanceof Map ? Object.fromEntries(server.env) : (server.env || {})
        });

        // Create and connect client
        const client = new Client({
          name: 'librechat-client',
          version: '1.0.0'
        }, {
          capabilities: {}
        });

        await client.connect(transport);
        
        // Store client
        this.clients.set(serverId, {
          client,
          server,
          transport
        });

        console.log(`[MCPService] Connected to ${server.name}`);
        return this.clients.get(serverId);
      } else if (server.connectionType === 'sse') {
        // Create SSE transport
        console.log(`[MCPService] Creating SSE transport for ${server.name}`);

        const transport = new SSEClientTransport({
          streamUrl: server.config?.streamUrl || `${server.url}/stream`,
          messageUrl: server.config?.messageUrl || `${server.url}/message`,
          env: server.env || {}
        });

        // Start the transport
        await transport.start();

        // Create and connect client
        const client = new Client({
          name: 'librechat-client',
          version: '1.0.0'
        }, {
          capabilities: {}
        });

        await client.connect(transport);

        // Store client
        this.clients.set(serverId, {
          client,
          server,
          transport
        });

        console.log(`[MCPService] Connected to ${server.name} via SSE`);
        return this.clients.get(serverId);
      } else {
        // Other types not yet implemented
        throw new Error(`Connection type ${server.connectionType} not yet supported`);
      }
    } catch (error) {
      console.error(`[MCPService] Error connecting to server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectFromServer(serverId) {
    try {
      const connection = this.clients.get(serverId);
      if (connection) {
        await connection.client.close();
        this.clients.delete(serverId);
        console.log(`[MCPService] Disconnected from server ${serverId}`);
      }
    } catch (error) {
      console.error(`[MCPService] Error disconnecting from server ${serverId}:`, error);
    }
  }

  /**
   * List available tools from connected servers
   */
  async getAvailableTools() {
    const tools = [];
    
    for (const [serverId, connection] of this.clients) {
      try {
        const result = await connection.client.listTools();
        if (result.tools) {
          tools.push(...result.tools.map(tool => ({
            ...tool,
            serverId,
            serverName: connection.server.name
          })));
        }
      } catch (error) {
        console.error(`[MCPService] Error listing tools from ${serverId}:`, error);
      }
    }
    
    return tools;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverId, toolName, args = {}) {
    try {
      const connection = this.clients.get(serverId);
      if (!connection) {
        throw new Error(`Not connected to MCP server ${serverId}`);
      }

      console.log(`[MCPService] Calling tool ${toolName} on ${connection.server.name}`);
      
      const result = await connection.client.callTool({
        name: toolName,
        arguments: args
      });

      return result;
    } catch (error) {
      console.error(`[MCPService] Error calling tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Connect to all available MCP servers
   */
  async connectToAllServers() {
    const servers = await this.getAvailableServers();
    const results = [];

    for (const server of servers) {
      try {
        await this.connectToServer(server._id);
        results.push({ serverId: server._id, name: server.name, status: 'connected' });
      } catch (error) {
        results.push({ 
          serverId: server._id, 
          name: server.name, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Format tools for use in AI prompts
   */
  formatToolsForPrompt(tools) {
    if (!tools || tools.length === 0) {
      return '';
    }

    let prompt = '\n\n## Available MCP Tools\n';
    prompt += 'You have access to the following tools through MCP servers:\n\n';

    for (const tool of tools) {
      prompt += `### ${tool.name} (from ${tool.serverName})\n`;
      if (tool.description) {
        prompt += `${tool.description}\n`;
      }
      if (tool.inputSchema) {
        prompt += `Input: ${JSON.stringify(tool.inputSchema, null, 2)}\n`;
      }
      prompt += '\n';
    }

    prompt += 'To use a tool, specify it in your response like: [TOOL: tool_name {"arg": "value"}]\n';
    
    return prompt;
  }
}

// Singleton instance
let mcpServiceInstance = null;

function getMCPService() {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new MCPService();
  }
  return mcpServiceInstance;
}

module.exports = {
  MCPService,
  getMCPService
};