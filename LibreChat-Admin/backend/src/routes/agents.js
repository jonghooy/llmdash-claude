const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Prompt = require('../models/Prompt');
const MCPServer = require('../models/MCPServer');

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  // Check for Internal API Key first
  const internalApiKey = req.headers['x-api-key'];
  if (internalApiKey === process.env.INTERNAL_API_KEY) {
    req.isInternalApi = true;
    return next();
  }

  // Check for JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // For now, just pass through if token exists
  // In production, verify JWT properly
  next();
};

// Get all agents
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      type,
      isPublic,
      isActive,
      search,
      organization,
      limit = 50,
      offset = 0
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (type) query.type = type;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (organization) query.organization = organization;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const agents = await Agent.find(query)
      .populate('prompts', 'name category')
      .populate('mcpServers', 'name connectionType isActive')
      .sort({ usageCount: -1, rating: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Agent.countDocuments(query);

    res.json({
      agents,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get single agent
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('prompts')
      .populate('mcpServers')
      .populate('organization', 'name')
      .populate('teams', 'name');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create new agent
router.post('/', authMiddleware, async (req, res) => {
  try {
    const agentData = req.body;

    // Validate MCP servers exist
    if (agentData.mcpServers && agentData.mcpServers.length > 0) {
      const servers = await MCPServer.find({
        _id: { $in: agentData.mcpServers },
        isActive: true
      });

      if (servers.length !== agentData.mcpServers.length) {
        return res.status(400).json({ error: 'Some MCP servers are invalid or inactive' });
      }

      // Auto-populate tools from MCP servers
      const mcpTools = [];
      for (const server of servers) {
        if (server.tools && server.tools.length > 0) {
          server.tools.forEach(tool => {
            mcpTools.push({
              name: `${server.name}:${tool}`,
              enabled: true,
              config: { serverId: server._id }
            });
          });
        }
      }
      agentData.tools = [...(agentData.tools || []), ...mcpTools];
    }

    // Validate prompts exist
    if (agentData.prompts && agentData.prompts.length > 0) {
      const prompts = await Prompt.find({ _id: { $in: agentData.prompts } });
      if (prompts.length !== agentData.prompts.length) {
        return res.status(400).json({ error: 'Some prompts are invalid' });
      }
    }

    const agent = new Agent(agentData);
    await agent.save();

    const populatedAgent = await Agent.findById(agent._id)
      .populate('prompts', 'name category')
      .populate('mcpServers', 'name connectionType');

    res.status(201).json(populatedAgent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Re-validate MCP servers if updated
    if (updates.mcpServers) {
      const servers = await MCPServer.find({
        _id: { $in: updates.mcpServers },
        isActive: true
      });

      if (servers.length !== updates.mcpServers.length) {
        return res.status(400).json({ error: 'Some MCP servers are invalid or inactive' });
      }
    }

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      {
        ...updates,
        updatedBy: req.user?._id
      },
      { new: true, runValidators: true }
    )
    .populate('prompts', 'name category')
    .populate('mcpServers', 'name connectionType');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Agent deactivated successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Duplicate agent
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const newAgent = await agent.duplicate(req.body.name);
    const populatedAgent = await Agent.findById(newAgent._id)
      .populate('prompts', 'name category')
      .populate('mcpServers', 'name connectionType');

    res.status(201).json(populatedAgent);
  } catch (error) {
    console.error('Error duplicating agent:', error);
    res.status(500).json({ error: 'Failed to duplicate agent' });
  }
});

// Test agent
router.post('/:id/test', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('prompts')
      .populate('mcpServers');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Simple test response
    const testResponse = {
      status: 'ready',
      agent: agent.name,
      model: agent.model,
      toolsCount: agent.tools.length,
      mcpServersCount: agent.mcpServers.length,
      promptsCount: agent.prompts.length,
      capabilities: agent.capabilities,
      testMessage: `Agent "${agent.name}" is configured and ready to use.`
    };

    res.json(testResponse);
  } catch (error) {
    console.error('Error testing agent:', error);
    res.status(500).json({ error: 'Failed to test agent' });
  }
});

// Update usage statistics
router.post('/:id/usage', authMiddleware, async (req, res) => {
  try {
    const { tokensUsed = 0 } = req.body;
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await agent.incrementUsage(tokensUsed);
    res.json({ message: 'Usage updated successfully' });
  } catch (error) {
    console.error('Error updating usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

// Rate agent
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await agent.updateRating(rating);
    res.json({ message: 'Rating updated successfully' });
  } catch (error) {
    console.error('Error rating agent:', error);
    res.status(500).json({ error: 'Failed to rate agent' });
  }
});

// Get agent statistics
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const stats = {
      usageCount: agent.usageCount,
      totalTokens: agent.totalTokens,
      successRate: agent.successRate,
      avgResponseTime: agent.avgResponseTime,
      rating: agent.rating,
      ratingCount: agent.ratingCount,
      lastUsed: agent.lastUsed,
      avgTokensPerUse: agent.usageCount > 0 ? Math.round(agent.totalTokens / agent.usageCount) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({ error: 'Failed to fetch agent statistics' });
  }
});

// Get popular agents
router.get('/popular/list', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const agents = await Agent.findPopular(parseInt(limit));
    res.json(agents);
  } catch (error) {
    console.error('Error fetching popular agents:', error);
    res.status(500).json({ error: 'Failed to fetch popular agents' });
  }
});

module.exports = router;