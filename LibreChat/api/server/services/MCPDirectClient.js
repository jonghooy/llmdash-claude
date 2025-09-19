/**
 * MCP Direct Client - Simplified MCP integration
 * Directly calls Python scripts for MCP operations
 */

const { spawn, exec } = require('child_process');
const { logger } = require('@librechat/data-schemas');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MCPDirectClient {
  constructor() {
    this.mcpPath = path.join(__dirname, '..', '..', '..', '..', 'mem-agent-mcp');
    this.venvPython = path.join(this.mcpPath, '.venv', 'bin', 'python3');
  }

  /**
   * Execute a Python script with MCP tools
   */
  async executePython(scriptContent) {
    return new Promise((resolve, reject) => {
      console.log('[MCP DIRECT DEBUG] executePython() called');
      console.log('[MCP DIRECT DEBUG] Python binary:', this.venvPython);
      console.log('[MCP DIRECT DEBUG] Working directory:', this.mcpPath);

      const python = spawn(this.venvPython, ['-c', scriptContent], {
        cwd: this.mcpPath,
        env: {
          ...process.env,
          PYTHONPATH: this.mcpPath,
          FASTMCP_DISABLE_SPLASH: '1',
          NO_COLOR: '1'
        }
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        console.log('[MCP DIRECT DEBUG] Python process closed with code:', code);
        console.log('[MCP DIRECT DEBUG] stdout:', output);
        console.log('[MCP DIRECT DEBUG] stderr:', error);

        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Python process exited with code ${code}: ${error}`));
        }
      });

      python.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Add memory using MCP tools
   */
  async addMemory(entityName, content) {
    try {
      console.log('='.repeat(60));
      console.log('[MCP DIRECT DEBUG] addMemory() called');
      console.log('[MCP DIRECT DEBUG] Entity:', entityName);
      console.log('[MCP DIRECT DEBUG] Content preview:', content.substring(0, 100));
      console.log('[MCP DIRECT DEBUG] MCP Path:', this.mcpPath);
      console.log('[MCP DIRECT DEBUG] Python Path:', this.venvPython);
      console.log('='.repeat(60));

      logger.info('[MCP Direct] Adding memory', { entityName });

      const script = `
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pathlib import Path

async def add_mem():
    server_script = Path("${this.mcpPath}/mcp_client_vllm.py")
    server_params = StdioServerParameters(
        command="${this.venvPython}",
        args=[str(server_script)],
        cwd="${this.mcpPath}",
        env={"FASTMCP_DISABLE_SPLASH": "1", "NO_COLOR": "1"}
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("add_memory", {
                "entity_name": ${JSON.stringify(entityName)},
                "content": ${JSON.stringify(content)}
            })
            # Extract text from result
            if hasattr(result, 'content') and result.content:
                for item in result.content:
                    if hasattr(item, 'text'):
                        print(json.dumps({"success": True, "result": item.text}))
                        return
            print(json.dumps({"success": True, "result": str(result)}))

asyncio.run(add_mem())
`;

      console.log('[MCP DIRECT DEBUG] Executing Python script...');
      const output = await this.executePython(script);
      console.log('[MCP DIRECT DEBUG] Python output:', output);

      // Parse the last line of output (ignoring any startup messages)
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      console.log('[MCP DIRECT DEBUG] Last line:', lastLine);

      try {
        const result = JSON.parse(lastLine);
        console.log('[MCP DIRECT DEBUG] Parsed result:', result);
        logger.info('[MCP Direct] Memory added successfully', { entityName, result });
        return result.result;
      } catch (parseError) {
        // If we can't parse JSON, but the script ran successfully, consider it a success
        console.log('[MCP DIRECT DEBUG] Could not parse JSON, returning raw output');
        logger.info('[MCP Direct] Memory added (non-JSON response)', { entityName });
        return output;
      }
    } catch (error) {
      logger.error('[MCP Direct] Failed to add memory', {
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
      const script = `
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pathlib import Path

async def search_mem():
    server_script = Path("${this.mcpPath}/mcp_client_vllm.py")
    server_params = StdioServerParameters(
        command="${this.venvPython}",
        args=[str(server_script)],
        cwd="${this.mcpPath}",
        env={"FASTMCP_DISABLE_SPLASH": "1", "NO_COLOR": "1"}
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("search_memory", {
                "query": ${JSON.stringify(query)}
            })
            # Extract text from result
            if hasattr(result, 'content') and result.content:
                for item in result.content:
                    if hasattr(item, 'text'):
                        print(json.dumps({"success": True, "result": item.text}))
                        return
            print(json.dumps({"success": True, "result": str(result)}))

asyncio.run(search_mem())
`;

      const output = await this.executePython(script);
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];

      try {
        const result = JSON.parse(lastLine);
        return result.result;
      } catch (parseError) {
        return output;
      }
    } catch (error) {
      logger.error('[MCP Direct] Failed to search memory', {
        query,
        error: error.message
      });
      return null;
    }
  }

  /**
   * List memories
   */
  async listMemories() {
    try {
      const script = `
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from pathlib import Path

async def list_mem():
    server_script = Path("${this.mcpPath}/mcp_client_vllm.py")
    server_params = StdioServerParameters(
        command="${this.venvPython}",
        args=[str(server_script)],
        cwd="${this.mcpPath}",
        env={"FASTMCP_DISABLE_SPLASH": "1", "NO_COLOR": "1"}
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("list_memories", {})
            # Extract text from result
            if hasattr(result, 'content') and result.content:
                for item in result.content:
                    if hasattr(item, 'text'):
                        memories = json.loads(item.text)
                        print(json.dumps(memories))
                        return
            print(json.dumps({"files": [], "count": 0}))

asyncio.run(list_mem())
`;

      const output = await this.executePython(script);
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];

      try {
        return JSON.parse(lastLine);
      } catch (parseError) {
        return { files: [], count: 0 };
      }
    } catch (error) {
      logger.error('[MCP Direct] Failed to list memories', {
        error: error.message
      });
      return { files: [], count: 0 };
    }
  }
}

// Singleton instance
let mcpDirectClient = null;

/**
 * Get or create MCP direct client instance
 */
function getMCPDirectClient() {
  if (!mcpDirectClient) {
    mcpDirectClient = new MCPDirectClient();
  }
  return mcpDirectClient;
}

module.exports = {
  MCPDirectClient,
  getMCPDirectClient
};