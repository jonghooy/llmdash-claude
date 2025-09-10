const express = require('express');
const ApiKey = require('../models/ApiKey');
const router = express.Router();

// Test functions for each provider
async function testOpenAIKey(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        message: `Successfully connected. Found ${data.data.length} models.`,
        models: data.data.map(m => m.id).slice(0, 5) // Return first 5 model IDs
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        message: 'Invalid API key. Please check your OpenAI API key.'
      };
    } else {
      return {
        isValid: false,
        message: `API returned status ${response.status}`
      };
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Connection error: ${error.message}`
    };
  }
}

async function testGoogleKey(apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        message: `Successfully connected. Found ${data.models?.length || 0} models.`,
        models: data.models?.map(m => m.name).slice(0, 5) || []
      };
    } else if (response.status === 403 || response.status === 401) {
      return {
        isValid: false,
        message: 'Invalid API key. Please check your Google AI API key.'
      };
    } else {
      return {
        isValid: false,
        message: `API returned status ${response.status}`
      };
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Connection error: ${error.message}`
    };
  }
}

async function testAnthropicKey(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    
    if (response.ok) {
      return {
        isValid: true,
        message: 'Successfully connected to Anthropic API.',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        message: 'Invalid API key. Please check your Anthropic API key.'
      };
    } else if (response.status === 400) {
      // 400 might mean the key works but request format issue
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.type === 'invalid_request_error') {
        return {
          isValid: true,
          message: 'API key is valid. Connection successful.',
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
        };
      }
      return {
        isValid: false,
        message: errorData.error?.message || `API returned status ${response.status}`
      };
    } else {
      return {
        isValid: false,
        message: `API returned status ${response.status}`
      };
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Connection error: ${error.message}`
    };
  }
}

// GET /api/api-keys - Get all API keys (without actual keys)
router.get('/', async (req, res) => {
  try {
    const apiKeys = await ApiKey.find().select('-apiKey');
    
    // Initialize default entries if none exist
    if (apiKeys.length === 0) {
      const defaults = [
        { provider: 'openai', displayKey: 'Not configured', isValid: false },
        { provider: 'google', displayKey: 'Not configured', isValid: false },
        { provider: 'anthropic', displayKey: 'Not configured', isValid: false }
      ];
      
      res.json(defaults);
    } else {
      // Ensure all providers are represented
      const providers = ['openai', 'google', 'anthropic'];
      const result = providers.map(provider => {
        const existing = apiKeys.find(k => k.provider === provider);
        if (existing) {
          return existing;
        }
        return {
          provider,
          displayKey: 'Not configured',
          isValid: false
        };
      });
      
      res.json(result);
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// POST /api/api-keys - Save or update an API key
router.post('/', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }
    
    // Create display key (first 6 and last 4 characters)
    let displayKey = 'Key set';
    if (apiKey.length > 10) {
      displayKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4);
    }
    
    // Save or update the key
    const existingKey = await ApiKey.findOne({ provider });
    
    if (existingKey) {
      existingKey.apiKey = apiKey;
      existingKey.displayKey = displayKey;
      existingKey.isValid = false; // Reset validation
      existingKey.lastTested = null;
      existingKey.testResult = '';
      await existingKey.save();
      
      res.json({
        success: true,
        message: `${provider} API key updated successfully`,
        data: {
          provider,
          displayKey,
          isValid: false
        }
      });
    } else {
      const newKey = await ApiKey.create({
        provider,
        apiKey,
        displayKey,
        isValid: false
      });
      
      res.json({
        success: true,
        message: `${provider} API key saved successfully`,
        data: {
          provider,
          displayKey: newKey.displayKey,
          isValid: false
        }
      });
    }
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// POST /api/api-keys/test - Test an API key
router.post('/test', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }
    
    let testResult;
    
    // Test the API key based on provider
    switch (provider) {
      case 'openai':
        testResult = await testOpenAIKey(apiKey);
        break;
      case 'google':
        testResult = await testGoogleKey(apiKey);
        break;
      case 'anthropic':
        testResult = await testAnthropicKey(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider' });
    }
    
    // Update the stored key's validation status if it exists
    const existingKey = await ApiKey.findOne({ provider });
    if (existingKey && existingKey.displayKey === (apiKey.length > 10 ? apiKey.slice(0, 6) + '...' + apiKey.slice(-4) : 'Key set')) {
      existingKey.isValid = testResult.isValid;
      existingKey.lastTested = new Date();
      existingKey.testResult = testResult.message;
      if (testResult.models) {
        existingKey.modelAccess = testResult.models;
      }
      await existingKey.save();
    }
    
    res.json({
      success: true,
      ...testResult
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({ 
      success: false,
      isValid: false,
      message: `Error testing API key: ${error.message}` 
    });
  }
});

// DELETE /api/api-keys/:provider - Delete an API key
router.delete('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const result = await ApiKey.findOneAndDelete({ provider });
    
    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({
      success: true,
      message: `${provider} API key deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// PATCH /api/api-keys/:provider/toggle - Enable/disable an API key
router.patch('/:provider/toggle', async (req, res) => {
  try {
    const { provider } = req.params;
    const { enabled } = req.body;
    
    const apiKey = await ApiKey.findOne({ provider });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    apiKey.enabled = enabled;
    await apiKey.save();
    
    res.json({
      success: true,
      message: `${provider} API key ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        provider,
        enabled
      }
    });
  } catch (error) {
    console.error('Error toggling API key:', error);
    res.status(500).json({ error: 'Failed to toggle API key' });
  }
});

module.exports = router;