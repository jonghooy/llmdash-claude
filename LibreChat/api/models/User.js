const mongoose = require('mongoose');
const operations = require('./userOperations');

/**
 * User Model - Fully migrated to dbGateway
 *
 * This module provides a complete abstraction over User operations,
 * supporting both dbGateway and direct Mongoose operations.
 */

// Get User model from data-schemas
const getUser = () => {
  if (!mongoose.models.User) {
    const { createModels } = require('@librechat/data-schemas');
    createModels(mongoose);
  }
  return mongoose.models.User;
};

// Get the User model
const User = getUser();

// Export model with all operations
module.exports = {
  // Export the model itself for backward compatibility
  Model: User,
  User,

  // Re-export all operations
  ...operations,

  // Maintain backward compatibility with common patterns
  findOne: operations.findUser,
  findById: operations.getUserById,
  find: async (criteria, options) => {
    if (process.env.USE_DB_GATEWAY === 'true') {
      const { getRepository } = require('../server/services/dbGateway');
      const userRepo = await getRepository('User');
      return await userRepo.find(criteria, options);
    }
    // Fallback to Mongoose
    let query = User.find(criteria);
    if (options?.select) query = query.select(options.select);
    if (options?.sort) query = query.sort(options.sort);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.skip) query = query.skip(options.skip);
    if (options?.populate) query = query.populate(options.populate);
    return await query.lean();
  },
  create: operations.createUser,
  findByIdAndUpdate: operations.updateUser,
  deleteOne: async (criteria) => {
    if (criteria._id) {
      return await operations.deleteUserById(criteria._id);
    }
    // For other criteria, use repository
    if (process.env.USE_DB_GATEWAY === 'true') {
      const { getRepository } = require('../server/services/dbGateway');
      const userRepo = await getRepository('User');
      const user = await userRepo.findOne(criteria);
      if (user) {
        await userRepo.delete(user._id);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
    // Fallback to Mongoose
    return await User.deleteOne(criteria);
  },
  exists: async (criteria) => {
    if (criteria.email && Object.keys(criteria).length === 1) {
      return await operations.emailExists(criteria.email);
    }
    if (criteria.username && Object.keys(criteria).length === 1) {
      return await operations.usernameExists(criteria.username);
    }
    // For other criteria
    if (process.env.USE_DB_GATEWAY === 'true') {
      const { getRepository } = require('../server/services/dbGateway');
      const userRepo = await getRepository('User');
      return await userRepo.exists(criteria);
    }
    // Fallback to Mongoose
    return await User.exists(criteria);
  },
  countDocuments: operations.countUsers,
  insertMany: operations.bulkCreateUsers,
};