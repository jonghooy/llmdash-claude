import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface UsageData {
  daily: Array<{
    date: string;
    messages: number;
    tokens: number;
    users: number;
  }>;
  modelUsage: Array<{
    model: string;
    count: number;
    tokens: number;
  }>;
  topUsers: Array<{
    username: string;
    messages: number;
    tokens: number;
  }>;
  summary: {
    totalMessages: number;
    totalTokens: number;
    totalUsers: number;
    avgMessagesPerUser: number;
    avgTokensPerMessage: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Usage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const { data, isLoading } = useQuery<UsageData>({
    queryKey: ['usage', timeRange],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/usage/stats', {
        params: { range: timeRange },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Usage Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Messages
              </Typography>
              <Typography variant="h4">
                {data?.summary?.totalMessages?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Tokens
              </Typography>
              <Typography variant="h4">
                {data?.summary?.totalTokens?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4">
                {data?.summary?.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg Tokens/Message
              </Typography>
              <Typography variant="h4">
                {Math.round(data?.summary?.avgTokensPerMessage || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Usage Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#8884d8" 
                  name="Messages"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#82ca9d"
                  name="Tokens"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Usage Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.modelUsage || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.model}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data?.modelUsage?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Users
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell align="right">Messages</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell align="right">Avg Tokens/Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.topUsers?.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell align="right">{user.messages.toLocaleString()}</TableCell>
                      <TableCell align="right">{user.tokens.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {Math.round(user.tokens / user.messages)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Usage;