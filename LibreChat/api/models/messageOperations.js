/**
 * Message Operations Abstraction Layer
 * This module provides a unified interface for message operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getMessageModel() {
  return require('./Message.original');
}

function getLazyGateway() {
  return require('~/db/lazyGateway');
}

/**
 * Check if dbGateway is enabled
 * Note: Message model uses UUID as primary key, which conflicts with MongoDB's ObjectId
 * So we disable dbGateway for Message operations temporarily
 */
function isDbGatewayEnabled() {
  // TODO: Fix Message model to work with dbGateway
  return false;
  // Original: return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get a single message
 */
async function getMessage(params) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    if (params.messageId) {
      // Use findByMessageId instead of findById since Message uses messageId as primary key
      return await messageRepo.findByMessageId(params.messageId);
    }
    return await messageRepo.findOne(params);
  }

  const Message = getMessageModel();
  if (Message.getMessage) {
    return Message.getMessage(params);
  }
  // Fallback
  const { Message: MessageModel } = require('~/db/models');
  return MessageModel.findOne(params).lean();
}

/**
 * Get messages for a conversation
 */
async function getMessages(filter, select) {
  if (isDbGatewayEnabled()) {
    const { getRepository, isGatewayInitialized } = getLazyGateway();
    console.log('[messageOperations] getMessages - Gateway initialized?:', isGatewayInitialized());
    console.log('[messageOperations] getMessages - filter:', filter, 'select:', select);

    const messageRepo = await getRepository('Message');
    console.log('[messageOperations] Got message repo:', !!messageRepo);

    const options = select ? { select } : {};
    const result = await messageRepo.find(filter, options);
    console.log('[messageOperations] Message query result count:', result ? result.length : 0);
    return result;
  }

  const Message = getMessageModel();
  if (Message.getMessages) {
    return Message.getMessages(filter, select);
  }
  // Fallback
  const { Message: MessageModel } = require('~/db/models');
  const query = MessageModel.find(filter);
  if (select) {
    query.select(select);
  }
  return query.lean();
}

/**
 * Save a message
 */
async function saveMessage(req, params, metadata) {
  // Validate params
  if (!params) {
    logger.error('[messageOperations] saveMessage called with undefined params');
    logger.error('[messageOperations] req:', !!req, 'params:', params, 'metadata:', metadata);
    throw new Error('saveMessage params are required');
  }

  // Log for debugging
  if (!params.conversationId) {
    logger.warn('[messageOperations] saveMessage - no conversationId in params:', JSON.stringify(params, null, 2));
  }

  // For now, always use the original Mongoose implementation
  // dbGateway migration needs more work for Message model
  const Message = getMessageModel();
  if (Message.saveMessage) {
    return Message.saveMessage(req, params, metadata);
  }
  const { Message: MessageModel } = require('~/db/models');
  return MessageModel.create(params);
}

/**
 * Record a message
 */
async function recordMessage(messageData) {
  // Complex operation - use original for now
  const Message = getMessageModel();
  if (Message.recordMessage) {
    return Message.recordMessage(messageData);
  }
  return saveMessage(messageData);
}

/**
 * Update a message
 */
async function updateMessage(req, message, metadata) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    return await messageRepo.update(message.messageId, message);
  }

  const Message = getMessageModel();
  if (Message.updateMessage) {
    return Message.updateMessage(req, message, metadata);
  }
  const { Message: MessageModel } = require('~/db/models');
  return MessageModel.findByIdAndUpdate(message.messageId, message, { new: true }).lean();
}

/**
 * Delete messages since a certain time or all
 */
async function deleteMessagesSince(req, params) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    // Need to handle the logic for deleting messages since a specific message
    const { messageId, conversationId } = params;
    const message = await messageRepo.findOne({ messageId, user: req.user.id });
    if (message) {
      return await messageRepo.deleteMany({
        conversationId,
        user: req.user.id,
        createdAt: { $gt: message.createdAt }
      });
    }
    return undefined;
  }

  const Message = getMessageModel();
  if (Message.deleteMessagesSince) {
    return Message.deleteMessagesSince(req, params);
  }
  const { Message: MessageModel } = require('~/db/models');
  const { messageId, conversationId } = params;
  const message = await MessageModel.findOne({ messageId, user: req.user.id }).lean();
  if (message) {
    return await MessageModel.deleteMany({
      conversationId,
      user: req.user.id,
      createdAt: { $gt: message.createdAt }
    });
  }
  return undefined;
}

/**
 * Delete messages
 */
async function deleteMessages(filter) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    return await messageRepo.deleteMany(filter);
  }

  const Message = getMessageModel();
  if (Message.deleteMessages) {
    return Message.deleteMessages(filter);
  }
  const { Message: MessageModel } = require('~/db/models');
  return MessageModel.deleteMany(filter);
}

/**
 * Updates the text of a message.
 */
async function updateMessageText(req, { messageId, text }) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    return await messageRepo.update({ messageId, user: req.user.id }, { text });
  }

  const Message = getMessageModel();
  if (Message.updateMessageText) {
    return Message.updateMessageText(req, { messageId, text });
  }
  const { Message: MessageModel } = require('~/db/models');
  return MessageModel.updateOne({ messageId, user: req.user.id }, { text });
}

/**
 * Saves multiple messages in the database in bulk.
 */
async function bulkSaveMessages(messages, overrideTimestamp = false) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const messageRepo = await getRepository('Message');
    // Implement bulk save for dbGateway
    const results = [];
    for (const message of messages) {
      const existing = await messageRepo.findOne({ messageId: message.messageId });
      if (existing) {
        results.push(await messageRepo.update({ messageId: message.messageId }, message));
      } else {
        results.push(await messageRepo.create(message));
      }
    }
    return { acknowledged: true, modifiedCount: results.length };
  }

  const Message = getMessageModel();
  if (Message.bulkSaveMessages) {
    return Message.bulkSaveMessages(messages, overrideTimestamp);
  }

  const { Message: MessageModel } = require('~/db/models');
  const bulkOps = messages.map((message) => ({
    updateOne: {
      filter: { messageId: message.messageId },
      update: message,
      timestamps: !overrideTimestamp,
      upsert: true,
    },
  }));
  return MessageModel.bulkWrite(bulkOps);
}

// Export all functions
module.exports = {
  getMessage,
  getMessages,
  saveMessage,
  bulkSaveMessages,
  recordMessage,
  updateMessageText,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
};