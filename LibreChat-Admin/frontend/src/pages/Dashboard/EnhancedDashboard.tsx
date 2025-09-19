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
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  useTheme,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  People,
  ChatBubble,
  TrendingUp,
  TrendingDown,
  Storage,
  AttachMoney,
  Speed,
  AccessTime,
  Circle,
  MoreVert,
  Refresh,
  CalendarToday,
  ShowChart,
  PieChart,
  BarChart,
  Timeline,
  Security,
  Warning,
  CheckCircle,
  ErrorOutline,
  CloudQueue,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  subtitle,
  loading
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.05)})`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.2),
              color: color,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {change >= 0 ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: change >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {Math.abs(change)}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const EnhancedDashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid');
  const [refreshKey, setRefreshKey] = useState(0);

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  // Mock data generation
  const generateMockData = () => ({
    metrics: {
      users: { total: 1234, active: 456, new: 78, change: 12 },
      conversations: { total: 45678, today: 234, change: -5 },
      tokens: { total: 12345678, today: 98765, change: 23 },
      cost: { total: 4567.89, today: 123.45, change: 8 },
      storage: { used: 456, total: 1000, change: 3 },
      apiCalls: { total: 987654, today: 5432, change: 15 }
    },
    usage: Array.from({ length: timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30 }, (_, i) => ({
      date: timeRange === 'day'
        ? `${i}:00`
        : timeRange === 'week'
          ? format(subDays(new Date(), 6 - i), 'EEE')
          : format(subDays(new Date(), 29 - i), 'MM/dd'),
      conversations: Math.floor(Math.random() * 1000) + 500,
      tokens: Math.floor(Math.random() * 50000) + 25000,
      cost: Math.floor(Math.random() * 200) + 100,
      users: Math.floor(Math.random() * 100) + 50
    })),
    modelUsage: [
      { name: 'GPT-4', value: 35, tokens: 5432100 },
      { name: 'GPT-3.5', value: 25, tokens: 3210000 },
      { name: 'Claude', value: 20, tokens: 2876543 },
      { name: 'Gemini', value: 15, tokens: 1987654 },
      { name: 'Others', value: 5, tokens: 654321 }
    ],
    userActivity: {
      hourly: Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        active: Math.floor(Math.random() * 100) + 20
      })),
      daily: Array.from({ length: 7 }, (_, day) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
        active: Math.floor(Math.random() * 500) + 200
      }))
    },
    performance: {
      responseTime: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        avg: Math.random() * 500 + 200,
        p95: Math.random() * 800 + 400,
        p99: Math.random() * 1000 + 600
      })),
      errorRate: Array.from({ length: 7 }, (_, i) => ({
        day: format(subDays(new Date(), 6 - i), 'EEE'),
        rate: Math.random() * 2,
        count: Math.floor(Math.random() * 50)
      }))
    },
    topUsers: [
      { name: 'John Doe', conversations: 234, tokens: 543210, cost: 123.45 },
      { name: 'Jane Smith', conversations: 198, tokens: 432109, cost: 98.76 },
      { name: 'Bob Johnson', conversations: 176, tokens: 321098, cost: 76.54 },
      { name: 'Alice Brown', conversations: 165, tokens: 298765, cost: 65.43 },
      { name: 'Charlie Wilson', conversations: 143, tokens: 234567, cost: 54.32 }
    ]
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['enhanced-dashboard', timeRange, refreshKey],
    queryFn: async () => {
      // In production, fetch from API
      return generateMockData();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid key={i} item xs={12} sm={6} md={4}>
              <MetricCard
                title=""
                value=""
                icon={<Circle />}
                color={theme.palette.primary.main}
                loading
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time insights and metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, value) => value && setTimeRange(value)}
            size="small"
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="grid">
              <Tooltip title="Grid View">
                <ShowChart />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="analytics">
              <Tooltip title="Analytics View">
                <Timeline />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Total Users"
            value={data.metrics.users.total.toLocaleString()}
            change={data.metrics.users.change}
            icon={<People />}
            color={theme.palette.primary.main}
            subtitle={`${data.metrics.users.active} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Conversations"
            value={data.metrics.conversations.total.toLocaleString()}
            change={data.metrics.conversations.change}
            icon={<ChatBubble />}
            color={theme.palette.secondary.main}
            subtitle={`${data.metrics.conversations.today} today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Tokens Used"
            value={`${(data.metrics.tokens.total / 1000000).toFixed(1)}M`}
            change={data.metrics.tokens.change}
            icon={<MemoryIcon />}
            color={theme.palette.success.main}
            subtitle={`${(data.metrics.tokens.today / 1000).toFixed(0)}k today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Total Cost"
            value={`$${data.metrics.cost.total.toFixed(2)}`}
            change={data.metrics.cost.change}
            icon={<AttachMoney />}
            color={theme.palette.warning.main}
            subtitle={`$${data.metrics.cost.today.toFixed(2)} today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Storage"
            value={`${data.metrics.storage.used} GB`}
            change={data.metrics.storage.change}
            icon={<Storage />}
            color={theme.palette.info.main}
            subtitle={`of ${data.metrics.storage.total} GB`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="API Calls"
            value={`${(data.metrics.apiCalls.total / 1000).toFixed(0)}k`}
            change={data.metrics.apiCalls.change}
            icon={<CloudQueue />}
            color={theme.palette.error.main}
            subtitle={`${data.metrics.apiCalls.today} today`}
          />
        </Grid>
      </Grid>

      {viewMode === 'grid' ? (
        <>
          {/* Usage Chart */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Usage Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversations"
                      stroke={COLORS[0]}
                      fill={alpha(COLORS[0], 0.3)}
                      name="Conversations"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tokens"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      name="Tokens"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="users"
                      fill={COLORS[2]}
                      name="Active Users"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Model Usage
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie width={400} height={400}>
                    <Pie
                      data={data.modelUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.modelUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Performance Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Response Time Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.performance.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke={COLORS[0]}
                      name="Average"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="p95"
                      stroke={COLORS[1]}
                      name="P95"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="p99"
                      stroke={COLORS[2]}
                      name="P99"
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Users by Usage
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {data.topUsers.map((user, index) => (
                    <Box
                      key={user.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 20 }}>
                          {index + 1}.
                        </Typography>
                        <Box>
                          <Typography variant="body1">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.conversations} conversations
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="primary">
                          ${user.cost.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(user.tokens / 1000).toFixed(0)}k tokens
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : (
        /* Analytics View */
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Comprehensive Analytics
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stackId="1"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke={COLORS[1]}
                    fill={COLORS[1]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EnhancedDashboard;