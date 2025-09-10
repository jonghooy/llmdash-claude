import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Fade,
  Grow
} from '@mui/material';
import { 
  People, 
  ChatBubble, 
  TrendingUp,
  Storage,
  AttachMoney,
  Speed,
  AccessTime,
  Circle
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import io from 'socket.io-client';

interface DashboardData {
  users: {
    total: number;
    active: number;
    new: number;
  };
  messages: {
    total: number;
    today: number;
  };
  tokens: {
    total: number;
    today: number;
  };
  models: {
    [key: string]: number;
  };
  costs?: {
    today: number;
    month: number;
    trend: number;
  };
  realtime?: {
    activeNow: number;
    messagesPerMinute: number;
    avgResponseTime: number;
    systemLoad: number;
  };
}

const RealtimeDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState({
    activeNow: 0,
    messagesPerMinute: 0,
    avgResponseTime: 0,
    systemLoad: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Main dashboard data with auto-refresh every 10 seconds
  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socket = io('http://localhost:5001', {
      auth: {
        token: localStorage.getItem('admin_token')
      }
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe:metrics', ['realtime']);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('metric:realtime', (data) => {
      setRealtimeData(data);
      setLastUpdate(new Date());
    });

    // Fetch real data from API if WebSocket not working
    const fetchRealtimeData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/dashboard/realtime', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setRealtimeData(data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching realtime data:', error);
      }
    };

    // Fetch data every 3 seconds if not connected to WebSocket
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchRealtimeData();
      }
    }, 3000);

    // Initial fetch
    fetchRealtimeData();

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [isConnected]);

  const AnimatedStatCard = ({ title, value, icon, color, subtitle, isNew = false }: any) => (
    <Grow in={true} timeout={1000}>
      <Card 
        sx={{ 
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box 
              sx={{ 
                backgroundColor: `${color}.light`,
                borderRadius: 2,
                p: 1,
                mr: 2,
                animation: isNew ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                }
              }}
            >
              {icon}
            </Box>
            <Typography color="text.secondary" variant="subtitle2">
              {title}
            </Typography>
          </Box>
          <Fade in={!isLoading} timeout={500}>
            <Typography variant="h4" component="div">
              {isLoading ? '-' : value?.toLocaleString()}
            </Typography>
          </Fade>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grow>
  );

  const getSystemStatus = () => {
    if (realtimeData.systemLoad < 30) return { color: 'success', text: 'Healthy' };
    if (realtimeData.systemLoad < 70) return { color: 'warning', text: 'Moderate' };
    return { color: 'error', text: 'High Load' };
  };

  const systemStatus = getSystemStatus();

  return (
    <Box>
      {/* Header with Real-time Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<Circle sx={{ fontSize: 12 }} />}
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'default'}
            size="small"
            sx={{
              '& .MuiChip-icon': {
                color: isConnected ? '#4caf50' : '#757575',
                animation: isConnected ? 'blink 2s infinite' : 'none',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.3 },
                }
              }
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Real-time Metrics Bar */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Speed sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Messages/min
                </Typography>
                <Typography variant="h6">
                  {realtimeData.messagesPerMinute}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1, color: 'success.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active Now
                </Typography>
                <Typography variant="h6">
                  {realtimeData.activeNow}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, color: 'warning.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Avg Response
                </Typography>
                <Typography variant="h6">
                  {realtimeData.avgResponseTime}ms
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  System Load
                </Typography>
                <Chip 
                  label={systemStatus.text} 
                  color={systemStatus.color as any}
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={realtimeData.systemLoad} 
                color={systemStatus.color as any}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Main Stats Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Users"
            value={data?.users?.total}
            icon={<People sx={{ color: 'primary.main' }} />}
            color="primary"
            subtitle={`+${data?.users?.new || 0} today`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Active Users"
            value={data?.users?.active}
            icon={<TrendingUp sx={{ color: 'success.main' }} />}
            color="success"
            subtitle={`${realtimeData.activeNow} online now`}
            isNew={realtimeData.activeNow > 0}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Messages Today"
            value={data?.messages?.today}
            icon={<ChatBubble sx={{ color: 'info.main' }} />}
            color="info"
            subtitle={`${realtimeData.messagesPerMinute}/min`}
            isNew={true}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Tokens Today"
            value={data?.tokens?.today}
            icon={<Storage sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        {/* Enhanced Cost Widget with Animation */}
        <Grid item xs={12}>
          <Fade in={true} timeout={1500}>
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'background.paper',
              background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(255,255,255,0) 100%)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} />
                Cost Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }
                  }}>
                    <Typography color="text.secondary" gutterBottom>
                      Today's Cost
                    </Typography>
                    <Typography variant="h5" color="primary">
                      ${data?.costs?.today?.toFixed(2) || '0.00'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={30} 
                      sx={{ mt: 1, height: 2 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }
                  }}>
                    <Typography color="text.secondary" gutterBottom>
                      This Month
                    </Typography>
                    <Typography variant="h5">
                      ${data?.costs?.month?.toFixed(2) || '0.00'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={60} 
                      sx={{ mt: 1, height: 2 }}
                      color="secondary"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: data?.costs?.trend && data.costs.trend > 0 ? 'error.main' : 'success.main',
                      boxShadow: 1
                    }
                  }}>
                    <Typography color="text.secondary" gutterBottom>
                      Monthly Trend
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={data?.costs?.trend && data.costs.trend > 0 ? 'error.main' : 'success.main'}
                    >
                      {data?.costs?.trend ? `${data.costs.trend > 0 ? '+' : ''}${data.costs.trend.toFixed(1)}%` : '0%'}
                    </Typography>
                    <Chip 
                      label={data?.costs?.trend && data.costs.trend > 0 ? 'Increasing' : 'Stable'}
                      color={data?.costs?.trend && data.costs.trend > 0 ? 'error' : 'success'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        </Grid>

        {/* Model Usage with Live Updates */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Model Usage
              </Typography>
              <Chip 
                label="Live" 
                color="primary" 
                size="small"
                sx={{ animation: 'pulse 2s infinite' }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              {data?.models && Object.entries(data.models).map(([model, count]) => (
                <Fade in={true} key={model}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{model}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {count.toLocaleString()} messages
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(count / Math.max(...Object.values(data.models))) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Fade>
              ))}
              {(!data?.models || Object.keys(data.models).length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No model usage data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Live Activity Feed */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">New Users Today</Typography>
                <Chip 
                  label={data?.users?.new || 0}
                  color="primary"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Total Messages</Typography>
                <Chip 
                  label={data?.messages?.total?.toLocaleString() || 0}
                  color="secondary"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Total Tokens</Typography>
                <Chip 
                  label={data?.tokens?.total?.toLocaleString() || 0}
                  color="default"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Response Time</Typography>
                <Chip 
                  label={`${realtimeData.avgResponseTime}ms`}
                  color={realtimeData.avgResponseTime < 200 ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;