const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { getAdminAgentIntegration } = require('../services/AdminAgentIntegration');

const router = express.Router();

/**
 * Get all agents from Admin Dashboard
 * This endpoint is used internally by LibreChat to fetch Admin-managed agents
 */
router.get('/', async (req, res) => {
  try {
    // Check if Admin Agent integration is enabled
    if (process.env.ENABLE_ADMIN_AGENTS !== 'true') {
      return res.json({ agents: [] });
    }

    const userId = req.user?.id || 'system';
    const adminAgentIntegration = getAdminAgentIntegration();

    // Fetch agents from Admin Dashboard
    const agents = await adminAgentIntegration.getAgentsForLibreChat(userId);

    logger.info(`[AdminAgents] Fetched ${agents.length} agents for user ${userId}`);

    res.json({ agents });
  } catch (error) {
    logger.error('[AdminAgents] Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch admin agents' });
  }
});

/**
 * Get a specific agent by ID
 */
router.get('/:agentId', async (req, res) => {
  try {
    if (process.env.ENABLE_ADMIN_AGENTS !== 'true') {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const { agentId } = req.params;
    const userId = req.user?.id || 'system';
    const adminAgentIntegration = getAdminAgentIntegration();

    const agent = await adminAgentIntegration.getAgentById(agentId, userId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    logger.error('[AdminAgents] Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

/**
 * Update agent usage statistics
 */
router.post('/:agentId/usage', async (req, res) => {
  try {
    if (process.env.ENABLE_ADMIN_AGENTS !== 'true') {
      return res.json({ success: true });
    }

    const { agentId } = req.params;
    const { tokensUsed = 0 } = req.body;
    const adminAgentIntegration = getAdminAgentIntegration();

    await adminAgentIntegration.updateAgentUsage(agentId, tokensUsed);

    res.json({ success: true });
  } catch (error) {
    logger.error('[AdminAgents] Error updating usage:', error);
    res.json({ success: false });
  }
});

module.exports = router;