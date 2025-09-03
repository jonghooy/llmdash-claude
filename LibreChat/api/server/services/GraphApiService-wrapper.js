// Wrapper for GraphApiService with ESM openid-client support
const { isEnabled } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const { Client } = require('@microsoft/microsoft-graph-client');
const getCustomConfig = require('./Config/getCustomConfig');
const { getOpenIdConfig } = require('./Files/Permissions/config');

let openidClient = null;

// Initialize the ESM module
async function initializeOpenIDClient() {
  if (!openidClient) {
    const module = await import('openid-client');
    openidClient = module;
  }
  return openidClient;
}

// Export wrapped functions that handle async loading
module.exports = {
  initializeOpenIDClient,
  // Add other GraphApiService exports here as needed
};