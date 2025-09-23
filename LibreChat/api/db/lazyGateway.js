/**
 * Lazy Database Gateway
 *
 * This module provides lazy initialization for the database gateway,
 * ensuring it's only initialized when actually used, not at module load time.
 */

require('dotenv').config();
const { logger } = require('@librechat/data-schemas');
const { DbGatewayFactory } = require('@librechat/db-gateway');
const { isEnabled } = require('@librechat/api');

let dbGateway = null;
let initPromise = null;
let isInitialized = false;

/**
 * Get database configuration from environment
 */
function getDbConfig() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable');
  }

  const maxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE) || undefined;
  const minPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE) || undefined;
  const maxConnecting = parseInt(process.env.MONGO_MAX_CONNECTING) || undefined;
  const maxIdleTimeMS = parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || undefined;
  const waitQueueTimeoutMS = parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS) || undefined;
  const autoIndex =
    process.env.MONGO_AUTO_INDEX != undefined
      ? isEnabled(process.env.MONGO_AUTO_INDEX) || false
      : undefined;
  const autoCreate =
    process.env.MONGO_AUTO_CREATE != undefined
      ? isEnabled(process.env.MONGO_AUTO_CREATE) || false
      : undefined;

  return {
    uri: MONGO_URI,
    options: {
      bufferCommands: false,
      ...(maxPoolSize ? { maxPoolSize } : {}),
      ...(minPoolSize ? { minPoolSize } : {}),
      ...(maxConnecting ? { maxConnecting } : {}),
      ...(maxIdleTimeMS ? { maxIdleTimeMS } : {}),
      ...(waitQueueTimeoutMS ? { waitQueueTimeoutMS } : {}),
      ...(autoIndex != undefined ? { autoIndex } : {}),
      ...(autoCreate != undefined ? { autoCreate } : {}),
    },
  };
}

/**
 * Initialize the database gateway (if not already initialized)
 * This is called automatically when the gateway is first accessed
 */
async function ensureInitialized() {
  if (isInitialized && dbGateway) {
    return dbGateway;
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      const config = getDbConfig();

      logger.debug('[lazyGateway] Initializing Database Gateway...');

      // Create and connect the database gateway
      dbGateway = DbGatewayFactory.create('mongodb');
      await dbGateway.connect(config);

      isInitialized = true;
      logger.debug('[lazyGateway] Database Gateway initialized successfully');

      // Perform health check
      const isHealthy = await dbGateway.healthCheck();
      logger.debug(`[lazyGateway] Database health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

      return dbGateway;
    } catch (error) {
      logger.error('[lazyGateway] Failed to initialize Database Gateway:', error);
      initPromise = null; // Reset to allow retry
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get a repository from the gateway (with lazy initialization)
 * @param {string} entityName - Name of the entity (e.g., 'User', 'Message', 'Conversation')
 */
async function getRepository(entityName) {
  await ensureInitialized();
  return dbGateway.getRepository(entityName);
}

/**
 * Get a repository synchronously (throws if not initialized)
 * This is for backward compatibility with code that expects synchronous access
 * @param {string} entityName - Name of the entity
 */
function getRepositorySync(entityName) {
  if (!isInitialized || !dbGateway) {
    throw new Error('Database Gateway not initialized. The gateway is now lazily initialized - use await getRepository() or ensure the database is connected first.');
  }
  return dbGateway.getRepository(entityName);
}

/**
 * Execute a transaction
 * @param {Function} callback - Async function to execute within the transaction
 */
async function executeTransaction(callback) {
  await ensureInitialized();
  return await dbGateway.transaction(callback);
}

/**
 * Close the database connection
 */
async function closeDbGateway() {
  if (dbGateway && dbGateway.isConnected()) {
    await dbGateway.disconnect();
    dbGateway = null;
    isInitialized = false;
    initPromise = null;
    logger.debug('[lazyGateway] Database Gateway disconnected');
  }
}

/**
 * Check if the gateway is initialized
 */
function isGatewayInitialized() {
  return isInitialized && dbGateway !== null;
}

/**
 * Force initialization (for use in startup sequence)
 */
async function initDbGateway() {
  return ensureInitialized();
}

module.exports = {
  initDbGateway,
  getRepository,
  getRepositorySync,
  executeTransaction,
  closeDbGateway,
  isGatewayInitialized,
  ensureInitialized,
};