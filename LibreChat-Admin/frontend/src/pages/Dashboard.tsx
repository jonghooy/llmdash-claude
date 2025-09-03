import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent
} from '@mui/material';
import { 
  People, 
  ChatBubble, 
  TrendingUp,
  Storage
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
}

const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('http://localhost:5001/api/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    refetchInterval: 30000
  });

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography color="text.secondary" variant="subtitle2">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {isLoading ? '-' : value?.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={data?.users?.total}
            icon={<People sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={data?.users?.active}
            icon={<TrendingUp sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages Today"
            value={data?.messages?.today}
            icon={<ChatBubble sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tokens Today"
            value={data?.tokens?.today}
            icon={<Storage sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Usage
            </Typography>
            <Box sx={{ mt: 2 }}>
              {data?.models && Object.entries(data.models).map(([model, count]) => (
                <Box key={model} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{model}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {count.toLocaleString()} messages
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">New Users Today</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {data?.users?.new || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Messages</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {data?.messages?.total?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Tokens</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {data?.tokens?.total?.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;