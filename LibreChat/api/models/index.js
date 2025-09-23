const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
const { comparePassword } = require('./userMethods');
const User = require('./User');
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { File } = require('~/db/models');

const seedDatabase = async () => {
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  await methods.ensureDefaultCategories();
};

module.exports = {
  ...methods,
  seedDatabase,
  comparePassword,

  // User operations (override data-schemas methods)
  findUser: User.findUser,
  findByEmail: User.findByEmail,
  findByUsername: User.findByUsername,
  findByProviderId: User.findByProviderId,
  getUserById: User.getUserById,
  countUsers: User.countUsers,
  createUser: User.createUser,
  updateUser: User.updateUser,
  deleteUserById: User.deleteUserById,
  searchUsers: User.searchUsers,
  generateToken: User.generateToken,
  toggleUserMemories: User.toggleUserMemories,
  verifyEmail: User.verifyEmail,
  updatePassword: User.updatePassword,
  updateLastLogin: User.updateLastLogin,
  getUsersByRole: User.getUsersByRole,
  findWithRoles: User.findWithRoles,
  emailExists: User.emailExists,
  usernameExists: User.usernameExists,
  bulkCreateUsers: User.bulkCreateUsers,
  getAllUsers: User.getAllUsers,
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,

  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,

  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,

  getPreset,
  getPresets,
  savePreset,
  deletePresets,

  Files: File,
};
