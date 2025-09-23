/**
 * ConversationTag Model Wrapper
 * Exports conversation tag operations from the abstraction layer
 */

const tagOps = require('./conversationTagOperations');

// Export all operations from the abstraction layer
module.exports = {
  getConversationTags: tagOps.getConversationTags,
  createConversationTag: tagOps.createConversationTag,
  updateConversationTag: tagOps.updateConversationTag,
  deleteConversationTag: tagOps.deleteConversationTag,
  updateTagsForConversation: tagOps.updateTagsForConversation,
};