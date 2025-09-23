/**
 * DbGatewayConversationRepository - DbGateway implementation of ConversationRepository
 * This uses the dbGateway abstraction layer for database operations
 */

const { logger } = require('@librechat/data-schemas');
const { createTempChatExpirationDate } = require('@librechat/api');

class DbGatewayConversationRepository {
  constructor() {
    // We'll get repositories lazily as needed
    this.getRepo = (name) => {
      const { getRepository } = require('~/db');
      return getRepository(name);
    };

    // Import message model for some operations that need it
    this.getMessages = require('~/models/Message').getMessages;
    this.deleteMessages = require('~/models/Message').deleteMessages;
  }

  async searchConversation(conversationId) {
    try {
      const convoRepo = this.getRepo('Conversation');
      return await convoRepo.findOne(
        { conversationId },
        { select: ['conversationId', 'user'] }
      );
    } catch (error) {
      logger.error('[searchConversation] Error searching conversation', error);
      throw new Error('Error searching conversation');
    }
  }

  async getConvo(user, conversationId) {
    try {
      const convoRepo = this.getRepo('Conversation');
      return await convoRepo.findOne({ user, conversationId });
    } catch (error) {
      logger.error('[getConvo] Error getting single conversation', error);
      return { message: 'Error getting single conversation' };
    }
  }

  async saveConvo(req, update, metadata) {
    const { conversationId, newConversationId, ...convo } = update;
    try {
      if (metadata?.context) {
        logger.debug(`[saveConvo] ${metadata.context}`);
      }

      // Messages and other fields are already included in the update object from conversationOperations.js
      const finalUpdate = { ...update, user: req.user.id };

      if (newConversationId) {
        finalUpdate.conversationId = newConversationId;
      }

      const convoRepo = this.getRepo('Conversation');

      // Use findOneAndUpdate equivalent
      const savedConvo = await convoRepo.findOneAndUpdate(
        { conversationId: finalUpdate.conversationId || conversationId, user: req.user.id },
        finalUpdate,
        { upsert: true, returnNew: true }
      );

      return savedConvo;
    } catch (error) {
      logger.error('[saveConvo] Error saving conversation', error);
      return { message: 'Error saving conversation' };
    }
  }

  async bulkSaveConvos(conversations) {
    try {
      const convoRepo = this.getRepo('Conversation');
      const bulkOps = conversations.map((convo) => ({
        updateOne: {
          filter: { conversationId: convo.conversationId, user: convo.user },
          update: convo,
          upsert: true
        }
      }));

      // DbGateway would need to support bulkWrite
      // For now, we'll process them sequentially
      const results = [];
      for (const op of bulkOps) {
        const result = await convoRepo.findOneAndUpdate(
          op.updateOne.filter,
          op.updateOne.update,
          { upsert: op.updateOne.upsert }
        );
        results.push(result);
      }

      return { results };
    } catch (error) {
      logger.error('[bulkSaveConvos] Error bulk saving conversations', error);
      throw error;
    }
  }

  async getConvosByCursor({
    user,
    cursor,
    limit = 25,
    isArchived = false,
    tags = [],
    includeSharedLinks = false
  }) {
    try {
      const convoRepo = this.getRepo('Conversation');

      const query = { user };

      if (isArchived !== null) {
        query.isArchived = isArchived;
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (includeSharedLinks) {
        query.$or = [
          { user },
          { 'share.isShared': true }
        ];
      }

      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      const conversations = await convoRepo.find(query, {
        sort: { createdAt: -1 },
        limit: limit + 1
      });

      const hasMore = conversations.length > limit;
      if (hasMore) {
        conversations.pop();
      }

      const nextCursor = hasMore && conversations.length > 0
        ? conversations[conversations.length - 1].createdAt.toISOString()
        : null;

      return {
        conversations,
        nextCursor,
        hasMore
      };
    } catch (error) {
      logger.error('[getConvosByCursor] Error getting conversations by cursor', error);
      throw error;
    }
  }

  async getConvosQueried(user, convoIds, cursor = null, limit = 25) {
    try {
      const convoRepo = this.getRepo('Conversation');

      const query = {
        user,
        conversationId: { $in: convoIds }
      };

      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      const conversations = await convoRepo.find(query, {
        sort: { createdAt: -1 },
        limit
      });

      return conversations;
    } catch (error) {
      logger.error('[getConvosQueried] Error getting queried conversations', error);
      throw error;
    }
  }

  async getConvoTitle(user, conversationId) {
    try {
      const convoRepo = this.getRepo('Conversation');
      const convo = await convoRepo.findOne(
        { user, conversationId },
        { select: ['title'] }
      );
      return convo?.title || 'New Chat';
    } catch (error) {
      logger.error('[getConvoTitle] Error getting conversation title', error);
      return 'New Chat';
    }
  }

  async deleteConvos(user, filter) {
    try {
      const convoRepo = this.getRepo('Conversation');

      // First get the conversation IDs that will be deleted
      const convosToDelete = await convoRepo.find({
        user,
        ...filter
      }, { select: ['conversationId'] });

      const conversationIds = convosToDelete.map(c => c.conversationId);

      if (conversationIds.length === 0) {
        return { deletedCount: 0 };
      }

      // Delete the conversations
      const deleteResult = await convoRepo.deleteMany({
        user,
        conversationId: { $in: conversationIds }
      });

      // Delete associated messages
      await this.deleteMessages({ conversationId: { $in: conversationIds } });

      return deleteResult;
    } catch (error) {
      logger.error('[deleteConvos] Error deleting conversations', error);
      throw error;
    }
  }

  async deleteNullOrEmptyConversations() {
    try {
      const convoRepo = this.getRepo('Conversation');

      const filter = {
        $or: [
          { conversationId: null },
          { conversationId: '' },
          { conversationId: { $exists: false } }
        ]
      };

      const result = await convoRepo.deleteMany(filter);

      // Delete associated messages
      const messageDeleteResult = await this.deleteMessages(filter);

      logger.info(
        '[deleteNullOrEmptyConversations] Deleted conversations and messages',
        { conversations: result, messages: messageDeleteResult }
      );

      return {
        conversations: result,
        messages: messageDeleteResult
      };
    } catch (error) {
      logger.error('[deleteNullOrEmptyConversations] Error deleting null/empty conversations', error);
      throw error;
    }
  }

  async getConvoFiles(conversationId) {
    try {
      const fileRepo = this.getRepo('File');

      return await fileRepo.find({
        conversationId,
        context: 'message'
      });
    } catch (error) {
      logger.error('[getConvoFiles] Error getting conversation files', error);
      return [];
    }
  }

  async getRecentConvos(user, options = {}) {
    try {
      const convoRepo = this.getRepo('Conversation');
      const limit = options.limit || 10;

      return await convoRepo.find(
        { user },
        {
          sort: { updatedAt: -1 },
          limit
        }
      );
    } catch (error) {
      logger.error('[getRecentConvos] Error getting recent conversations', error);
      return [];
    }
  }
}

module.exports = DbGatewayConversationRepository;