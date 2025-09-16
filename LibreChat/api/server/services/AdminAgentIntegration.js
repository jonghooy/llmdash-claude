const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

/**
 * Service to fetch Agents from Admin Dashboard
 * and make them available in LibreChat
 */
class AdminAgentIntegration {
  constructor() {
    this.adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5001';
    this.internalApiKey = process.env.INTERNAL_API_KEY;
    this.cachedAgents = null;
    this.cacheTime = null;
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Fetch agents from Admin Dashboard
   * @returns {Promise<Array>} Array of agent configurations
   */
  async fetchAdminAgents() {
    try {
      // Check cache
      if (this.cachedAgents && this.cacheTime && (Date.now() - this.cacheTime < this.cacheTimeout)) {
        logger.debug('[AdminAgentIntegration] Returning cached agents');
        return this.cachedAgents;
      }

      if (!this.internalApiKey) {
        logger.warn('[AdminAgentIntegration] No internal API key configured');
        return [];
      }

      logger.info('[AdminAgentIntegration] Fetching agents from Admin Dashboard');

      const response = await axios.get(`${this.adminApiUrl}/api/agents`, {
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json'
        },
        params: {
          isActive: true,
          isPublic: true
        },
        timeout: 5000
      });

      const agents = response.data.agents || [];

      logger.info(`[AdminAgentIntegration] Found ${agents.length} active agents`);

      // Cache the results
      this.cachedAgents = agents;
      this.cacheTime = Date.now();

      return agents;
    } catch (error) {
      logger.error('[AdminAgentIntegration] Error fetching agents:', error.message);
      // Return cached data if available
      if (this.cachedAgents) {
        logger.info('[AdminAgentIntegration] Returning stale cache due to error');
        return this.cachedAgents;
      }
      return [];
    }
  }

  /**
   * Convert Admin Agent format to LibreChat format
   * @param {Object} adminAgent - Agent configuration from Admin Dashboard
   * @param {string} userId - Current user ID
   * @returns {Object} LibreChat-compatible agent configuration
   */
  convertToLibreChatFormat(adminAgent, userId = 'admin') {
    // Map capabilities to tools
    const tools = [];

    // Add MCP tools if connected
    if (adminAgent.mcpServers && adminAgent.mcpServers.length > 0) {
      adminAgent.mcpServers.forEach(server => {
        if (server.isActive) {
          tools.push({
            type: 'mcp',
            name: server.name,
            serverId: server._id
          });
        }
      });
    }

    // Add capability-based tools
    if (adminAgent.capabilities) {
      if (adminAgent.capabilities.codeExecution) {
        tools.push({ type: 'code_interpreter', enabled: true });
      }
      if (adminAgent.capabilities.fileAccess) {
        tools.push({ type: 'file_search', enabled: true });
      }
      if (adminAgent.capabilities.webSearch) {
        tools.push({ type: 'web_search', enabled: true });
      }
      if (adminAgent.capabilities.imageGeneration) {
        tools.push({ type: 'dalle', enabled: true });
      }
      if (adminAgent.capabilities.dataAnalysis) {
        tools.push({ type: 'data_analysis', enabled: true });
      }
    }

    // Build the agent configuration for LibreChat
    const libreChatAgent = {
      id: adminAgent._id,
      name: adminAgent.name,
      description: adminAgent.description,
      avatar: adminAgent.avatar,
      author: userId,
      category: adminAgent.category || 'general',
      model: adminAgent.model || 'gpt-4',
      provider: this.getProviderFromModel(adminAgent.model),
      instructions: adminAgent.systemPrompt || adminAgent.instructions || '',
      temperature: adminAgent.temperature || 0.7,
      max_tokens: adminAgent.maxTokens || 4000,
      tools: tools,
      tags: adminAgent.tags || [],
      isPublic: adminAgent.isPublic,
      isActive: adminAgent.isActive,
      metadata: {
        source: 'admin',
        adminId: adminAgent._id,
        type: adminAgent.type,
        usageCount: adminAgent.usageCount,
        rating: adminAgent.rating,
        version: adminAgent.version
      }
    };

    // Add prompt templates if available
    if (adminAgent.prompts && adminAgent.prompts.length > 0) {
      libreChatAgent.promptTemplates = adminAgent.prompts.map(p => ({
        id: p._id,
        name: p.name,
        content: p.prompt || p.content
      }));
    }

    return libreChatAgent;
  }

  /**
   * Get provider based on model name
   * @param {string} model - Model name
   * @returns {string} Provider name
   */
  getProviderFromModel(model) {
    if (!model) return 'openAI';

    const modelLower = model.toLowerCase();

    if (modelLower.includes('gpt')) return 'openAI';
    if (modelLower.includes('claude')) return 'anthropic';
    if (modelLower.includes('gemini')) return 'google';
    if (modelLower.includes('llama')) return 'meta';
    if (modelLower.includes('mistral')) return 'mistral';

    return 'openAI'; // Default
  }

  /**
   * Get all agents for LibreChat
   * @param {string} userId - Current user ID
   * @returns {Promise<Array>} Array of LibreChat-formatted agents
   */
  async getAgentsForLibreChat(userId = 'admin') {
    try {
      const adminAgents = await this.fetchAdminAgents();
      const libreChatAgents = [];

      for (const agent of adminAgents) {
        try {
          const convertedAgent = this.convertToLibreChatFormat(agent, userId);
          libreChatAgents.push(convertedAgent);
        } catch (error) {
          logger.error(`[AdminAgentIntegration] Error converting agent ${agent.name}:`, error);
        }
      }

      logger.info(`[AdminAgentIntegration] Converted ${libreChatAgents.length} agents for LibreChat`);
      return libreChatAgents;
    } catch (error) {
      logger.error('[AdminAgentIntegration] Error getting agents for LibreChat:', error);
      return [];
    }
  }

  /**
   * Get a specific agent by ID
   * @param {string} agentId - Agent ID
   * @param {string} userId - Current user ID
   * @returns {Promise<Object|null>} LibreChat-formatted agent or null
   */
  async getAgentById(agentId, userId = 'admin') {
    try {
      if (!this.internalApiKey) {
        logger.warn('[AdminAgentIntegration] No internal API key configured');
        return null;
      }

      const response = await axios.get(`${this.adminApiUrl}/api/agents/${agentId}`, {
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data) {
        return this.convertToLibreChatFormat(response.data, userId);
      }

      return null;
    } catch (error) {
      logger.error(`[AdminAgentIntegration] Error fetching agent ${agentId}:`, error.message);
      return null;
    }
  }

  /**
   * Update agent usage statistics
   * @param {string} agentId - Agent ID
   * @param {number} tokensUsed - Tokens used in conversation
   * @returns {Promise<boolean>} Success status
   */
  async updateAgentUsage(agentId, tokensUsed = 0) {
    try {
      if (!this.internalApiKey) {
        return false;
      }

      await axios.post(
        `${this.adminApiUrl}/api/agents/${agentId}/usage`,
        { tokensUsed },
        {
          headers: {
            'X-API-Key': this.internalApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return true;
    } catch (error) {
      logger.error(`[AdminAgentIntegration] Error updating agent usage:`, error.message);
      return false;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cachedAgents = null;
    this.cacheTime = null;
    logger.debug('[AdminAgentIntegration] Cache cleared');
  }
}

// Singleton instance
let instance = null;

function getAdminAgentIntegration() {
  if (!instance) {
    instance = new AdminAgentIntegration();
  }
  return instance;
}

module.exports = {
  AdminAgentIntegration,
  getAdminAgentIntegration
};