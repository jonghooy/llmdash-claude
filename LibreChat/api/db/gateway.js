require('dotenv').config();
const { logger } = require('@librechat/data-schemas');
const { DbGatewayFactory } = require('@librechat/db-gateway');
const { isEnabled } = require('@librechat/api');

let dbGateway = null;
let isInitialized = false;

/**
 * Initialize the database gateway
 */
async function initDbGateway() {
  if (isInitialized) {
    return dbGateway;
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable');
  }

  /** Database connection options from environment */
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

  const config = {
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

  try {
    logger.info('Initializing Database Gateway...');
    logger.info('Database connection options:');
    logger.info(JSON.stringify(config.options, null, 2));

    // Create and connect the database gateway
    dbGateway = DbGatewayFactory.create('mongodb');
    await dbGateway.connect(config);

    isInitialized = true;
    logger.info('Database Gateway initialized successfully');

    // Perform health check
    const isHealthy = await dbGateway.healthCheck();
    logger.info(`Database health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

    return dbGateway;
  } catch (error) {
    logger.error('Failed to initialize Database Gateway:', error);
    throw error;
  }
}

/**
 * Get the database gateway instance
 */
function getDbGateway() {
  if (!dbGateway) {
    throw new Error('Database Gateway not initialized. Call initDbGateway() first.');
  }
  return dbGateway;
}

/**
 * Close the database connection
 */
async function closeDbGateway() {
  if (dbGateway && dbGateway.isConnected()) {
    await dbGateway.disconnect();
    dbGateway = null;
    isInitialized = false;
    logger.info('Database Gateway disconnected');
  }
}

/**
 * Get a repository from the gateway
 * @param {string} entityName - Name of the entity (e.g., 'User', 'Message', 'Conversation')
 */
function getRepository(entityName) {
  const gateway = getDbGateway();
  return gateway.getRepository(entityName);
}

/**
 * Execute a transaction
 * @param {Function} callback - Async function to execute within the transaction
 */
async function executeTransaction(callback) {
  const gateway = getDbGateway();
  return await gateway.transaction(callback);
}

module.exports = {
  initDbGateway,
  getDbGateway,
  closeDbGateway,
  getRepository,
  executeTransaction,
};

// For backward compatibility, also export a connectDb function
// This maintains compatibility with existing code
module.exports.connectDb = initDbGateway;