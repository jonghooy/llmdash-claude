/**
 * Assistant Operations Abstraction Layer
 * This module provides a unified interface for assistant operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getAssistantModel() {
  const { Assistant } = require('~/db/models');
  return Assistant;
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
 * Update an assistant with new data without overwriting existing properties,
 * or create a new assistant if it doesn't exist.
 *
 * @param {Object} searchParams - The search parameters to find the assistant to update.
 * @param {string} searchParams.assistant_id - The ID of the assistant to update.
 * @param {string} searchParams.user - The user ID of the assistant's author.
 * @param {Object} updateData - An object containing the properties to update.
 * @returns {Promise<AssistantDocument>} The updated or newly created assistant document as a plain object.
 */
async function updateAssistantDoc(searchParams, updateData) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const assistantRepo = await getRepository('Assistant');
      return await assistantRepo.upsertAssistant(searchParams, updateData);
    }

    const Assistant = getAssistantModel();
    const options = { new: true, upsert: true };
    return await Assistant.findOneAndUpdate(searchParams, updateData, options).lean();
  } catch (error) {
    logger.error('[updateAssistantDoc] Error updating assistant', error);
    throw error;
  }
}

/**
 * Retrieves an assistant document based on the provided ID.
 *
 * @param {Object} searchParams - The search parameters to find the assistant to update.
 * @param {string} searchParams.assistant_id - The ID of the assistant to update.
 * @param {string} searchParams.user - The user ID of the assistant's author.
 * @returns {Promise<AssistantDocument|null>} The assistant document as a plain object, or null if not found.
 */
async function getAssistant(searchParams) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const assistantRepo = await getRepository('Assistant');

      if (searchParams.assistant_id && searchParams.user) {
        return await assistantRepo.findByAssistantId(searchParams.assistant_id, searchParams.user);
      }

      return await assistantRepo.findOne(searchParams);
    }

    const Assistant = getAssistantModel();
    return await Assistant.findOne(searchParams).lean();
  } catch (error) {
    logger.error('[getAssistant] Error getting assistant', error);
    return null;
  }
}

/**
 * Retrieves all assistants that match the given search parameters.
 *
 * @param {Object} searchParams - The search parameters to find matching assistants.
 * @param {Object} [select] - Optional. Specifies which document fields to include or exclude.
 * @returns {Promise<Array<AssistantDocument>>} A promise that resolves to an array of assistant documents as plain objects.
 */
async function getAssistants(searchParams, select = null) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const assistantRepo = await getRepository('Assistant');

      // If searching by user only, use optimized method
      if (searchParams.user && Object.keys(searchParams).length === 1) {
        return await assistantRepo.getUserAssistants(searchParams.user);
      }

      const options = select ? { select } : {};
      return await assistantRepo.find(searchParams, options);
    }

    const Assistant = getAssistantModel();
    let query = Assistant.find(searchParams);

    if (select) {
      query = query.select(select);
    }

    return await query.lean();
  } catch (error) {
    logger.error('[getAssistants] Error getting assistants', error);
    return [];
  }
}

/**
 * Deletes an assistant based on the provided ID.
 *
 * @param {Object} searchParams - The search parameters to find the assistant to delete.
 * @param {string} searchParams.assistant_id - The ID of the assistant to delete.
 * @param {string} searchParams.user - The user ID of the assistant's author.
 * @returns {Promise<void>} Resolves when the assistant has been successfully deleted.
 */
async function deleteAssistant(searchParams) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const assistantRepo = await getRepository('Assistant');

      if (searchParams.assistant_id && searchParams.user) {
        return await assistantRepo.deleteAssistant(searchParams.assistant_id, searchParams.user);
      }

      // Fallback to generic delete
      const result = await assistantRepo.deleteMany(searchParams);
      return result > 0;
    }

    const Assistant = getAssistantModel();
    return await Assistant.findOneAndDelete(searchParams);
  } catch (error) {
    logger.error('[deleteAssistant] Error deleting assistant', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  updateAssistantDoc,
  deleteAssistant,
  getAssistants,
  getAssistant,
};