# LLMDash + mem-agent-mcp 통합 가이드

## 🎯 프로젝트 개요

LLMDash와 mem-agent-mcp를 RTX 5090 GPU에서 통합하여 개인 메모리 시스템을 구축한 프로젝트입니다.

### 주요 성과
- ✅ **RTX 5090 GPU 지원**: PyTorch 2.7.1+cu128로 해결
- ✅ **vLLM 통합**: OpenAI 호환 API로 고속 추론
- ✅ **MCP 프로토콜**: stdio 기반 메모리 시스템 인터페이스
- ✅ **메모리 관리**: 읽기/쓰기/검색 기능 완벽 구현

## 📋 시스템 요구사항

- **GPU**: NVIDIA RTX 5090 (sm_120, CUDA 12.8+)
- **Python**: 3.11+
- **PyTorch**: 2.7.1+cu128 (RTX 5090 지원)
- **vLLM**: 0.10.0
- **메모리**: 32GB+ RAM, 32GB+ GPU 메모리

## 🚀 설치 방법

### 1. 프로젝트 클론 및 환경 설정

```bash
# 프로젝트 디렉토리
cd /home/jonghooy/work/llmdash-claude

# mem-agent-mcp 클론
git clone https://github.com/skydeckai/mem-agent-mcp
cd mem-agent-mcp

# Python 가상환경 생성
python3 -m venv .venv
source .venv/bin/activate

# uv 설치 (빠른 패키지 관리)
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

### 2. PyTorch 2.7.1+cu128 설치 (RTX 5090 지원)

```bash
# RTX 5090을 지원하는 PyTorch 설치
~/.local/bin/uv pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu128

# vLLM 설치
~/.local/bin/uv pip install vllm

# 기타 의존성
~/.local/bin/uv pip install fastmcp transformers accelerate
```

### 3. 모델 다운로드

```bash
# Hugging Face CLI 설치
pip install huggingface-hub

# mem-agent 모델 다운로드 (약 7.6GB)
huggingface-cli download skydeckai/mem-agent \
    --local-dir ./models/mem-agent \
    --local-dir-use-symlinks False
```

### 4. 메모리 스토리지 초기화

```bash
# 메모리 디렉토리 생성
mkdir -p /home/jonghooy/work/llmdash-claude/memory-storage/entities

# 사용자 정보 생성
cat > /home/jonghooy/work/llmdash-claude/memory-storage/user.md << 'EOF'
# User Information
- user_name: Your Name
- birth_date: YYYY-MM-DD
- location: Your Location

## User Relationships
- company: [[entities/your-company.md]]
- project: [[entities/your-project.md]]
EOF
```

## 🔧 실행 방법

### 1. vLLM 서버 실행 (GPU 추론)

```bash
cd /home/jonghooy/work/llmdash-claude/mem-agent-mcp
source .venv/bin/activate

# vLLM 서버 시작 (포트 8001)
VLLM_WORKER_MULTIPROC_METHOD=spawn python -m vllm.entrypoints.openai.api_server \
    --model ./models/mem-agent \
    --trust-remote-code \
    --dtype bfloat16 \
    --max-model-len 2048 \
    --gpu-memory-utilization 0.8 \
    --port 8001
```

### 2. MCP 서버 실행 (메모리 인터페이스)

```bash
# 새 터미널에서
cd /home/jonghooy/work/llmdash-claude/mem-agent-mcp
source .venv/bin/activate

# MCP 서버 시작 (vLLM 백엔드 사용)
python mcp_client_vllm.py
```

## 📡 API 사용법

### vLLM API (OpenAI 호환)

```python
import requests

# 텍스트 생성
response = requests.post(
    "http://localhost:8001/v1/completions",
    json={
        "model": "./models/mem-agent",
        "prompt": "What is LLMDash?",
        "max_tokens": 100,
        "temperature": 0.7
    }
)

print(response.json()['choices'][0]['text'])
```

### MCP 프로토콜 (메모리 시스템)

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def use_mcp():
    # MCP 서버 연결
    server_params = StdioServerParameters(
        command="python",
        args=["mcp_client_vllm.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 1. 메모리 조회
            result = await session.call_tool(
                "query_with_memory",
                {"question": "Tell me about myself"}
            )

            # 2. 메모리 검색
            result = await session.call_tool(
                "search_memory",
                {"query": "project"}
            )

            # 3. 메모리 추가
            result = await session.call_tool(
                "add_memory",
                {
                    "entity_name": "new-topic",
                    "content": "New information to remember"
                }
            )

            # 4. 사용자 정보 업데이트
            result = await session.call_tool(
                "update_user_memory",
                {
                    "key": "favorite_hobby",
                    "value": "Programming"
                }
            )

            # 5. 메모리 목록 조회
            result = await session.call_tool("list_memories", {})

asyncio.run(use_mcp())
```

