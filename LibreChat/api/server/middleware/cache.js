const { getCache } = require('../services/simpleCache');
const { logger } = require('@librechat/data-schemas');

/**
 * Cache middleware for API responses
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {boolean} options.userSpecific - Whether to cache per user (default: false)
 * @param {Function} options.keyGenerator - Custom key generator function
 */
const cacheMiddleware = (options = {}) => {
  const { 
    ttl = 300, 
    userSpecific = false,
    keyGenerator,
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cache = getCache();
    
    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      const baseKey = `api:${req.path}`;
      const queryString = JSON.stringify(req.query || {});
      cacheKey = `${baseKey}:${queryString}`;
      
      if (userSpecific && req.user?.id) {
        cacheKey = `user:${req.user.id}:${cacheKey}`;
      }
    }

    // Try to get from cache
    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
    } catch (error) {
      logger.error('Cache get error:', error);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data) {
      res.set('X-Cache', 'MISS');
      
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl).catch((error) => {
          logger.error('Cache set error:', error);
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache invalidation middleware
 * Use this on routes that modify data
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    const cache = getCache();
    
    // Store original json/send methods
    const originalJson = res.json;
    const originalSend = res.send;

    const clearCache = async () => {
      try {
        await cache.clearPattern(pattern || req.path);
        logger.debug(`Cache invalidated for pattern: ${pattern || req.path}`);
      } catch (error) {
        logger.error('Cache invalidation error:', error);
      }
    };

    // Override methods to clear cache after successful response
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCache();
      }
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCache();
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};