/**
 * ConversationTag Operations Abstraction Layer
 * This module provides a unified interface for conversation tag operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getConversationTagModel() {
  const { ConversationTag } = require('~/db/models');
  return ConversationTag;
}

function getConversationModel() {
  const { Conversation } = require('~/db/models');
  return Conversation;
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
 * Retrieves all conversation tags for a user.
 * @param {string} user - The user ID.
 * @returns {Promise<Array>} An array of conversation tags.
 */
async function getConversationTags(user) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const tagRepo = await getRepository('ConversationTag');
      return await tagRepo.getUserTags(user);
    }

    const ConversationTag = getConversationTagModel();
    return await ConversationTag.find({ user }).sort({ position: 1 }).lean();
  } catch (error) {
    logger.error('[getConversationTags] Error getting conversation tags', error);
    throw new Error('Error getting conversation tags');
  }
}

/**
 * Creates a new conversation tag.
 * @param {string} user - The user ID.
 * @param {Object} data - The tag data.
 * @param {string} data.tag - The tag name.
 * @param {string} [data.description] - The tag description.
 * @param {boolean} [data.addToConversation] - Whether to add the tag to a conversation.
 * @param {string} [data.conversationId] - The conversation ID to add the tag to.
 * @returns {Promise<Object>} The created tag.
 */
async function createConversationTag(user, data) {
  try {
    const { tag, description, addToConversation, conversationId } = data;

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const tagRepo = await getRepository('ConversationTag');

      // Check if tag already exists
      const existingTag = await tagRepo.findUserTag(user, tag);
      if (existingTag) {
        return existingTag;
      }

      // Get max position
      const maxPosition = await tagRepo.getMaxPosition(user);
      const position = maxPosition + 1;

      // Create tag
      const newTag = await tagRepo.upsertTag(user, tag, {
        tag,
        user,
        count: addToConversation ? 1 : 0,
        position,
        description,
      });

      // Add to conversation if requested
      if (addToConversation && conversationId) {
        const Conversation = getConversationModel();
        await Conversation.findOneAndUpdate(
          { user, conversationId },
          { $addToSet: { tags: tag } },
          { new: true },
        );
      }

      return newTag;
    }

    // Original Mongoose implementation
    const ConversationTag = getConversationTagModel();

    const existingTag = await ConversationTag.findOne({ user, tag }).lean();
    if (existingTag) {
      return existingTag;
    }

    const maxPosition = await ConversationTag.findOne({ user }).sort('-position').lean();
    const position = (maxPosition?.position || 0) + 1;

    const newTag = await ConversationTag.findOneAndUpdate(
      { tag, user },
      {
        tag,
        user,
        count: addToConversation ? 1 : 0,
        position,
        description,
        $setOnInsert: { createdAt: new Date() },
      },
      {
        new: true,
        upsert: true,
        lean: true,
      },
    );

    if (addToConversation && conversationId) {
      const Conversation = getConversationModel();
      await Conversation.findOneAndUpdate(
        { user, conversationId },
        { $addToSet: { tags: tag } },
        { new: true },
      );
    }

    return newTag;
  } catch (error) {
    logger.error('[createConversationTag] Error creating conversation tag', error);
    throw new Error('Error creating conversation tag');
  }
}

/**
 * Updates an existing conversation tag.
 * @param {string} user - The user ID.
 * @param {string} oldTag - The current tag name.
 * @param {Object} data - The updated tag data.
 * @param {string} [data.tag] - The new tag name.
 * @param {string} [data.description] - The updated description.
 * @param {number} [data.position] - The new position.
 * @returns {Promise<Object>} The updated tag.
 */
async function updateConversationTag(user, oldTag, data) {
  try {
    const { tag: newTag, description, position } = data;

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const tagRepo = await getRepository('ConversationTag');

      // Check if tag exists
      const existingTag = await tagRepo.findUserTag(user, oldTag);
      if (!existingTag) {
        return null;
      }

      // Handle rename
      if (newTag && newTag !== oldTag) {
        const tagAlreadyExists = await tagRepo.findUserTag(user, newTag);
        if (tagAlreadyExists) {
          throw new Error('Tag already exists');
        }

        // Update conversations
        const Conversation = getConversationModel();
        await Conversation.updateMany({ user, tags: oldTag }, { $set: { 'tags.$': newTag } });

        // Rename tag
        await tagRepo.renameTag(user, oldTag, newTag);
      }

      // Update description if provided
      if (description !== undefined) {
        await tagRepo.updateTagDescription(user, newTag || oldTag, description);
      }

      // Update position if provided
      if (position !== undefined && existingTag.position !== position) {
        await adjustPositions(user, existingTag.position, position);
        await tagRepo.updateTagPosition(user, newTag || oldTag, position);
      }

      // Return updated tag
      return await tagRepo.findUserTag(user, newTag || oldTag);
    }

    // Original Mongoose implementation
    const ConversationTag = getConversationTagModel();

    const existingTag = await ConversationTag.findOne({ user, tag: oldTag }).lean();
    if (!existingTag) {
      return null;
    }

    if (newTag && newTag !== oldTag) {
      const tagAlreadyExists = await ConversationTag.findOne({ user, tag: newTag }).lean();
      if (tagAlreadyExists) {
        throw new Error('Tag already exists');
      }

      const Conversation = getConversationModel();
      await Conversation.updateMany({ user, tags: oldTag }, { $set: { 'tags.$': newTag } });
    }

    const updateData = {};
    if (newTag) {
      updateData.tag = newTag;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (position !== undefined) {
      await adjustPositions(user, existingTag.position, position);
      updateData.position = position;
    }

    return await ConversationTag.findOneAndUpdate({ user, tag: oldTag }, updateData, {
      new: true,
      lean: true,
    });
  } catch (error) {
    logger.error('[updateConversationTag] Error updating conversation tag', error);
    throw new Error('Error updating conversation tag');
  }
}

