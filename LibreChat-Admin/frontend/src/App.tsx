import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Usage from './pages/Usage';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Approvals from './pages/Approvals';
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
            <Route path="/users" element={<Users />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;