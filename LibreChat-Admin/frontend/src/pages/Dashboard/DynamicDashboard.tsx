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
  Grow,
  IconButton,
  Menu,
  MenuItem,
  Zoom,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import { keyframes } from '@mui/system';
import { 
  People, 
  ChatBubble, 
  TrendingUp,
  Storage,
  AttachMoney,
  Speed,
  AccessTime,
  Circle,
  MoreVert,
  Refresh
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Import chart components
import SimpleLineChart from '../../components/Charts/SimpleLineChart';
import SimplePieChart from '../../components/Charts/SimplePieChart';

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
}

const DynamicDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState({
    activeNow: 0,
    messagesPerMinute: 0,
    avgResponseTime: 0,
    systemLoad: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Main dashboard data with auto-refresh
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
    refetchInterval: 10000
  });

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await axios.get('/admin/api/dashboard/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          setRealtimeData({
            activeNow: response.data.activeSessions || 0,
            messagesPerMinute: response.data.messagesPerMinute || 0,
            avgResponseTime: response.data.avgResponseTime || 0,
            systemLoad: response.data.systemLoad || 0
          });
          setIsConnected(true);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Initial fetch
    fetchMetrics();
    
    // Update every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const theme = useTheme();

  // Pulse animation for live indicators
  const pulse = keyframes`
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  `;

  // Slide in animation
  const slideIn = keyframes`
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  `;

  const AnimatedStatCard = ({ title, value, icon, color, subtitle, trend, delay = 0 }: any) => {
    const colorPalette = theme.palette[color as keyof typeof theme.palette] as any;
    return (
    <Zoom in={true} timeout={500 + delay * 100}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(colorPalette?.light || '#f0f0f0', 0.1)} 0%, white 100%)`,
          border: `1px solid ${alpha(colorPalette?.main || '#333', 0.1)}`,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(colorPalette?.main || '#333', 0.3)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorPalette?.light || '#f0f0f0'}, ${colorPalette?.main || '#333'})`,
            animation: `${slideIn} 1s ease-out`
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    background: `linear-gradient(135deg, ${colorPalette?.main || '#333'}, ${colorPalette?.dark || '#111'})`,
                    borderRadius: 2,
                    p: 1.5,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${pulse} 2s infinite`,
                    boxShadow: `0 4px 12px ${alpha(colorPalette?.main || '#333', 0.3)}`
                  }}
                >
                  {React.cloneElement(icon, { sx: { color: 'white', fontSize: 28 } })}
                </Box>
                <Typography color="text.secondary" variant="subtitle2">
                  {title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {isLoading ? '-' : value?.toLocaleString()}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {trend !== undefined && (
              <Chip
                size="small"
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                color={trend > 0 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Zoom>
    );
  };

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
          Dynamic Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton onClick={() => refetch()} size="small">
            <Refresh />
          </IconButton>
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
            {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Real-time Metrics Bar */}
      <Fade in={true} timeout={800}>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: `${slideIn} 3s infinite`
            }
          }}
        >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Speed sx={{ mr: 1 }} />
              <Box>
                <Typography variant="caption">Messages/min</Typography>
                <Typography variant="h5">
                  {realtimeData.messagesPerMinute}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1 }} />
              <Box>
                <Typography variant="caption">Active Now</Typography>
                <Typography variant="h5">
                  {realtimeData.activeNow}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1 }} />
              <Box>
                <Typography variant="caption">Avg Response</Typography>
                <Typography variant="h5">
                  {realtimeData.avgResponseTime}ms
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">System Load</Typography>
                <Chip 
                  label={systemStatus.text} 
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={realtimeData.systemLoad} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Fade>
      
      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Users"
            value={data?.users?.total}
            icon={<People />}
            color="primary"
            subtitle={`+${data?.users?.new || 0} today`}
            trend={5}
            delay={0}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Active Users"
            value={data?.users?.active}
            icon={<TrendingUp />}
            color="success"
            subtitle={`${realtimeData.activeNow} online now`}
            trend={12}
            delay={1}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Messages Today"
            value={data?.messages?.today}
            icon={<ChatBubble />}
            color="info"
            subtitle={`${realtimeData.messagesPerMinute}/min`}
            trend={-3}
            delay={2}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Monthly Cost"
            value={`$${data?.costs?.month?.toFixed(2) || '0.00'}`}
            icon={<AttachMoney />}
            color="warning"
            delay={3}
            subtitle={`$${data?.costs?.today?.toFixed(2) || '0.00'} today`}
            trend={data?.costs?.trend}
          />
        </Grid>
      </Grid>

      {/* Charts Grid with Working Components */}
      <Grid container spacing={3}>
        {/* Real-time Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Fade in={true} timeout={600}>
            <Box>
              <SimpleLineChart />
            </Box>
          </Fade>
        </Grid>

        {/* Model Usage Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Fade in={true} timeout={800}>
            <Box>
              <SimplePieChart modelData={data?.models} />
            </Box>
          </Fade>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {data?.messages?.total?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Messages
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="secondary">
                    {data?.tokens?.total?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tokens
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main">
                    {Object.keys(data?.models || {}).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Models
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="warning.main">
                    {realtimeData.avgResponseTime}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DynamicDashboard;