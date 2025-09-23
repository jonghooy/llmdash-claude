const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const { connectDb } = require('./connect');
const indexSync = require('./indexSync');

createModels(mongoose);

// Export dbGateway functionality if enabled
const useDbGateway = process.env.USE_DB_GATEWAY === 'true';
if (useDbGateway) {
  const { initDbGateway, getRepository, executeTransaction, closeDbGateway } = require('./gateway');
  module.exports = {
    connectDb: initDbGateway, // Use dbGateway initialization instead
    indexSync,
    getRepository,
    executeTransaction,
    closeDbGateway,
  };
} else {
  module.exports = { connectDb, indexSync };
}
