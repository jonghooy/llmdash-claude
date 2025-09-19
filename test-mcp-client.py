#!/usr/bin/env python3
"""
Test MCP Client - Connects to mem-agent-mcp server and tests functionality
"""

import asyncio
import json
import sys
import subprocess
from pathlib import Path

# Add MCP SDK path
sys.path.append(str(Path(__file__).parent / "mem-agent-mcp"))

async def test_mcp_server():
    """Test the MCP server with stdio transport"""

    print("=" * 60)
    print("MCP CLIENT TEST")
    print("=" * 60)

    try:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client

        print("\n1. Creating MCP client connection...")

        # Server parameters for our GPU-enabled MCP server
        server_params = StdioServerParameters(
            command="python",
            args=[
                str(Path(__file__).parent / "mem-agent-mcp" / "mcp_server_gpu.py")
            ],
            env={
                "PYTHONPATH": str(Path(__file__).parent / "mem-agent-mcp")
            }
        )

        print("   Server command:", server_params.command)
        print("   Server args:", server_params.args)

        # Connect to the server
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                print("\n2. ✓ Connected to MCP server!")

                # Initialize the connection
                await session.initialize()
                print("   ✓ Session initialized")

                # List available tools
                print("\n3. Available tools:")
                tools_response = await session.list_tools()
                tools = tools_response.tools if hasattr(tools_response, 'tools') else []

                for tool in tools:
                    print(f"   - {tool.name}: {tool.description[:50]}...")

                if not tools:
                    print("   ⚠ No tools available")
                    return

                # Test the main tool: use_memory_agent
                print("\n4. Testing memory agent tool...")

                test_queries = [
                    "What is LLMDash?",
                    "Tell me about the mem-agent-mcp project",
                    "What technologies are being used?"
                ]

                for i, query in enumerate(test_queries, 1):
                    print(f"\n   Query {i}: {query}")

                    try:
                        # Call the tool
                        result = await session.call_tool(
                            "use_memory_agent",
                            {"question": query}
                        )

                        # Parse result
                        if hasattr(result, 'content'):
                            response = result.content
                            if isinstance(response, list) and len(response) > 0:
                                text = response[0].text if hasattr(response[0], 'text') else str(response[0])
                            else:
                                text = str(response)
                        else:
                            text = str(result)

                        print(f"   Response: {text[:150]}...")

                    except Exception as e:
                        print(f"   ✗ Error: {e}")

                # Test system info tool if available
                print("\n5. Testing system info...")
                try:
                    result = await session.call_tool("get_system_info", {})
                    if hasattr(result, 'content'):
                        info = json.loads(result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0]))
                        print(f"   GPU Available: {info.get('gpu_available', False)}")
                        if info.get('gpu_available'):
                            print(f"   GPU Name: {info.get('gpu_name', 'N/A')}")
                            print(f"   GPU Memory: {info.get('gpu_memory_allocated_gb', 0):.2f} / {info.get('gpu_memory_total_gb', 0):.1f} GB")
                except Exception as e:
                    print(f"   System info not available: {e}")

                print("\n" + "=" * 60)
                print("✓ MCP Server Test Complete!")
                print("=" * 60)

    except ImportError as e:
        print(f"\n✗ Error: MCP SDK not found. Install with:")
        print(f"  pip install mcp")
        print(f"\nError details: {e}")
    except Exception as e:
        print(f"\n✗ Connection error: {e}")
        import traceback
        traceback.print_exc()


async def test_direct_server():
    """Alternative: Test the server directly without MCP protocol"""

    print("\n" + "=" * 60)
    print("DIRECT SERVER TEST (Fallback)")
    print("=" * 60)

    # Import the server module directly
    sys.path.insert(0, str(Path(__file__).parent / "mem-agent-mcp"))

    try:
        from mcp_server_gpu import (
            initialize_model,
            use_memory_agent,
            get_system_info,
            list_memories
        )

        print("\n1. Initializing model...")
        initialize_model()
        print("   ✓ Model initialized")

        print("\n2. Testing memory agent...")
        response = await use_memory_agent("What is LLMDash?")
        print(f"   Response: {response[:150]}...")

        print("\n3. Getting system info...")
        info = await get_system_info()
        print(f"   {info}")

        print("\n4. Listing memories...")
        memories = await list_memories()
        print(f"   {memories}")

        print("\n✓ Direct server test complete!")

    except Exception as e:
        print(f"\n✗ Direct test error: {e}")
        import traceback
        traceback.print_exc()


def check_gpu_status():
    """Check current GPU status"""

    print("\n" + "=" * 60)
    print("GPU STATUS CHECK")
    print("=" * 60)

    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu',
             '--format=csv,noheader'],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            data = result.stdout.strip().split(', ')
            print(f"\nGPU: {data[0]}")
            print(f"Memory: {data[1]} / {data[2]}")
            print(f"Utilization: {data[3]}")
            print(f"Temperature: {data[4]}")
        else:
            print("✗ Could not get GPU status")

    except Exception as e:
        print(f"✗ GPU check error: {e}")


async def main():
    """Main test function"""

    # Check GPU first
    check_gpu_status()

    # Try MCP protocol test
    try:
        await test_mcp_server()
    except Exception as e:
        print(f"\nMCP test failed: {e}")
        print("\nTrying direct server test...")
        await test_direct_server()

    # Check GPU after tests
    check_gpu_status()

    print("\n✓ All tests complete!")


if __name__ == "__main__":
    asyncio.run(main())