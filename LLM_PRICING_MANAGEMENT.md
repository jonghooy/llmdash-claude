# 💰 LLM 모델 가격 및 권한 관리 시스템

## 📊 개요
LLM 모델별 토큰 가격을 설정하고, 사용자/팀별 모델 사용 권한을 관리하는 통합 시스템

---

## 🎯 핵심 기능

### 1. 모델 가격 관리 (Model Pricing)
- 각 LLM 모델의 입력/출력 토큰당 가격 설정
- 실시간 가격 업데이트
- 가격 히스토리 추적

### 2. 모델 권한 관리 (Model Permissions)
- 모델별 활성화/비활성화
- 팀/사용자별 모델 접근 권한
- 사용 한도 설정

---

## 📋 데이터베이스 스키마

### 1. ModelPricing Collection
```javascript
{
  _id: ObjectId,
  modelId: String,              // "gpt-4", "claude-3", etc.
  provider: String,             // "openai", "anthropic", "google"
  displayName: String,          // "GPT-4 Turbo"
  description: String,          // "Most capable GPT-4 model"
  
  // 가격 정보 (USD per 1K tokens)
  pricing: {
    input: Number,              // $0.03 per 1K input tokens
    output: Number,             // $0.06 per 1K output tokens
    currency: String,           // "USD"
    unit: String               // "1K tokens"
  },
  
  // 성능 지표
  performance: {
    contextWindow: Number,      // 128000
    maxOutput: Number,         // 4096
    responseTime: Number,      // avg ms
    accuracy: Number           // 0-100%
  },
  
  // 상태 관리
  status: {
    enabled: Boolean,          // 전체 활성화 여부
    available: Boolean,        // API 가용성
    deprecated: Boolean        // 지원 중단 여부
  },
  
  // 사용 제한
  limits: {
    rateLimit: Number,         // requests per minute
    dailyLimit: Number,        // requests per day
    maxTokensPerRequest: Number
  },
  
  // 메타데이터
  tags: [String],              // ["chat", "code", "vision"]
  createdAt: Date,
  updatedAt: Date,
  updatedBy: String            // admin userId
}
```

