/**
 * Conversation Model Wrapper
 * Exports conversation operations from the abstraction layer
 */

const conversationOps = require('./conversationOperations');

// Export all operations from the abstraction layer
module.exports = {
  searchConversation: conversationOps.searchConversation,
  getConvo: conversationOps.getConvo,
  getConvoTitle: conversationOps.getConvoTitle,
  saveConvo: conversationOps.saveConvo,
  deleteConvos: conversationOps.deleteConvos,
  deleteNullOrEmptyConversations: conversationOps.deleteNullOrEmptyConversations,
  getConvoFiles: conversationOps.getConvoFiles,
  getConvosByCursor: conversationOps.getConvosByCursor,
  getConvosQueried: conversationOps.getConvosQueried,
  bulkSaveConvos: conversationOps.bulkSaveConvos,
};