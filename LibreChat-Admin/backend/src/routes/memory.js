const express = require('express');
const router = express.Router();
const Memory = require('../models/Memory');

// Auth middleware - supports both JWT token and internal API key
const authMiddleware = (req, res, next) => {
  // Check for internal API key first (for service-to-service communication)
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
  const internalApiKey = process.env.INTERNAL_API_KEY;

  console.log('[Auth] Headers:', Object.keys(req.headers));
  console.log('[Auth] x-api-key header:', apiKey);
  console.log('[Auth] INTERNAL_API_KEY env:', internalApiKey);

  if (apiKey && internalApiKey && apiKey === internalApiKey) {
    console.log('[Auth] Internal API key authentication successful');
    req.userId = 'internal-service';
    req.userRole = 'admin';
    return next();
  }

  // Check for JWT token (for regular user authentication)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_please_change_this');
    req.userId = decoded.userId || decoded.id || 'admin';
    req.userRole = decoded.role || 'admin';
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all memories with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[Admin Memory GET] Request from user:', req.userId);
    console.log('[Admin Memory GET] Query params:', req.query);
    
    const { 
      category, 
      organizationId, 
      teamId, 
      tags, 
      search,
      accessLevel,
      limit = 100,
      offset = 0 
    } = req.query;

    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (organizationId) filter.organizationId = organizationId;
    if (teamId) filter.teamId = teamId;
    if (accessLevel) filter.accessLevel = accessLevel;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }
    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log('[Admin Memory GET] Filter applied:', JSON.stringify(filter, null, 2));

    const memories = await Memory.find(filter)
      .sort({ 'metadata.accessCount': -1, updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Memory.countDocuments(filter);

    console.log('[Admin Memory GET] Found memories:', memories.length);
    memories.forEach(mem => {
      const valuePreview = typeof mem.value === 'string' 
        ? mem.value.substring(0, 50) + '...' 
        : JSON.stringify(mem.value).substring(0, 50) + '...';
      console.log(`[Admin Memory GET] - ${mem.key}: ${valuePreview} (accessLevel: ${mem.accessLevel})`);
    });

    res.json({
      memories,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Get single memory by key
router.get('/key/:key', authMiddleware, async (req, res) => {
  try {
    const memory = await Memory.getByKey(req.params.key);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(memory);
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// Get single memory by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(memory);
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// Create new memory
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('[Admin Memory] Creating new memory with data:', JSON.stringify(req.body, null, 2));
    console.log('[Admin Memory] User ID:', req.userId);
    
    const memoryData = {
      ...req.body,
      metadata: {
        ...req.body.metadata,
        createdBy: req.userId,
        accessCount: 0
      }
    };

    console.log('[Admin Memory] Final memory data to save:', JSON.stringify(memoryData, null, 2));
    
    const memory = new Memory(memoryData);
    await memory.save();
    
    const valuePreview = typeof memory.value === 'string' 
      ? memory.value.substring(0, 100) + '...' 
      : JSON.stringify(memory.value).substring(0, 100) + '...';
    
    console.log('[Admin Memory] Memory saved successfully:', {
      id: memory._id,
      key: memory.key,
      category: memory.category,
      accessLevel: memory.accessLevel,
      value: valuePreview
    });
    
    res.status(201).json(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Memory with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Update memory
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      metadata: {
        ...req.body.metadata,
        updatedBy: req.userId
      }
    };

    const memory = await Memory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  } catch (error) {
    console.error('Error updating memory:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Memory with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Bulk upsert memories
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { memories } = req.body;
    if (!Array.isArray(memories)) {
      return res.status(400).json({ error: 'Memories must be an array' });
    }

    const memoriesWithMetadata = memories.map(memory => ({
      ...memory,
      metadata: {
        ...memory.metadata,
        createdBy: req.userId,
        updatedBy: req.userId,
        accessCount: 0
      }
    }));

    const result = await Memory.bulkUpsert(memoriesWithMetadata);
    res.json({
      success: true,
      upserted: result.upsertedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk upserting memories:', error);
    res.status(500).json({ error: 'Failed to bulk upsert memories' });
  }
});

// Delete memory (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const memory = await Memory.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        'metadata.updatedBy': req.userId
      },
      { new: true }
    );

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// Get memory categories
router.get('/meta/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Memory.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get memory statistics
router.get('/meta/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Memory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAccess: { $sum: '$metadata.accessCount' },
          avgAccess: { $avg: '$metadata.accessCount' },
          categories: { $addToSet: '$category' },
          types: { $addToSet: '$type' }
        }
      }
    ]);

    const categoryStats = await Memory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAccess: { $sum: '$metadata.accessCount' }
        }
      }
    ]);

    res.json({
      overall: stats[0] || { total: 0, totalAccess: 0, avgAccess: 0 },
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;