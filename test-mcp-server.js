#!/usr/bin/env node

/**
 * Simple test MCP server for demonstration
 * This server provides basic file operations and math tools
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');

// Create server instance
const server = new Server(
  {
    name: 'test-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to read',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to write',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'calculate',
        description: 'Perform a mathematical calculation',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate (e.g., "2 + 2")',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'get_current_time',
        description: 'Get the current date and time',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file': {
        const filePath = path.resolve(args.path);
        // Restrict to /tmp for safety
        if (!filePath.startsWith('/tmp')) {
          throw new Error('File access restricted to /tmp directory');
        }
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `File content of ${args.path}:\n${content}`,
            },
          ],
        };
      }

      case 'write_file': {
        const filePath = path.resolve(args.path);
        // Restrict to /tmp for safety
        if (!filePath.startsWith('/tmp')) {
          throw new Error('File access restricted to /tmp directory');
        }
        await fs.writeFile(filePath, args.content, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote ${args.content.length} characters to ${args.path}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const dirPath = path.resolve(args.path);
        // Restrict to /tmp for safety
        if (!dirPath.startsWith('/tmp')) {
          throw new Error('Directory access restricted to /tmp directory');
        }
        const files = await fs.readdir(dirPath);
        return {
          content: [
            {
              type: 'text',
              text: `Files in ${args.path}:\n${files.join('\n')}`,
            },
          ],
        };
      }

      case 'calculate': {
        // Simple safe math evaluation
        const result = Function('"use strict"; return (' + args.expression + ')')();
        return {
          content: [
            {
              type: 'text',
              text: `${args.expression} = ${result}`,
            },
          ],
        };
      }

      case 'get_current_time': {
        const now = new Date();
        return {
          content: [
            {
              type: 'text',
              text: `Current time: ${now.toLocaleString()}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});