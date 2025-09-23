/**
 * Message Model Wrapper
 * Exports message operations from the abstraction layer
 */

const messageOps = require('./messageOperations');

// Export all operations from the abstraction layer
module.exports = {
  getMessage: messageOps.getMessage,
  getMessages: messageOps.getMessages,
  saveMessage: messageOps.saveMessage,
  bulkSaveMessages: messageOps.bulkSaveMessages,
  recordMessage: messageOps.recordMessage,
  updateMessageText: messageOps.updateMessageText,
  updateMessage: messageOps.updateMessage,
  deleteMessagesSince: messageOps.deleteMessagesSince,
  deleteMessages: messageOps.deleteMessages,
};