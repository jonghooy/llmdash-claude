const { logger } = require('@librechat/data-schemas');

/**
 * Response time monitoring middleware
 * Tracks API response times and logs slow requests
 */
function responseTimeMiddleware(req, res, next) {
  const startTime = Date.now();

  // Store original res.json and res.send methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override res.json to add timing
  res.json = function(data) {
    const responseTime = Date.now() - startTime;

    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);

    // Log slow requests (>3 seconds)
    if (responseTime > 3000) {
      logger.warn(`Slow API response: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Log very slow requests (>10 seconds) as errors
    if (responseTime > 10000) {
      logger.error(`Very slow API response: ${req.method} ${req.path} - ${responseTime}ms`, {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        responseTime
      });
    }

    return originalJson.call(this, data);
  };

  // Override res.send to add timing for non-JSON responses
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);

    if (responseTime > 3000) {
      logger.warn(`Slow API response: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Enhanced SSE response time monitoring for chat endpoints
 */
function sseResponseTimeMiddleware(req, res, next) {
  const startTime = Date.now();

  // Track first byte sent (time to first response)
  const originalWrite = res.write;
  let firstByteTime = null;

  res.write = function(chunk, encoding) {
    if (firstByteTime === null) {
      firstByteTime = Date.now() - startTime;
      res.set('X-First-Byte-Time', `${firstByteTime}ms`);

      // Log slow first response times
      if (firstByteTime > 5000) {
        logger.warn(`Slow first response: ${req.method} ${req.path} - ${firstByteTime}ms to first byte`);
      }
    }

    return originalWrite.call(this, chunk, encoding);
  };

  // Track connection end
  res.on('finish', () => {
    const totalTime = Date.now() - startTime;
    logger.info(`SSE completed: ${req.method} ${req.path} - ${totalTime}ms total, ${firstByteTime || 'N/A'}ms to first byte`);
  });

  next();
}

/**
 * Performance monitoring for specific endpoints
 */
function createEndpointMonitor(endpointName, slowThreshold = 5000) {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      if (responseTime > slowThreshold) {
        logger.warn(`[${endpointName}] Slow response: ${responseTime}ms`, {
          endpoint: endpointName,
          method: req.method,
          path: req.path,
          responseTime,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
}

module.exports = {
  responseTimeMiddleware,
  sseResponseTimeMiddleware,
  createEndpointMonitor
};