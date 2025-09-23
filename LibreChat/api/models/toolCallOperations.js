const { ToolCall } = require('~/db/models');

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get the dbGateway lazily to avoid circular dependencies
 */
function getLazyGateway() {
  return require('../server/services/dbGateway');
}

/**
 * Create a new tool call
 * @param {IToolCallData} toolCallData - The tool call data
 * @returns {Promise<IToolCallData>} The created tool call document
 */
async function createToolCall(toolCallData) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      return await toolCallRepo.create(toolCallData);
    }
    // Fallback to Mongoose
    return await ToolCall.create(toolCallData);
  } catch (error) {
    throw new Error(`Error creating tool call: ${error.message}`);
  }
}

/**
 * Get a tool call by ID
 * @param {string} id - The tool call document ID
 * @returns {Promise<IToolCallData|null>} The tool call document or null if not found
 */
async function getToolCallById(id) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      return await toolCallRepo.getToolCallById(id);
    }
    // Fallback to Mongoose
    return await ToolCall.findById(id).lean();
  } catch (error) {
    throw new Error(`Error fetching tool call: ${error.message}`);
  }
}

/**
 * Get tool calls by message ID and user
 * @param {string} messageId - The message ID
 * @param {string} userId - The user's ObjectId
 * @returns {Promise<Array>} Array of tool call documents
 */
async function getToolCallsByMessage(messageId, userId) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      return await toolCallRepo.getToolCallsByMessage(messageId, userId);
    }
    // Fallback to Mongoose
    return await ToolCall.find({ messageId, user: userId }).lean();
  } catch (error) {
    throw new Error(`Error fetching tool calls: ${error.message}`);
  }
}

/**
 * Get tool calls by conversation ID and user
 * @param {string} conversationId - The conversation ID
 * @param {string} userId - The user's ObjectId
 * @returns {Promise<IToolCallData[]>} Array of tool call documents
 */
async function getToolCallsByConvo(conversationId, userId) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      return await toolCallRepo.getToolCallsByConvo(conversationId, userId);
    }
    // Fallback to Mongoose
    return await ToolCall.find({ conversationId, user: userId }).lean();
  } catch (error) {
    throw new Error(`Error fetching tool calls: ${error.message}`);
  }
}

/**
 * Update a tool call
 * @param {string} id - The tool call document ID
 * @param {Partial<IToolCallData>} updateData - The data to update
 * @returns {Promise<IToolCallData|null>} The updated tool call document or null if not found
 */
async function updateToolCall(id, updateData) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      return await toolCallRepo.updateToolCall(id, updateData);
    }
    // Fallback to Mongoose
    return await ToolCall.findByIdAndUpdate(id, updateData, { new: true }).lean();
  } catch (error) {
    throw new Error(`Error updating tool call: ${error.message}`);
  }
}

/**
 * Delete tool calls
 * @param {string} userId - The related user's ObjectId
 * @param {string} [conversationId] - The tool call conversation ID
 * @returns {Promise<{ ok?: number; n?: number; deletedCount?: number }>} The result of the delete operation
 */
async function deleteToolCalls(userId, conversationId) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const toolCallRepo = await getRepository('ToolCall');
      const count = await toolCallRepo.deleteToolCalls(userId, conversationId);
      return { deletedCount: count };
    }
    // Fallback to Mongoose
    const query = { user: userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }
    return await ToolCall.deleteMany(query);
  } catch (error) {
    throw new Error(`Error deleting tool call: ${error.message}`);
  }
}

/**
 * Get tool calls by tool ID
 * @param {string} toolId - The tool ID
 * @param {string} [userId] - Optional user ID filter
 * @returns {Promise<Array>} Array of tool call documents
 */
async function getToolCallsByToolId(toolId, userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const toolCallRepo = await getRepository('ToolCall');
    return await toolCallRepo.getToolCallsByToolId(toolId, userId);
  }
  // Fallback to Mongoose
  const query = { toolId };
  if (userId) {
    query.user = userId;
  }
  return await ToolCall.find(query).lean();
}

/**
 * Bulk create tool calls
 * @param {Array} toolCalls - Array of tool call data
 * @returns {Promise<Array>} Array of created tool call documents
 */
async function bulkCreateToolCalls(toolCalls) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const toolCallRepo = await getRepository('ToolCall');
    return await toolCallRepo.bulkCreateToolCalls(toolCalls);
  }
  // Fallback to Mongoose
  return await ToolCall.insertMany(toolCalls);
}

/**
 * Update tool call result
 * @param {string} id - The tool call ID
 * @param {any} result - The result to update
 * @returns {Promise<boolean>} True if updated successfully
 */
async function updateToolCallResult(id, result) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const toolCallRepo = await getRepository('ToolCall');
    return await toolCallRepo.updateToolCallResult(id, result);
  }
  // Fallback to Mongoose
  const updateResult = await ToolCall.updateOne(
    { _id: id },
    { $set: { result, updatedAt: new Date() } }
  );
  return updateResult.modifiedCount > 0;
}

/**
 * Get tool calls with pagination
 * @param {string} userId - The user ID
 * @param {Object} options - Pagination options
 * @returns {Promise<{data: Array, total: number}>} Paginated results
 */
async function getToolCallsPaginated(userId, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const toolCallRepo = await getRepository('ToolCall');
    return await toolCallRepo.getToolCallsPaginated(userId, options);
  }
  // Fallback to Mongoose
  const query = { user: userId };
  if (options.conversationId) {
    query.conversationId = options.conversationId;
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const [data, total] = await Promise.all([
    ToolCall.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean(),
    ToolCall.countDocuments(query),
  ]);

  return { data, total };
}

/**
 * Delete tool calls by message ID
 * @param {string} messageId - The message ID
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Number of deleted documents
 */
async function deleteToolCallsByMessage(messageId, userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const toolCallRepo = await getRepository('ToolCall');
    return await toolCallRepo.deleteToolCallsByMessage(messageId, userId);
  }
  // Fallback to Mongoose
  const result = await ToolCall.deleteMany({ messageId, user: userId });
  return result.deletedCount || 0;
}

module.exports = {
  createToolCall,
  updateToolCall,
  deleteToolCalls,
  getToolCallById,
  getToolCallsByConvo,
  getToolCallsByMessage,
  getToolCallsByToolId,
  bulkCreateToolCalls,
  updateToolCallResult,
  getToolCallsPaginated,
  deleteToolCallsByMessage,
};