### 2. ModelPermissions Collection
```javascript
{
  _id: ObjectId,
  modelId: String,
  organizationId: ObjectId,
  
  // 기본 권한 설정
  defaultPermissions: {
    enabled: Boolean,          // 기본 활성화
    allowedForNewUsers: Boolean
  },
  
  // 팀별 권한
  teamPermissions: [{
    teamId: ObjectId,
    teamName: String,
    enabled: Boolean,
    priority: Number,          // 우선순위 (충돌 시)
    limits: {
      dailyTokens: Number,
      monthlyBudget: Number,
      maxRequestSize: Number
    }
  }],
  
  // 사용자별 권한 (override)
  userPermissions: [{
    userId: ObjectId,
    userName: String,
    enabled: Boolean,
    customLimits: {
      dailyTokens: Number,
      monthlyBudget: Number
    },
    reason: String            // "Special project access"
  }],
  
  // 사용 정책
  policies: {
    requireApproval: Boolean,  // 사용 전 승인 필요
    autoDisableOnBudget: Boolean,
    notifyOnHighUsage: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. PricingHistory Collection
```javascript
{
  _id: ObjectId,
  modelId: String,
  changeType: 'price' | 'status' | 'limit',
  
  previousValue: {
    input: Number,
    output: Number
  },
  
  newValue: {
    input: Number,
    output: Number
  },
  
  reason: String,
  changedBy: String,
  changedAt: Date,
  effectiveFrom: Date
}
```

---

## 🖼️ UI 디자인

### 1. 모델 관리 메인 화면
```
┌────────────────────────────────────────────────────────────┐
│ 🤖 모델 관리                               [+ 모델 추가]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 검색: [_______________] Provider: [All ▼] Status: [All ▼] │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ □ 모델명        제공사    입력가격  출력가격  상태   │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ☑ GPT-4        OpenAI    $0.03    $0.06    🟢 활성  │  │
│ │   128K context • 고급 추론 • 코드 생성              │  │
│ │   [가격 수정] [권한 설정] [통계 보기]               │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ☑ Claude-3     Anthropic $0.025   $0.05    🟢 활성  │  │
│ │   200K context • 안전한 응답 • 긴 문서              │  │
│ │   [가격 수정] [권한 설정] [통계 보기]               │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ☐ GPT-3.5      OpenAI    $0.001   $0.002   🔴 비활성│  │
│ │   16K context • 빠른 응답 • 일반 대화               │  │
│ │   [가격 수정] [권한 설정] [통계 보기]               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ [일괄 활성화] [일괄 비활성화] [가격 일괄 수정]           │
└────────────────────────────────────────────────────────────┘
```

### 2. 가격 설정 모달
```
┌─────────────────────────────────────────────────┐
│ 💰 모델 가격 설정 - GPT-4                   [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│ 기본 정보                                       │
│ ┌─────────────────────────────────────────┐   │
│ │ 모델 ID: gpt-4-turbo-preview             │   │
│ │ 제공사: OpenAI                           │   │
│ │ 설명: [최신 GPT-4 모델_______________]   │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 토큰 가격 (USD per 1K tokens)                  │
│ ┌─────────────────────────────────────────┐   │
│ │ 입력 토큰: $ [0.03___]                   │   │
│ │ 출력 토큰: $ [0.06___]                   │   │
│ │                                          │   │
│ │ 💡 참고 가격:                            │   │
│ │ • OpenAI 공식: $0.03/$0.06              │   │
│ │ • 마진 20% 적용: $0.036/$0.072          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 성능 지표                                       │
│ ┌─────────────────────────────────────────┐   │
│ │ 컨텍스트 윈도우: [128000___] tokens      │   │
│ │ 최대 출력: [4096___] tokens              │   │
│ │ 평균 응답시간: [2500___] ms              │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 사용 제한                                       │
│ ┌─────────────────────────────────────────┐   │
│ │ ☑ Rate Limit 설정                        │   │
│ │   분당 요청: [60___] requests            │   │
│ │   일일 한도: [10000___] requests         │   │
│ │   요청당 최대 토큰: [8000___]            │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [취소] [가격 히스토리] [저장 및 적용]          │
└─────────────────────────────────────────────────┘
```

### 3. 권한 설정 화면
```
┌─────────────────────────────────────────────────────────┐
│ 🔐 모델 권한 설정 - GPT-4                          [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 전체 설정                                            │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 모델 상태: [🟢 활성화] [🔴 비활성화]              │ │
│ │ 신규 사용자 기본값: [✓ 허용] [✗ 차단]            │ │
│ │ 승인 필요: [✓ 예] [✗ 아니오]                     │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ 👥 팀별 권한                                           │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 팀명        상태    일일 토큰   월 예산   작업     │ │
│ ├───────────────────────────────────────────────────┤ │
│ │ 개발팀      ✅     100K        $500     [수정]    │ │
│ │ 영업팀      ✅     50K         $200     [수정]    │ │
│ │ 마케팅팀    ❌     -           -        [수정]    │ │
│ │ 고객지원    ✅     30K         $100     [수정]    │ │
│ └───────────────────────────────────────────────────┘ │
│ [+ 팀 추가]                                            │
│                                                         │
│ 👤 사용자별 예외 설정                                  │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 사용자      팀       상태    사유          작업    │ │
│ ├───────────────────────────────────────────────────┤ │
│ │ 김철수      개발팀   ✅     프로젝트 리더  [삭제]  │ │
│ │ 이영희      마케팅   ✅     특별 권한      [삭제]  │ │
│ └───────────────────────────────────────────────────┘ │
│ [+ 사용자 예외 추가]                                   │
│                                                         │
│ 📋 정책 설정                                           │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ☑ 예산 초과 시 자동 비활성화                      │ │
│ │ ☑ 80% 사용 시 알림 발송                           │ │
│ │ ☑ 일일 리포트 생성                                │ │
│ │ ☐ 특정 시간대만 허용 [09:00] ~ [18:00]           │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ [취소] [미리보기] [저장]                               │
└─────────────────────────────────────────────────────────┘
```

### 4. 대시보드 위젯 (비용 계산 예시)
```
┌──────────────────────────────────────────┐
│ 💵 실시간 비용 계산기                    │
├──────────────────────────────────────────┤
│ 모델: GPT-4                              │
│ 입력: 1,234 tokens × $0.03 = $0.037     │
│ 출력: 567 tokens × $0.06 = $0.034       │
│ ─────────────────────────────────        │
│ 총 비용: $0.071                         │
│                                          │
│ 일일 누적: $45.67 / $200 (23%)          │
│ ████████░░░░░░░░░░░░░░░░░░░░░           │
└──────────────────────────────────────────┘
```

---

## 🔧 구현 코드

### 1. React 컴포넌트 - ModelPricingTable
```typescript
// components/ModelManagement/ModelPricingTable.tsx
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Switch, IconButton, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, FormControlLabel, Checkbox
} from '@mui/material';
import { Edit, Security, BarChart } from '@mui/icons-material';

interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  pricing: {
    input: number;
    output: number;
  };
  status: {
    enabled: boolean;
  };
  performance: {
    contextWindow: number;
  };
}

