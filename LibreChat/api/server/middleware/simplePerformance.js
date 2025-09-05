const { logger } = require('@librechat/data-schemas');

/**
 * Simple performance monitoring middleware
 * Tracks response time for API requests
 */
const simplePerformanceMonitor = () => {
  return (req, res, next) => {
    // Only monitor API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    res.end = function(...args) {
      const duration = Date.now() - startTime;
      
      // Add response time header only if headers haven't been sent
      if (!res.headersSent) {
        res.set('X-Response-Time', `${duration}ms`);
      }

      // Log slow requests (over 100ms)
      if (duration > 100) {
        logger.warn(`Slow API response: ${req.method} ${req.path} - ${duration}ms`);
      }

      // Call original end function
      originalEnd.apply(res, args);
    };

    next();
  };
};

module.exports = simplePerformanceMonitor;