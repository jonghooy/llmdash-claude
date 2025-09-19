#!/bin/bash

# Send initialization
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}}},"id":1}'

# Send memory_create tool call
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"memory_create","arguments":{"content":"Test memory from MCP bridge","tenant_id":"default","user_id":"test-user"}},"id":2}'
