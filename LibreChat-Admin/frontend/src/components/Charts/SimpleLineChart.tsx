import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import axios from 'axios';

interface ChartData {
  time: string;
  messages: number;
  users: number;
}

const SimpleLineChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  const fetchActivityData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/dashboard/activity-timeline', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      if (response.data.success) {
        setData(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Error fetching activity timeline:', err);
      setError(err.message);
      // Fallback to empty data on error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActivityData();

    // Update data every 30 seconds (less frequent than before since it's real data)
    const interval = setInterval(() => {
      fetchActivityData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6">Real-time Activity</Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">Loading real-time data...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6">Real-time Activity</Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error">Error loading data: {error}</Typography>
        </Box>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6">Real-time Activity</Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No activity data available</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Real-time Activity (Last 10 Minutes)
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            style={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="messages" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Messages"
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Active Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default SimpleLineChart;