const { MongoDbAdapter } = require('@librechat/db-gateway');

let gateway = null;
let initPromise = null;

/**
 * Initialize the database gateway
 */
async function initialize(config = {}) {
  if (gateway && gateway.isConnected()) {
    return gateway;
  }

  // Prevent multiple initialization attempts
  if (initPromise) {
    return await initPromise;
  }

  initPromise = _initialize(config);
  return await initPromise;
}

async function _initialize(config) {
  try {
    gateway = new MongoDbAdapter();

    const dbConfig = {
      uri: config.uri || process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat',
      options: config.options || {},
    };

    await gateway.connect(dbConfig);
    console.log('[dbGateway] Successfully connected to database');

    initPromise = null;
    return gateway;
  } catch (error) {
    console.error('[dbGateway] Failed to initialize:', error);
    initPromise = null;
    throw error;
  }
}

/**
 * Get repository for an entity
 */
async function getRepository(entityName) {
  if (!gateway || !gateway.isConnected()) {
    await initialize();
  }
  return gateway.getRepository(entityName);
}

/**
 * Execute a transaction
 */
async function transaction(callback) {
  if (!gateway || !gateway.isConnected()) {
    await initialize();
  }
  return await gateway.transaction(callback);
}

/**
 * Check if gateway is connected
 */
function isConnected() {
  return gateway && gateway.isConnected();
}

/**
 * Get gateway instance
 */
function getGateway() {
  return gateway;
}

/**
 * Disconnect from database
 */
async function disconnect() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    initPromise = null;
  }
}

/**
 * Health check
 */
async function healthCheck() {
  if (!gateway || !gateway.isConnected()) {
    return false;
  }
  return await gateway.healthCheck();
}

module.exports = {
  initialize,
  getRepository,
  transaction,
  isConnected,
  getGateway,
  disconnect,
  healthCheck,
};