const express = require('express');
const { getCache } = require('~/server/services/simpleCache');
const { requireJwtAuth } = require('~/server/middleware/');

const router = express.Router();

// Cache statistics endpoint (admin only)
router.get('/stats', requireJwtAuth, async (req, res) => {
  try {
    const cache = getCache();
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

module.exports = router;