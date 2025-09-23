/**
 * File Model Wrapper
 * Exports file operations from the abstraction layer
 */

const fileOps = require('./fileOperations');

// Export all operations from the abstraction layer
module.exports = {
  findFileById: fileOps.findFileById,
  getFiles: fileOps.getFiles,
  getToolFilesByIds: fileOps.getToolFilesByIds,
  createFile: fileOps.createFile,
  updateFile: fileOps.updateFile,
  updateFileUsage: fileOps.updateFileUsage,
  deleteFile: fileOps.deleteFile,
  deleteFiles: fileOps.deleteFiles,
  deleteFileByFilter: fileOps.deleteFileByFilter,
  batchUpdateFiles: fileOps.batchUpdateFiles,
};