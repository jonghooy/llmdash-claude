/**
 * ConversationRepository - Abstract repository interface for conversation data access
 * This provides a clean abstraction over different data access implementations
 */

class ConversationRepository {
  constructor(dataAccessLayer) {
    this.dal = dataAccessLayer;
  }

  /**
   * Search for a conversation by conversationId
   * @param {string} conversationId - The conversation's ID
   * @returns {Promise<{conversationId: string, user: string} | null>} The conversation with selected fields
   */
  async searchConversation(conversationId) {
    return await this.dal.searchConversation(conversationId);
  }

  /**
   * Get a single conversation for a user
   * @param {string} user - The user's ID
   * @param {string} conversationId - The conversation's ID
   * @returns {Promise<Object>} The conversation object
   */
  async getConvo(user, conversationId) {
    return await this.dal.getConvo(user, conversationId);
  }

  /**
   * Save a conversation
   * @param {Object} req - The request object
   * @param {Object} conversationData - The conversation data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} The saved conversation
   */
  async saveConvo(req, conversationData, metadata) {
    return await this.dal.saveConvo(req, conversationData, metadata);
  }

  /**
   * Bulk save multiple conversations
   * @param {Array} conversations - Array of conversations to save
   * @returns {Promise<Object>} Bulk write result
   */
  async bulkSaveConvos(conversations) {
    return await this.dal.bulkSaveConvos(conversations);
  }

  /**
   * Get conversations by cursor (pagination)
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of conversations
   */
  async getConvosByCursor(params) {
    return await this.dal.getConvosByCursor(params);
  }

  /**
   * Get conversations by IDs with pagination
   * @param {string} user - User ID
   * @param {Array} convoIds - Array of conversation IDs
   * @param {string} cursor - Pagination cursor
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Array of conversations
   */
  async getConvosQueried(user, convoIds, cursor = null, limit = 25) {
    return await this.dal.getConvosQueried(user, convoIds, cursor, limit);
  }

  /**
   * Get conversation title
   * @param {string} user - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<string>} The conversation title
   */
  async getConvoTitle(user, conversationId) {
    return await this.dal.getConvoTitle(user, conversationId);
  }

  /**
   * Delete conversations
   * @param {string} user - User ID
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Deletion result
   */
  async deleteConvos(user, filter) {
    return await this.dal.deleteConvos(user, filter);
  }

  /**
   * Delete null or empty conversations
   * @returns {Promise<Object>} Deletion result with conversations and messages deleted
   */
  async deleteNullOrEmptyConversations() {
    return await this.dal.deleteNullOrEmptyConversations();
  }

  /**
   * Get files associated with a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array>} Array of file objects
   */
  async getConvoFiles(conversationId) {
    return await this.dal.getConvoFiles(conversationId);
  }

  /**
   * Get recent conversations for a user
   * @param {string} user - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of recent conversations
   */
  async getRecentConvos(user, options = {}) {
    return await this.dal.getRecentConvos(user, options);
  }
}

module.exports = ConversationRepository;