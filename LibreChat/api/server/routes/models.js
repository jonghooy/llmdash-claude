const express = require('express');
const { modelController } = require('~/server/controllers/ModelController');
const { requireJwtAuth } = require('~/server/middleware/');
const { cacheMiddleware } = require('~/server/middleware/cache');

const router = express.Router();
router.get('/', 
  requireJwtAuth,
  cacheMiddleware({ 
    ttl: 600, // Cache for 10 minutes
    userSpecific: true // Cache per user
  }),
  modelController
);

module.exports = router;
