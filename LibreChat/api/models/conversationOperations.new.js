/**
 * Conversation Operations Abstraction Layer
 * This module provides a unified interface for conversation operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getConversationModel() {
  return require('./Conversation');
}

function getLazyGateway() {
  return require('~/db/lazyGateway');
}

function getMessageModel() {
  return require('./Message');
}

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Search for a conversation
 */
async function searchConversation(userId, conversationId, title) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.searchConversation(userId, conversationId, title);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for searchConversation:', error.message);
    }
  }

  const Conversation = getConversationModel();
  return Conversation.searchConversation(userId, conversationId, title);
}

/**
 * Get a conversation by ID
 */
async function getConvo(userId, conversationId) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.getConvo(userId, conversationId);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for getConvo:', error.message);
    }
  }

  const Conversation = getConversationModel();
  return Conversation.getConvo(userId, conversationId);
}

/**
 * Get conversation title
 */
async function getConvoTitle(userId, conversationId) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.getConvoTitle(userId, conversationId);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for getConvoTitle:', error.message);
    }
  }

  const Conversation = getConversationModel();
  return Conversation.getConvoTitle(userId, conversationId);
}

/**
 * Save a conversation
 */
async function saveConvo(req, convoData, metadata) {
  // This is complex and needs special handling
  // For now, use the original implementation
  const Conversation = getConversationModel();
  return Conversation.saveConvo(req, convoData, metadata);
}

/**
 * Delete conversations
 */
async function deleteConvos(userId, filter, deleteFiles) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.deleteConvos(userId, filter, deleteFiles);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for deleteConvos:', error.message);
    }
  }

  const Conversation = getConversationModel();
  return Conversation.deleteConvos(userId, filter, deleteFiles);
}

/**
 * Delete null or empty conversations
 */
async function deleteNullOrEmptyConversations() {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.deleteNullOrEmptyConversations();
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for deleteNullOrEmptyConversations:', error.message);
    }
  }

  const Conversation = getConversationModel();
  if (Conversation.deleteNullOrEmptyConversations) {
    return Conversation.deleteNullOrEmptyConversations();
  }
  return { deletedCount: 0 };
}

/**
 * Get conversation files
 */
async function getConvoFiles(userId, conversationId) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.getConvoFiles(userId, conversationId);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for getConvoFiles:', error.message);
    }
  }

  const Conversation = getConversationModel();
  if (Conversation.getConvoFiles) {
    return Conversation.getConvoFiles(userId, conversationId);
  }
  return [];
}

/**
 * Get conversations by cursor (pagination)
 */
async function getConvosByCursor(userId, pageNumber, pageSize, filter) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.getConvosByCursor(userId, pageNumber, pageSize, filter);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for getConvosByCursor:', error.message);
    }
  }

  const Conversation = getConversationModel();
  if (Conversation.getConvosByCursor) {
    return Conversation.getConvosByCursor(userId, pageNumber, pageSize, filter);
  }

  // Fallback to basic pagination
  const convos = await Conversation.find({ user: userId, ...filter })
    .sort({ updatedAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    conversations: convos,
    pageNumber,
    pageSize,
    pages: 1
  };
}

/**
 * Get conversations with query
 */
async function getConvosQueried(userId, query, pageNumber, pageSize) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.getConvosQueried(userId, query, pageNumber, pageSize);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for getConvosQueried:', error.message);
    }
  }

  const Conversation = getConversationModel();
  if (Conversation.getConvosQueried) {
    return Conversation.getConvosQueried(userId, query, pageNumber, pageSize);
  }

  return getConvosByCursor(userId, pageNumber, pageSize, { title: new RegExp(query, 'i') });
}

/**
 * Bulk save conversations
 */
async function bulkSaveConvos(conversations) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.bulkSaveConvos(conversations);
    } catch (error) {
      logger.debug('[conversationOperations] Error using dbGateway for bulkSaveConvos:', error.message);
    }
  }

  const Conversation = getConversationModel();
  if (Conversation.bulkSaveConvos) {
    return Conversation.bulkSaveConvos(conversations);
  }

  // Fallback to individual saves
  const results = [];
  for (const convo of conversations) {
    const saved = await saveConvo(null, convo, {});
    results.push(saved);
  }
  return results;
}

// Export all functions
module.exports = {
  searchConversation,
  getConvo,
  getConvoTitle,
  saveConvo,
  deleteConvos,
  deleteNullOrEmptyConversations,
  getConvoFiles,
  getConvosByCursor,
  getConvosQueried,
  bulkSaveConvos,
};