const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { signPayload, logger } = require('@librechat/data-schemas');

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
 * Get User model from data-schemas
 */
function getUserModel() {
  return mongoose.models.User;
}

/**
 * Find a user by search criteria
 * @param {Object} searchCriteria - Search criteria
 * @param {string|string[]|null} fieldsToSelect - Fields to select
 * @returns {Promise<Object|null>} User object or null
 */
async function findUser(searchCriteria, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    const options = fieldsToSelect ? { select: fieldsToSelect } : {};
    return await userRepo.findOne(searchCriteria, options);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  const query = User.findOne(searchCriteria);
  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }
  return await query.lean();
}

/**
 * Find user by email
 * @param {string} email - User email
 * @param {string|string[]|null} fieldsToSelect - Fields to select
 * @returns {Promise<Object|null>} User object or null
 */
async function findByEmail(email, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    const user = await userRepo.findByEmail(email);
    if (!user || !fieldsToSelect) return user;

    // Apply field selection if needed
    const selected = {};
    const fields = Array.isArray(fieldsToSelect) ? fieldsToSelect : fieldsToSelect.split(' ');
    for (const field of fields) {
      if (field && !field.startsWith('-') && user[field] !== undefined) {
        selected[field] = user[field];
      }
    }
    return selected;
  }

  // Fallback to Mongoose
  return await findUser({ email: email.toLowerCase() }, fieldsToSelect);
}

/**
 * Find user by username
 * @param {string} username - Username
 * @param {string|string[]|null} fieldsToSelect - Fields to select
 * @returns {Promise<Object|null>} User object or null
 */
async function findByUsername(username, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    const user = await userRepo.findByUsername(username);
    if (!user || !fieldsToSelect) return user;

    // Apply field selection if needed
    const selected = {};
    const fields = Array.isArray(fieldsToSelect) ? fieldsToSelect : fieldsToSelect.split(' ');
    for (const field of fields) {
      if (field && !field.startsWith('-') && user[field] !== undefined) {
        selected[field] = user[field];
      }
    }
    return selected;
  }

  // Fallback to Mongoose
  return await findUser({ username: username.toLowerCase() }, fieldsToSelect);
}

/**
 * Find user by provider ID
 * @param {string} provider - Provider name
 * @param {string} providerId - Provider ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findByProviderId(provider, providerId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.findByProviderId(provider, providerId);
  }

  // Fallback to Mongoose
  return await findUser({ provider, providerId });
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {string|string[]|null} fieldsToSelect - Fields to select
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserById(userId, fieldsToSelect = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    const options = fieldsToSelect ? { select: fieldsToSelect } : {};
    return await userRepo.findById(userId, options);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  const query = User.findById(userId);
  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }
  return await query.lean();
}

/**
 * Count users
 * @param {Object} filter - Filter criteria
 * @returns {Promise<number>} Number of users
 */
