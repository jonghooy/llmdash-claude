import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import CostUsage from './pages/CostUsage';
import Settings from './pages/Settings';
import SystemConfiguration from './pages/SystemConfiguration';
import Login from './pages/Login';
import { useAuthStore } from './stores/authStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, login } = useAuthStore();

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('admin_token');
    if (token && !isAuthenticated) {
      // Simple validation - in production, verify with backend
      login(token, { id: 'admin', email: 'admin@librechat.local', role: 'admin' });
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto', bgcolor: 'background.default' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cost-usage" element={<CostUsage />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/system-config" element={<SystemConfiguration />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;