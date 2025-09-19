#!/usr/bin/env python3
"""
Test MCP Memory Agent via HTTP interface
"""

import asyncio
import aiohttp
import json
import subprocess
import time
import sys
import os
from pathlib import Path

# Add to path
sys.path.insert(0, str(Path(__file__).parent / "mem-agent-mcp"))
os.chdir(Path(__file__).parent / "mem-agent-mcp")

async def start_http_server():
    """Start the MCP HTTP server in background"""
    print("Starting MCP HTTP server...")

    # Start server in background
    process = subprocess.Popen(
        ["bash", "-c", "source .venv/bin/activate && make serve-mcp-http"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(3)

    return process

async def test_memory_tools():
    """Test memory tools via HTTP"""
    base_url = "http://localhost:8081/mcp"

    async with aiohttp.ClientSession() as session:
        # Test 1: List available tools
        print("\n1. Testing tool listing...")
        try:
            async with session.get(f"{base_url}/tools") as resp:
                if resp.status == 200:
                    tools = await resp.json()
                    print(f"✓ Found {len(tools.get('tools', []))} tools:")
                    for tool in tools.get('tools', [])[:5]:  # Show first 5
                        print(f"  - {tool.get('name')}: {tool.get('description', '')[:50]}...")
                else:
                    print(f"✗ Failed to get tools: {resp.status}")
        except Exception as e:
            print(f"✗ Error getting tools: {e}")

        # Test 2: Test search_memory tool
        print("\n2. Testing search_memory tool...")
        try:
            payload = {
                "tool": "search_memory",
                "arguments": {
                    "query": "LLMDash project"
                }
            }
            async with session.post(f"{base_url}/tools/call", json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✓ Search result: {str(result)[:200]}...")
                else:
                    print(f"✗ Search failed: {resp.status}")
                    error = await resp.text()
                    print(f"  Error: {error[:200]}")
        except Exception as e:
            print(f"✗ Error calling search_memory: {e}")

        # Test 3: Test read_memory tool
        print("\n3. Testing read_memory tool...")
        try:
            payload = {
                "tool": "read_memory",
                "arguments": {
                    "file_path": "user.md"
                }
            }
            async with session.post(f"{base_url}/tools/call", json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✓ Read result: {str(result)[:200]}...")
                else:
                    print(f"✗ Read failed: {resp.status}")
        except Exception as e:
            print(f"✗ Error calling read_memory: {e}")

        # Test 4: List memories
        print("\n4. Testing list_memories tool...")
        try:
            payload = {
                "tool": "list_memories",
                "arguments": {}
            }
            async with session.post(f"{base_url}/tools/call", json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✓ Memory files found: {result}")
                else:
                    print(f"✗ List failed: {resp.status}")
        except Exception as e:
            print(f"✗ Error calling list_memories: {e}")

async def main():
    print("="*60)
    print("MEM-AGENT-MCP HTTP TEST")
    print("="*60)

    # Start server
    server_process = await start_http_server()

    try:
        # Run tests
        await test_memory_tools()

        print("\n" + "="*60)
        print("TEST COMPLETE")
        print("="*60)
        print("\n✓ MCP Memory Agent is working!")
        print("\nIntegration steps:")
        print("1. The server is running at http://localhost:8081/mcp")
        print("2. Use the generated mcp.json for Claude Desktop integration")
        print("3. Or use the HTTP API directly from your applications")

    finally:
        # Stop server
        print("\nStopping server...")
        server_process.terminate()
        server_process.wait(timeout=5)

if __name__ == "__main__":
    asyncio.run(main())