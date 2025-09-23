/**
 * Database Operations Abstraction Layer
 * This module provides a unified interface for database operations
 * that can switch between direct Mongoose models and dbGateway repositories
 */

const { logger } = require('@librechat/data-schemas');

// Lazy require to avoid circular dependencies
function getModels() {
  return require('~/models');
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
 * User operations
 */
async function findUser(filter, select) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');

      if (filter.email) {
        return await userRepo.findByEmail(filter.email);
      }
      if (filter.username) {
        return await userRepo.findByUsername(filter.username);
      }
      return await userRepo.findOne(filter, { select });
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for findUser, falling back to Mongoose:', error.message);
      // Fall back to Mongoose
    }
  }

  const models = getModels();
  return models.findUser(filter, select);
}

async function createUser(userData, balance, disableTTL, skipBalance) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      // Note: dbGateway version may need to handle balance differently
      return await userRepo.create(userData);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for createUser, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.createUser(userData, balance, disableTTL, skipBalance);
}

async function updateUser(userId, update) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      return await userRepo.update(userId, update);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for updateUser, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.updateUser(userId, update);
}

async function getUserById(userId) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      return await userRepo.findById(userId);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for getUserById, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.getUserById(userId);
}

async function countUsers() {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      return await userRepo.count({});
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for countUsers, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.countUsers();
}

async function deleteUserById(userId) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const userRepo = await getRepository('User');
      return await userRepo.delete(userId);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for deleteUserById, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.deleteUserById(userId);
}

/**
 * Token operations
 */
async function findToken(query) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const tokenRepo = await getRepository('Token');
      return await tokenRepo.findToken(query);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for findToken, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.findToken(query);
}

async function createToken(tokenData) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const tokenRepo = await getRepository('Token');
      return await tokenRepo.createToken(tokenData);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for createToken, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.createToken(tokenData);
}

async function deleteTokens(query) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const tokenRepo = await getRepository('Token');
      return await tokenRepo.deleteTokens(query);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for deleteTokens, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.deleteTokens(query);
}

/**
 * Session operations
 */
async function findSession(params, options) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const sessionRepo = await getRepository('Session');
      // Note: dbGateway may not support all options
      return await sessionRepo.findSession(params);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for findSession, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.findSession(params, options);
}

async function createSession(userId, options) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const sessionRepo = await getRepository('Session');
      return await sessionRepo.createSession(userId, options);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for createSession, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.createSession(userId, options);
}

async function deleteSession(params) {
  if (isDbGatewayEnabled()) {
    try {
      const { getRepository } = getLazyGateway();
      const sessionRepo = await getRepository('Session');
      return await sessionRepo.deleteSession(params);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for deleteSession, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.deleteSession(params);
}

/**
 * Auth token operations (these remain with Mongoose for now)
 */
async function generateToken(user) {
  const models = getModels();
  return models.generateToken(user);
}

async function generateRefreshToken(session) {
  // If dbGateway is enabled and session is from dbGateway
  if (isDbGatewayEnabled() && session && !session.save) {
    try {
      const { getRepository } = getLazyGateway();
      const sessionRepo = await getRepository('Session');
      return await sessionRepo.generateRefreshToken(session);
    } catch (error) {
      logger.debug('[dbOperations] Error using dbGateway for generateRefreshToken, falling back to Mongoose:', error.message);
    }
  }

  const models = getModels();
  return models.generateRefreshToken(session);
}

// Export all functions
module.exports = {
  // User operations
  findUser,
  createUser,
  updateUser,
  getUserById,
  countUsers,
  deleteUserById,

  // Token operations
  findToken,
  createToken,
  deleteTokens,

  // Session operations
  findSession,
  createSession,
  deleteSession,

  // Auth token operations
  generateToken,
  generateRefreshToken,
};