const ModelPricingTable: React.FC = () => {
  const [models, setModels] = useState<ModelPricing[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPricing | null>(null);

  const handleStatusToggle = (modelId: string) => {
    // API call to toggle model status
    fetch(`/api/models/${modelId}/toggle`, { method: 'POST' })
      .then(() => {
        setModels(prev => prev.map(m => 
          m.id === modelId 
            ? { ...m, status: { ...m.status, enabled: !m.status.enabled } }
            : m
        ));
      });
  };

  const handlePricingEdit = (model: ModelPricing) => {
    setSelectedModel(model);
    setEditDialog(true);
  };

  const savePricing = () => {
    if (!selectedModel) return;
    
    fetch(`/api/models/${selectedModel.id}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedModel.pricing)
    }).then(() => {
      setEditDialog(false);
      // Refresh models
    });
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>활성화</TableCell>
            <TableCell>모델명</TableCell>
            <TableCell>제공사</TableCell>
            <TableCell>입력 가격</TableCell>
            <TableCell>출력 가격</TableCell>
            <TableCell>컨텍스트</TableCell>
            <TableCell>작업</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {models.map(model => (
            <TableRow key={model.id}>
              <TableCell>
                <Switch
                  checked={model.status.enabled}
                  onChange={() => handleStatusToggle(model.id)}
                />
              </TableCell>
              <TableCell>{model.name}</TableCell>
              <TableCell>
                <Chip label={model.provider} size="small" />
              </TableCell>
              <TableCell>${model.pricing.input}/1K</TableCell>
              <TableCell>${model.pricing.output}/1K</TableCell>
              <TableCell>{model.performance.contextWindow / 1000}K</TableCell>
              <TableCell>
                <IconButton onClick={() => handlePricingEdit(model)}>
                  <Edit />
                </IconButton>
                <IconButton>
                  <Security />
                </IconButton>
                <IconButton>
                  <BarChart />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pricing Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>모델 가격 설정 - {selectedModel?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="입력 토큰 가격 ($/1K)"
                type="number"
                fullWidth
                value={selectedModel?.pricing.input || 0}
                onChange={(e) => setSelectedModel(prev => prev ? {
                  ...prev,
                  pricing: { ...prev.pricing, input: parseFloat(e.target.value) }
                } : null)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="출력 토큰 가격 ($/1K)"
                type="number"
                fullWidth
                value={selectedModel?.pricing.output || 0}
                onChange={(e) => setSelectedModel(prev => prev ? {
                  ...prev,
                  pricing: { ...prev.pricing, output: parseFloat(e.target.value) }
                } : null)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>취소</Button>
          <Button onClick={savePricing} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ModelPricingTable;
```

### 2. Backend API - Express Routes
```typescript
// routes/modelManagement.ts
import { Router } from 'express';
import { ModelPricing, ModelPermissions } from '../models';

const router = Router();

// Get all models with pricing
router.get('/models', async (req, res) => {
  const models = await ModelPricing.find({});
  res.json(models);
});

// Update model pricing
router.put('/models/:modelId/pricing', async (req, res) => {
  const { modelId } = req.params;
  const { input, output } = req.body;
  
  // Save current pricing to history
  const current = await ModelPricing.findById(modelId);
  await PricingHistory.create({
    modelId,
    changeType: 'price',
    previousValue: current.pricing,
    newValue: { input, output },
    changedBy: req.user.id,
    changedAt: new Date()
  });
  
  // Update pricing
  await ModelPricing.findByIdAndUpdate(modelId, {
    'pricing.input': input,
    'pricing.output': output,
    updatedAt: new Date(),
    updatedBy: req.user.id
  });
  
  res.json({ success: true });
});

// Toggle model status
router.post('/models/:modelId/toggle', async (req, res) => {
  const { modelId } = req.params;
  
  const model = await ModelPricing.findById(modelId);
  await ModelPricing.findByIdAndUpdate(modelId, {
    'status.enabled': !model.status.enabled
  });
  
  res.json({ success: true });
});

// Get model permissions
router.get('/models/:modelId/permissions', async (req, res) => {
  const { modelId } = req.params;
  const permissions = await ModelPermissions.findOne({ modelId });
  res.json(permissions);
});

// Update team permissions
router.put('/models/:modelId/permissions/team/:teamId', async (req, res) => {
  const { modelId, teamId } = req.params;
  const { enabled, limits } = req.body;
  
  await ModelPermissions.updateOne(
    { modelId },
    {
      $set: {
        'teamPermissions.$[team].enabled': enabled,
        'teamPermissions.$[team].limits': limits
      }
    },
    {
      arrayFilters: [{ 'team.teamId': teamId }]
    }
  );
  
  res.json({ success: true });
});

// Calculate real-time cost
router.post('/models/calculate-cost', async (req, res) => {
  const { modelId, inputTokens, outputTokens } = req.body;
  
  const model = await ModelPricing.findById(modelId);
  const inputCost = (inputTokens / 1000) * model.pricing.input;
  const outputCost = (outputTokens / 1000) * model.pricing.output;
  const totalCost = inputCost + outputCost;
  
  res.json({
    inputCost,
    outputCost,
    totalCost,
    currency: model.pricing.currency
  });
});

export default router;
```

### 3. 권한 체크 미들웨어
```typescript
// middleware/modelPermissions.ts
export const checkModelPermission = async (req, res, next) => {
  const { modelId } = req.body;
  const userId = req.user.id;
  const userTeamId = req.user.teamId;
  
  // Get model permissions
  const permissions = await ModelPermissions.findOne({ modelId });
  
  // Check if model is globally enabled
  const model = await ModelPricing.findById(modelId);
  if (!model.status.enabled) {
    return res.status(403).json({ error: 'Model is disabled' });
  }
  
  // Check user-specific permissions (highest priority)
  const userPerm = permissions.userPermissions.find(p => p.userId === userId);
  if (userPerm) {
    if (!userPerm.enabled) {
      return res.status(403).json({ error: 'Model access denied for user' });
    }
    req.modelLimits = userPerm.customLimits;
    return next();
  }
  
  // Check team permissions
  const teamPerm = permissions.teamPermissions.find(p => p.teamId === userTeamId);
  if (teamPerm) {
    if (!teamPerm.enabled) {
      return res.status(403).json({ error: 'Model access denied for team' });
    }
    req.modelLimits = teamPerm.limits;
    return next();
  }
  
  // Check default permissions
  if (!permissions.defaultPermissions.enabled) {
    return res.status(403).json({ error: 'Model access denied' });
  }
  
  next();
};
```

---

## 📊 MVP 메뉴 구성안 업데이트

### 수정된 Settings 메뉴 구조
```javascript
const settingsSubMenu = [
  { 
    text: '일반 설정', 
    path: '/settings/general',
    icon: <Tune />
  },
  { 
    text: '모델 관리',  // 새로 추가
    path: '/settings/models',
    icon: <Psychology />,
    badge: 'NEW',
    subItems: [
      { text: '가격 설정', path: '/settings/models/pricing' },
      { text: '권한 관리', path: '/settings/models/permissions' },
      { text: '사용 정책', path: '/settings/models/policies' }
    ]
  },
  { 
    text: 'API 키 관리', 
    path: '/settings/api-keys',
    icon: <VpnKey />
  },
  { 
    text: '보안', 
    path: '/settings/security',
    icon: <Security />
  }
];
```

---

## 🎯 구현 우선순위

### Phase 1 (필수 - 2일)
1. **ModelPricing 스키마 생성**
2. **가격 설정 UI 구현**
3. **모델 활성화/비활성화 기능**
4. **실시간 비용 계산 API**

### Phase 2 (중요 - 3일)
1. **ModelPermissions 스키마 생성**
2. **팀별 권한 관리 UI**
3. **권한 체크 미들웨어**
4. **사용 한도 관리**

### Phase 3 (선택 - 2일)
1. **가격 변경 히스토리**
2. **자동 비활성화 정책**
3. **사용량 예측 및 경고**
4. **상세 리포트**

---

## 💡 핵심 이점

1. **투명한 비용 관리**: 실시간 비용 추적
2. **유연한 권한 관리**: 팀/사용자별 세밀한 제어
3. **예산 통제**: 자동 차단 및 알림
4. **사용 최적화**: 모델별 성능/비용 분석

이 시스템으로 관리자는 LLM 사용 비용을 정확히 추적하고, 팀별로 적절한 모델 접근 권한을 부여할 수 있습니다.