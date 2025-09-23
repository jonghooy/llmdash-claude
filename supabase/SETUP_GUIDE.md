# Supabase 설정 가이드

## 현재 상태
✅ **완료된 항목**
- Supabase 프로젝트 생성 완료
- 데이터베이스 테이블 스키마 준비 완료
- 샘플 데이터 SQL 준비 완료
- MCP 서버 설치 및 설정 완료

❌ **필요한 작업**
- SQL 스크립트 실행 (테이블 생성 및 RLS 정책)
- 샘플 데이터 삽입
- 인증 제공자 활성화

## 설정 단계

### 1. SQL 스크립트 실행 (필수)

1. Supabase SQL Editor 접속:
   https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql

2. 다음 SQL 파일의 내용을 복사하여 실행:
   ```
   /home/jonghooy/work/llmdash-claude/supabase/setup_all.sql
   ```

   이 스크립트는 다음을 수행합니다:
   - 6개의 테이블 생성 (organizations, profiles, invitations 등)
   - RLS 정책 설정
   - 트리거 및 헬퍼 함수 생성
   - 2개의 샘플 조직 생성

3. 샘플 데이터 추가 (선택):
   ```
   /home/jonghooy/work/llmdash-claude/supabase/insert_sample_data.sql
   ```

   추가 샘플 데이터:
   - 3개 조직
   - 6명 사용자
   - 9개 부서/팀
   - 테스트용 초대장 및 권한

### 2. 인증 설정 (필수)

1. Authentication 설정 페이지 접속:
   https://app.supabase.com/project/qctdaaezghvqnbpghinr/auth/providers

2. **Email/Password** 활성화:
   - Email 섹션에서 "Enable Email Auth" 토글 ON
   - "Confirm email" 옵션은 개발 중에는 OFF 권장

3. **OAuth 제공자 설정** (선택):
   - Google OAuth
   - GitHub OAuth
   - 각 제공자의 Client ID와 Secret 필요

### 3. 검증

설정이 완료되면 다음 명령으로 확인:
```bash
cd /home/jonghooy/work/llmdash-claude/supabase
node run_setup.js
```

모든 항목이 ✅로 표시되어야 합니다:
- Database Tables ✅
- RLS Policies ✅
- Authentication ✅
- Sample Data ✅

### 4. Edge Functions 배포 (선택)

고급 기능을 위한 Edge Functions:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref qctdaaezghvqnbpghinr

# Functions 배포
supabase functions deploy invitation-system
```

## 프로젝트 정보

**Project URL**: https://qctdaaezghvqnbpghinr.supabase.co
**Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdGRhYWV6Z2h2cW5icGdoaW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzU3NTMsImV4cCI6MjA3Mzg1MTc1M30.WJVWs7aruIuo_jpa6o0xXbXefN8DCIK_1CTr_afVRos

## 빠른 링크

- [Supabase Dashboard](https://app.supabase.com/project/qctdaaezghvqnbpghinr)
- [SQL Editor](https://app.supabase.com/project/qctdaaezghvqnbpghinr/sql)
- [Table Editor](https://app.supabase.com/project/qctdaaezghvqnbpghinr/editor)
- [Authentication](https://app.supabase.com/project/qctdaaezghvqnbpghinr/auth/users)
- [API Docs](https://app.supabase.com/project/qctdaaezghvqnbpghinr/api)

## 테스트 계정

SQL 스크립트 실행 후 사용 가능한 테스트 계정:
- **Super Admin**: john@llmdash.com (CTO at LLMDash Inc)
- **Org Admin**: jane@llmdash.com (VP of Product)
- **Demo Admin**: admin@demo.com (Tech Lead at Demo Company)

## 다음 단계

1. **즉시 필요**: SQL Editor에서 `setup_all.sql` 실행
2. **필수**: Email/Password 인증 활성화
3. **선택**: OAuth 제공자 설정
4. **검증**: `node run_setup.js` 실행하여 설정 확인

## 문제 해결

### 테이블이 보이지 않는 경우
- SQL Editor에서 `setup_all.sql` 전체 내용 실행
- Table Editor에서 새로고침

### 인증이 작동하지 않는 경우
- Authentication > Providers에서 Email Auth 활성화 확인
- API Settings에서 Anon Key 확인

### RLS 정책 오류
- SQL Editor에서 각 테이블의 RLS 활성화 상태 확인
- `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;` 실행