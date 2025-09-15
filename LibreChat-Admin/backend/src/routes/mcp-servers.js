const express = require('express');
const router = express.Router();
const MCPServer = require('../models/MCPServer');
const { spawn } = require('child_process');
const axios = require('axios');

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (apiKey && internalApiKey && apiKey === internalApiKey) {
    req.userId = 'internal-service';
    req.userRole = 'admin';
    return next();
  }

  // Check for JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

// Get all MCP servers accessible by user
router.get('/', checkAuth, async (req, res) => {
  try {
    const { organizationId, teamIds } = req.query;
    
    let query = {
      isActive: true,
      deletedAt: null
    };
    
    if (req.userRole !== 'admin') {
      query.$or = [
        { isPublic: true },
        { organization: organizationId },
        { teams: { $in: teamIds || [] } },
        { allowedUsers: req.userId }
      ];
    }
    
    const servers = await MCPServer.find(query)
      // .populate('organization', 'name')  // Organization model not yet implemented
      // .populate('teams', 'name')  // Teams model not yet implemented
      // .populate('createdBy', 'name email')  // User model not yet implemented
      .sort('-createdAt');
    
    res.json({ servers });
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    res.status(500).json({ error: 'Failed to fetch MCP servers' });
  }
});

// Get single MCP server by ID
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
      // .populate('organization', 'name')  // Organization model not yet implemented
      // .populate('teams', 'name')  // Teams model not yet implemented
      // .populate('createdBy', 'name email')  // User model not yet implemented
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    res.json(server);
  } catch (error) {
    console.error('Error fetching MCP server:', error);
    res.status(500).json({ error: 'Failed to fetch MCP server' });
  }
});

// Create new MCP server
router.post('/', checkAuth, async (req, res) => {
  try {
    const serverData = {
      ...req.body,
      createdBy: req.userId,
      updatedBy: req.userId
    };
    
    const server = new MCPServer(serverData);
    await server.save();
    
    res.status(201).json(server);
  } catch (error) {
    console.error('Error creating MCP server:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'MCP server with this name already exists in the organization' });
    }
    res.status(500).json({ error: 'Failed to create MCP server' });
  }
});

// Update MCP server
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    Object.assign(server, req.body, {
      updatedBy: req.userId
    });
    
    await server.save();
    res.json(server);
  } catch (error) {
    console.error('Error updating MCP server:', error);
    res.status(500).json({ error: 'Failed to update MCP server' });
  }
});

// Delete MCP server (soft delete)
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    await server.softDelete();
    res.json({ message: 'MCP server deleted successfully' });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    res.status(500).json({ error: 'Failed to delete MCP server' });
  }
});

// Test MCP server connection
router.post('/:id/test', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    const startTime = Date.now();
    let success = false;
    let error = null;
    
    try {
      if (server.connectionType === 'stdio') {
        // Test stdio connection
        const child = spawn(server.command, server.args || [], {
          env: { ...process.env, ...Object.fromEntries(server.env || new Map()) },
          timeout: server.config?.timeout || 30000
        });
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('Connection timeout'));
          }, 5000);
          
          child.on('spawn', () => {
            clearTimeout(timeout);
            child.kill();
            resolve();
          });
          
          child.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
        
        success = true;
      } else if (server.connectionType === 'sse' || server.connectionType === 'websocket') {
        // Test HTTP/WebSocket connection
        const response = await axios.get(server.url, {
          headers: Object.fromEntries(server.headers || new Map()),
          timeout: 5000
        });
        
        success = response.status < 400;
      }
    } catch (err) {
      error = err.message;
    }
    
    const responseTime = Date.now() - startTime;
    
    // Update health status
    await server.updateHealthStatus(
      success ? 'healthy' : 'unhealthy',
      responseTime
    );
    
    if (error) {
      await server.recordError(error);
    }
    
    res.json({
      success,
      status: success ? 'healthy' : 'unhealthy',
      responseTime,
      error
    });
  } catch (error) {
    console.error('Error testing MCP server:', error);
    res.status(500).json({ error: 'Failed to test MCP server' });
  }
});

// Get MCP server statistics
router.get('/:id/stats', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    res.json({
      stats: server.stats,
      healthCheck: server.healthCheck,
      toolCount: server.toolCount,
      resourceCount: server.resourceCount
    });
  } catch (error) {
    console.error('Error fetching MCP server stats:', error);
    res.status(500).json({ error: 'Failed to fetch MCP server statistics' });
  }
});

// Discover tools from MCP server
router.post('/:id/discover', checkAuth, async (req, res) => {
  try {
    const server = await MCPServer.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'MCP server not found' });
    }
    
    // This would normally connect to the MCP server and discover available tools
    // For now, return a placeholder response
    res.json({
      message: 'Tool discovery would be implemented here',
      server: server.name
    });
  } catch (error) {
    console.error('Error discovering MCP server tools:', error);
    res.status(500).json({ error: 'Failed to discover MCP server tools' });
  }
});

// Bulk operations
router.post('/bulk/activate', checkAuth, async (req, res) => {
  try {
    const { serverIds } = req.body;
    
    const result = await MCPServer.updateMany(
      { _id: { $in: serverIds } },
      { isActive: true, updatedBy: req.userId }
    );
    
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error('Error activating MCP servers:', error);
    res.status(500).json({ error: 'Failed to activate MCP servers' });
  }
});

router.post('/bulk/deactivate', checkAuth, async (req, res) => {
  try {
    const { serverIds } = req.body;
    
    const result = await MCPServer.updateMany(
      { _id: { $in: serverIds } },
      { isActive: false, updatedBy: req.userId }
    );
    
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error('Error deactivating MCP servers:', error);
    res.status(500).json({ error: 'Failed to deactivate MCP servers' });
  }
});

module.exports = router;