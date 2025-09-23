const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const { connectDb } = require('./connect');
const indexSync = require('./indexSync');

// Create models for Mongoose
createModels(mongoose);

// Check if dbGateway is enabled
const useDbGateway = process.env.USE_DB_GATEWAY === 'true';

if (useDbGateway) {
  const lazyGateway = require('./lazyGateway');

  // Create a wrapped connectDb that initializes both Mongoose and dbGateway
  async function connectDbWithGateway() {
    // First connect with Mongoose (needed for models)
    await connectDb();
    // Then initialize dbGateway
    await lazyGateway.initDbGateway();
    return true;
  }

  module.exports = {
    connectDb: connectDbWithGateway,
    indexSync,
    // Export gateway functions
    getRepository: lazyGateway.getRepository,
    getRepositorySync: lazyGateway.getRepositorySync,
    executeTransaction: lazyGateway.executeTransaction,
    closeDbGateway: lazyGateway.closeDbGateway,
    isGatewayInitialized: lazyGateway.isGatewayInitialized,
  };
} else {
  // Standard Mongoose-only exports
  module.exports = {
    connectDb,
    indexSync,
  };
}