#!/usr/bin/env node

const express = require('express');
const { EventSource } = require('eventsource');
const axios = require('axios');
// const { v4: uuidv4 } = require('uuid'); // Not needed, using Date.now() instead

const app = express();
app.use(express.json());

const MEMORY_ENTERPRISE_BASE = 'http://localhost:8005';
const PORT = 8006;

// Store active sessions
const sessions = new Map();

// Create SSE endpoint for MCP SDK
app.get('/sse', (req, res) => {
  console.log('[Bridge] New SSE connection request');

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Create a unique session for Memory Enterprise
  const sessionId = `bridge-${Date.now()}`;
  const streamUrl = `${MEMORY_ENTERPRISE_BASE}/mcp/jsonrpc-sse/stream/${sessionId}`;

  console.log(`[Bridge] Creating session: ${sessionId}`);

  // Connect to Memory Enterprise SSE stream
  const eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    console.log(`[Bridge] Connected to Memory Enterprise for session ${sessionId}`);
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[Bridge] Received from Memory Enterprise:`, data);

      // Forward to client
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('[Bridge] Error parsing message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error(`[Bridge] SSE error for session ${sessionId}:`, error);
    eventSource.close();
    sessions.delete(sessionId);
    res.end();
  };

  // Store session info
  sessions.set(sessionId, {
    eventSource,
    res
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[Bridge] Client disconnected, closing session ${sessionId}`);
    eventSource.close();
    sessions.delete(sessionId);
  });
});

// Handle JSON-RPC requests
app.post('/sse', async (req, res) => {
  console.log('[Bridge] Received POST request:', req.body);

  try {
    // Find or create session
    let sessionId = null;

    // Try to find an existing session
    for (const [sid, session] of sessions.entries()) {
      if (session.res) {
        sessionId = sid;
        break;
      }
    }

    if (!sessionId) {
      // Create new session
      sessionId = `bridge-${Date.now()}`;
      console.log(`[Bridge] Creating new session for POST: ${sessionId}`);
    }

    // Forward request to Memory Enterprise
    const requestUrl = `${MEMORY_ENTERPRISE_BASE}/mcp/jsonrpc-sse/request/${sessionId}`;
    const response = await axios.post(requestUrl, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Bridge] Response from Memory Enterprise:`, response.data);
    res.json(response.data);

  } catch (error) {
    console.error('[Bridge] Error forwarding request:', error.message);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message
      },
      id: req.body.id
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Bridge] Memory Enterprise SSE Bridge running on port ${PORT}`);
  console.log(`[Bridge] SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`[Bridge] Proxying to: ${MEMORY_ENTERPRISE_BASE}`);
});