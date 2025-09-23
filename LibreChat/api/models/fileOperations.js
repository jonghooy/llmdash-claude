/**
 * File Operations Abstraction Layer
 * This module provides a unified interface for file operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');
const { EToolResources, FileContext } = require('librechat-data-provider');

// Lazy require to avoid circular dependencies
function getFileModel() {
  return require('./File.original');
}

function getLazyGateway() {
  return require('~/db/lazyGateway');
}

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Finds a file by its file_id with additional query options.
 */
async function findFileById(file_id, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    return await fileRepo.findOne({ file_id, ...options });
  }

  const File = getFileModel();
  if (File.findFileById) {
    return File.findFileById(file_id, options);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  return FileModel.findOne({ file_id, ...options }).lean();
}

/**
 * Retrieves files matching a given filter, sorted by the most recently updated.
 */
async function getFiles(filter, _sortOptions, selectFields = { text: 0 }) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    const sortOptions = { updatedAt: -1, ..._sortOptions };
    const options = {
      select: selectFields,
      sort: sortOptions
    };
    return await fileRepo.find(filter, options);
  }

  const File = getFileModel();
  if (File.getFiles) {
    return File.getFiles(filter, _sortOptions, selectFields);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  const sortOptions = { updatedAt: -1, ..._sortOptions };
  return FileModel.find(filter).select(selectFields).sort(sortOptions).lean();
}

/**
 * Retrieves tool files (files that are embedded or have a fileIdentifier) from an array of file IDs
 */
async function getToolFilesByIds(fileIds, toolResourceSet) {
  if (!fileIds || !fileIds.length || !toolResourceSet?.size) {
    return [];
  }

  try {
    const filter = {
      file_id: { $in: fileIds },
      $or: [],
    };

    if (toolResourceSet.has(EToolResources.ocr)) {
      filter.$or.push({ text: { $exists: true, $ne: null }, context: FileContext.agents });
    }
    if (toolResourceSet.has(EToolResources.file_search)) {
      filter.$or.push({ embedded: true });
    }
    if (toolResourceSet.has(EToolResources.execute_code)) {
      filter.$or.push({ 'metadata.fileIdentifier': { $exists: true } });
    }

    const selectFields = { text: 0 };
    const sortOptions = { updatedAt: -1 };

    return await getFiles(filter, sortOptions, selectFields);
  } catch (error) {
    logger.error('[getToolFilesByIds] Error retrieving tool files:', error);
    throw new Error('Error retrieving tool files');
  }
}

/**
 * Creates a new file with a TTL of 1 hour.
 */
async function createFile(data, disableTTL) {
  const fileData = {
    ...data,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };

  if (disableTTL) {
    delete fileData.expiresAt;
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    // dbGateway upsert
    const existing = await fileRepo.findOne({ file_id: data.file_id });
    if (existing) {
      return await fileRepo.update({ file_id: data.file_id }, fileData);
    }
    return await fileRepo.create(fileData);
  }

  const File = getFileModel();
  if (File.createFile) {
    return File.createFile(data, disableTTL);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  return FileModel.findOneAndUpdate({ file_id: data.file_id }, fileData, {
    new: true,
    upsert: true,
  }).lean();
}

/**
 * Updates a file identified by file_id with new data and removes the TTL.
 */
async function updateFile(data) {
  const { file_id, ...update } = data;
  const updateOperation = {
    ...update,
    expiresAt: undefined, // Remove the expiresAt field to prevent TTL
  };

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    return await fileRepo.update({ file_id }, updateOperation);
  }

  const File = getFileModel();
  if (File.updateFile) {
    return File.updateFile(data);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  const mongoUpdate = {
    $set: update,
    $unset: { expiresAt: '' },
  };
  return FileModel.findOneAndUpdate({ file_id }, mongoUpdate, { new: true }).lean();
}

/**
 * Increments the usage of a file identified by file_id.
 */
async function updateFileUsage(data) {
  const { file_id, inc = 1 } = data;

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    // Get current file
    const file = await fileRepo.findOne({ file_id });
    if (file) {
      const update = {
        usage: (file.usage || 0) + inc,
        expiresAt: undefined,
        temp_file_id: undefined,
      };
      return await fileRepo.update({ file_id }, update);
    }
    return null;
  }

  const File = getFileModel();
  if (File.updateFileUsage) {
    return File.updateFileUsage(data);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  const updateOperation = {
    $inc: { usage: inc },
    $unset: { expiresAt: '', temp_file_id: '' },
  };
  return FileModel.findOneAndUpdate({ file_id }, updateOperation, { new: true }).lean();
}

/**
 * Deletes a file identified by file_id.
 */
async function deleteFile(file_id) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    const file = await fileRepo.findOne({ file_id });
    if (file) {
      await fileRepo.delete({ file_id });
      return file;
    }
    return null;
  }

  const File = getFileModel();
  if (File.deleteFile) {
    return File.deleteFile(file_id);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  return FileModel.findOneAndDelete({ file_id }).lean();
}

/**
 * Deletes a file identified by a filter.
 */
async function deleteFileByFilter(filter) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    const file = await fileRepo.findOne(filter);
    if (file) {
      await fileRepo.delete(filter);
      return file;
    }
    return null;
  }

  const File = getFileModel();
  if (File.deleteFileByFilter) {
    return File.deleteFileByFilter(filter);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  return FileModel.findOneAndDelete(filter).lean();
}

/**
 * Deletes multiple files identified by an array of file_ids.
 */
async function deleteFiles(file_ids, user) {
  let deleteQuery = { file_id: { $in: file_ids } };
  if (user) {
    deleteQuery = { user: user };
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');
    return await fileRepo.deleteMany(deleteQuery);
  }

  const File = getFileModel();
  if (File.deleteFiles) {
    return File.deleteFiles(file_ids, user);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  return FileModel.deleteMany(deleteQuery);
}

/**
 * Batch updates files with new signed URLs in MongoDB
 */
async function batchUpdateFiles(updates) {
  if (!updates || updates.length === 0) {
    return;
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const fileRepo = await getRepository('File');

    // Update each file
    for (const update of updates) {
      await fileRepo.update(
        { file_id: update.file_id },
        { filepath: update.filepath }
      );
    }

    logger.info(`Updated ${updates.length} files with new S3 URLs`);
    return;
  }

  const File = getFileModel();
  if (File.batchUpdateFiles) {
    return File.batchUpdateFiles(updates);
  }
  // Fallback
  const { File: FileModel } = require('~/db/models');
  const bulkOperations = updates.map((update) => ({
    updateOne: {
      filter: { file_id: update.file_id },
      update: { $set: { filepath: update.filepath } },
    },
  }));

  const result = await FileModel.bulkWrite(bulkOperations);
  logger.info(`Updated ${result.modifiedCount} files with new S3 URLs`);
}

// Export all functions
module.exports = {
  findFileById,
  getFiles,
  getToolFilesByIds,
  createFile,
  updateFile,
  updateFileUsage,
  deleteFile,
  deleteFiles,
  deleteFileByFilter,
  batchUpdateFiles,
};