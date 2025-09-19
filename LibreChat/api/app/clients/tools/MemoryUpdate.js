const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { sendEvent } = require('@librechat/api');
const MemoryService = require('~/server/services/MemoryService');

class MemoryUpdateTool extends Tool {
  constructor(fields = {}) {
    super(fields);
    this.name = 'memory_update';
    this.description = 'Update or add information to the organization memory storage. Use this when users ask to save, update, or modify information about projects, entities, or any organizational knowledge.';
    this.schema = z.object({
      entityName: z.string().describe('The name of the entity or topic to update (e.g., "llmdash", "project-x", "meeting-notes")'),
      content: z.string().describe('The information to add or update for this entity'),
      operation: z.enum(['add', 'update', 'replace']).default('add').describe('How to apply the update: add (append), update (modify existing), or replace (overwrite all)')
    });
    this.override = fields.override || true;
    this.memoryService = null;
    this.res = fields.res || null; // Response object for SSE
  }

  async _call({ entityName, content, operation = 'add' }) {
    try {
      console.log('='.repeat(60));
      console.log('[MCP DEBUG] MemoryUpdateTool._call() invoked');
      console.log('[MCP DEBUG] Entity:', entityName);
      console.log('[MCP DEBUG] Operation:', operation);
      console.log('[MCP DEBUG] Content length:', content.length);
      console.log('[MCP DEBUG] Has res object:', !!this.res);
      console.log('='.repeat(60));

      logger.info(`[MemoryUpdateTool] Updating memory for entity: ${entityName}`);
      logger.info(`[MemoryUpdateTool] Operation: ${operation}`);
      logger.info(`[MemoryUpdateTool] Content length: ${content.length}`);

      // Send notification to user via SSE
      if (this.res) {
        sendEvent(this.res, {
          message: true,
          text: '\n🔄 [MCP 서버 접속 중] 메모리 업데이트 서비스에 연결하고 있습니다...\n',
          initial: false,
          stream: false
        });
      }

      // Initialize memory service if not already done
      if (!this.memoryService) {
        const memoryEnabled = process.env.MEMORY_MCP_ENABLED !== 'false';
        const memoryUrl = process.env.MEMORY_MCP_URL || 'http://localhost:8001';

        console.log('[MCP DEBUG] Memory enabled:', memoryEnabled);
        console.log('[MCP DEBUG] Memory URL:', memoryUrl);

        if (!memoryEnabled) {
          if (this.res) {
            sendEvent(this.res, {
              message: true,
              text: '❌ 메모리 업데이트 서비스가 비활성화되어 있습니다.\n',
              initial: false,
              stream: false
            });
          }
          return 'Memory update service is not enabled. Please contact the administrator.';
        }

        console.log('[MCP DEBUG] Creating MemoryService instance...');
        this.memoryService = new MemoryService({ memoryUrl });
        console.log('[MCP DEBUG] Initializing MemoryService...');
        await this.memoryService.initialize();
        console.log('[MCP DEBUG] MemoryService initialized successfully');

        if (this.res) {
          sendEvent(this.res, {
            message: true,
            text: '✅ MCP 서버에 성공적으로 연결되었습니다.\n',
            initial: false,
            stream: false
          });
        }
      }

      // Send processing notification
      if (this.res) {
        sendEvent(this.res, {
          message: true,
          text: `📝 "${entityName}"에 대한 메모리를 업데이트하고 있습니다...\n`,
          initial: false,
          stream: false
        });
      }

      // Perform the update using MCP protocol
      console.log('[MCP DEBUG] Calling memoryService.addMemory()...');
      const result = await this.memoryService.addMemory(entityName, content);
      console.log('[MCP DEBUG] addMemory result:', result);

      logger.info(`[MemoryUpdateTool] Update successful for ${entityName}`);

      // Send success notification
      if (this.res) {
        sendEvent(this.res, {
          message: true,
          text: `✅ "${entityName}"에 대한 메모리가 성공적으로 업데이트되었습니다.\n`,
          initial: false,
          stream: false
        });
      }

      return `Successfully updated memory for "${entityName}". The information has been saved and will be available in future conversations.`;
    } catch (error) {
      logger.error('[MemoryUpdateTool] Error updating memory:', error);

      // Send error notification
      if (this.res) {
        sendEvent(this.res, {
          message: true,
          text: `❌ 메모리 업데이트 실패: ${error.message}\n`,
          initial: false,
          stream: false
        });
      }

      return `Failed to update memory: ${error.message}. Please try again or contact support if the issue persists.`;
    }
  }
}

module.exports = MemoryUpdateTool;