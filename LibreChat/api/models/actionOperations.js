const { Action } = require('~/db/models');

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
 * Update an action with new data without overwriting existing properties,
 * or create a new action if it doesn't exist.
 *
 * @param {Object} searchParams - The search parameters to find the action to update.
 * @param {string} searchParams.action_id - The ID of the action to update.
 * @param {string} searchParams.user - The user ID of the action's author.
 * @param {Object} updateData - An object containing the properties to update.
 * @returns {Promise<Action>} The updated or newly created action document as a plain object.
 */
async function updateAction(searchParams, updateData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.updateAction(searchParams, updateData);
  }
  // Fallback to Mongoose
  const options = { new: true, upsert: true };
  return await Action.findOneAndUpdate(searchParams, updateData, options).lean();
}

/**
 * Retrieves all actions that match the given search parameters.
 *
 * @param {Object} searchParams - The search parameters to find matching actions.
 * @param {boolean} includeSensitive - Flag to include sensitive data in the metadata.
 * @returns {Promise<Array<Action>>} A promise that resolves to an array of action documents as plain objects.
 */
async function getActions(searchParams, includeSensitive = false) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.getActions(searchParams, includeSensitive);
  }
  // Fallback to Mongoose
  const actions = await Action.find(searchParams).lean();

  if (!includeSensitive) {
    for (let i = 0; i < actions.length; i++) {
      const metadata = actions[i].metadata;
      if (!metadata) {
        continue;
      }

      const sensitiveFields = ['api_key', 'oauth_client_id', 'oauth_client_secret'];
      for (let field of sensitiveFields) {
        if (metadata[field]) {
          delete metadata[field];
        }
      }
    }
  }

  return actions;
}

/**
 * Deletes an action by params.
 *
 * @param {Object} searchParams - The search parameters to find the action to delete.
 * @param {string} searchParams.action_id - The ID of the action to delete.
 * @param {string} searchParams.user - The user ID of the action's author.
 * @returns {Promise<Action>} A promise that resolves to the deleted action document as a plain object, or null if no document was found.
 */
async function deleteAction(searchParams) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.deleteAction(searchParams);
  }
  // Fallback to Mongoose
  return await Action.findOneAndDelete(searchParams).lean();
}

/**
 * Deletes actions by params.
 *
 * @param {Object} searchParams - The search parameters to find the actions to delete.
 * @param {string} searchParams.action_id - The ID of the action(s) to delete.
 * @param {string} searchParams.user - The user ID of the action's author.
 * @returns {Promise<Number>} A promise that resolves to the number of deleted action documents.
 */
async function deleteActions(searchParams) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.deleteActions(searchParams);
  }
  // Fallback to Mongoose
  const result = await Action.deleteMany(searchParams);
  return result.deletedCount;
}

/**
 * Find action by action_id and user
 *
 * @param {string} action_id - The action ID
 * @param {string} user - The user ID
 * @returns {Promise<Action|null>} The action document or null
 */
async function findByActionIdAndUser(action_id, user) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.findByActionIdAndUser(action_id, user);
  }
  // Fallback to Mongoose
  return await Action.findOne({ action_id, user }).lean();
}

/**
 * Get all actions for a specific user
 *
 * @param {string} user - The user ID
 * @returns {Promise<Array<Action>>} Array of action documents
 */
async function getUserActions(user) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.getUserActions(user);
  }
  // Fallback to Mongoose
  return await Action.find({ user }).lean();
}

/**
 * Update action metadata
 *
 * @param {string} action_id - The action ID
 * @param {string} user - The user ID
 * @param {Object} metadata - The metadata to update
 * @returns {Promise<boolean>} True if updated successfully
 */
async function updateActionMetadata(action_id, user, metadata) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.updateActionMetadata(action_id, user, metadata);
  }
  // Fallback to Mongoose
  const result = await Action.updateOne(
    { action_id, user },
    { $set: { metadata, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

/**
 * Create a new action
 *
 * @param {Object} actionData - The action data
 * @returns {Promise<Action>} The created action document
 */
async function createAction(actionData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.create(actionData);
  }
  // Fallback to Mongoose
  const action = new Action(actionData);
  return await action.save();
}

/**
 * Find actions matching criteria
 *
 * @param {Object} criteria - The search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array<Action>>} Array of action documents
 */
async function findActions(criteria, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const actionRepo = await getRepository('Action');
    return await actionRepo.find(criteria, options);
  }
  // Fallback to Mongoose
  let query = Action.find(criteria);

  if (options.sort) {
    query = query.sort(options.sort);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.skip) {
    query = query.skip(options.skip);
  }

  return await query.lean();
}

module.exports = {
  getActions,
  updateAction,
  deleteAction,
  deleteActions,
  findByActionIdAndUser,
  getUserActions,
  updateActionMetadata,
  createAction,
  findActions,
};