async function countUsers(filter = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.count(filter);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return await User.countDocuments(filter);
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {Object} balanceConfig - Balance configuration
 * @param {boolean} disableTTL - Disable TTL
 * @param {boolean} returnUser - Return full user object
 * @returns {Promise<string|Object>} User ID or user object
 */
async function createUser(userData, balanceConfig = null, disableTTL = true, returnUser = false) {
  const data = {
    ...userData,
    email: userData.email?.toLowerCase(),
    username: userData.username?.toLowerCase(),
  };

  if (!disableTTL) {
    data.expiresAt = new Date(Date.now() + 604800 * 1000); // 1 week
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    const user = await userRepo.create(data);

    // Handle balance if configured
    if (balanceConfig?.enabled && balanceConfig?.startBalance) {
      const Balance = mongoose.models.Balance;
      const update = {
        $inc: { tokenCredits: balanceConfig.startBalance },
      };

      if (balanceConfig.autoRefillEnabled) {
        update.$set = {
          autoRefillEnabled: true,
          refillIntervalValue: balanceConfig.refillIntervalValue,
          refillIntervalUnit: balanceConfig.refillIntervalUnit,
          refillAmount: balanceConfig.refillAmount,
        };
      }

      await Balance.findOneAndUpdate(
        { user: user._id },
        update,
        { upsert: true, new: true }
      ).lean();
    }

    return returnUser ? user : user._id;
  }

  // Fallback to Mongoose
  const User = getUserModel();
  const user = await User.create(data);

  // Handle balance if configured
  if (balanceConfig?.enabled && balanceConfig?.startBalance) {
    const Balance = mongoose.models.Balance;
    const update = {
      $inc: { tokenCredits: balanceConfig.startBalance },
    };

    if (balanceConfig.autoRefillEnabled) {
      update.$set = {
        autoRefillEnabled: true,
        refillIntervalValue: balanceConfig.refillIntervalValue,
        refillIntervalUnit: balanceConfig.refillIntervalUnit,
        refillAmount: balanceConfig.refillAmount,
      };
    }

    await Balance.findOneAndUpdate(
      { user: user._id },
      update,
      { upsert: true, new: true }
    ).lean();
  }

  return returnUser ? user.toObject() : user._id;
}

/**
 * Update a user
 * @param {string} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object|null>} Updated user or null
 */
async function updateUser(userId, updateData) {
  const data = { ...updateData };
  if (data.email) data.email = data.email.toLowerCase();
  if (data.username) data.username = data.username.toLowerCase();

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.update(userId, data);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  const updateOperation = {
    $set: data,
    $unset: { expiresAt: '' }, // Remove TTL
  };
  return await User.findByIdAndUpdate(userId, updateOperation, {
    new: true,
    runValidators: true,
  }).lean();
}

/**
 * Delete a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
async function deleteUserById(userId) {
  try {
    if (isDbGatewayEnabled()) {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      const deleted = await userRepo.delete(userId);
      if (!deleted) {
        return { deletedCount: 0, message: 'No user found with that ID.' };
      }
      return { deletedCount: 1, message: 'User was deleted successfully.' };
    }

    // Fallback to Mongoose
    const User = getUserModel();
    const result = await User.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      return { deletedCount: 0, message: 'No user found with that ID.' };
    }
    return { deletedCount: result.deletedCount, message: 'User was deleted successfully.' };
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
}

/**
 * Search users
 * @param {string} searchPattern - Search pattern
 * @param {number} limit - Limit
 * @param {string|string[]|null} fieldsToSelect - Fields to select
 * @returns {Promise<Array>} Array of users
 */
async function searchUsers({ searchPattern, limit = 20, fieldsToSelect = null }) {
  if (!searchPattern || searchPattern.trim().length === 0) {
    return [];
  }

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.searchUsers(searchPattern.trim(), limit);
  }

  // Fallback to Mongoose
  const regex = new RegExp(searchPattern.trim(), 'i');
  const User = getUserModel();

  const query = User.find({
    $or: [{ email: regex }, { name: regex }, { username: regex }],
  }).limit(limit * 2);

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  const users = await query.lean();

  // Score results by relevance
  const exactRegex = new RegExp(`^${searchPattern.trim()}$`, 'i');
  const startsWithPattern = searchPattern.trim().toLowerCase();

  const scoredUsers = users.map((user) => {
    const searchableFields = [user.name, user.email, user.username].filter(Boolean);
    let maxScore = 0;

    for (const field of searchableFields) {
      const fieldLower = field.toLowerCase();
      let score = 0;

      if (exactRegex.test(field)) {
        score = 100;
      } else if (fieldLower.startsWith(startsWithPattern)) {
        score = 80;
      } else if (fieldLower.includes(startsWithPattern)) {
        score = 50;
      } else {
        score = 10;
      }

      maxScore = Math.max(maxScore, score);
    }

    return { ...user, _searchScore: maxScore };
  });

  return scoredUsers
    .sort((a, b) => b._searchScore - a._searchScore)
    .slice(0, limit)
    .map((user) => {
      const { _searchScore, ...userWithoutScore } = user;
      return userWithoutScore;
    });
}

/**
 * Verify user's email
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function verifyEmail(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.verifyEmail(userId);
  }

  // Fallback to Mongoose
  const result = await updateUser(userId, { emailVerified: true });
  return !!result;
}

/**
 * Update user's password
 * @param {string} userId - User ID
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} Success status
 */
async function updatePassword(userId, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.updatePassword(userId, hashedPassword);
  }

  // Fallback to Mongoose
  const result = await updateUser(userId, { password: hashedPassword });
  return !!result;
}

