const { logger } = require('@librechat/data-schemas');

/**
 * Simple cache service with in-memory and optional Redis support
 */
class SimpleCache {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
    
    // Initialize Redis if available
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      this.initRedis();
    }
  }

  async initRedis() {
    try {
      const Redis = require('ioredis');
      
      if (process.env.REDIS_URL) {
        this.redisClient = new Redis(process.env.REDIS_URL);
      } else {
        this.redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
        });
      }

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err.message);
        // Fall back to memory cache only
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis cache connected successfully');
      });

      // Test connection
      await this.redisClient.ping();
    } catch (error) {
      logger.warn('Redis not available, using memory cache only:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    // Try memory cache first
    if (this.memoryCache.has(key)) {
      this.stats.hits++;
      return this.memoryCache.get(key);
    }

    // Try Redis if available
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          this.stats.hits++;
          const parsed = JSON.parse(value);
          // Store in memory cache for faster access
          this.memoryCache.set(key, parsed);
          return parsed;
        }
      } catch (error) {
        logger.error('Redis get error:', error.message);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttlSeconds = 300) {
    this.stats.sets++;
    
    // Store in memory cache
    this.memoryCache.set(key, value);
    
    // Cleanup memory cache if too large
    if (this.memoryCache.size > 1000) {
      const keysToDelete = Array.from(this.memoryCache.keys()).slice(0, 100);
      keysToDelete.forEach(k => this.memoryCache.delete(k));
    }

    // Store in Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (error) {
        logger.error('Redis set error:', error.message);
      }
    }

    return true;
  }

  /**
   * Delete from cache
   */
  async del(key) {
    this.memoryCache.delete(key);
    
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        logger.error('Redis del error:', error.message);
      }
    }
    
    return true;
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern) {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from Redis if available
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        logger.error('Redis clear pattern error:', error.message);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      memoryCacheSize: this.memoryCache.size,
      redisEnabled: !!this.redisClient,
    };
  }
}

// Singleton instance
let cacheInstance = null;

const getCache = () => {
  if (!cacheInstance) {
    cacheInstance = new SimpleCache();
  }
  return cacheInstance;
};

module.exports = {
  getCache,
  SimpleCache,
};