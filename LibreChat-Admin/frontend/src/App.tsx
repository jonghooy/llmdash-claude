import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { adminTheme } from './theme/adminTheme';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import { OrganizationManagement } from './features/organization/pages/OrganizationManagement';
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
      // Simple validation - in production, verify with backend
      login(token, { id: 'admin', email: 'admin@librechat.local', role: 'admin' });

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/cost-usage" element={<CostUsage />} />
            <Route path="/organization" element={<OrganizationManagement />} />
            <Route path="/invitations" element={<InvitationPage />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/mcp-servers" element={<MCPServers />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/system-config" element={<SystemConfiguration />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;