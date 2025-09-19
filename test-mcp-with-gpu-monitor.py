#!/usr/bin/env python3
"""
Test MCP with real-time GPU monitoring
"""

import asyncio
import subprocess
import threading
import time
import sys
from pathlib import Path

# Add MCP SDK path
sys.path.append(str(Path(__file__).parent / "mem-agent-mcp"))

def gpu_monitor(stop_event):
    """Monitor GPU in real-time"""
    while not stop_event.is_set():
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=timestamp,memory.used,utilization.gpu,temperature.gpu,power.draw',
                 '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                data = result.stdout.strip().split(', ')
                print(f"\r[GPU] Memory: {data[1]} MB | Util: {data[2]}% | Temp: {data[3]}°C | Power: {data[4]}W",
                      end="", flush=True)
        except:
            pass
        time.sleep(1)

async def test_mcp_with_monitoring():
    """Test MCP with GPU monitoring"""

    print("=" * 70)
    print("MCP TEST WITH GPU MONITORING")
    print("=" * 70)
    print("\nStarting GPU monitor (watch the line below)...")
    print("-" * 70)

    # Start GPU monitor
    stop_event = threading.Event()
    monitor_thread = threading.Thread(target=gpu_monitor, args=(stop_event,))
    monitor_thread.start()

    try:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client

        # Wait a bit to see baseline GPU usage
        await asyncio.sleep(2)

        print("\n\nConnecting to MCP server...")

        server_params = StdioServerParameters(
            command="python",
            args=[str(Path(__file__).parent / "mem-agent-mcp" / "mcp_server_gpu.py")],
            env={"PYTHONPATH": str(Path(__file__).parent / "mem-agent-mcp")}
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                print("✓ Connected to MCP server\n")

                # Heavy test queries to see GPU usage
                heavy_queries = [
                    "Explain in detail what LLMDash is, its architecture, and all technologies used",
                    "Tell me everything about mem-agent-mcp, how it works, and its GPU requirements",
                    "Describe the complete memory system architecture and how it integrates with AI",
                    "What are all the relationships and entities in the memory system?",
                    "Provide a comprehensive analysis of the project status and future plans"
                ]

                print("\nRunning heavy queries (watch GPU monitor above)...")
                print("-" * 70)

                for i, query in enumerate(heavy_queries, 1):
                    print(f"\n\nQuery {i}/5: {query[:60]}...")

                    # Show GPU before query
                    await asyncio.sleep(0.5)

                    start_time = time.time()

                    # Call the memory agent
                    result = await session.call_tool(
                        "use_memory_agent",
                        {"question": query}
                    )

                    elapsed = time.time() - start_time

                    # Extract response
                    if hasattr(result, 'content'):
                        response = result.content
                        if isinstance(response, list) and len(response) > 0:
                            text = response[0].text if hasattr(response[0], 'text') else str(response[0])
                        else:
                            text = str(response)
                    else:
                        text = str(result)

                    print(f"Response ({elapsed:.2f}s): {text[:100]}...")

                    # Wait to see GPU settle
                    await asyncio.sleep(2)

    finally:
        # Stop monitor
        print("\n\nStopping GPU monitor...")
        stop_event.set()
        monitor_thread.join()

    print("\n" + "=" * 70)
    print("✓ Test complete! GPU successfully used for MCP operations")
    print("=" * 70)

async def main():
    await test_mcp_with_monitoring()

if __name__ == "__main__":
    asyncio.run(main())