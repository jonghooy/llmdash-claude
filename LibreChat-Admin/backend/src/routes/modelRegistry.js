const express = require('express');
const ModelRegistry = require('../models/ModelRegistry');
const router = express.Router();

// GET /api/model-registry - Get all model registry entries
router.get('/', async (req, res) => {
  try {
    const { provider, enabled, userSelectable } = req.query;
    
    // Build filter object
    const filter = {};
    if (provider) filter.provider = provider;
    if (enabled !== undefined) filter.enabled = enabled === 'true';
    if (userSelectable !== undefined) filter.userSelectable = userSelectable === 'true';
    
    const models = await ModelRegistry.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    console.error('Error fetching model registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model registry',
      error: error.message
    });
  }
});

// GET /api/model-registry/:id - Get specific model registry entry
router.get('/:id', async (req, res) => {
  try {
    const model = await ModelRegistry.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model',
      error: error.message
    });
  }
});

// POST /api/model-registry - Create new model registry entry
router.post('/', async (req, res) => {
  try {
    const modelData = req.body;
    
    // Check if modelId already exists
    const existingModel = await ModelRegistry.findOne({ modelId: modelData.modelId });
    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: 'Model with this ID already exists'
      });
    }
    
    const model = new ModelRegistry(modelData);
    await model.save();
    
    res.status(201).json({
      success: true,
      data: model,
      message: 'Model registry entry created successfully'
    });
  } catch (error) {
    console.error('Error creating model registry entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create model registry entry',
      error: error.message
    });
  }
});

// PUT /api/model-registry/:id - Update model registry entry
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    // Don't allow updating modelId through this endpoint
    delete updateData.modelId;
    
    const model = await ModelRegistry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      data: model,
      message: 'Model registry entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating model registry entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update model registry entry',
      error: error.message
    });
  }
});

// DELETE /api/model-registry/:id - Delete model registry entry
router.delete('/:id', async (req, res) => {
  try {
    const model = await ModelRegistry.findByIdAndDelete(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Model registry entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting model registry entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete model registry entry',
      error: error.message
    });
  }
});

// PATCH /api/model-registry/:id/toggle-enabled - Toggle enabled status
router.patch('/:id/toggle-enabled', async (req, res) => {
  try {
    const model = await ModelRegistry.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    model.enabled = !model.enabled;
    await model.save();
    
    res.json({
      success: true,
      data: model,
      message: `Model ${model.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling model status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle model status',
      error: error.message
    });
  }
});

// GET /api/model-registry/stats/summary - Get registry statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await ModelRegistry.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          enabled: { $sum: { $cond: ['$enabled', 1, 0] } },
          disabled: { $sum: { $cond: ['$enabled', 0, 1] } },
          userSelectable: { $sum: { $cond: ['$userSelectable', 1, 0] } }
        }
      }
    ]);
    
    const providerStats = await ModelRegistry.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          enabled: { $sum: { $cond: ['$enabled', 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, enabled: 0, disabled: 0, userSelectable: 0 },
        providers: providerStats
      }
    });
  } catch (error) {
    console.error('Error fetching registry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registry statistics',
      error: error.message
    });
  }
});

module.exports = router;