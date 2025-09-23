/**
 * Preset Operations Abstraction Layer
 * This module provides a unified interface for preset operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getPresetModel() {
  const { Preset } = require('~/db/models');
  return Preset;
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
 * Get a single preset by user and presetId
 */
async function getPreset(user, presetId) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const presetRepo = await getRepository('Preset');
      return await presetRepo.findOne({ user, presetId });
    }

    const Preset = getPresetModel();
    return await Preset.findOne({ user, presetId }).lean();
  } catch (error) {
    logger.error('[getPreset] Error getting single preset', error);
    return { message: 'Error getting single preset' };
  }
}

/**
 * Get all presets for a user with optional filter
 */
async function getPresets(user, filter) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const presetRepo = await getRepository('Preset');

      const presets = await presetRepo.find({ ...filter, user });
      const defaultValue = 10000;

      presets.sort((a, b) => {
        let orderA = a.order !== undefined ? a.order : defaultValue;
        let orderB = b.order !== undefined ? b.order : defaultValue;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return b.updatedAt - a.updatedAt;
      });

      return presets;
    }

    const Preset = getPresetModel();
    const presets = await Preset.find({ ...filter, user }).lean();
    const defaultValue = 10000;

    presets.sort((a, b) => {
      let orderA = a.order !== undefined ? a.order : defaultValue;
      let orderB = b.order !== undefined ? b.order : defaultValue;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return b.updatedAt - a.updatedAt;
    });

    return presets;
  } catch (error) {
    logger.error('[getPresets] Error getting presets', error);
    return { message: 'Error retrieving presets' };
  }
}

/**
 * Save or update a preset
 */
async function savePreset(user, { presetId, newPresetId, defaultPreset, ...preset }) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const presetRepo = await getRepository('Preset');

      const { user: _, ...cleanPreset } = preset;
      const update = { presetId, ...cleanPreset };

      if (preset.tools && Array.isArray(preset.tools)) {
        update.tools =
          preset.tools
            .map((tool) => tool?.pluginKey ?? tool)
            .filter((toolName) => typeof toolName === 'string') ?? [];
      }

      if (newPresetId) {
        update.presetId = newPresetId;
      }

      if (defaultPreset) {
        update.defaultPreset = defaultPreset;
        update.order = 0;

        // Find and unset the current default
        const currentDefault = await presetRepo.findOne({ defaultPreset: true, user });
        if (currentDefault && currentDefault.presetId !== presetId) {
          await presetRepo.update(currentDefault._id, {
            defaultPreset: undefined,
            order: undefined
          });
        }
      } else if (defaultPreset === false) {
        update.defaultPreset = undefined;
        update.order = undefined;
      }

      // Check if preset exists
      const existing = await presetRepo.findOne({ presetId, user });
      if (existing) {
        return await presetRepo.update(existing._id, update);
      } else {
        return await presetRepo.create({ ...update, user });
      }
    }

    // Original Mongoose implementation
    const Preset = getPresetModel();
    const setter = { $set: {} };
    const { user: _, ...cleanPreset } = preset;
    const update = { presetId, ...cleanPreset };

    if (preset.tools && Array.isArray(preset.tools)) {
      update.tools =
        preset.tools
          .map((tool) => tool?.pluginKey ?? tool)
          .filter((toolName) => typeof toolName === 'string') ?? [];
    }

    if (newPresetId) {
      update.presetId = newPresetId;
    }

    if (defaultPreset) {
      update.defaultPreset = defaultPreset;
      update.order = 0;

      const currentDefault = await Preset.findOne({ defaultPreset: true, user });
      if (currentDefault && currentDefault.presetId !== presetId) {
        await Preset.findByIdAndUpdate(currentDefault._id, {
          $unset: { defaultPreset: '', order: '' },
        });
      }
    } else if (defaultPreset === false) {
      update.defaultPreset = undefined;
      update.order = undefined;
      setter['$unset'] = { defaultPreset: '', order: '' };
    }

    setter.$set = update;
    return await Preset.findOneAndUpdate({ presetId, user }, setter, { new: true, upsert: true });
  } catch (error) {
    logger.error('[savePreset] Error saving preset', error);
    return { message: 'Error saving preset' };
  }
}

/**
 * Delete presets matching filter for a user
 */
async function deletePresets(user, filter) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const presetRepo = await getRepository('Preset');

      const result = await presetRepo.deleteMany({ ...filter, user });
      return { deletedCount: result };
    }

    const Preset = getPresetModel();
    let deleteCount = await Preset.deleteMany({ ...filter, user });
    return deleteCount;
  } catch (error) {
    logger.error('[deletePresets] Error deleting presets', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  getPreset,
  getPresets,
  savePreset,
  deletePresets,
};