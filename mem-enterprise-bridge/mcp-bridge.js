#!/usr/bin/env node

/**
 * MCP Bridge for Memory Enterprise
 * This bridges to Memory Enterprise stdio server
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

// Environment variables for tenant and user
const TENANT_ID = process.env.TENANT_ID || 'default';
const USER_ID = process.env.USER_ID || 'system';

// Path to Memory Enterprise project directory
const PROJECT_DIR = process.env.PROJECT_DIR || '/home/jonghooy/work/llmdash-claude/memory-enterprise';
const STDIO_SERVER_PATH = 'src/mcp/stdio_server.py';

// Spawn the stdio server process using Poetry virtualenv Python directly
const PYTHON_PATH = '/root/.cache/pypoetry/virtualenvs/memory-agent-enterprise-CFpEst9h-py3.12/bin/python';
const serverProcess = spawn(PYTHON_PATH, [STDIO_SERVER_PATH], {
  cwd: PROJECT_DIR,
  env: {
    ...process.env,
    LOG_LEVEL: 'INFO',
    TENANT_ID: TENANT_ID,
    USER_ID: USER_ID
  }
});

// Handle server stdout (responses from Memory Enterprise)
serverProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

// Handle server stderr (log messages)
serverProcess.stderr.on('data', (data) => {
  process.stderr.write(`[Memory Enterprise] ${data}`);
});

// Handle server process errors
serverProcess.on('error', (error) => {
  process.stderr.write(`[Memory Enterprise] Failed to start stdio server: ${error.message}\n`);
  process.exit(1);
});

// Handle server process exit
serverProcess.on('close', (code) => {
  process.stderr.write(`[Memory Enterprise] stdio server exited with code ${code}\n`);
  process.exit(code || 0);
});

// Create readline interface for stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

// Process incoming requests from LibreChat and forward to stdio server
rl.on('line', (line) => {
  try {
    // Parse the incoming request
    const request = JSON.parse(line);

    // Enhance params with tenant_id and user_id if it's a tool call
    if (request.method === 'tools/call' && request.params) {
      if (!request.params.arguments) {
        request.params.arguments = {};
      }
      request.params.arguments.tenant_id = request.params.arguments.tenant_id || TENANT_ID;
      request.params.arguments.user_id = request.params.arguments.user_id || USER_ID;
    }

    // Forward the request to stdio server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  } catch (error) {
    // Send error response
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: error.message
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

// Log initialization
process.stderr.write('[Memory Enterprise Bridge] Started\n');
process.stderr.write(`[Memory Enterprise Bridge] TENANT_ID: ${TENANT_ID}\n`);
process.stderr.write(`[Memory Enterprise Bridge] USER_ID: ${USER_ID}\n`);
process.stderr.write(`[Memory Enterprise Bridge] PROJECT_DIR: ${PROJECT_DIR}\n`);
process.stderr.write(`[Memory Enterprise Bridge] Using Poetry to run: ${STDIO_SERVER_PATH}\n`);