/**
 * MongooseConversationRepository - Mongoose implementation of ConversationRepository
 * This wraps the existing Mongoose models for backward compatibility
 */

class MongooseConversationRepository {
  constructor() {
    // Import the conversation model functions
    const conversationModel = require('~/models/Conversation');

    // Bind all model functions to this instance
    this.searchConversation = conversationModel.searchConversation;
    this.getConvo = conversationModel.getConvo;
    this.saveConvo = conversationModel.saveConvo;
    this.bulkSaveConvos = conversationModel.bulkSaveConvos;
    this.getConvosByCursor = conversationModel.getConvosByCursor;
    this.getConvosQueried = conversationModel.getConvosQueried;
    this.getConvoTitle = conversationModel.getConvoTitle;
    this.deleteConvos = conversationModel.deleteConvos;
    this.deleteNullOrEmptyConversations = conversationModel.deleteNullOrEmptyConversations;
    this.getConvoFiles = conversationModel.getConvoFiles;

    // Also bind any additional functions that might exist
    this.getRecentConvos = conversationModel.getRecentConvos || this._defaultGetRecentConvos;
  }

  /**
   * Default implementation for getRecentConvos if not available in model
   */
  async _defaultGetRecentConvos(user, options = {}) {
    const { Conversation } = require('~/db/models');
    const limit = options.limit || 10;

    return await Conversation.find({ user })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = MongooseConversationRepository;