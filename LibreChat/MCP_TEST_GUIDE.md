# LibreChat에서 MCP 테스트 가이드

## 1. 웹 브라우저로 접속
- URL: https://www.llmdash.com/chat
- 로그인 필요

## 2. 새 대화 시작 및 Agent 설정

### 방법 1: 새 대화 버튼 클릭
1. 좌측 사이드바에서 "New Chat" 버튼 클릭
2. 상단 모델 선택 드롭다운에서 "Agents" 선택
3. Agent Builder가 나타나면:
   - Agent 이름 입력 (예: "File Manager")
   - Model 선택 (예: gpt-4)
   - **Tools 섹션에서 "MCP Tools" 활성화**
   - Available Tools에서 사용할 도구 선택

### 방법 2: 기존 대화에서 변경
1. 대화 상단의 모델 선택 드롭다운 클릭
2. "Agents" 선택
3. Tools 활성화

## 3. MCP 도구 테스트 예제

### 📁 File System MCP 테스트

```
# 현재 디렉토리 파일 목록 보기
"현재 디렉토리의 파일 목록을 보여줘"

# 파일 읽기
"package.json 파일의 내용을 읽어줘"

# 파일 생성
"test.txt 파일을 만들고 'Hello MCP!' 내용을 써줘"

# 파일 편집
"test.txt 파일에 새로운 줄을 추가해줘"

# 디렉토리 트리 보기
"src 폴더의 디렉토리 구조를 트리 형태로 보여줘"

# 파일 검색
"프로젝트에서 모든 .js 파일을 찾아줘"
```

### 🐙 GitHub MCP 테스트

```
# 레포지토리 검색
"GitHub에서 'react' 관련 인기 레포지토리를 검색해줘"

# 이슈 생성
"내 레포지토리에 'Bug: MCP 테스트' 제목으로 이슈를 만들어줘"

# 파일 내용 가져오기
"facebook/react 레포지토리의 README.md 내용을 가져와줘"

# PR 목록 보기
"내 레포지토리의 열린 PR 목록을 보여줘"
```

## 4. 확인 사항

### ✅ 정상 작동 시
- AI가 "도구를 사용하겠습니다" 같은 메시지 표시
- 도구 실행 결과가 대화에 표시
- 파일 작업의 경우 실제 파일이 생성/수정됨

### ❌ 문제 발생 시
- "도구를 사용할 수 없습니다" 메시지
- Agent 설정에서 Tools가 비활성화되어 있을 수 있음
- MCP 서버가 실행 중이 아닐 수 있음

## 5. 디버깅

### 로그 확인
```bash
# LibreChat 로그에서 MCP 관련 메시지 확인
pm2 logs librechat-backend --lines 50 | grep -i mcp

# MCP 도구 실행 로그 확인
pm2 logs librechat-backend --lines 100 | grep -i "tool"
```

### MCP 서버 상태 확인
```bash
# MCP 통합 테스트 실행
node test-mcp-integration.js

# MCP 도구 목록 확인
node demo-mcp-usage.js
```

## 6. 주의사항

1. **Agent 엔드포인트 필수**: 일반 모델(gpt-4 등)이 아닌 "Agents" 선택 필요
2. **Tools 활성화 필수**: Agent 설정에서 Tools/MCP Tools 체크
3. **권한**: File System MCP는 서버의 특정 디렉토리만 접근 가능
4. **GitHub 인증**: GitHub MCP는 토큰 설정이 필요할 수 있음

## 7. 테스트 시나리오

### 시나리오 1: 프로젝트 파일 분석
```
1. "현재 프로젝트의 package.json을 읽어줘"
2. "dependencies 중에서 react 버전이 뭐야?"
3. "package.json에 새 스크립트를 추가해줘: test:mcp"
```

### 시나리오 2: 코드 파일 작업
```
1. "src 폴더에 있는 모든 .js 파일 목록을 보여줘"
2. "가장 최근에 수정된 파일의 내용을 읽어줘"
3. "새로운 utils/mcp-helper.js 파일을 만들어줘"
```

### 시나리오 3: GitHub 작업
```
1. "tensorflow 레포지토리를 검색해줘"
2. "가장 인기 있는 tensorflow 레포지토리의 최근 이슈를 보여줘"
3. "해당 레포지토리의 README 파일을 가져와줘"
```

## 문제 해결

### MCP 도구가 표시되지 않을 때
1. PM2로 서비스 재시작
```bash
pm2 restart librechat-backend
```

2. 환경 변수 확인
```bash
grep ENABLE_ADMIN_MCP_INTEGRATION .env
# ENABLE_ADMIN_MCP_INTEGRATION=true 확인
```

3. Admin Dashboard에서 MCP 서버 상태 확인
- https://www.llmdash.com/admin 접속
- Settings > MCP Servers 메뉴
- 서버가 Active 상태인지 확인

---

**테스트 준비 완료!** 위 가이드를 따라 MCP 기능을 테스트해보세요.