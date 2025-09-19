/**
 * Memory API Routes for LLMDash
 */

const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../middleware/');
const MemoryService = require('../services/MemoryService');
const { logger } = require('@librechat/data-schemas');

/**
 * Initialize memory service on server start (non-blocking)
 */
setTimeout(() => {
  MemoryService.initialize().catch(err => {
    logger.warn('Memory service initialization failed - feature will be disabled', { error: err.message });
  });
}, 5000); // Delayed initialization to avoid blocking server start

/**
 * Search memory
 */
router.post('/search', requireJwtAuth, async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const userId = req.user.id;

    // Get user's team from database (placeholder for now)
    const teamId = req.user.team || 'dev';
    options.teamId = teamId;

    const results = await MemoryService.searchAllMemory(userId, query, options);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('Memory search error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to search memory',
    });
  }
});

/**
 * Get memory context for a conversation
 */
router.post('/context', requireJwtAuth, async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    const userId = req.user.id;

    // Get user's team from database
    const teamId = req.user.team || 'dev';
    options.teamId = teamId;

    const context = await MemoryService.getConversationContext(userId, prompt, options);

    res.json({
      success: true,
      context,
    });
  } catch (error) {
    logger.error('Failed to get memory context', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get memory context',
    });
  }
});

/**
 * Save conversation to memory
 */
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { conversation, options = {} } = req.body;
    const userId = req.user.id;

    // Get user's team
    const teamId = req.user.team || 'dev';
    options.teamId = teamId;

    // Determine if conversation should be saved to team/business levels
    if (conversation.shareWithTeam) {
      options.saveToTeam = true;
    }

    if (conversation.importance === 'high' || conversation.shareWithOrganization) {
      options.saveToBusiness = true;
    }

    const results = await MemoryService.saveConversation(userId, conversation, options);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('Failed to save conversation to memory', {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to save conversation',
    });
  }
});

/**
 * Update user profile in memory
 */
router.post('/profile', requireJwtAuth, async (req, res) => {
  try {
    const { profile } = req.body;
    const userId = req.user.id;

    const success = await MemoryService.updateUserProfile(userId, profile);

    res.json({
      success,
    });
  } catch (error) {
    logger.error('Failed to update user profile in memory', {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

/**
 * Get memory statistics
 */
router.get('/stats', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = req.user.team || 'dev';

    const stats = await MemoryService.getMemoryStats(userId, teamId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get memory stats', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

/**
 * Get available memory levels
 */
router.get('/levels', requireJwtAuth, async (req, res) => {
  try {
    const levels = MemoryService.getAvailableLevels();
    const isAvailable = MemoryService.isAvailable();

    res.json({
      success: true,
      available: isAvailable,
      levels,
    });
  } catch (error) {
    logger.error('Failed to get memory levels', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get memory levels',
    });
  }
});

/**
 * Test memory connection
 */
router.get('/test', requireJwtAuth, async (req, res) => {
  try {
    const isAvailable = MemoryService.isAvailable();

    if (!isAvailable) {
      // Try to reinitialize
      await MemoryService.initialize();
    }

    res.json({
      success: true,
      available: MemoryService.isAvailable(),
      levels: MemoryService.getAvailableLevels(),
    });
  } catch (error) {
    logger.error('Memory test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Memory service test failed',
    });
  }
});

/**
 * Add or update memory via MCP protocol
 * POST /api/memory/add
 */
router.post('/add', requireJwtAuth, async (req, res) => {
  try {
    const { entityName, content } = req.body;

    if (!entityName || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityName and content'
      });
    }

    logger.info(`[Memory API] Adding memory via MCP: ${entityName}`);

    const result = await MemoryService.addMemory(entityName, content);

    if (result) {
      logger.info(`[Memory API] Successfully added memory for: ${entityName}`);
      res.json({
        success: true,
        message: `Memory added for entity: ${entityName}`,
        result
      });
    } else {
      throw new Error('Failed to add memory');
    }
  } catch (error) {
    logger.error('[Memory API] Add memory error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to add memory: ${error.message}`
    });
  }
});

/**
 * Update memory file directly (for LLMDash project info)
 * POST /api/memory/update-file
 */
router.post('/update-file', requireJwtAuth, async (req, res) => {
  try {
    const { filePath, content } = req.body;
    const fs = require('fs').promises;
    const path = require('path');

    if (!filePath || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filePath and content'
      });
    }

    // Memory storage path
    const MEMORY_PATH = '/home/jonghooy/work/llmdash-claude/memory-storage';

    // Security: prevent path traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(MEMORY_PATH, normalizedPath);

    // Ensure the path is still within MEMORY_PATH
    if (!fullPath.startsWith(MEMORY_PATH)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }

    logger.info(`[Memory API] Updating memory file: ${normalizedPath}`);

    // Create parent directories if needed
    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Write the content
    await fs.writeFile(fullPath, content, 'utf-8');

    logger.info(`[Memory API] Successfully updated: ${normalizedPath}`);

    res.json({
      success: true,
      message: `Memory file updated: ${normalizedPath}`,
      filePath: normalizedPath
    });
  } catch (error) {
    logger.error('[Memory API] Update file error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to update memory file: ${error.message}`
    });
  }
});

/**
 * Read memory file directly
 * GET /api/memory/read-file
 */
router.get('/read-file', requireJwtAuth, async (req, res) => {
  try {
    const { filePath } = req.query;
    const fs = require('fs').promises;
    const path = require('path');

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing file path parameter'
      });
    }

    // Memory storage path
    const MEMORY_PATH = '/home/jonghooy/work/llmdash-claude/memory-storage';

    // Security: prevent path traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(MEMORY_PATH, normalizedPath);

    // Ensure the path is still within MEMORY_PATH
    if (!fullPath.startsWith(MEMORY_PATH)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }

    logger.info(`[Memory API] Reading memory file: ${normalizedPath}`);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `Memory file not found: ${normalizedPath}`
      });
    }

    // Read the content
    const content = await fs.readFile(fullPath, 'utf-8');

    res.json({
      success: true,
      filePath: normalizedPath,
      content
    });
  } catch (error) {
    logger.error('[Memory API] Read file error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to read memory file: ${error.message}`
    });
  }
});

module.exports = router;