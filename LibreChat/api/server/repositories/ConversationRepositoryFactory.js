/**
 * ConversationRepositoryFactory - Factory for creating ConversationRepository instances
 * Selects the appropriate implementation based on configuration
 */

const ConversationRepository = require('./ConversationRepository');
const MongooseConversationRepository = require('./MongooseConversationRepository');
const DbGatewayConversationRepository = require('./DbGatewayConversationRepository');

let repositoryInstance = null;

/**
 * Create or get the singleton ConversationRepository instance
 * @returns {ConversationRepository} Repository instance
 */
function getConversationRepository() {
  // Use singleton pattern to avoid recreating the repository
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const useDbGateway = process.env.USE_DB_GATEWAY === 'true';

  let dataAccessLayer;

  if (useDbGateway) {
    const { logger } = require('@librechat/data-schemas');
    logger.info('[ConversationRepositoryFactory] Using DbGateway implementation for conversations');
    dataAccessLayer = new DbGatewayConversationRepository();
  } else {
    const { logger } = require('@librechat/data-schemas');
    logger.info('[ConversationRepositoryFactory] Using Mongoose implementation for conversations');
    dataAccessLayer = new MongooseConversationRepository();
  }

  repositoryInstance = new ConversationRepository(dataAccessLayer);
  return repositoryInstance;
}

/**
 * Clear the cached repository instance (useful for testing)
 */
function clearRepositoryCache() {
  repositoryInstance = null;
}

module.exports = {
  getConversationRepository,
  clearRepositoryCache
};