## 🛠️ MCP 도구 목록

| 도구명 | 설명 | 파라미터 |
|--------|------|----------|
| `query_with_memory` | 메모리 컨텍스트와 함께 질의 | `question: str` |
| `search_memory` | 메모리에서 특정 정보 검색 | `query: str` |
| `list_memories` | 모든 메모리 파일 목록 조회 | 없음 |
| `add_memory` | 새 메모리 엔티티 추가 | `entity_name: str`, `content: str` |
| `update_user_memory` | 사용자 정보 업데이트 | `key: str`, `value: str` |
| `get_vllm_status` | vLLM 서버 상태 확인 | 없음 |

## 📂 프로젝트 구조

```
/home/jonghooy/work/llmdash-claude/
├── mem-agent-mcp/
│   ├── models/
│   │   └── mem-agent/           # Qwen3 기반 7.6GB 모델
│   ├── mcp_client_vllm.py       # MCP 서버 (vLLM 백엔드)
│   ├── mcp_server_gpu.py        # GPU 직접 사용 버전
│   ├── test-vllm-api.py         # vLLM API 테스트
│   ├── test-mcp-vllm.py         # MCP 통합 테스트
│   └── test-memory-operations.py # 메모리 작업 테스트
├── memory-storage/
│   ├── user.md                  # 사용자 정보
│   └── entities/                # 엔티티별 메모리
│       ├── llmdash.md
│       ├── mem-agent-mcp.md
│       └── vLLM-integration.md
└── LibreChat/                   # LLMDash 메인 애플리케이션
```

## 🔍 테스트 스크립트

### vLLM API 테스트
```bash
python test-vllm-api.py
```

### MCP 통합 테스트
```bash
python test-mcp-vllm.py
```

### 메모리 작업 테스트
```bash
python test-memory-operations.py
```

## 📊 성능 지표

- **모델 크기**: 7.6GB (Qwen3 아키텍처)
- **GPU 메모리 사용**:
  - 모델 로드: ~7.5GB
  - 실행 시: ~27GB (KV 캐시 포함)
- **추론 속도**: ~0.35초/쿼리
- **최대 컨텍스트**: 2,048 토큰 (설정 가능)
- **GPU 활용률**: 80-92%

## 🐛 트러블슈팅

### RTX 5090 호환성 문제
```bash
# PyTorch 2.7.1+cu128 재설치
~/.local/bin/uv pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu128 --force-reinstall
```

### vLLM 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :8001

# 다른 포트로 실행
--port 8002
```

### 메모리 부족
```bash
# GPU 메모리 사용량 조정
--gpu-memory-utilization 0.5  # 50%만 사용
```

## 🔗 관련 링크

- [mem-agent-mcp GitHub](https://github.com/skydeckai/mem-agent-mcp)
- [vLLM Documentation](https://docs.vllm.ai/)
- [MCP Protocol Spec](https://github.com/anthropics/mcp)
- [LibreChat/LLMDash](https://github.com/danny-avila/LibreChat)

## 📝 주요 업데이트 내역

- **2025-09-18**: RTX 5090 지원 완료 (PyTorch 2.7.1+cu128)
- **2025-09-18**: vLLM 통합 성공
- **2025-09-18**: MCP 메모리 추가/업데이트 기능 구현
- **2025-09-18**: 전체 시스템 테스트 완료

## ✨ 특징

1. **GPU 가속**: RTX 5090의 강력한 성능 활용
2. **메모리 시스템**: Obsidian 스타일 마크다운 기반
3. **OpenAI 호환**: 기존 애플리케이션과 쉽게 통합
4. **MCP 프로토콜**: 표준화된 AI 도구 인터페이스
5. **확장 가능**: 새로운 메모리 타입과 도구 추가 용이

---

*이 문서는 LLMDash와 mem-agent-mcp 통합 프로젝트의 공식 가이드입니다.*