/**
 * Adjusts positions of tags when a tag's position is changed.
 * @param {string} user - The user ID.
 * @param {number} oldPosition - The old position of the tag.
 * @param {number} newPosition - The new position of the tag.
 * @returns {Promise<void>}
 */
async function adjustPositions(user, oldPosition, newPosition) {
  if (oldPosition === newPosition) {
    return;
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const tagRepo = await getRepository('ConversationTag');

    const increment = oldPosition < newPosition ? -1 : 1;
    await tagRepo.adjustPositions(user, oldPosition, newPosition, increment);
    return;
  }

  const ConversationTag = getConversationTagModel();
  const update = oldPosition < newPosition ? { $inc: { position: -1 } } : { $inc: { position: 1 } };
  const position =
    oldPosition < newPosition
      ? {
          $gt: Math.min(oldPosition, newPosition),
          $lte: Math.max(oldPosition, newPosition),
        }
      : {
          $gte: Math.min(oldPosition, newPosition),
          $lt: Math.max(oldPosition, newPosition),
        };

  await ConversationTag.updateMany(
    {
      user,
      position,
    },
    update,
  );
}

/**
 * Deletes a conversation tag.
 * @param {string} user - The user ID.
 * @param {string} tag - The tag to delete.
 * @returns {Promise<Object>} The deleted tag.
 */
async function deleteConversationTag(user, tag) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const tagRepo = await getRepository('ConversationTag');

      const deletedTag = await tagRepo.deleteUserTag(user, tag);
      if (!deletedTag) {
        return null;
      }

      // Remove from conversations
      const Conversation = getConversationModel();
      await Conversation.updateMany({ user, tags: tag }, { $pull: { tags: tag } });

      // Adjust positions
      await tagRepo.adjustPositions(user, deletedTag.position, Number.MAX_SAFE_INTEGER, -1);

      return deletedTag;
    }

    // Original Mongoose implementation
    const ConversationTag = getConversationTagModel();
    const deletedTag = await ConversationTag.findOneAndDelete({ user, tag }).lean();
    if (!deletedTag) {
      return null;
    }

    const Conversation = getConversationModel();
    await Conversation.updateMany({ user, tags: tag }, { $pull: { tags: tag } });

    await ConversationTag.updateMany(
      { user, position: { $gt: deletedTag.position } },
      { $inc: { position: -1 } },
    );

    return deletedTag;
  } catch (error) {
    logger.error('[deleteConversationTag] Error deleting conversation tag', error);
    throw new Error('Error deleting conversation tag');
  }
}

/**
 * Updates tags for a specific conversation.
 * @param {string} user - The user ID.
 * @param {string} conversationId - The conversation ID.
 * @param {string[]} tags - The new set of tags for the conversation.
 * @returns {Promise<string[]>} The updated list of tags for the conversation.
 */
async function updateTagsForConversation(user, conversationId, tags) {
  try {
    const Conversation = getConversationModel();
    const conversation = await Conversation.findOne({ user, conversationId }).lean();
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const oldTags = new Set(conversation.tags || []);
    const newTags = new Set(tags);

    const addedTags = [...newTags].filter((tag) => !oldTags.has(tag));
    const removedTags = [...oldTags].filter((tag) => !newTags.has(tag));

    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const tagRepo = await getRepository('ConversationTag');

      // Increment count for added tags
      for (const tag of addedTags) {
        const existingTag = await tagRepo.findUserTag(user, tag);
        if (existingTag) {
          await tagRepo.incrementTagCount(user, tag, 1);
        } else {
          // Create new tag if doesn't exist
          const maxPosition = await tagRepo.getMaxPosition(user);
          await tagRepo.create({
            tag,
            user,
            count: 1,
            position: maxPosition + 1,
          });
        }
      }

      // Decrement count for removed tags
      for (const tag of removedTags) {
        await tagRepo.incrementTagCount(user, tag, -1);
      }
    } else {
      const ConversationTag = getConversationTagModel();

      // Handle added tags
      for (const tag of addedTags) {
        const existingTag = await ConversationTag.findOne({ user, tag }).lean();
        if (existingTag) {
          await ConversationTag.updateOne({ user, tag }, { $inc: { count: 1 } });
        } else {
          const maxPosition = await ConversationTag.findOne({ user }).sort('-position').lean();
          const position = (maxPosition?.position || 0) + 1;
          await ConversationTag.create({ tag, user, count: 1, position });
        }
      }

      // Handle removed tags
      for (const tag of removedTags) {
        await ConversationTag.updateOne({ user, tag }, { $inc: { count: -1 } });
      }
    }

    // Update conversation with new tags
    await Conversation.findOneAndUpdate(
      { user, conversationId },
      { tags: Array.from(newTags) },
      { new: true },
    );

    return Array.from(newTags);
  } catch (error) {
    logger.error('[updateTagsForConversation] Error updating tags for conversation', error);
    throw new Error('Error updating tags for conversation');
  }
}

// Export all functions
module.exports = {
  getConversationTags,
  createConversationTag,
  updateConversationTag,
  deleteConversationTag,
  updateTagsForConversation,
};