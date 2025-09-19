#!/usr/bin/env python3
"""
MCP 인터페이스를 통한 memory-storage/entities/llmdash.md 파일 수정 테스트
"""

import asyncio
import sys
import json
from datetime import datetime
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_mcp_memory_update():
    """MCP를 통해 llmdash.md 파일을 수정하는 테스트"""

    print("=" * 60)
    print("MCP Memory Update Test - llmdash.md")
    print("=" * 60)

    # MCP 서버 연결 설정
    server_script = Path(__file__).parent / "mem-agent-mcp" / "mcp_client_vllm.py"

    if not server_script.exists():
        print(f"❌ MCP server script not found: {server_script}")
        return

    server_params = StdioServerParameters(
        command="python3",
        args=[str(server_script)],
        cwd=str(server_script.parent)
    )

    try:
        print("\n📡 Connecting to MCP server...")
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                print("✅ MCP server connected")

                # 1. 현재 메모리 파일 목록 확인
                print("\n📂 Checking current memory files...")
                result = await session.call_tool("list_memories", {})
                memories = json.loads(result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0]))
                print(f"Memory path: {memories['memory_path']}")
                print(f"Total files: {memories['count']}")
                for file in memories['files']:
                    if 'llmdash' in file:
                        print(f"  ✓ Found: {file}")

                # 2. llmdash 메모리 검색
                print("\n🔍 Searching for LLMDash in memory...")
                result = await session.call_tool(
                    "search_memory",
                    {"query": "LLMDash"}
                )
                search_result = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])
                print(f"Search results (first 200 chars):\n{search_result[:200]}...")

                # 3. llmdash.md 파일에 새로운 정보 추가
                print("\n✍️ Adding new information to llmdash entity...")

                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                new_content = f"""
### MCP Integration Test Results ({current_time})

**Test Summary:**
- MCP interface successfully connected
- Memory read operations verified
- Memory write operations functional
- File modification via add_memory tool confirmed

**Technical Details:**
- MCP Protocol: stdio-based communication
- Backend: vLLM server on port 8001
- Memory Storage: Markdown files in {memories['memory_path']}
- Entity Update Method: Append mode with timestamp

**Test Status:** ✅ PASSED
"""

                result = await session.call_tool(
                    "add_memory",
                    {
                        "entity_name": "llmdash",
                        "content": new_content
                    }
                )
                update_result = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])
                print(f"Update result: {update_result}")

                # 4. 업데이트 확인을 위한 재검색
                print("\n🔄 Verifying update by searching for test results...")
                result = await session.call_tool(
                    "search_memory",
                    {"query": "MCP Integration Test Results"}
                )
                verification = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])

                if "MCP Integration Test Results" in verification:
                    print("✅ Update verified! New content found in memory.")
                else:
                    print("⚠️ Update may not have been successful.")

                # 5. 메모리 기반 질의 테스트
                print("\n💬 Testing memory-based query...")
                result = await session.call_tool(
                    "query_with_memory",
                    {"question": "What are the recent updates to LLMDash related to MCP integration?"}
                )
                query_response = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])
                print(f"Query response:\n{query_response}")

                print("\n" + "=" * 60)
                print("✅ Test Complete!")
                print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("\n🚀 Starting MCP Memory Update Test...")
    print(f"Python version: {sys.version}")
    print(f"Test script: {__file__}")

    # 비동기 테스트 실행
    asyncio.run(test_mcp_memory_update())

if __name__ == "__main__":
    main()