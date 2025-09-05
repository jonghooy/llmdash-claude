const express = require('express');
const endpointController = require('~/server/controllers/EndpointController');
const { cacheMiddleware } = require('~/server/middleware/cache');

const router = express.Router();
router.get('/', 
  cacheMiddleware({ 
    ttl: 300, // Cache for 5 minutes
    userSpecific: true 
  }),
  endpointController
);

module.exports = router;
