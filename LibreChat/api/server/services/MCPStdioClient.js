/**
 * MCP Stdio Client for direct MCP protocol communication
 * Uses standard input/output to communicate with MCP server
 */

const { spawn } = require('child_process');
const { logger } = require('@librechat/data-schemas');
const path = require('path');
const { EventEmitter } = require('events');

class MCPStdioClient extends EventEmitter {
  constructor() {
    super();
    this.mcpProcess = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.initialized = false;
    this.buffer = '';
  }

  /**
   * Start the MCP server process
   */
  async start() {
    try {
      const mcpScript = path.join(__dirname, '..', '..', '..', '..', 'mem-agent-mcp', 'mcp_client_vllm.py');

      logger.info('[MCP Stdio] Starting MCP server process', { script: mcpScript });

      // Use the venv Python to run the script
      const venvPython = path.join(path.dirname(mcpScript), '.venv', 'bin', 'python3');

      this.mcpProcess = spawn(venvPython, [mcpScript], {
        cwd: path.dirname(mcpScript),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          FASTMCP_DISABLE_SPLASH: '1',  // Disable FastMCP splash screen
          NO_COLOR: '1'  // Disable colored output
        }
      });

      // Handle stdout (responses from MCP server)
      this.mcpProcess.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      // Handle stderr (for debugging)
      this.mcpProcess.stderr.on('data', (data) => {
        const stderr = data.toString();
        logger.error('[MCP Stdio] Server stderr:', stderr);
        // Check for specific errors
        if (stderr.includes('ModuleNotFoundError') || stderr.includes('ImportError')) {
          logger.error('[MCP Stdio] Python module error - check venv setup');
        }
      });

      // Handle process exit
      this.mcpProcess.on('close', (code) => {
        logger.info('[MCP Stdio] Server process closed', { code });
        this.initialized = false;
        this.mcpProcess = null;
      });

      this.mcpProcess.on('error', (err) => {
        logger.error('[MCP Stdio] Process error', { error: err.message });
      });

      // Initialize the connection
      await this.initialize();

      logger.info('[MCP Stdio] Client started successfully');
      return true;
    } catch (error) {
      logger.error('[MCP Stdio] Failed to start', { error: error.message });
      return false;
    }
  }

  /**
   * Process buffered data from stdout
   */
  processBuffer() {
    // Look for Content-Length header
    while (this.buffer.includes('Content-Length:')) {
      const headerIndex = this.buffer.indexOf('Content-Length:');
      const headerEnd = this.buffer.indexOf('\r\n\r\n', headerIndex);

      if (headerEnd === -1) {
        // Header not complete yet
        break;
      }

      // Extract content length
      const headerLine = this.buffer.substring(headerIndex, headerEnd);
      const lengthMatch = headerLine.match(/Content-Length:\s*(\d+)/);

      if (!lengthMatch) {
        // Invalid header, skip it
        this.buffer = this.buffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(lengthMatch[1]);
      const contentStart = headerEnd + 4;

      // Check if we have enough content
      if (this.buffer.length < contentStart + contentLength) {
        // Not enough data yet
        break;
      }

      // Extract the JSON content
      const jsonContent = this.buffer.substring(contentStart, contentStart + contentLength);
      this.buffer = this.buffer.substring(contentStart + contentLength);

      try {
        const message = JSON.parse(jsonContent);
        this.handleMessage(message);
      } catch (e) {
        logger.error('[MCP Stdio] Failed to parse JSON:', e.message, 'Content:', jsonContent);
      }
    }

    // Clean up any non-JSON data before the first Content-Length
    const firstHeader = this.buffer.indexOf('Content-Length:');
    if (firstHeader > 0) {
      // Remove everything before the first Content-Length (like splash screen)
      const removed = this.buffer.substring(0, firstHeader);
      if (removed.trim()) {
        logger.debug('[MCP Stdio] Skipping non-protocol data (splash screen, etc)');
      }
      this.buffer = this.buffer.substring(firstHeader);
    }
  }

  /**
   * Handle incoming message from MCP server
   */
  handleMessage(message) {
    logger.debug('[MCP Stdio] Received message:', message);

    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'MCP error'));
      } else {
        resolve(message.result);
      }
    } else if (message.method) {
      // Server-initiated message (notification)
      this.emit('notification', message);
    }
  }

  /**
   * Send a JSON-RPC message to the MCP server
   */
  async sendMessage(method, params = {}) {
    if (!this.mcpProcess) {
      throw new Error('MCP process not started');
    }

    const id = this.messageId++;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const jsonStr = JSON.stringify(message);
      const content = `Content-Length: ${Buffer.byteLength(jsonStr)}\r\n\r\n${jsonStr}\n`;

      logger.debug('[MCP Stdio] Sending message:', { method, params });

      this.mcpProcess.stdin.write(content, (err) => {
        if (err) {
          this.pendingRequests.delete(id);
          reject(err);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Initialize the MCP connection
   */
  async initialize() {
    try {
      const result = await this.sendMessage('initialize', {
        protocolVersion: '0.1.0',
        capabilities: {}
      });

      this.initialized = true;
      logger.info('[MCP Stdio] Initialized successfully', result);
      return result;
    } catch (error) {
      logger.error('[MCP Stdio] Initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(name, args = {}) {
    if (!this.initialized) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.sendMessage('tools/call', {
        name,
        arguments: args
      });

      // Extract text content from result
      if (result && result.content && Array.isArray(result.content)) {
        const textContent = result.content.find(c => c.type === 'text');
        return textContent ? textContent.text : JSON.stringify(result.content);
      }

      return result;
    } catch (error) {
      logger.error('[MCP Stdio] Tool call failed', {
        name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools() {
    try {
      const result = await this.sendMessage('tools/list');
      return result.tools || [];
    } catch (error) {
      logger.error('[MCP Stdio] Failed to list tools', { error: error.message });
      return [];
    }
  }

  /**
   * Add memory to the system
   */
  async addMemory(entityName, content) {
    try {
      logger.info('[MCP Stdio] Adding memory', { entityName, contentLength: content.length });

      const result = await this.callTool('add_memory', {
        entity_name: entityName,
        content: content
      });

      logger.info('[MCP Stdio] Memory added successfully', { entityName, result });
      return result;
    } catch (error) {
      logger.error('[MCP Stdio] Failed to add memory', {
        entityName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search memory
   */
  async searchMemory(query) {
    try {
      const result = await this.callTool('search_memory', { query });
      return result;
    } catch (error) {
      logger.error('[MCP Stdio] Failed to search memory', {
        query,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Query with memory context
   */
  async queryWithMemory(question) {
    try {
      const result = await this.callTool('query_with_memory', { question });
      return result;
    } catch (error) {
      logger.error('[MCP Stdio] Failed to query with memory', {
        question,
        error: error.message
      });
      return null;
    }
  }

  /**
   * List all memories
   */
  async listMemories() {
    try {
      const result = await this.callTool('list_memories');
      return typeof result === 'string' ? JSON.parse(result) : result;
    } catch (error) {
      logger.error('[MCP Stdio] Failed to list memories', {
        error: error.message
      });
      return { files: [], count: 0 };
    }
  }

  /**
   * Stop the MCP server process
   */
  async stop() {
    if (this.mcpProcess) {
      logger.info('[MCP Stdio] Stopping MCP server process');

      // Clear pending requests
      for (const [id, { reject }] of this.pendingRequests) {
        reject(new Error('Client shutting down'));
      }
      this.pendingRequests.clear();

      // Kill the process
      this.mcpProcess.kill('SIGTERM');
      this.mcpProcess = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let mcpClient = null;

/**
 * Get or create MCP client instance
 */
function getMCPClient() {
  if (!mcpClient) {
    mcpClient = new MCPStdioClient();
  }
  return mcpClient;
}

module.exports = {
  MCPStdioClient,
  getMCPClient
};