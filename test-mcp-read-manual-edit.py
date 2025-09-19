#!/usr/bin/env python3
"""
수동으로 편집한 llmdash.md 파일 내용을 MCP를 통해 읽기 테스트
"""

import asyncio
import sys
import json
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_manual_edit_reading():
    """수동 편집 내용이 MCP를 통해 제대로 읽히는지 테스트"""

    print("=" * 60)
    print("MCP Manual Edit Reading Test")
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
                print("✅ MCP server connected\n")

                # 1. search_memory로 수동 입력 내용 검색
                print("🔍 Test 1: Searching for 'Manual Update' via search_memory...")
                print("-" * 40)

                result = await session.call_tool(
                    "search_memory",
                    {"query": "Manual Update"}
                )
                search_result = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])

                if "Check Manual Update is Valid" in search_result or "Manual Update" in search_result:
                    print("✅ SUCCESS: Manual edit found via search_memory!")
                    print(f"Result: {search_result}")
                else:
                    print("❌ FAIL: Manual edit NOT found via search_memory")
                    print(f"Result: {search_result}")

                print("\n" + "=" * 60)

                # 2. 대소문자 구분 없이 검색
                print("🔍 Test 2: Case-insensitive search for 'manual update'...")
                print("-" * 40)

                result = await session.call_tool(
                    "search_memory",
                    {"query": "manual update"}
                )
                search_result2 = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])

                if "Manual Update" in search_result2 or "manual update" in search_result2.lower():
                    print("✅ SUCCESS: Found with case-insensitive search!")
                    print(f"Result: {search_result2}")
                else:
                    print("❌ FAIL: Not found with case-insensitive search")

                print("\n" + "=" * 60)

                # 3. 날짜로 검색 (2015.9.13)
                print("🔍 Test 3: Searching for date '2015.9.13'...")
                print("-" * 40)

                result = await session.call_tool(
                    "search_memory",
                    {"query": "2015.9.13"}
                )
                date_search = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])

                if "2015.9.13" in date_search:
                    print("✅ SUCCESS: Date found in memory!")
                    print(f"Result: {date_search}")
                else:
                    print("❌ FAIL: Date not found")

                print("\n" + "=" * 60)

                # 4. query_with_memory로 질의
                print("💬 Test 4: Querying about manual updates via query_with_memory...")
                print("-" * 40)

                result = await session.call_tool(
                    "query_with_memory",
                    {"question": "What manual updates or validations were added to LLMDash recently? Look for any content with 'Manual Update' or date '2015.9.13'."}
                )
                query_response = result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])
                print(f"Query response:\n{query_response[:500]}...")

                print("\n" + "=" * 60)

                # 5. 전체 파일 목록 확인
                print("📂 Test 5: Listing all memory files...")
                print("-" * 40)

                result = await session.call_tool("list_memories", {})
                memories = json.loads(result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0]))

                for file in memories['files']:
                    if 'llmdash' in file:
                        print(f"✓ Found file: {file}")

                print("\n" + "=" * 60)
                print("📊 Test Summary:")
                print("=" * 60)
                print("Manual edit content: '*** 2015.9.13. Check Manual Update is Valid. **'")
                print("\nThe MCP interface should be able to read manually edited files")
                print("if the mcp_client_vllm.py properly loads the file content.")
                print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("\n🚀 Starting Manual Edit Reading Test...")
    print(f"Python version: {sys.version}")
    print(f"Test script: {__file__}\n")

    # 비동기 테스트 실행
    asyncio.run(test_manual_edit_reading())

if __name__ == "__main__":
    main()