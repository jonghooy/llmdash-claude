/**
 * MCP Memory Client for LLMDash
 * Connects to mem-agent-mcp server with vLLM backend
 */

const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

class MCPMemoryClient {
  constructor(level = 'personal', userId = null, teamId = null) {
    this.level = level;
    this.userId = userId;
    this.teamId = teamId;
    // Use mem-agent-mcp server on port 8001 for all memory levels
    this.baseUrl = process.env.MEMORY_MCP_URL || 'http://localhost:8001';
    this.timeout = 30000; // 30 seconds for vLLM responses
  }

  /**
   * Get the appropriate MCP server URL
   * Now using single mem-agent-mcp instance for all levels
   */
  getServerUrl(level, teamId = null) {
    // All memory levels now use the same mem-agent-mcp server
    return this.baseUrl;
  }

  /**
   * Initialize connection and validate vLLM server availability
   */
  async initialize() {
    try {
      // Check if vLLM server is available
      const response = await axios.get(
        `${this.baseUrl}/v1/models`,
        {
          timeout: 5000,
        },
      );

      if (response.data && response.data.data) {
        logger.info(`Memory Client initialized for ${this.level} level`, {
          serverUrl: this.baseUrl,
          models: response.data.data.map(m => m.id),
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to initialize Memory Client for ${this.level}`, {
        error: error.message,
        serverUrl: this.baseUrl,
      });
      return false;
    }
  }

  /**
   * Search memory for relevant context using mem-agent-mcp
   */
  async searchMemory(query, filters = []) {
    try {
      // Call vLLM API directly for memory search
      const response = await axios.post(
        `${this.baseUrl}/v1/completions`,
        {
          model: './models/mem-agent',
          prompt: `Search the memory system for: ${query}\n\nProvide relevant information found:`,
          max_tokens: 200,
          temperature: 0.3,
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.choices) {
        const result = response.data.choices[0].text.trim();
        return this.parseMemoryResponse(result);
      }
      return null;
    } catch (error) {
      logger.error('Memory search failed', {
        error: error.message,
        query,
        level: this.level,
      });
      return null;
    }
  }

  /**
   * Save conversation to memory
   */
  async saveConversation(conversation) {
    try {
      const { messages, title, conversationId, model, endpoint } = conversation;

      // Extract entities and topics from the conversation
      const entities = this.extractEntities(messages);
      const summary = this.generateSummary(messages);

      // Save each entity mentioned in the conversation using MCP add_memory tool
      for (const entity of entities) {
        await this.addMemory(entity, summary);
      }

      // Save conversation summary as general memory
      if (title && summary) {
        await this.addMemory('conversations', `## ${title}\n${summary}\n- ID: ${conversationId}\n- Date: ${new Date().toISOString()}`);
      }

      logger.info('Conversation saved to memory', {
        conversationId,
        level: this.level,
        entities: entities.length,
      });
      return true;
    } catch (error) {
      logger.error('Failed to save conversation to memory', {
        error: error.message,
        level: this.level,
      });
      return false;
    }
  }

  /**
   * Add memory using MCP protocol
   */
  async addMemory(entityName, content) {
    try {
      // Use the MCP server's stdio interface via HTTP proxy
      const { spawn } = require('child_process');
      const path = require('path');

      // Path to MCP client script
      const mcpScript = path.join(__dirname, '..', '..', '..', '..', 'mem-agent-mcp', 'mcp_client_vllm.py');

      // Create a simple Python script to call add_memory tool
      const pythonCode = `
import asyncio
import json
import sys
from pathlib import Path
sys.path.append('${path.dirname(mcpScript)}')

async def add_mem():
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    server_params = StdioServerParameters(
        command="python3",
        args=["${mcpScript}"],
        cwd="${path.dirname(mcpScript)}"
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("add_memory", {
                "entity_name": "${entityName.replace(/"/g, '\\"')}",
                "content": ${JSON.stringify(content)}
            })
            return result

result = asyncio.run(add_mem())
print(json.dumps({"success": True, "result": str(result)}))
`;

      return new Promise((resolve, reject) => {
        const python = spawn('python3', ['-c', pythonCode]);
        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              resolve(result.success);
            } catch (e) {
              logger.warn('Memory add parsing error', { output, error: e.message });
              resolve(false);
            }
          } else {
            logger.error('Memory add failed', { code, error });
            resolve(false);
          }
        });

        python.on('error', (err) => {
          logger.error('Failed to spawn Python process', { error: err.message });
          resolve(false);
        });
      });
    } catch (error) {
      logger.error('Failed to add memory', { error: error.message, entityName });
      return false;
    }
  }

  /**
   * Get relevant context for a prompt using mem-agent-mcp
   */
  async getRelevantContext(prompt, maxResults = 5) {
    try {
      // Use vLLM with memory context
      const response = await axios.post(
        `${this.baseUrl}/v1/completions`,
        {
          model: './models/mem-agent',
          prompt: `Based on the memory system, provide relevant context for: "${prompt}"\n\nRelevant context:`,
          max_tokens: 300,
          temperature: 0.3,
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.choices) {
        const contextData = response.data.choices[0].text.trim();
        return this.formatContextForChat(contextData);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get relevant context', {
        error: error.message,
        prompt: prompt.substring(0, 100),
        level: this.level,
      });
      return null;
    }
  }

  /**
   * Update user profile in memory
   */
  async updateUserProfile(profile) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/mcp`,
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'update_profile',
            arguments: {
              user_id: this.userId,
              profile: JSON.stringify(profile),
              level: this.level,
            },
          },
          id: Date.now(),
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.result ? true : false;
    } catch (error) {
      logger.error('Failed to update user profile', {
        error: error.message,
        userId: this.userId,
      });
      return false;
    }
  }

  /**
   * Parse memory response from MCP server
   */
  parseMemoryResponse(result) {
    try {
      if (typeof result === 'string') {
        // Try to extract structured data from the response
        const lines = result.split('\n');
        const memories = [];

        lines.forEach(line => {
          if (line.includes('[[') && line.includes(']]')) {
            // Extract entity references
            const matches = line.match(/\[\[(.*?)\]\]/g);
            if (matches) {
              matches.forEach(match => {
                memories.push({
                  type: 'entity',
                  reference: match.replace(/\[\[|\]\]/g, ''),
                  context: line,
                });
              });
            }
          } else if (line.trim()) {
            memories.push({
              type: 'text',
              content: line.trim(),
            });
          }
        });

        return memories;
      }
      return result;
    } catch (error) {
      logger.error('Failed to parse memory response', { error: error.message });
      return null;
    }
  }

  /**
   * Extract entities from conversation messages
   */
  extractEntities(messages) {
    const entities = new Set();

    messages.forEach(msg => {
      const text = msg.text || '';

      // Extract mentioned names (simple heuristic)
      const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
      const names = text.match(namePattern);
      if (names) {
        names.forEach(name => entities.add(name));
      }

      // Extract mentioned projects, companies, etc.
      const projectPattern = /(?:project|company|organization|team)\s+(\w+)/gi;
      const projects = text.match(projectPattern);
      if (projects) {
        projects.forEach(project => entities.add(project));
      }
    });

    return Array.from(entities);
  }

  /**
   * Generate summary from messages
   */
  generateSummary(messages) {
    if (!messages || messages.length === 0) {
      return 'Empty conversation';
    }

    // Get the first user message and last assistant message for a basic summary
    const userMessages = messages.filter(m => m.isCreatedByUser);
    const assistantMessages = messages.filter(m => !m.isCreatedByUser);

    let summary = '';
    if (userMessages.length > 0) {
      summary += `User asked about: ${userMessages[0].text.substring(0, 100)}... `;
    }
    if (assistantMessages.length > 0) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1];
      summary += `Assistant provided: ${lastAssistant.text.substring(0, 100)}...`;
    }

    return summary || 'Conversation between user and assistant';
  }

  /**
   * Format context for inclusion in chat
   */
  formatContextForChat(contextData) {
    if (!contextData) return null;

    let formattedContext = {
      systemPrompt: '',
      relevantMemories: [],
      entities: [],
    };

    // Parse the context data
    if (typeof contextData === 'string') {
      formattedContext.systemPrompt = `\n[Memory Context]\n${contextData}\n`;
      return formattedContext;
    }

    // Handle structured context
    if (contextData.memories) {
      formattedContext.relevantMemories = contextData.memories;
    }

    if (contextData.entities) {
      formattedContext.entities = contextData.entities;
    }

    // Build system prompt with context
    if (formattedContext.relevantMemories.length > 0) {
      formattedContext.systemPrompt += '\n[Relevant Memories]\n';
      formattedContext.relevantMemories.forEach(memory => {
        formattedContext.systemPrompt += `- ${memory}\n`;
      });
    }

    if (formattedContext.entities.length > 0) {
      formattedContext.systemPrompt += '\n[Known Entities]\n';
      formattedContext.entities.forEach(entity => {
        formattedContext.systemPrompt += `- ${entity}\n`;
      });
    }

    return formattedContext;
  }

  /**
   * Test connection to vLLM server
   */
  async testConnection() {
    try {
      // Check vLLM health endpoint
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      // Try models endpoint if health doesn't exist
      try {
        const modelsResponse = await axios.get(`${this.baseUrl}/v1/models`, {
          timeout: 5000,
        });
        return modelsResponse.status === 200;
      } catch (err) {
        return false;
      }
    }
  }
}

module.exports = MCPMemoryClient;