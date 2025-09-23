/**
 * Conversation Operations Abstraction Layer
 * This module provides a unified interface for conversation operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getConversationModel() {
  return require('./Conversation.mongoose');
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
  const enabled = process.env.USE_DB_GATEWAY === 'true';
  console.log('[conversationOperations] USE_DB_GATEWAY:', process.env.USE_DB_GATEWAY, '=> enabled:', enabled);
  return enabled;
}

/**
 * Search for a conversation
 * Note: This function signature matches the original implementation used by middleware
 * When called with one parameter, it searches by conversationId only
 * When called with three parameters, it searches by userId, conversationId, and title
 */
async function searchConversation(...args) {
  // Handle both function signatures for backwards compatibility
  if (args.length === 1) {
    // Called as searchConversation(conversationId) - used by middleware
    const conversationId = args[0];

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      // Find by conversationId only, return with user field
      return await convoRepo.findOne({ conversationId }, { select: 'conversationId user' });
    }

    const Conversation = getConversationModel();
    return Conversation.searchConversation(conversationId);
  } else {
    // Called as searchConversation(userId, conversationId, title)
    const [userId, conversationId, title] = args;

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');
      return await convoRepo.searchConversation(userId, conversationId, title);
    }

    const Conversation = getConversationModel();
    return Conversation.searchConversation(userId, conversationId, title);
  }
}

/**
 * Get a conversation by ID
 */
async function getConvo(userId, conversationId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.getConvo(userId, conversationId);
  }

  const Conversation = getConversationModel();
  return Conversation.getConvo(userId, conversationId);
}

/**
 * Get conversation title
 */
async function getConvoTitle(userId, conversationId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.getConvoTitle(userId, conversationId);
  }

  const Conversation = getConversationModel();
  return Conversation.getConvoTitle(userId, conversationId);
}

/**
 * Save a conversation
 */
async function saveConvo(req, convoData, metadata) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const convoRepo = await getRepository('Conversation');

      const { conversationId, newConversationId, ...update } = convoData;

      // Handle message IDs
      const MessageOps = getMessageModel();
      const messages = await MessageOps.getMessages({ conversationId }, 'messageId');

      update.messages = messages;
      update.user = req.user.id;

      if (newConversationId) {
        update.conversationId = newConversationId;
      } else {
        update.conversationId = conversationId;
      }

      // Handle temporary chat expiration
      if (req?.body?.isTemporary) {
        try {
          const { createTempChatExpirationDate } = require('@librechat/api');
          const appConfig = req.config;
          update.expiredAt = createTempChatExpirationDate(appConfig?.interfaceConfig);
        } catch (err) {
          logger.error('Error creating temporary chat expiration date:', err);
          update.expiredAt = null;
        }
      } else {
        update.expiredAt = null;
      }

      // Use upsert to create or update
      const result = await convoRepo.model.findOneAndUpdate(
        { conversationId: update.conversationId, user: req.user.id },
        { $set: update },
        { new: true, upsert: true, lean: true }
      );

      return result;
    }

    // Fallback to original implementation
    const Conversation = getConversationModel();
    return Conversation.saveConvo(req, convoData, metadata);
  } catch (error) {
    logger.error('[saveConvo] Error saving conversation:', error);
    if (metadata?.context) {
      logger.info(`[saveConvo] ${metadata.context}`);
    }
    // Return the conversation data even if save fails
    return { ...convoData, user: req.user.id, message: 'Error saving conversation' };
  }
}

/**
 * Delete conversations
 */
async function deleteConvos(userId, filter, deleteFiles) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.deleteConvos(userId, filter, deleteFiles);
  }

  const Conversation = getConversationModel();
  return Conversation.deleteConvos(userId, filter, deleteFiles);
}

/**
 * Delete null or empty conversations
 */
async function deleteNullOrEmptyConversations() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.deleteNullOrEmptyConversations();
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
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.getConvoFiles(userId, conversationId);
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
async function getConvosByCursor(
  user,
  { cursor, limit = 25, isArchived = false, tags, search, order = 'desc' } = {},
) {
  if (isDbGatewayEnabled()) {
    const { getRepository, isGatewayInitialized } = getLazyGateway();
    console.log('[conversationOperations] getConvosByCursor - Gateway initialized?:', isGatewayInitialized());
    const convoRepo = await getRepository('Conversation');
    console.log('[conversationOperations] Got conversation repo:', !!convoRepo, 'has getConvosByCursor?:', !!convoRepo?.getConvosByCursor);
    return await convoRepo.getConvosByCursor(user, { cursor, limit, isArchived, tags, search, order });
  }

  const Conversation = getConversationModel();
  return Conversation.getConvosByCursor(user, { cursor, limit, isArchived, tags, search, order });
}

/**
 * Get conversations with query
 */
async function getConvosQueried(userId, query, pageNumber, pageSize) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.getConvosQueried(userId, query, pageNumber, pageSize);
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
    const { getRepository } = getLazyGateway();
    const convoRepo = await getRepository('Conversation');
    return await convoRepo.bulkSaveConvos(conversations);
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