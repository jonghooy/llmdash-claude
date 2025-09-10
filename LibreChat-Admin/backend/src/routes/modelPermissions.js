const express = require('express');
const ModelPermission = require('../models/ModelPermission');
const router = express.Router();

// GET /api/model-permissions - Get all model permissions
router.get('/', async (req, res) => {
  try {
    const permissions = await ModelPermission.find().sort({ modelId: 1 });
    
    // If no permissions exist, create defaults for known models
    if (permissions.length === 0) {
      const defaultModels = [
        { modelId: 'claude-opus-4-1-20250805', provider: 'anthropic', enabled: true },
        { modelId: 'claude-sonnet-4-20250514', provider: 'anthropic', enabled: true },
        { modelId: 'gemini-2.5-flash', provider: 'google', enabled: true },
        { modelId: 'gemini-2.5-pro', provider: 'google', enabled: true },
        { modelId: 'gpt-4.1', provider: 'openai', enabled: true },
        { modelId: 'gpt-5', provider: 'openai', enabled: true }
      ];
      
      const createdPermissions = await ModelPermission.insertMany(defaultModels);
      return res.json(createdPermissions);
    }
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching model permissions:', error);
    res.status(500).json({ error: 'Failed to fetch model permissions' });
  }
});

// GET /api/model-permissions/:modelId - Get specific model permission
router.get('/:modelId', async (req, res) => {
  try {
    const permission = await ModelPermission.findOne({ modelId: req.params.modelId });
    
    if (!permission) {
      return res.status(404).json({ error: 'Model permission not found' });
    }
    
    res.json(permission);
  } catch (error) {
    console.error('Error fetching model permission:', error);
    res.status(500).json({ error: 'Failed to fetch model permission' });
  }
});

// POST /api/model-permissions - Create or update model permission
router.post('/', async (req, res) => {
  try {
    const { modelId, provider, enabled, disabledReason, restrictions } = req.body;
    
    const permission = await ModelPermission.findOneAndUpdate(
      { modelId },
      {
        $set: {
          modelId,
          provider,
          enabled,
          disabledReason: enabled ? '' : disabledReason,
          restrictions,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.json({
      success: true,
      data: permission,
      message: `Model ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error updating model permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update model permission'
    });
  }
});

// PATCH /api/model-permissions/:modelId/toggle - Toggle model enabled status
router.patch('/:modelId/toggle', async (req, res) => {
  try {
    const { enabled, disabledReason } = req.body;
    
    const permission = await ModelPermission.findOneAndUpdate(
      { modelId: req.params.modelId },
      {
        $set: {
          enabled,
          disabledReason: enabled ? '' : disabledReason,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!permission) {
      // Create new permission if it doesn't exist
      const newPermission = await ModelPermission.create({
        modelId: req.params.modelId,
        provider: req.body.provider || 'unknown',
        enabled,
        disabledReason: enabled ? '' : disabledReason
      });
      
      return res.json({
        success: true,
        data: newPermission,
        message: `Model ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    }
    
    res.json({
      success: true,
      data: permission,
      message: `Model ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling model permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle model permission'
    });
  }
});

// PUT /api/model-permissions/:modelId/restrictions - Update model restrictions
router.put('/:modelId/restrictions', async (req, res) => {
  try {
    const { maxTokens, maxRequestsPerDay, allowedUsers, blockedUsers } = req.body;
    
    const permission = await ModelPermission.findOneAndUpdate(
      { modelId: req.params.modelId },
      {
        $set: {
          'restrictions.maxTokens': maxTokens,
          'restrictions.maxRequestsPerDay': maxRequestsPerDay,
          'restrictions.allowedUsers': allowedUsers,
          'restrictions.blockedUsers': blockedUsers,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!permission) {
      return res.status(404).json({ error: 'Model permission not found' });
    }
    
    res.json({
      success: true,
      data: permission,
      message: 'Model restrictions updated successfully'
    });
  } catch (error) {
    console.error('Error updating model restrictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update model restrictions'
    });
  }
});

// DELETE /api/model-permissions/:modelId - Delete model permission
router.delete('/:modelId', async (req, res) => {
  try {
    const permission = await ModelPermission.findOneAndDelete({ modelId: req.params.modelId });
    
    if (!permission) {
      return res.status(404).json({ error: 'Model permission not found' });
    }
    
    res.json({
      success: true,
      message: 'Model permission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting model permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete model permission'
    });
  }
});

module.exports = router;