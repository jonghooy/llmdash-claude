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
  IntegrationInstructions
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
  const theme = useTheme();

  // State for collapsible menus
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    organization: false,
    aiModels: false,
    aiTools: false,
    system: false
  });

  // Auto-open menu when navigating to its submenu items
  useEffect(() => {
    if (location.pathname.startsWith('/organization')) {
      setOpenMenus(prev => ({ ...prev, organization: true }));
    }
    if (location.pathname.startsWith('/ai-models')) {
      setOpenMenus(prev => ({ ...prev, aiModels: true }));
    }
    if (location.pathname.startsWith('/prompts') || location.pathname.startsWith('/mcp-servers') || location.pathname.startsWith('/agents')) {
      setOpenMenus(prev => ({ ...prev, aiTools: true }));
    }
    if (location.pathname.startsWith('/system')) {
      setOpenMenus(prev => ({ ...prev, system: true }));
    }
  }, [location.pathname]);

  const handleMenuToggle = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Check if any submenu item is active
  const isSubmenuActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/', queryKey: ['dashboard'] },

    // Organization management
    {
      text: 'Organization',
      icon: <Business />,
      hasSubmenu: true,
      submenuKey: 'organization',
      isOpen: openMenus.organization,
      submenu: [
        { text: 'Structure', icon: <AccountTree />, path: '/organization', queryKey: ['orgStructure'] },
        { text: 'Members', icon: <People />, path: '/organization/members', queryKey: ['orgMembers'] },
        { text: 'Invitations', icon: <Mail />, path: '/organization/invitations', queryKey: ['invitations'] },
        { text: 'Settings', icon: <Settings />, path: '/organization/settings', queryKey: ['orgSettings'] }
      ]
    },

    { text: 'Cost & Usage', icon: <AttachMoney />, path: '/cost-usage', queryKey: ['costUsage'] },

    // AI Models (formerly Settings)
    {
      text: 'AI Models',
      icon: <ModelTraining />,
      hasSubmenu: true,
      submenuKey: 'aiModels',
      isOpen: openMenus.aiModels,
      submenu: [
        { text: 'Management', icon: <Build />, path: '/ai-models/management', queryKey: ['modelManagement'] },
        { text: 'Pricing', icon: <PriceIcon />, path: '/ai-models/pricing', queryKey: ['modelPricing'] },
        { text: 'Permissions', icon: <Security />, path: '/ai-models/permissions', queryKey: ['modelPermissions'] },
        { text: 'API Keys', icon: <VpnKey />, path: '/ai-models/api-keys', queryKey: ['apiKeys'] }
      ]
    },

    // AI Tools group
    {
      text: 'AI Tools',
      icon: <Extension />,
      hasSubmenu: true,
      submenuKey: 'aiTools',
      isOpen: openMenus.aiTools,
      submenu: [
        { text: 'Prompts', icon: <Description />, path: '/prompts', queryKey: ['prompts'] },
        { text: 'MCP Servers', icon: <Storage />, path: '/mcp-servers', queryKey: ['mcpServers'] },
        { text: 'Agents', icon: <SmartToy />, path: '/agents', queryKey: ['agents'] }
      ]
    },

    // System (formerly System Config)
    {
      text: 'System',
      icon: <SettingsApplications />,
      hasSubmenu: true,
      submenuKey: 'system',
      isOpen: openMenus.system,
      submenu: [
        { text: 'General', icon: <Settings />, path: '/system/general', queryKey: ['systemGeneral'] },
        { text: 'Security', icon: <Security />, path: '/system/security', queryKey: ['systemSecurity'] },
        { text: 'Integrations', icon: <IntegrationInstructions />, path: '/system/integrations', queryKey: ['systemIntegrations'] }
      ]
    }
  ];

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