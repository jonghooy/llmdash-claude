/**
 * Memory Service for LLMDash
 * Unified memory management using mem-agent-mcp with vLLM
 */

const MCPMemoryClient = require('./MCPMemoryClient');
const { getMCPClient } = require('./MCPStdioClient');
const { getMCPDirectClient } = require('./MCPDirectClient');
const { logger } = require('@librechat/data-schemas');

class MemoryService {
  constructor() {
    this.mainClient = null;
    this.mcpStdioClient = null;
    this.mcpDirectClient = null;
    this.initialized = false;
  }

  /**
   * Initialize memory service with mem-agent-mcp
   */
  async initialize() {
    try {
      console.log('[MCP DEBUG] MemoryService.initialize() called');
      console.log('[MCP DEBUG] MEMORY_MCP_URL:', process.env.MEMORY_MCP_URL);
      console.log('[MCP DEBUG] MEMORY_MCP_ENABLED:', process.env.MEMORY_MCP_ENABLED);

      // Use direct MCP client for simpler integration
      console.log('[MCP DEBUG] Getting MCP Direct Client...');
      this.mcpDirectClient = getMCPDirectClient();
      console.log('[MCP DEBUG] MCP Direct Client obtained:', !!this.mcpDirectClient);

      // Test if vLLM server is available
      console.log('[MCP DEBUG] Creating MCPMemoryClient...');
      this.mainClient = new MCPMemoryClient('unified');
      console.log('[MCP DEBUG] Testing connection to vLLM server...');
      if (await this.mainClient.testConnection()) {
        console.log('[MCP DEBUG] Connection test successful, initializing...');
        await this.mainClient.initialize();
        this.initialized = true;
        console.log('[MCP DEBUG] Memory service fully initialized');
        logger.info('Memory service initialized with MCP Direct Client and vLLM backend', {
          url: process.env.MEMORY_MCP_URL || 'http://localhost:8001',
        });
        return true;
      }

      logger.warn('vLLM server not available, memory features disabled');
      return false;
    } catch (error) {
      logger.error('Failed to initialize memory service', { error: error.message });
      return false;
    }
  }

  /**
   * Get memory client (simplified - returns main client)
   */
  async getMemoryClient(userId = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.mainClient;
  }

  /**
   * Search memory using mem-agent-mcp
   */
  async searchAllMemory(userId, query, options = {}) {
    try {
      const client = await this.getMemoryClient(userId);
      if (!client) {
        logger.warn('Memory client not available');
        return null;
      }

      // Search using unified memory
      const results = await client.searchMemory(query, options.filters || []);

      // Format results for compatibility
      return {
        memories: Array.isArray(results) ? results : [results],
        entities: [],
        sources: ['mem-agent-mcp'],
      };
    } catch (error) {
      logger.error('Failed to search memory', {
        error: error.message,
        userId,
        query,
      });
      return null;
    }
  }

  /**
   * Get relevant context for a conversation
   */
  async getConversationContext(userId, prompt, options = {}) {
    try {
      const client = await this.getMemoryClient(userId);
      if (!client) {
        logger.warn('Memory client not available');
        return null;
      }

      // Get context from unified memory
      const context = await client.getRelevantContext(prompt, 5);

      if (!context) {
        return null;
      }

      // Return formatted context
      return {
        systemPrompt: context.systemPrompt || '',
        relevantMemories: context.relevantMemories || [],
        entities: context.entities || [],
        sources: ['mem-agent-mcp'],
      };
    } catch (error) {
      logger.error('Failed to get conversation context', {
        error: error.message,
        userId,
      });
      return null;
    }
  }

  /**
   * Save conversation to memory
   */
  async saveConversation(userId, conversation, options = {}) {
    try {
      const client = await this.getMemoryClient(userId);
      if (!client) {
        logger.warn('Memory client not available');
        return { saved: false };
      }

      // Save conversation to unified memory
      const result = await client.saveConversation(conversation);

      logger.info('Conversation saved to memory', {
        userId,
        conversationId: conversation.conversationId,
        success: result,
      });

      return { saved: result };
    } catch (error) {
      logger.error('Failed to save conversation to memory', {
        error: error.message,
        userId,
        conversationId: conversation.conversationId,
      });
      return { saved: false };
    }
  }

  /**
   * Update user profile in memory
   */
  async updateUserProfile(userId, profile) {
    try {
      const client = await this.getMemoryClient(userId);
      if (!client) {
        return false;
      }
      return await client.updateUserProfile(profile);
    } catch (error) {
      logger.error('Failed to update user profile', {
        error: error.message,
        userId,
      });
      return false;
    }
  }


  /**
   * Get memory statistics
   */
  async getMemoryStats(userId, teamId = null) {
    try {
      const client = await this.getMemoryClient(userId);
      if (!client) {
        return { available: false };
      }

      // For now, return basic stats
      return {
        available: true,
        source: 'mem-agent-mcp',
        serverUrl: client.baseUrl,
      };
    } catch (error) {
      logger.error('Failed to get memory statistics', {
        error: error.message,
        userId,
      });
      return { available: false };
    }
  }

  /**
   * Add or update memory for an entity
   */
  async addMemory(entityName, content) {
    try {
      console.log('[MCP DEBUG] MemoryService.addMemory() called');
      console.log('[MCP DEBUG] Entity:', entityName);
      console.log('[MCP DEBUG] Content length:', content.length);
      console.log('[MCP DEBUG] Has mcpDirectClient:', !!this.mcpDirectClient);
      console.log('[MCP DEBUG] Has mainClient:', !!this.mainClient);

      if (this.mcpDirectClient) {
        // Use direct MCP client
        console.log('[MCP DEBUG] Using MCP Direct Client for memory update');
        const result = await this.mcpDirectClient.addMemory(entityName, content);
        console.log('[MCP DEBUG] MCP Direct Client result:', result);
        logger.info('Memory added via MCP Direct Client', { entityName });
        return result;
      } else if (this.mainClient) {
        // Fallback to HTTP client
        logger.warn('Using fallback HTTP client for memory update');
        // For HTTP client, we need to implement a different approach
        // Since it doesn't have add_memory, we'll save as a conversation
        const conversation = {
          messages: [{ text: content }],
          title: entityName,
          conversationId: `entity-${entityName}-${Date.now()}`
        };
        return await this.mainClient.saveConversation(conversation);
      }

      logger.error('No memory client available for adding memory');
      return false;
    } catch (error) {
      logger.error('Failed to add memory', {
        error: error.message,
        entityName
      });
      return false;
    }
  }

  /**
   * Check if memory service is available
   */
  isAvailable() {
    return this.initialized && (this.mcpStdioClient !== null || this.mainClient !== null);
  }

  /**
   * Get available memory levels
   */
  getAvailableLevels() {
    if (this.isAvailable()) {
      return ['unified']; // Single unified memory level
    }
    return [];
  }
}

// Export singleton instance
module.exports = new MemoryService();