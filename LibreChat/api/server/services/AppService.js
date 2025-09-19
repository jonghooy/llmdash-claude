const {
  isEnabled,
  loadMemoryConfig,
  agentsConfigSetup,
  loadWebSearchConfig,
  loadDefaultInterface,
} = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const {
  FileSources,
  loadOCRConfig,
  EModelEndpoint,
  getConfigDefaults,
} = require('librechat-data-provider');
const {
  checkWebSearchConfig,
  checkVariables,
  checkHealth,
  checkConfig,
} = require('./start/checks');
const { initializeAzureBlobService } = require('./Files/Azure/initialize');
const { initializeFirebase } = require('./Files/Firebase/initialize');
const handleRateLimits = require('./Config/handleRateLimits');
const loadCustomConfig = require('./Config/loadCustomConfig');
const { loadTurnstileConfig } = require('./start/turnstile');
const { processModelSpecs } = require('./start/modelSpecs');
const { initializeS3 } = require('./Files/S3/initialize');
const { loadAndFormatTools } = require('./start/tools');
const { loadEndpoints } = require('./start/endpoints');
const paths = require('~/config/paths');

/**
 * Loads custom config and initializes app-wide variables.
 * @function AppService
 */
const AppService = async () => {
  /** @type {TCustomConfig} */
  const config = (await loadCustomConfig()) ?? {};
  const configDefaults = getConfigDefaults();

  const ocr = loadOCRConfig(config.ocr);
  const webSearch = loadWebSearchConfig(config.webSearch);
  checkWebSearchConfig(webSearch);
  const memory = loadMemoryConfig(config.memory);
  const filteredTools = config.filteredTools;
  const includedTools = config.includedTools;
  const fileStrategy = config.fileStrategy ?? configDefaults.fileStrategy;
  const startBalance = process.env.START_BALANCE;
  const balance = config.balance ?? {
    enabled: isEnabled(process.env.CHECK_BALANCE),
    startBalance: startBalance ? parseInt(startBalance, 10) : undefined,
  };
  const imageOutputType = config?.imageOutputType ?? configDefaults.imageOutputType;

  process.env.CDN_PROVIDER = fileStrategy;

  checkVariables();
  await checkHealth();

  if (fileStrategy === FileSources.firebase) {
    initializeFirebase();
  } else if (fileStrategy === FileSources.azure_blob) {
    initializeAzureBlobService();
  } else if (fileStrategy === FileSources.s3) {
    initializeS3();
  }

  /** @type {Record<string, FunctionTool>} */
  const availableTools = loadAndFormatTools({
    adminFilter: filteredTools,
    adminIncluded: includedTools,
    directory: paths.structuredTools,
  });

  // Get MCP servers from librechat.yaml
  let mcpConfig = config.mcpServers || {};

  // Try to merge Admin Dashboard MCP servers if enabled
  if (process.env.ENABLE_ADMIN_MCP_INTEGRATION === 'true') {
    try {
      const MCPServer = require('../../../../LibreChat-Admin/backend/src/models/MCPServer');
      const activeMCPServers = await MCPServer.find({ isActive: true }).lean();

      if (activeMCPServers && activeMCPServers.length > 0) {
        logger.info(`[AppService] Loading ${activeMCPServers.length} active MCP servers from Admin Dashboard`);

        activeMCPServers.forEach(server => {
          // Convert Admin MCP format to LibreChat MCP format
          const serverConfig = {
            type: server.connectionType || 'stdio',
            startup: true,
            chatMenu: true
          };

          // Handle different connection types
          if (server.connectionType === 'stdio') {
            serverConfig.command = server.command;
            serverConfig.args = server.args;
            if (server.env && server.env instanceof Map) {
              serverConfig.env = Object.fromEntries(server.env);
            }
          } else if (server.connectionType === 'sse' || server.connectionType === 'websocket') {
            serverConfig.url = server.url;
            if (server.headers && server.headers instanceof Map) {
              serverConfig.headers = Object.fromEntries(server.headers);
            }
          }

          // Use underscore format for server name (e.g., memory_enterprise)
          const serverName = server.name.toLowerCase().replace(/[\s-]+/g, '_');
          mcpConfig[serverName] = serverConfig;

          logger.debug(`[AppService] Added MCP server: ${serverName} (${server.connectionType})`);
        });
      }
    } catch (error) {
      logger.warn('[AppService] Could not load MCP servers from Admin Dashboard:', error.message);
    }
  }

  // Ensure mcpConfig is not null
  mcpConfig = Object.keys(mcpConfig).length > 0 ? mcpConfig : null;
  const registration = config.registration ?? configDefaults.registration;
  const interfaceConfig = await loadDefaultInterface({ config, configDefaults });
  const turnstileConfig = loadTurnstileConfig(config, configDefaults);
  const speech = config.speech;

  const defaultConfig = {
    ocr,
    paths,
    config,
    memory,
    speech,
    balance,
    mcpConfig,
    webSearch,
    fileStrategy,
    registration,
    filteredTools,
    includedTools,
    availableTools,
    imageOutputType,
    interfaceConfig,
    turnstileConfig,
    fileStrategies: config.fileStrategies,
  };

  const agentsDefaults = agentsConfigSetup(config);

  if (!Object.keys(config).length) {
    const appConfig = {
      ...defaultConfig,
      endpoints: {
        [EModelEndpoint.agents]: agentsDefaults,
      },
    };
    return appConfig;
  }

  checkConfig(config);
  handleRateLimits(config?.rateLimits);
  const loadedEndpoints = loadEndpoints(config, agentsDefaults);

  const appConfig = {
    ...defaultConfig,
    fileConfig: config?.fileConfig,
    secureImageLinks: config?.secureImageLinks,
    modelSpecs: processModelSpecs(config?.endpoints, config.modelSpecs, interfaceConfig),
    endpoints: loadedEndpoints,
  };

  return appConfig;
};

module.exports = AppService;
