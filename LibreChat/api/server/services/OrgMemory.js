const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

/**
 * Fetch organization memories from Admin Dashboard
 * @param {Array<string>} keywords - Keywords to search for relevant memories
 * @returns {Promise<Object>} - Memory data
 */
async function fetchOrgMemories(keywords = []) {
  try {
    // Admin backend API endpoint
    const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5001';
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

    logger.info('[OrgMemory] ========== FETCHING MEMORIES ==========');
    logger.info(`[OrgMemory] API URL: ${ADMIN_API_URL}/api/memory`);
    logger.info(`[OrgMemory] Using internal API key: ${!!INTERNAL_API_KEY}`);
    logger.info(`[OrgMemory] Keywords: ${JSON.stringify(keywords)}`);

    // Fetch all public memories using internal API key
    const response = await axios.get(`${ADMIN_API_URL}/api/memory`, {
      headers: {
        'X-API-Key': INTERNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        accessLevel: 'public',  // Only fetch public memories
        // You can add search parameters if needed
        // search: keywords.join(' ')
      }
    });

    logger.info(`[OrgMemory] Response status: ${response.status}`);
    logger.info(`[OrgMemory] Response data exists: ${!!response.data}`);
    logger.info(`[OrgMemory] Response has memories: ${!!response.data?.memories}`);

    if (!response.data || !response.data.memories) {
      logger.warn('[OrgMemory] No memories found in response');
      return {};
    }

    const memories = response.data.memories;
    const memoryMap = {};

    logger.info(`[OrgMemory] Total memories received: ${memories.length}`);
    
    // Convert to key-value map
    memories.forEach((memory, index) => {
      const valuePreview = typeof memory.value === 'string'
        ? memory.value.substring(0, 50) + '...'
        : JSON.stringify(memory.value).substring(0, 50) + '...';

      logger.info(`[OrgMemory] Memory ${index + 1}:`, {
        key: memory.key,
        isActive: memory.isActive,
        accessLevel: memory.accessLevel,
        value: valuePreview
      });
      
      if (memory.isActive && memory.accessLevel === 'public') {
        memoryMap[memory.key] = memory.value;
        logger.info(`[OrgMemory] ✓ Added to map: "${memory.key}"`);
      } else {
        logger.info(`[OrgMemory] ✗ Skipped: "${memory.key}" (active: ${memory.isActive}, access: ${memory.accessLevel})`);
      }
    });

    logger.info('[OrgMemory] Final memory map:', JSON.stringify(memoryMap, null, 2));
    logger.info('[OrgMemory] ========== END FETCHING MEMORIES ==========');
    return memoryMap;
  } catch (error) {
    logger.error('[OrgMemory] ========== ERROR FETCHING MEMORIES ==========');
    logger.error(`[OrgMemory] Error: ${error.message}`);
    logger.error(`[OrgMemory] Stack: ${error.stack}`);
    if (error.response) {
      logger.error(`[OrgMemory] Response status: ${error.response.status}`);
      logger.error(`[OrgMemory] Response data: ${JSON.stringify(error.response.data)}`);
    }
    return {};
  }
}

/**
 * Format organization memories into a system message
 * @param {Object} memories - Key-value map of memories
 * @returns {string} - Formatted system message
 */
function formatMemoriesAsSystemMessage(memories) {
  if (!memories || Object.keys(memories).length === 0) {
    return '';
  }

  const memoryTexts = [];
  
  // Add organization memories as context
  memoryTexts.push('=== Organization Knowledge Base ===');
  
  for (const [key, value] of Object.entries(memories)) {
    if (typeof value === 'string') {
      memoryTexts.push(`[${key}]: ${value}`);
    } else if (typeof value === 'object') {
      memoryTexts.push(`[${key}]: ${JSON.stringify(value, null, 2)}`);
    } else {
      memoryTexts.push(`[${key}]: ${value}`);
    }
  }
  
  memoryTexts.push('=== End of Organization Knowledge ===\n');
  
  return memoryTexts.join('\n');
}

/**
 * Get organization memory context for chat
 * @param {Object} req - Express request object
 * @returns {Promise<string>} - Formatted memory context
 */
async function getOrgMemoryContext(req) {
  try {
    logger.info('[OrgMemory Context] ========== START CONTEXT GENERATION ==========');

    // Check if organization memory is enabled
    const orgMemoryEnabled = process.env.ENABLE_ORG_MEMORY !== 'false';
    logger.info(`[OrgMemory Context] Memory enabled (env): ${orgMemoryEnabled}`);
    logger.info(`[OrgMemory Context] ENABLE_ORG_MEMORY env: ${process.env.ENABLE_ORG_MEMORY}`);

    if (!orgMemoryEnabled) {
      logger.warn('[OrgMemory Context] Memory disabled via environment variable');
      return '';
    }

    // Check if internal API key is configured
    const hasApiKey = !!process.env.INTERNAL_API_KEY;
    logger.info(`[OrgMemory Context] Internal API key configured: ${hasApiKey}`);

    if (!hasApiKey) {
      logger.warn('[OrgMemory Context] No internal API key configured, skipping memory fetch');
      return '';
    }

    // Extract keywords from the latest message (optional)
    const keywords = [];
    logger.info(`[OrgMemory Context] Request body: ${req?.body ? 'Present' : 'Missing'}`);
    logger.info(`[OrgMemory Context] Request text: ${req?.body?.text?.substring(0, 100) || 'No text'}`);

    if (req?.body && req.body.text) {
      // Simple keyword extraction - can be improved
      const words = req.body.text.toLowerCase().split(/\s+/);
      keywords.push(...words.filter(w => w.length > 3).slice(0, 5));
      logger.info(`[OrgMemory Context] Extracted keywords: ${JSON.stringify(keywords)}`);
    }

    // Fetch organization memories using internal API key
    logger.info('[OrgMemory Context] Calling fetchOrgMemories...');
    const memories = await fetchOrgMemories(keywords);
    logger.info(`[OrgMemory Context] Memories fetched: ${Object.keys(memories).length} items`);

    // Format as system message
    const contextMessage = formatMemoriesAsSystemMessage(memories);
    logger.info(`[OrgMemory Context] Context message generated, length: ${contextMessage.length}`);

    if (contextMessage) {
      logger.info('[OrgMemory Context] Context preview:', contextMessage.substring(0, 200) + '...');
    }

    logger.info('[OrgMemory Context] ========== END CONTEXT GENERATION ==========');
    return contextMessage;
  } catch (error) {
    logger.error('[OrgMemory Context] ========== ERROR IN CONTEXT GENERATION ==========');
    logger.error(`[OrgMemory Context] Error: ${error.message}`);
    logger.error(`[OrgMemory Context] Stack: ${error.stack}`);
    return '';
  }
}

module.exports = {
  fetchOrgMemories,
  formatMemoriesAsSystemMessage,
  getOrgMemoryContext
};