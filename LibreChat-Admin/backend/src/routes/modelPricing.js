const express = require('express');
const ModelPricing = require('../models/ModelPricing');
const router = express.Router();

// GET /api/model-pricing - Get all model pricing entries
router.get('/', async (req, res) => {
  try {
    const { provider, status, tier } = req.query;
    
    // Build filter object
    const filter = {};
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    if (tier) filter['features.tier'] = tier;
    
    const pricings = await ModelPricing.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: pricings,
      count: pricings.length
    });
  } catch (error) {
    console.error('Error fetching model pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model pricing',
      error: error.message
    });
  }
});

// GET /api/model-pricing/:id - Get specific model pricing entry
router.get('/:id', async (req, res) => {
  try {
    const pricing = await ModelPricing.findById(req.params.id);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Model pricing not found'
      });
    }
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching model pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model pricing',
      error: error.message
    });
  }
});

// GET /api/model-pricing/by-model/:modelId - Get pricing by modelId
router.get('/by-model/:modelId', async (req, res) => {
  try {
    const pricing = await ModelPricing.findOne({ modelId: req.params.modelId });
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Model pricing not found'
      });
    }
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching model pricing by modelId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model pricing',
      error: error.message
    });
  }
});

// POST /api/model-pricing - Create new model pricing entry
router.post('/', async (req, res) => {
  try {
    const pricingData = req.body;
    
    // Check if modelId already exists
    const existingPricing = await ModelPricing.findOne({ modelId: pricingData.modelId });
    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'Pricing for this model ID already exists'
      });
    }
    
    // Set lastUpdated in pricing object
    if (pricingData.pricing) {
      pricingData.pricing.lastUpdated = new Date();
    }
    
    const pricing = new ModelPricing(pricingData);
    await pricing.save();
    
    res.status(201).json({
      success: true,
      data: pricing,
      message: 'Model pricing entry created successfully'
    });
  } catch (error) {
    console.error('Error creating model pricing entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create model pricing entry',
      error: error.message
    });
  }
});

// PUT /api/model-pricing/:id - Update model pricing entry
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    // Don't allow updating modelId through this endpoint
    delete updateData.modelId;
    
    // Update lastUpdated timestamp if pricing is being updated
    if (updateData.pricing) {
      updateData.pricing.lastUpdated = new Date();
    }
    
    const pricing = await ModelPricing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Model pricing not found'
      });
    }
    
    res.json({
      success: true,
      data: pricing,
      message: 'Model pricing entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating model pricing entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update model pricing entry',
      error: error.message
    });
  }
});

// DELETE /api/model-pricing/:id - Delete model pricing entry
router.delete('/:id', async (req, res) => {
  try {
    const pricing = await ModelPricing.findByIdAndDelete(req.params.id);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Model pricing not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Model pricing entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting model pricing entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete model pricing entry',
      error: error.message
    });
  }
});

// PATCH /api/model-pricing/:id/status - Update model pricing status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'deprecated', 'beta', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const pricing = await ModelPricing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Model pricing not found'
      });
    }
    
    res.json({
      success: true,
      data: pricing,
      message: `Model pricing status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating model pricing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update model pricing status',
      error: error.message
    });
  }
});

// GET /api/model-pricing/stats/summary - Get pricing statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await ModelPricing.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          deprecated: { $sum: { $cond: [{ $eq: ['$status', 'deprecated'] }, 1, 0] } },
          beta: { $sum: { $cond: [{ $eq: ['$status', 'beta'] }, 1, 0] } },
          avgPromptPrice: { $avg: '$pricing.prompt' },
          avgCompletionPrice: { $avg: '$pricing.completion' }
        }
      }
    ]);
    
    const providerStats = await ModelPricing.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          avgPromptPrice: { $avg: '$pricing.prompt' },
          avgCompletionPrice: { $avg: '$pricing.completion' }
        }
      }
    ]);
    
    const tierStats = await ModelPricing.aggregate([
      {
        $group: {
          _id: '$features.tier',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || { 
          total: 0, 
          active: 0, 
          deprecated: 0, 
          beta: 0,
          avgPromptPrice: 0,
          avgCompletionPrice: 0
        },
        providers: providerStats,
        tiers: tierStats
      }
    });
  } catch (error) {
    console.error('Error fetching pricing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing statistics',
      error: error.message
    });
  }
});

// POST /api/model-pricing/bulk-update - Bulk update pricing for multiple models
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and cannot be empty'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { modelId, ...updateData } = update;
        
        if (updateData.pricing) {
          updateData.pricing.lastUpdated = new Date();
        }
        
        const pricing = await ModelPricing.findOneAndUpdate(
          { modelId },
          updateData,
          { new: true, upsert: true, runValidators: true }
        );
        
        results.push(pricing);
      } catch (error) {
        errors.push({
          modelId: update.modelId,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        updated: results,
        errors: errors
      },
      message: `Successfully updated ${results.length} model pricing entries`
    });
  } catch (error) {
    console.error('Error bulk updating model pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update model pricing',
      error: error.message
    });
  }
});

module.exports = router;