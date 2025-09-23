/**
 * Assistant Model Wrapper
 * Exports assistant operations from the abstraction layer
 */

const assistantOps = require('./assistantOperations');

// Export all operations from the abstraction layer
module.exports = {
  updateAssistantDoc: assistantOps.updateAssistantDoc,
  deleteAssistant: assistantOps.deleteAssistant,
  getAssistants: assistantOps.getAssistants,
  getAssistant: assistantOps.getAssistant,
};