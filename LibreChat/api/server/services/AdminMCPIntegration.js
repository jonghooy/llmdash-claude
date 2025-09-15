const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

/**
 * Service to fetch MCP servers from Admin Dashboard
 * and convert them to LibreChat format
 */
class AdminMCPIntegration {
  constructor() {
    this.adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5001';
    this.internalApiKey = process.env.INTERNAL_API_KEY;
    this.cachedServers = null;
    this.cacheTime = null;
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Fetch MCP servers from Admin Dashboard
   * @returns {Promise<Array>} Array of MCP server configurations
   */
  async fetchAdminMCPServers() {
    try {
      // Check cache
      if (this.cachedServers && this.cacheTime && (Date.now() - this.cacheTime < this.cacheTimeout)) {
        logger.debug('[AdminMCPIntegration] Returning cached MCP servers');
        return this.cachedServers;
      }

      if (!this.internalApiKey) {
        logger.warn('[AdminMCPIntegration] No internal API key configured');
        return [];
      }

      logger.info('[AdminMCPIntegration] Fetching MCP servers from Admin Dashboard');
      
      const response = await axios.get(`${this.adminApiUrl}/api/mcp-servers`, {
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const servers = response.data.servers || [];
      
      // Filter only active and public servers
      const activeServers = servers.filter(s => s.isActive && s.isPublic);
      
      logger.info(`[AdminMCPIntegration] Found ${activeServers.length} active MCP servers`);
      
      // Cache the results
      this.cachedServers = activeServers;
      this.cacheTime = Date.now();
      
      return activeServers;
    } catch (error) {
      logger.error('[AdminMCPIntegration] Error fetching MCP servers:', error.message);
      // Return cached data if available
      if (this.cachedServers) {
        logger.info('[AdminMCPIntegration] Returning stale cache due to error');
        return this.cachedServers;
      }
      return [];
    }
  }

  /**
   * Convert Admin MCP server format to LibreChat format
   * @param {Object} adminServer - Server configuration from Admin Dashboard
   * @returns {Object} LibreChat-compatible MCP server configuration
   */
  convertToLibreChatFormat(adminServer) {
    const config = {
      timeout: adminServer.config?.timeout || 60000
    };

    if (adminServer.connectionType === 'stdio') {
      config.type = 'stdio';
      config.command = adminServer.command;
      config.args = adminServer.args || [];
      
      // Convert env Map to object if needed
      if (adminServer.env && adminServer.env instanceof Map) {
        config.env = Object.fromEntries(adminServer.env);
      } else if (adminServer.env) {
        config.env = adminServer.env;
      }
    } else if (adminServer.connectionType === 'sse') {
      config.type = 'sse';
      config.url = adminServer.url;
      
      // Convert headers Map to object if needed
      if (adminServer.headers && adminServer.headers instanceof Map) {
        config.headers = Object.fromEntries(adminServer.headers);
      } else if (adminServer.headers) {
        config.headers = adminServer.headers;
      }
    } else if (adminServer.connectionType === 'websocket') {
      // WebSocket support (future)
      config.type = 'websocket';
      config.url = adminServer.url;
    }

    // Add metadata
    config.description = adminServer.description;
    config.category = adminServer.category;
    config.serverId = adminServer._id;
    config.serverName = adminServer.name;
    
    // Add OAuth config if present
    if (adminServer.oauth && adminServer.oauth.enabled) {
      config.oauth = {
        clientId: adminServer.oauth.clientId,
        clientSecret: adminServer.oauth.clientSecret,
        authorizationUrl: adminServer.oauth.authorizationUrl,
        tokenUrl: adminServer.oauth.tokenUrl,
        scope: adminServer.oauth.scope
      };
    }

    return config;
  }

  /**
   * Get all MCP servers in LibreChat format
   * @returns {Promise<Object>} Object with server name as key and config as value
   */
  async getMCPServersForLibreChat() {
    try {
      const adminServers = await this.fetchAdminMCPServers();
      const libreChatServers = {};

      for (const server of adminServers) {
        // Use sanitized name as key (remove spaces and special chars)
        const serverKey = server.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        
        libreChatServers[serverKey] = this.convertToLibreChatFormat(server);
        
        logger.debug(`[AdminMCPIntegration] Converted server: ${server.name} -> ${serverKey}`);
      }

      return libreChatServers;
    } catch (error) {
      logger.error('[AdminMCPIntegration] Error getting MCP servers for LibreChat:', error);
      return {};
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cachedServers = null;
    this.cacheTime = null;
    logger.debug('[AdminMCPIntegration] Cache cleared');
  }
}

// Singleton instance
let instance = null;

function getAdminMCPIntegration() {
  if (!instance) {
    instance = new AdminMCPIntegration();
  }
  return instance;
}

module.exports = {
  AdminMCPIntegration,
  getAdminMCPIntegration
};