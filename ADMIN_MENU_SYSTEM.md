# LibreChat Admin Dashboard Menu System

## 📊 메뉴 구조 (Menu Structure)

```
┌─────────────────────────────────────────────────────────────┐
│  LibreChat Admin                                  User ▼    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                              │
│  │ MAIN     │                                              │
│  ├──────────┤  ┌──────────────────────────────────────┐   │
│  │          │  │                                        │   │
│  │ 📊 Dashboard                                        │   │
│  │ 👥 Users    │  │         Main Content Area          │   │
│  │ 📈 Analytics│  │                                    │   │
│  │ 💬 Conversations                                    │   │
│  │ 🔒 Security │  │                                    │   │
│  │ 💰 Billing  │  │                                    │   │
│  │ ⚙️ Settings │  │                                    │   │
│  │          │  └──────────────────────────────────────┘   │
│  ├──────────┤                                              │
│  │ MONITOR  │                                              │
│  ├──────────┤                                              │
│  │ 🔴 Real-time                                           │
│  │ 📊 Metrics  │                                           │
│  │ 🚨 Alerts   │                                           │
│  │ 📝 Logs     │                                           │
│  └──────────┘                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Primary Navigation Menu

### 1. Dashboard (대시보드)
```javascript
{
  id: 'dashboard',
  title: '대시보드',
  icon: '📊',
  path: '/',
  badge: null,
  subMenu: [
    {
      id: 'overview',
      title: '개요',
      path: '/dashboard/overview',
      description: '시스템 전체 현황'
    },
    {
      id: 'quick-stats',
      title: '빠른 통계',
      path: '/dashboard/stats',
      description: '주요 지표 요약'
    },
    {
      id: 'activity-feed',
      title: '활동 피드',
      path: '/dashboard/activity',
      description: '실시간 활동 로그'
    }
  ]
}
```

### 2. Users Management (사용자 관리)
```javascript
{
  id: 'users',
  title: '사용자',
  icon: '👥',
  path: '/users',
  badge: { type: 'number', value: activeUsers },
  subMenu: [
    {
      id: 'all-users',
      title: '전체 사용자',
      path: '/users/all',
      permissions: ['users.view']
    },
    {
      id: 'active-sessions',
      title: '활성 세션',
      path: '/users/sessions',
      badge: { type: 'dot', color: 'green' }
    },
    {
      id: 'user-groups',
      title: '사용자 그룹',
      path: '/users/groups'
    },
    {
      id: 'roles-permissions',
      title: '역할 및 권한',
      path: '/users/roles'
    },
    {
      id: 'suspended',
      title: '정지된 계정',
      path: '/users/suspended',
      badge: { type: 'number', value: suspendedCount, color: 'red' }
    }
  ]
}
```

### 3. Analytics (분석)
```javascript
{
  id: 'analytics',
  title: '분석',
  icon: '📈',
  path: '/analytics',
  subMenu: [
    {
      id: 'usage-stats',
      title: '사용량 통계',
      path: '/analytics/usage',
      children: [
        { title: 'API 사용량', path: '/analytics/usage/api' },
        { title: '토큰 사용량', path: '/analytics/usage/tokens' },
        { title: '모델별 사용량', path: '/analytics/usage/models' }
      ]
    },
    {
      id: 'cost-analysis',
      title: '비용 분석',
      path: '/analytics/costs',
      badge: { type: 'text', value: '$1,234' }
    },
    {
      id: 'performance',
      title: '성능 메트릭',
      path: '/analytics/performance'
    },
    {
      id: 'user-behavior',
      title: '사용자 행동 분석',
      path: '/analytics/behavior'
    },
    {
      id: 'reports',
      title: '리포트',
      path: '/analytics/reports',
      children: [
        { title: '일간 리포트', path: '/analytics/reports/daily' },
        { title: '주간 리포트', path: '/analytics/reports/weekly' },
        { title: '월간 리포트', path: '/analytics/reports/monthly' },
        { title: '커스텀 리포트', path: '/analytics/reports/custom' }
      ]
    }
  ]
}
```

### 4. Conversations (대화 관리)
```javascript
{
  id: 'conversations',
  title: '대화',
  icon: '💬',
  path: '/conversations',
  subMenu: [
    {
      id: 'active-chats',
      title: '진행중인 대화',
      path: '/conversations/active',
      badge: { type: 'number', value: activeChats }
    },
    {
      id: 'history',
      title: '대화 기록',
      path: '/conversations/history'
    },
    {
      id: 'flagged',
      title: '신고된 대화',
      path: '/conversations/flagged',
      badge: { type: 'dot', color: 'orange' }
    },
    {
      id: 'moderation',
      title: '콘텐츠 검토',
      path: '/conversations/moderation'
    },
    {
      id: 'export',
      title: '데이터 내보내기',
      path: '/conversations/export'
    }
  ]
}
```

### 5. Security (보안)
```javascript
{
  id: 'security',
  title: '보안',
  icon: '🔒',
  path: '/security',
  badge: threats > 0 ? { type: 'dot', color: 'red' } : null,
  subMenu: [
    {
      id: 'threats',
      title: '위협 감지',
      path: '/security/threats',
      badge: { type: 'number', value: threats, color: 'red' }
    },
    {
      id: 'audit-logs',
      title: '감사 로그',
      path: '/security/audit'
    },
    {
      id: 'access-control',
      title: '접근 제어',
      path: '/security/access',
      children: [
        { title: 'IP 차단 목록', path: '/security/access/ip-blocks' },
        { title: 'Rate Limiting', path: '/security/access/rate-limits' },
        { title: '2FA 설정', path: '/security/access/2fa' }
      ]
    },
    {
      id: 'compliance',
      title: '규정 준수',
      path: '/security/compliance'
    },
    {
      id: 'incidents',
      title: '보안 사고',
      path: '/security/incidents'
    }
  ]
}
```

### 6. Billing & Limits (결제 및 한도)
```javascript
{
  id: 'billing',
  title: '결제',
  icon: '💰',
  path: '/billing',
  subMenu: [
    {
      id: 'overview',
      title: '결제 현황',
      path: '/billing/overview'
    },
    {
      id: 'subscriptions',
      title: '구독 관리',
      path: '/billing/subscriptions'
    },
    {
      id: 'quotas',
      title: '사용 한도',
      path: '/billing/quotas',
      children: [
        { title: '사용자별 한도', path: '/billing/quotas/users' },
        { title: '그룹별 한도', path: '/billing/quotas/groups' },
        { title: '전역 한도', path: '/billing/quotas/global' }
      ]
    },
    {
      id: 'invoices',
      title: '청구서',
      path: '/billing/invoices'
    },
    {
      id: 'payment-methods',
      title: '결제 수단',
      path: '/billing/payment-methods'
    }
  ]
}
```

### 7. Settings (설정)
```javascript
{
  id: 'settings',
  title: '설정',
  icon: '⚙️',
  path: '/settings',
  subMenu: [
    {
      id: 'general',
      title: '일반 설정',
      path: '/settings/general'
    },
    {
      id: 'models',
      title: '모델 관리',
      path: '/settings/models',
      children: [
        { title: 'OpenAI', path: '/settings/models/openai' },
        { title: 'Anthropic', path: '/settings/models/anthropic' },
        { title: 'Google', path: '/settings/models/google' },
        { title: 'Custom Models', path: '/settings/models/custom' }
      ]
    },
    {
      id: 'integrations',
      title: '통합',
      path: '/settings/integrations'
    },
    {
      id: 'notifications',
      title: '알림 설정',
      path: '/settings/notifications'
    },
    {
      id: 'backup',
      title: '백업 및 복원',
      path: '/settings/backup'
    },
    {
      id: 'api-keys',
      title: 'API 키 관리',
      path: '/settings/api-keys'
    }
  ]
}
```

## 🔴 Real-time Monitoring Section

### 8. Real-time Monitor (실시간 모니터링)
```javascript
{
  id: 'realtime',
  title: '실시간',
  icon: '🔴',
  path: '/monitor',
  isRealtime: true,
  subMenu: [
    {
      id: 'live-dashboard',
      title: '라이브 대시보드',
      path: '/monitor/live'
    },
    {
      id: 'active-users',
      title: '활성 사용자',
      path: '/monitor/users',
      badge: { type: 'live', value: activeUsers }
    },
    {
      id: 'system-health',
      title: '시스템 상태',
      path: '/monitor/health',
      badge: { type: 'status', value: systemStatus }
    },
    {
      id: 'message-queue',
      title: '메시지 큐',
      path: '/monitor/queue'
    }
  ]
}
```

## 🎨 UI Component Structure

### Navigation Component
```typescript
// components/Navigation/AdminNavigation.tsx
interface MenuItem {
  id: string;
  title: string;
  icon: string | ReactNode;
  path: string;
  badge?: {
    type: 'number' | 'dot' | 'text' | 'live' | 'status';
    value?: any;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  };
  permissions?: string[];
  subMenu?: MenuItem[];
  children?: MenuItem[];
  isRealtime?: boolean;
  divider?: boolean;
}

const AdminNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo(() => 
    filterMenuByPermissions(MENU_ITEMS, user.permissions),
    [user.permissions]
  );

  return (
    <Drawer
      variant="permanent"
      className={clsx('admin-drawer', { collapsed })}
      sx={{
        width: collapsed ? 64 : 280,
        transition: 'width 0.3s ease'
      }}
    >
      <div className="drawer-header">
        <Logo collapsed={collapsed} />
        <IconButton onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      <Divider />

      <List component="nav">
        {menuItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            expanded={expanded}
            onToggle={setExpanded}
            currentPath={location.pathname}
          />
        ))}
      </List>

      <div className="drawer-footer">
        <QuickActions collapsed={collapsed} />
      </div>
    </Drawer>
  );
};
```

### Navigation Item Component
```typescript
// components/Navigation/NavigationItem.tsx
const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  collapsed,
  expanded,
  onToggle,
  currentPath,
  depth = 0
}) => {
  const hasChildren = item.subMenu && item.subMenu.length > 0;
  const isExpanded = expanded.includes(item.id);
  const isActive = currentPath === item.path || 
                   currentPath.startsWith(item.path + '/');

  const handleClick = () => {
    if (hasChildren) {
      onToggle(isExpanded 
        ? expanded.filter(id => id !== item.id)
        : [...expanded, item.id]
      );
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        selected={isActive}
        sx={{ 
          pl: depth * 2 + 2,
          position: 'relative'
        }}
      >
        {item.isRealtime && (
          <PulseIndicator className="live-indicator" />
        )}
        
        <ListItemIcon>
          {typeof item.icon === 'string' ? (
            <span className="emoji-icon">{item.icon}</span>
          ) : (
            item.icon
          )}
        </ListItemIcon>

        {!collapsed && (
          <>
            <ListItemText 
              primary={item.title}
              secondary={item.description}
            />
            
            {item.badge && (
              <MenuBadge badge={item.badge} />
            )}
            
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </>
        )}
      </ListItemButton>

      {hasChildren && !collapsed && (
        <Collapse in={isExpanded} timeout="auto">
          <List component="div" disablePadding>
            {item.subMenu.map((child) => (
              <NavigationItem
                key={child.id}
                item={child}
                collapsed={collapsed}
                expanded={expanded}
                onToggle={onToggle}
                currentPath={currentPath}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}

      {item.divider && <Divider sx={{ my: 1 }} />}
    </>
  );
};
```

## 🔐 권한별 메뉴 접근 제어

### Role-based Menu Visibility
```typescript
const ROLE_PERMISSIONS = {
  super_admin: ['*'], // 모든 메뉴 접근 가능
  admin: [
    'dashboard.*',
    'users.*',
    'analytics.*',
    'conversations.*',
    'security.audit',
    'security.access',
    'billing.overview',
    'settings.*'
  ],
  moderator: [
    'dashboard.overview',
    'users.view',
    'conversations.*',
    'security.audit'
  ],
  analyst: [
    'dashboard.*',
    'analytics.*',
    'billing.overview'
  ],
  support: [
    'dashboard.overview',
    'users.view',
    'conversations.history',
    'conversations.flagged'
  ]
};

const filterMenuByPermissions = (
  menuItems: MenuItem[],
  userPermissions: string[]
): MenuItem[] => {
  return menuItems.filter(item => {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    
    return item.permissions.some(permission =>
      hasPermission(userPermissions, permission)
    );
  }).map(item => ({
    ...item,
    subMenu: item.subMenu 
      ? filterMenuByPermissions(item.subMenu, userPermissions)
      : undefined
  }));
};
```

## 📱 Responsive Menu Design

### Mobile Menu
```typescript
const MobileMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton onClick={() => setOpen(!open)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            LibreChat Admin
          </Typography>
        </Toolbar>
      </AppBar>
      
      <SwipeableDrawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      >
        <AdminNavigation />
      </SwipeableDrawer>
    </>
  );
};
```

## 🎯 Quick Actions Menu

### Floating Action Menu
```typescript
const QuickActions: React.FC = () => {
  const [open, setOpen] = useState(false);
  
  const actions = [
    { icon: <AddIcon />, name: '새 사용자', action: 'create-user' },
    { icon: <BlockIcon />, name: 'IP 차단', action: 'block-ip' },
    { icon: <NotificationIcon />, name: '공지 발송', action: 'send-notice' },
    { icon: <BackupIcon />, name: '백업 실행', action: 'run-backup' },
    { icon: <RefreshIcon />, name: '캐시 초기화', action: 'clear-cache' }
  ];
  
  return (
    <SpeedDial
      ariaLabel="Quick Actions"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => handleAction(action.action)}
        />
      ))}
    </SpeedDial>
  );
};
```

## 🔔 Notification Center

### Top Bar with Notifications
```typescript
const TopBar: React.FC = () => {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <AppBar position="fixed" className="admin-topbar">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <IconButton>
          <Badge variant="dot" color="success">
            <MessageIcon />
          </Badge>
        </IconButton>
        
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};
```

## 🎨 Theme & Styling

### Dark/Light Mode Support
```scss
// styles/admin-navigation.scss
.admin-drawer {
  .drawer-header {
    display: flex;
    align-items: center;
    padding: 16px;
    justify-content: space-between;
  }

  &.collapsed {
    .MuiListItemText-root {
      display: none;
    }
    
    .MuiListItemIcon-root {
      min-width: auto;
      margin: 0 auto;
    }
  }

  .live-indicator {
    position: absolute;
    left: 8px;
    width: 8px;
    height: 8px;
    background: #f44336;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
    }
  }

  // Dark mode
  [data-theme="dark"] & {
    background: #1e1e1e;
    
    .MuiListItemButton-root {
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      &.Mui-selected {
        background: rgba(33, 150, 243, 0.15);
        border-left: 3px solid #2196f3;
      }
    }
  }
}
```

이 메뉴 시스템은 확장 가능하고, 권한 기반 접근 제어를 지원하며, 실시간 업데이트와 모바일 반응형 디자인을 포함합니다.