import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { adminTheme } from './theme/adminTheme';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import { OrganizationManagement } from './features/organization/pages/OrganizationManagement';
import { OrganizationMembers } from './features/organization/pages/OrganizationMembers';
import { OrganizationSettings } from './features/organization/pages/OrganizationSettings';
import { InvitationPage } from './features/invitation/components';
import CostUsage from './pages/CostUsage';
import Settings from './pages/Settings';
import SystemConfiguration from './pages/SystemConfiguration';
import Prompts from './pages/Prompts';
import MCPServers from './pages/MCPServers';
import Agents from './pages/Agents';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase/client';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, login } = useAuthStore();

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('admin_token');
    if (token && !isAuthenticated) {
      // Get saved user data or default to customer_admin for testing
      const savedUser = localStorage.getItem('admin_user');
      const user = savedUser ? JSON.parse(savedUser) : {
        id: 'admin',
        email: 'admin@librechat.local',
        role: 'admin',
        saasRole: 'customer_admin', // Default to customer_admin to see menus
        tenantId: 'tenant123',
        tenantName: 'Acme Corp',
        subscription: {
          plan: 'professional',
          status: 'active'
        }
      };

      login(token, user);

      // Also set up a Supabase session for admin user
      supabase.auth.signInWithPassword({
        email: 'admin@librechat.local',
        password: 'admin123456'
      }).catch(() => {
        // If login fails, we can still use the admin dashboard
        console.log('Supabase auth setup skipped');
      });
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <Box sx={{
            flexGrow: 1,
            overflow: 'auto',
            bgcolor: 'background.default',
            p: { xs: 2, sm: 3, md: 4 },
            '& > *': {
              maxWidth: '1600px',
              margin: '0 auto',
              width: '100%'
            }
          }}>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Super Admin Routes */}
            {/* Customer Management */}
            <Route path="/customers" element={<OrganizationManagement />} />
            <Route path="/customers/subscriptions" element={<CostUsage />} />
            <Route path="/customers/support" element={<InvitationPage />} />

            {/* Revenue & Analytics */}
            <Route path="/revenue/dashboard" element={<CostUsage />} />
            <Route path="/revenue/usage" element={<CostUsage />} />
            <Route path="/revenue/churn" element={<Dashboard />} />
            <Route path="/revenue/growth" element={<Dashboard />} />

            {/* Platform Settings */}
            <Route path="/platform/pricing" element={<Settings />} />
            <Route path="/platform/models" element={<Settings />} />
            <Route path="/platform/limits" element={<Settings />} />
            <Route path="/platform/features" element={<Settings />} />
            <Route path="/platform/api" element={<Settings />} />

            {/* System Operations */}
            <Route path="/operations/infrastructure" element={<SystemConfiguration />} />
            <Route path="/operations/deployments" element={<SystemConfiguration />} />
            <Route path="/operations/monitoring" element={<SystemConfiguration />} />
            <Route path="/operations/security" element={<SystemConfiguration />} />
            <Route path="/operations/backup" element={<SystemConfiguration />} />

            {/* Customer Admin Routes */}
            {/* Workspace */}
            <Route path="/workspace/organization" element={<OrganizationManagement />} />
            <Route path="/workspace/members" element={<OrganizationMembers />} />
            <Route path="/workspace/teams" element={<OrganizationMembers />} />
            <Route path="/workspace/invitations" element={<InvitationPage />} />
            <Route path="/workspace/roles" element={<OrganizationSettings />} />

            {/* Billing & Usage */}
            <Route path="/billing/plan" element={<CostUsage />} />
            <Route path="/billing/usage" element={<CostUsage />} />
            <Route path="/billing/invoices" element={<CostUsage />} />
            <Route path="/billing/payment" element={<CostUsage />} />
            <Route path="/billing/alerts" element={<Settings />} />

            {/* AI Configuration */}
            <Route path="/ai-config/models" element={<Settings />} />
            <Route path="/ai-config/prompts" element={<Prompts />} />
            <Route path="/ai-config/mcp" element={<MCPServers />} />
            <Route path="/ai-config/agents" element={<Agents />} />
            <Route path="/ai-config/api-keys" element={<Settings />} />

            {/* Workspace Settings */}
            <Route path="/settings/general" element={<SystemConfiguration />} />
            <Route path="/settings/security" element={<SystemConfiguration />} />
            <Route path="/settings/integrations" element={<SystemConfiguration />} />
            <Route path="/settings/notifications" element={<SystemConfiguration />} />
            <Route path="/settings/privacy" element={<SystemConfiguration />} />

            {/* Legacy routes for backward compatibility */}
            <Route path="/organization" element={<OrganizationManagement />} />
            <Route path="/organization/members" element={<OrganizationMembers />} />
            <Route path="/organization/invitations" element={<InvitationPage />} />
            <Route path="/organization/settings" element={<OrganizationSettings />} />
            <Route path="/cost-usage" element={<CostUsage />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/mcp-servers" element={<MCPServers />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/system-config" element={<SystemConfiguration />} />
            <Route path="/system/general" element={<SystemConfiguration />} />
            <Route path="/system/security" element={<SystemConfiguration />} />
            <Route path="/system/integrations" element={<SystemConfiguration />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;