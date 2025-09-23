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
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');

    if (filter.email) {
      return await userRepo.findByEmail(filter.email);
    }
    if (filter.username) {
      return await userRepo.findByUsername(filter.username);
    }
    return await userRepo.findOne(filter, { select });
  }

  const models = getModels();
  return models.findUser(filter, select);
}

async function createUser(userData, balance, disableTTL, skipBalance) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    // Note: dbGateway version may need to handle balance differently
    return await userRepo.create(userData);
  }

  const models = getModels();
  return models.createUser(userData, balance, disableTTL, skipBalance);
}

async function updateUser(userId, update) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.update(userId, update);
  }

  const models = getModels();
  return models.updateUser(userId, update);
}

async function getUserById(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.findById(userId);
  }

  const models = getModels();
  return models.getUserById(userId);
}

async function countUsers() {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.count({});
  }

  const models = getModels();
  return models.countUsers();
}

async function deleteUserById(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const userRepo = await getRepository('User');
    return await userRepo.delete(userId);
  }

  const models = getModels();
  return models.deleteUserById(userId);
}

/**
 * Token operations
 */
async function findToken(query) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const tokenRepo = await getRepository('Token');
    return await tokenRepo.findToken(query);
  }

  const models = getModels();
  return models.findToken(query);
}

async function createToken(tokenData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const tokenRepo = await getRepository('Token');
    return await tokenRepo.createToken(tokenData);
  }

  const models = getModels();
  return models.createToken(tokenData);
}

async function deleteTokens(query) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const tokenRepo = await getRepository('Token');
    return await tokenRepo.deleteTokens(query);
  }

  const models = getModels();
  return models.deleteTokens(query);
}

/**
 * Session operations
 */
async function findSession(params, options) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const sessionRepo = await getRepository('Session');
    // Note: dbGateway may not support all options
    return await sessionRepo.findSession(params);
  }

  const models = getModels();
  return models.findSession(params, options);
}

async function createSession(userId, options) {
  // Always use Mongoose for createSession since it needs document methods
  // dbGateway returns plain objects that don't have save() method
  const models = getModels();
  return models.createSession(userId, options);
}

async function deleteSession(params) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const sessionRepo = await getRepository('Session');
    return await sessionRepo.deleteSession(params);
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
  // Always use Mongoose for generateRefreshToken since it needs document methods
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