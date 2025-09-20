import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  alpha,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Dashboard,
  Business,
  AttachMoney,
  Analytics,
  Settings,
  SettingsApplications,
  Logout,
  Description,
  Storage,
  Extension,
  SmartToy,
  Mail,
  ExpandLess,
  ExpandMore,
  AccountTree,
  People,
  ModelTraining,
  Api,
  Security,
  VpnKey,
  AttachMoney as PriceIcon,
  Build,
  IntegrationInstructions,
  TrendingUp,
  MonetizationOn,
  AdminPanelSettings,
  CloudQueue,
  Notifications,
  SupportAgent,
  Groups,
  Receipt,
  CreditCard,
  Assessment,
  WorkspacePremium
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const isCustomerAdmin = useAuthStore((state) => state.isCustomerAdmin);
  const theme = useTheme();

  // State for collapsible menus
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    // Super Admin menus
    customers: false,
    revenue: false,
    platform: false,
    operations: false,
    // Customer Admin menus
    workspace: false,
    billing: false,
    aiConfig: false,
    settings: false
  });

  // Auto-open menu when navigating to its submenu items
  useEffect(() => {
    // Super Admin paths
    if (location.pathname.startsWith('/customers')) {
      setOpenMenus(prev => ({ ...prev, customers: true }));
    }
    if (location.pathname.startsWith('/revenue')) {
      setOpenMenus(prev => ({ ...prev, revenue: true }));
    }
    if (location.pathname.startsWith('/platform')) {
      setOpenMenus(prev => ({ ...prev, platform: true }));
    }
    if (location.pathname.startsWith('/operations')) {
      setOpenMenus(prev => ({ ...prev, operations: true }));
    }
    // Customer Admin paths
    if (location.pathname.startsWith('/workspace')) {
      setOpenMenus(prev => ({ ...prev, workspace: true }));
    }
    if (location.pathname.startsWith('/billing')) {
      setOpenMenus(prev => ({ ...prev, billing: true }));
    }
    if (location.pathname.startsWith('/ai-config')) {
      setOpenMenus(prev => ({ ...prev, aiConfig: true }));
    }
    if (location.pathname.startsWith('/settings')) {
      setOpenMenus(prev => ({ ...prev, settings: true }));
    }
  }, [location.pathname]);

  const handleMenuToggle = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Check if any submenu item is active
  const isSubmenuActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  // Build menu items based on user role
  const getSuperAdminMenus = () => [
    { text: 'Platform Dashboard', icon: <Dashboard />, path: '/', queryKey: ['dashboard'] },

    // Customer Management
    {
      text: 'Customer Management',
      icon: <Business />,
      hasSubmenu: true,
      submenuKey: 'customers',
      isOpen: openMenus.customers,
      submenu: [
        { text: 'All Customers', icon: <Business />, path: '/customers', queryKey: ['customers'] },
        { text: 'Subscriptions', icon: <AttachMoney />, path: '/customers/subscriptions', queryKey: ['subscriptions'] },
        { text: 'Support Tickets', icon: <SupportAgent />, path: '/customers/support', queryKey: ['support'] }
      ]
    },

    // Revenue & Analytics
    {
      text: 'Revenue & Analytics',
      icon: <TrendingUp />,
      hasSubmenu: true,
      submenuKey: 'revenue',
      isOpen: openMenus.revenue,
      submenu: [
        { text: 'Revenue Dashboard', icon: <MonetizationOn />, path: '/revenue/dashboard', queryKey: ['revenue'] },
        { text: 'Usage Analytics', icon: <Analytics />, path: '/revenue/usage', queryKey: ['usage'] },
        { text: 'Churn Analysis', icon: <Assessment />, path: '/revenue/churn', queryKey: ['churn'] },
        { text: 'Growth Metrics', icon: <TrendingUp />, path: '/revenue/growth', queryKey: ['growth'] }
      ]
    },

    // Platform Settings
    {
      text: 'Platform Settings',
      icon: <AdminPanelSettings />,
      hasSubmenu: true,
      submenuKey: 'platform',
      isOpen: openMenus.platform,
      submenu: [
        { text: 'Pricing Plans', icon: <PriceIcon />, path: '/platform/pricing', queryKey: ['pricing'] },
        { text: 'Model Registry', icon: <ModelTraining />, path: '/platform/models', queryKey: ['models'] },
        { text: 'Rate Limits', icon: <Security />, path: '/platform/limits', queryKey: ['limits'] },
        { text: 'Feature Flags', icon: <Build />, path: '/platform/features', queryKey: ['features'] },
        { text: 'API Management', icon: <Api />, path: '/platform/api', queryKey: ['api'] }
      ]
    },

    // System Operations
    {
      text: 'System Operations',
      icon: <CloudQueue />,
      hasSubmenu: true,
      submenuKey: 'operations',
      isOpen: openMenus.operations,
      submenu: [
        { text: 'Infrastructure', icon: <CloudQueue />, path: '/operations/infrastructure', queryKey: ['infrastructure'] },
        { text: 'Deployments', icon: <Storage />, path: '/operations/deployments', queryKey: ['deployments'] },
        { text: 'Logs & Monitoring', icon: <Assessment />, path: '/operations/monitoring', queryKey: ['monitoring'] },
        { text: 'Security Center', icon: <Security />, path: '/operations/security', queryKey: ['security'] },
        { text: 'Backup & Recovery', icon: <Storage />, path: '/operations/backup', queryKey: ['backup'] }
      ]
    }
  ];

  const getCustomerAdminMenus = () => [
    { text: 'Dashboard', icon: <Dashboard />, path: '/', queryKey: ['dashboard'] },

    // Workspace
    {
      text: 'Workspace',
      icon: <WorkspacePremium />,
      hasSubmenu: true,
      submenuKey: 'workspace',
      isOpen: openMenus.workspace,
      submenu: [
        { text: 'Organization', icon: <AccountTree />, path: '/workspace/organization', queryKey: ['organization'] },
        { text: 'Members', icon: <People />, path: '/workspace/members', queryKey: ['members'] },
        { text: 'Teams', icon: <Groups />, path: '/workspace/teams', queryKey: ['teams'] },
        { text: 'Invitations', icon: <Mail />, path: '/workspace/invitations', queryKey: ['invitations'] },
        { text: 'Roles', icon: <Security />, path: '/workspace/roles', queryKey: ['roles'] }
      ]
    },

    // Billing & Usage
    {
      text: 'Billing & Usage',
      icon: <AttachMoney />,
      hasSubmenu: true,
      submenuKey: 'billing',
      isOpen: openMenus.billing,
      submenu: [
        { text: 'Current Plan', icon: <CreditCard />, path: '/billing/plan', queryKey: ['plan'] },
        { text: 'Usage Reports', icon: <Analytics />, path: '/billing/usage', queryKey: ['usage'] },
        { text: 'Invoices', icon: <Receipt />, path: '/billing/invoices', queryKey: ['invoices'] },
        { text: 'Payment Methods', icon: <CreditCard />, path: '/billing/payment', queryKey: ['payment'] },
        { text: 'Usage Alerts', icon: <Notifications />, path: '/billing/alerts', queryKey: ['alerts'] }
      ]
    },

    // AI Configuration
    {
      text: 'AI Configuration',
      icon: <ModelTraining />,
      hasSubmenu: true,
      submenuKey: 'aiConfig',
      isOpen: openMenus.aiConfig,
      submenu: [
        { text: 'Model Access', icon: <ModelTraining />, path: '/ai-config/models', queryKey: ['models'] },
        { text: 'Prompts Library', icon: <Description />, path: '/ai-config/prompts', queryKey: ['prompts'] },
        { text: 'MCP Servers', icon: <Storage />, path: '/ai-config/mcp', queryKey: ['mcp'] },
        { text: 'Agents', icon: <SmartToy />, path: '/ai-config/agents', queryKey: ['agents'] },
        { text: 'API Keys', icon: <VpnKey />, path: '/ai-config/api-keys', queryKey: ['apiKeys'] }
      ]
    },

    // Workspace Settings
    {
      text: 'Workspace Settings',
      icon: <Settings />,
      hasSubmenu: true,
      submenuKey: 'settings',
      isOpen: openMenus.settings,
      submenu: [
        { text: 'General', icon: <Settings />, path: '/settings/general', queryKey: ['general'] },
        { text: 'Security', icon: <Security />, path: '/settings/security', queryKey: ['security'] },
        { text: 'Integrations', icon: <IntegrationInstructions />, path: '/settings/integrations', queryKey: ['integrations'] },
        { text: 'Notifications', icon: <Notifications />, path: '/settings/notifications', queryKey: ['notifications'] },
        { text: 'Data & Privacy', icon: <Security />, path: '/settings/privacy', queryKey: ['privacy'] }
      ]
    }
  ];

  // Select menu items based on user role
  const menuItems = isSuperAdmin()
    ? getSuperAdminMenus()
    : isCustomerAdmin()
      ? getCustomerAdminMenus()
      : [{ text: 'Dashboard', icon: <Dashboard />, path: '/', queryKey: ['dashboard'] }];


  const handleNavigation = (path: string, queryKeys?: string[]) => {
    // Invalidate queries to force refresh
    if (queryKeys) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? 280 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box 
        sx={{ 
          p: 3, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white'
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
          LLMDash Admin
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Management Console
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item: any) => (
          <React.Fragment key={item.text}>
            {/* Main menu item */}
            <ListItem disablePadding>
              <ListItemButton
                selected={!item.hasSubmenu && location.pathname === item.path}
                onClick={() => {
                  if (item.hasSubmenu) {
                    handleMenuToggle(item.submenuKey);
                  } else {
                    handleNavigation(item.path, item.queryKey);
                  }
                }}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: (!item.hasSubmenu && location.pathname === item.path) || item.isOpen ? 600 : 400
                  }}
                />
                {item.hasSubmenu && (item.isOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>

            {/* Submenu items */}
            {item.hasSubmenu && (
              <Collapse in={item.isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem: any) => (
                    <ListItem key={subItem.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname === subItem.path}
                        onClick={() => handleNavigation(subItem.path, subItem.queryKey)}
                        sx={{
                          pl: 4,
                          mx: 1,
                          my: 0.25,
                          borderRadius: 2,
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.18),
                            },
                            '& .MuiListItemIcon-root': {
                              color: theme.palette.primary.main,
                            },
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 35 }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: location.pathname === subItem.path ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                '& .MuiListItemIcon-root': {
                  color: theme.palette.error.main,
                },
              },
            }}
          >
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;