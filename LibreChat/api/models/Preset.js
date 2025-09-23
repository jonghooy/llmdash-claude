/**
 * Preset Model Wrapper
 * Exports preset operations from the abstraction layer
 */

const presetOps = require('./presetOperations');

// Export all operations from the abstraction layer
module.exports = {
  getPreset: presetOps.getPreset,
  getPresets: presetOps.getPresets,
  savePreset: presetOps.savePreset,
  deletePresets: presetOps.deletePresets,
};