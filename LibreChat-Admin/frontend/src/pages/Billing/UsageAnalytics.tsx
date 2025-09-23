import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download,
  FilterList,
  DateRange,
  Api,
  Person,
  Group,
  Storage,
  Speed,
  AttachMoney,
  Timeline,
  BarChart,
  PieChart,
  Info,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
  users: number;
}

interface ModelUsage {
  model: string;
  tokens: number;
  cost: number;
  requests: number;
  percentage: number;
}

interface UserUsage {
  user: string;
  department: string;
  tokens: number;
  cost: number;
  requests: number;
  lastActive: string;
}

const UsageAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedTab, setSelectedTab] = useState(0);
  const [department, setDepartment] = useState('all');

  // Mock data for usage over time
  const usageOverTime: UsageData[] = [
    { date: 'Jan 1', tokens: 45000, cost: 45, requests: 1200, users: 25 },
    { date: 'Jan 5', tokens: 52000, cost: 52, requests: 1400, users: 28 },
    { date: 'Jan 10', tokens: 48000, cost: 48, requests: 1300, users: 26 },
    { date: 'Jan 15', tokens: 65000, cost: 65, requests: 1750, users: 32 },
    { date: 'Jan 20', tokens: 72000, cost: 72, requests: 1950, users: 35 },
    { date: 'Jan 25', tokens: 68000, cost: 68, requests: 1850, users: 33 },
    { date: 'Jan 30', tokens: 75000, cost: 75, requests: 2000, users: 38 },
  ];

  // Mock data for model usage
  const modelUsage: ModelUsage[] = [
    { model: 'GPT-4', tokens: 250000, cost: 125, requests: 2500, percentage: 35 },
    { model: 'GPT-3.5 Turbo', tokens: 180000, cost: 36, requests: 6000, percentage: 25 },
    { model: 'Claude 3 Opus', tokens: 150000, cost: 90, requests: 1500, percentage: 21 },
    { model: 'Claude 3 Sonnet', tokens: 100000, cost: 40, requests: 2000, percentage: 14 },
    { model: 'Gemini Pro', tokens: 35000, cost: 14, requests: 1000, percentage: 5 },
  ];

  // Mock data for user usage
  const userUsage: UserUsage[] = [
    { user: 'John Smith', department: 'Engineering', tokens: 95000, cost: 47.5, requests: 950, lastActive: '2 hours ago' },
    { user: 'Sarah Johnson', department: 'Marketing', tokens: 82000, cost: 41, requests: 820, lastActive: '1 hour ago' },
    { user: 'Mike Chen', department: 'Engineering', tokens: 78000, cost: 39, requests: 780, lastActive: '30 min ago' },
    { user: 'Emily Davis', department: 'Sales', tokens: 65000, cost: 32.5, requests: 650, lastActive: '3 hours ago' },
    { user: 'Robert Wilson', department: 'Support', tokens: 58000, cost: 29, requests: 580, lastActive: '1 day ago' },
  ];

  // Summary statistics
  const summaryStats = {
    totalTokens: { value: 715000, change: 12.5, trend: 'up' },
    totalCost: { value: 305, change: 8.2, trend: 'up' },
    totalRequests: { value: 15000, change: -3.5, trend: 'down' },
    activeUsers: { value: 38, change: 5.8, trend: 'up' },
    avgTokensPerUser: { value: 18816, change: 6.7, trend: 'up' },
    avgCostPerUser: { value: 8.03, change: 2.4, trend: 'up' },
  };

  // Department usage data for pie chart
  const departmentUsage = [
    { name: 'Engineering', value: 35, color: '#0088FE' },
    { name: 'Marketing', value: 25, color: '#00C49F' },
    { name: 'Sales', value: 20, color: '#FFBB28' },
    { name: 'Support', value: 15, color: '#FF8042' },
    { name: 'HR', value: 5, color: '#8884D8' },
  ];

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting usage data...');
  };

  return (
    <Box>
      {/* Header with filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Usage Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="engineering">Engineering</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="support">Support</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Tokens Used
                  </Typography>
                  <Typography variant="h4">
                    {(summaryStats.totalTokens.value / 1000).toFixed(0)}k
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {summaryStats.totalTokens.trend === 'up' ? (
                      <ArrowUpward color="success" fontSize="small" />
                    ) : (
                      <ArrowDownward color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={summaryStats.totalTokens.trend === 'up' ? 'success.main' : 'error.main'}
                    >
                      {summaryStats.totalTokens.change}% from last period
                    </Typography>
                  </Box>
                </Box>
                <Api color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Cost
                  </Typography>
                  <Typography variant="h4">
                    ${summaryStats.totalCost.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {summaryStats.totalCost.trend === 'up' ? (
                      <ArrowUpward color="success" fontSize="small" />
                    ) : (
                      <ArrowDownward color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={summaryStats.totalCost.trend === 'up' ? 'success.main' : 'error.main'}
                    >
                      {summaryStats.totalCost.change}% from last period
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {summaryStats.activeUsers.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {summaryStats.activeUsers.trend === 'up' ? (
                      <ArrowUpward color="success" fontSize="small" />
                    ) : (
                      <ArrowDownward color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={summaryStats.activeUsers.trend === 'up' ? 'success.main' : 'error.main'}
                    >
                      {summaryStats.activeUsers.change}% from last period
                    </Typography>
                  </Box>
                </Box>
                <Group color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Charts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Token Usage" />
            <Tab label="Cost Analysis" />
            <Tab label="Request Volume" />
          </Tabs>

          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Token Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="tokens" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cost Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Request Volume
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="requests" fill="#ffc658" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Model Usage and Department Distribution */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Model Usage Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Requests</TableCell>
                      <TableCell align="right">Usage %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modelUsage.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={model.model} size="small" />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {(model.tokens / 1000).toFixed(0)}k
                        </TableCell>
                        <TableCell align="right">${model.cost}</TableCell>
                        <TableCell align="right">{model.requests.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={model.percentage}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2">{model.percentage}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage by Department
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={departmentUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Usage Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Top Users by Usage
            </Typography>
            <Button startIcon={<FilterList />} size="small">
              Filter
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell>Last Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userUsage.map((user) => (
                  <TableRow key={user.user}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        {user.user}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.department} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {(user.tokens / 1000).toFixed(0)}k
                    </TableCell>
                    <TableCell align="right">${user.cost}</TableCell>
                    <TableCell align="right">{user.requests}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastActive}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Usage Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info />
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Usage Tip
            </Typography>
            <Typography variant="body2">
              You're on track to use 90% of your monthly token quota by the end of the billing period.
              Consider optimizing prompt usage or upgrading your plan.
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Box>
  );
};

export default UsageAnalytics;