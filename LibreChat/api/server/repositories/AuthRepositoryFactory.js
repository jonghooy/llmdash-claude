/**
 * AuthRepositoryFactory - Factory for creating AuthRepository instances
 * Selects the appropriate implementation based on configuration
 */

const AuthRepository = require('./AuthRepository');
const MongooseAuthRepository = require('./MongooseAuthRepository');
const DbGatewayAuthRepository = require('./DbGatewayAuthRepository');

let repositoryInstance = null;

/**
 * Create or get the singleton AuthRepository instance
 * @returns {AuthRepository} Repository instance
 */
function getAuthRepository() {
  // Use singleton pattern to avoid recreating the repository
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const useDbGateway = process.env.USE_DB_GATEWAY === 'true';

  let dataAccessLayer;

  if (useDbGateway) {
    const { logger } = require('@librechat/data-schemas');
    logger.info('[AuthRepositoryFactory] Using DbGateway implementation for authentication');
    dataAccessLayer = new DbGatewayAuthRepository();
  } else {
    const { logger } = require('@librechat/data-schemas');
    logger.info('[AuthRepositoryFactory] Using Mongoose implementation for authentication');
    dataAccessLayer = new MongooseAuthRepository();
  }

  repositoryInstance = new AuthRepository(dataAccessLayer);
  return repositoryInstance;
}

/**
 * Clear the cached repository instance (useful for testing)
 */
function clearRepositoryCache() {
  repositoryInstance = null;
}

module.exports = {
  getAuthRepository,
  clearRepositoryCache
};