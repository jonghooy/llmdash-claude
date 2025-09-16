import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

interface CostSummary {
  totalCost: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalTransactions: number;
  averageCostPerTransaction: string;
}

interface ModelCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  conversationCount: number;
  // Legacy fields for backward compatibility
  totalCost?: number;
  transactions?: number;
}

interface UserCost {
  userId: string;
  userName: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  transactions: number;
}

interface DailyCost {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  transactions: number;
}

interface Transaction {
  id: string;
  date: string;
  user: string;
  userId: string;
  model: string;
  conversationId: string;
  tokenType: string;
  tokens: number;
  cost: string;
  context: string;
}

function CostAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Date range filter
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Data states
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [modelCosts, setModelCosts] = useState<ModelCost[]>([]);
  const [userCosts, setUserCosts] = useState<UserCost[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modelUsage, setModelUsage] = useState<any[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'
    : '/admin/api';

  const fetchCostOverview = async () => {
    try {
      setLoading(true);
      console.log('Fetching cost overview from:', `${apiUrl}/cost-analysis/overview`);
      console.log('Date range:', dateRange);
      
      const response = await fetch(
        `${apiUrl}/cost-analysis/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch cost overview: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);

      // Transform API response to match expected structure
      setSummary({
        totalCost: data.totalCost?.toFixed(2) || '0.00',
        totalInputTokens: data.modelUsage?.reduce((sum: number, m: any) => sum + (m.inputTokens || 0), 0) || 0,
        totalOutputTokens: data.modelUsage?.reduce((sum: number, m: any) => sum + (m.outputTokens || 0), 0) || 0,
        totalTokens: data.totalTokens || 0,
        totalTransactions: data.totalConversations || 0,
        averageCostPerTransaction: (data.averageCostPerConversation || 0).toFixed(2)
      });
      setModelCosts(data.modelUsage || []);
      setUserCosts(data.topUsers || []);
      setDailyCosts(data.dailyUsage || []);
    } catch (err: any) {
      console.error('Error fetching cost overview:', err);
      setError(err.message || 'Failed to fetch cost overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedTransactions = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/cost-analysis/detailed?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&page=${page}&limit=50`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchModelUsage = async () => {
    try {
      // Use the same overview endpoint for model usage data
      const response = await fetch(
        `${apiUrl}/cost-analysis/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch model usage');
      
      const data = await response.json();
      // Transform model usage data for chart display
      const transformedData = data.modelUsage?.map((model: any) => ({
        model: model.model,
        inputTokens: model.inputTokens || 0,
        outputTokens: model.outputTokens || 0,
        totalTokens: (model.inputTokens || 0) + (model.outputTokens || 0),
        cost: model.cost || 0,
        conversationCount: model.conversationCount || 0
      })) || [];
      setModelUsage(transformedData);
    } catch (err: any) {
      console.error('Error fetching model usage:', err);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(
        `${apiUrl}/cost-analysis/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-analysis-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  const handleRefresh = () => {
    fetchCostOverview();
    if (activeTab === 1) fetchDetailedTransactions();
    if (activeTab === 2) fetchModelUsage();
  };

  useEffect(() => {
    fetchCostOverview();
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === 1) fetchDetailedTransactions();
    if (activeTab === 2) fetchModelUsage();
  }, [activeTab, page, dateRange]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Cost
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatCurrency(summary.totalCost)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SpeedIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Tokens
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.totalTokens)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Input Tokens
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.totalInputTokens)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Output Tokens
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.totalOutputTokens)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Transactions
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.totalTransactions)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Avg Cost/Txn
                  </Typography>
                </Box>
                <Typography variant="h5" component="div">
                  {formatCurrency(summary.averageCostPerTransaction)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="Transactions" />
          <Tab label="Model Usage" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Daily Cost Trend */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Cost Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        try {
                          const d = new Date(date);
                          return isNaN(d.getTime()) ? '' : format(d, 'MMM dd');
                        } catch {
                          return '';
                        }
                      }}
                    />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <ChartTooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      labelFormatter={(date) => {
                        try {
                          const d = new Date(date);
                          return isNaN(d.getTime()) ? 'Invalid date' : format(d, 'MMM dd, yyyy');
                        } catch {
                          return 'Invalid date';
                        }
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost by Model */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost by Model
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelCosts}
                      dataKey="cost"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.model}: ${formatCurrency(entry.cost)}`}
                    >
                      {modelCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Users by Cost */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Users by Cost
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userCosts.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="totalCost" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Model Cost Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Model Cost Breakdown
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Input Tokens</TableCell>
                        <TableCell align="right">Output Tokens</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modelCosts.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell>
                            <Chip label={model.model} size="small" />
                          </TableCell>
                          <TableCell align="right">{formatNumber(model.inputTokens)}</TableCell>
                          <TableCell align="right">{formatNumber(model.outputTokens)}</TableCell>
                          <TableCell align="right">{formatNumber(model.conversationCount)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(model.cost)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transaction Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell>Conversation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {tx.date ? (() => {
                          try {
                            const date = new Date(tx.date);
                            return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, HH:mm');
                          } catch {
                            return 'Invalid date';
                          }
                        })() : '-'}
                      </TableCell>
                      <TableCell>{tx.user}</TableCell>
                      <TableCell>
                        <Chip label={tx.model} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.tokenType} 
                          size="small"
                          color={tx.tokenType === 'prompt' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatNumber(tx.tokens)}</TableCell>
                      <TableCell align="right">{formatCurrency(tx.cost)}</TableCell>
                      <TableCell>
                        <Tooltip title={tx.conversationId}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                            {tx.conversationId.slice(0, 8)}...
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Usage Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Total Tokens</TableCell>
                    <TableCell align="right">Input Tokens</TableCell>
                    <TableCell align="right">Output Tokens</TableCell>
                    <TableCell align="right">Conversations</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelUsage.map((usage) => (
                    <TableRow key={usage.model}>
                      <TableCell>
                        <Chip label={usage.model} size="small" />
                      </TableCell>
                      <TableCell align="right">{formatNumber(usage.totalTokens)}</TableCell>
                      <TableCell align="right">{formatNumber(usage.inputTokens)}</TableCell>
                      <TableCell align="right">{formatNumber(usage.outputTokens)}</TableCell>
                      <TableCell align="right">{formatNumber(usage.conversationCount)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(usage.cost)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default CostAnalysis;