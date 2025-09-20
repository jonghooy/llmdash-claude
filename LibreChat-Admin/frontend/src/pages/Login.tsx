import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const Login: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testRole, setTestRole] = useState('customer_admin'); // For testing only

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For testing: bypass backend and use local auth
      if (email === 'admin@librechat.local' && password === 'Admin123!@#') {
        const token = 'test_token_' + Date.now();
        const user = {
          id: 'test_admin',
          email,
          role: 'admin',
          saasRole: testRole as any,
          tenantId: testRole === 'customer_admin' ? 'tenant123' : undefined,
          tenantName: testRole === 'customer_admin' ? 'Acme Corp' : undefined,
          subscription: testRole === 'customer_admin' ? {
            plan: 'professional',
            status: 'active'
          } : undefined
        };
        login(token, user);
        // Save user data to localStorage for persistence
        localStorage.setItem('admin_user', JSON.stringify(user));
        // Force a page reload to ensure App component re-renders
        window.location.href = '/admin';
      } else {
        // Try real backend
        const response = await axios.post('/admin/api/auth/login', {
          email,
          password
        });

        if (response.data.success) {
          login(response.data.token, response.data.user);
          // Force a page reload to ensure App component re-renders
          window.location.href = '/admin';
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            LLMDash Admin
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {/* Test Role Selector - Remove in production */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="test-role-label">Test Role (Dev Only)</InputLabel>
              <Select
                labelId="test-role-label"
                value={testRole}
                label="Test Role (Dev Only)"
                onChange={(e) => setTestRole(e.target.value)}
              >
                <MenuItem value="super_admin">Super Admin (Platform)</MenuItem>
                <MenuItem value="customer_admin">Customer Admin (Tenant)</MenuItem>
                <MenuItem value="team_leader">Team Leader</MenuItem>
                <MenuItem value="user">Regular User</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;