/**
 * Update last login time
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    await userRepo.updateLastLogin(userId);
  } else {
    // Fallback to Mongoose
    await updateUser(userId, { lastLogin: new Date() });
  }
}

/**
 * Get users by role
 * @param {string} role - Role name
 * @returns {Promise<Array>} Array of users
 */
async function getUsersByRole(role) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.getUsersByRole(role);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return await User.find({ role }).select('-password').lean();
}

/**
 * Check if email exists
 * @param {string} email - Email
 * @returns {Promise<boolean>} Exists status
 */
async function emailExists(email) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.emailExists(email);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return !!(await User.exists({ email: email.toLowerCase() }));
}

/**
 * Check if username exists
 * @param {string} username - Username
 * @returns {Promise<boolean>} Exists status
 */
async function usernameExists(username) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.usernameExists(username);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return !!(await User.exists({ username: username.toLowerCase() }));
}

/**
 * Bulk create users
 * @param {Array} users - Array of user data
 * @returns {Promise<Array>} Created users
 */
async function bulkCreateUsers(users) {
  const normalizedUsers = users.map(user => ({
    ...user,
    email: user.email?.toLowerCase(),
    username: user.username?.toLowerCase(),
  }));

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.bulkCreate(normalizedUsers);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return await User.insertMany(normalizedUsers);
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {Promise<string>} JWT token
 */
async function generateToken(user) {
  if (!user) {
    throw new Error('No user provided');
  }

  let expires = 1000 * 60 * 15; // 15 minutes default

  if (process.env.SESSION_EXPIRY) {
    try {
      const evaluated = eval(process.env.SESSION_EXPIRY);
      if (evaluated) {
        expires = evaluated;
      }
    } catch (error) {
      logger.warn('Invalid SESSION_EXPIRY expression, using default:', error);
    }
  }

  return await signPayload({
    payload: {
      id: user._id,
      username: user.username,
      provider: user.provider,
      email: user.email,
    },
    secret: process.env.JWT_SECRET,
    expirationTime: expires / 1000,
  });
}

/**
 * Toggle user memories setting
 * @param {string} userId - User ID
 * @param {boolean} memoriesEnabled - Memories enabled status
 * @returns {Promise<Object|null>} Updated user or null
 */
async function toggleUserMemories(userId, memoriesEnabled) {
  const updateData = {
    'personalization.memories': memoriesEnabled,
  };

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');

    // First check if user exists
    const user = await userRepo.findById(userId);
    if (!user) return null;

    return await userRepo.update(userId, updateData);
  }

  // Fallback to Mongoose
  const User = getUserModel();

  // First check if user exists
  const user = await User.findById(userId);
  if (!user) return null;

  const updateOperation = {
    $set: {
      'personalization.memories': memoriesEnabled,
    },
  };

  return await User.findByIdAndUpdate(userId, updateOperation, {
    new: true,
    runValidators: true,
  }).lean();
}

/**
 * Find user with populated roles
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User with populated roles or null
 */
async function findWithRoles(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.findWithRoles(userId);
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return await User.findById(userId).populate('role').lean();
}

/**
 * Compare password
 * @param {Object} user - User object
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} Match status
 */
async function comparePassword(user, candidatePassword) {
  if (!user) {
    throw new Error('No user provided');
  }

  if (!user.password) {
    throw new Error('No password, likely an email first registered via Social/OIDC login');
  }

  return await bcrypt.compare(candidatePassword, user.password);
}

/**
 * Get all users (for admin)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of users
 */
async function getAllUsers(options = {}) {
  const { limit = 100, skip = 0, sort = { createdAt: -1 }, select = '-password' } = options;

  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.find({}, { limit, skip, sort, select });
  }

  // Fallback to Mongoose
  const User = getUserModel();
  return await User.find({})
    .select(select)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();
}

module.exports = {
  // Core CRUD operations
  findUser,
  findByEmail,
  findByUsername,
  findByProviderId,
  getUserById,
  countUsers,
  createUser,
  updateUser,
  deleteUserById,
  bulkCreateUsers,
  getAllUsers,

  // Authentication
  comparePassword,
  generateToken,
  verifyEmail,
  updatePassword,
  updateLastLogin,

  // Search and filtering
  searchUsers,
  getUsersByRole,
  findWithRoles,

  // Validation
  emailExists,
  usernameExists,

  // Features
  toggleUserMemories,
};