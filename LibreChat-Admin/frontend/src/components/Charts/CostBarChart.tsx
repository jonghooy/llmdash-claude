import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface CostData {
  name: string;
  cost: number;
  tokens: number;
  change?: number;
}

const CostBarChart: React.FC = () => {
  const [data, setData] = useState<CostData[]>([
    { name: 'Today', cost: 12.5, tokens: 125000, change: 15 },
    { name: 'Yesterday', cost: 10.8, tokens: 108000, change: -5 },
    { name: '2 Days Ago', cost: 11.4, tokens: 114000, change: 8 },
    { name: '3 Days Ago', cost: 10.5, tokens: 105000, change: -3 },
    { name: '4 Days Ago', cost: 10.8, tokens: 108000, change: 2 },
    { name: '5 Days Ago', cost: 10.6, tokens: 106000, change: -1 },
    { name: '6 Days Ago', cost: 10.7, tokens: 107000, change: 0 }
  ]);

  useEffect(() => {
    // Update today's data every 10 seconds
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData];
        // Update today's cost
        newData[0] = {
          ...newData[0],
          cost: newData[0].cost + (Math.random() * 0.5 - 0.2),
          tokens: newData[0].tokens + Math.floor(Math.random() * 1000),
          change: Math.floor(Math.random() * 20 - 5)
        };
        return newData;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary">
            Cost: ${payload[0].value.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="secondary">
            Tokens: {payload[1].value.toLocaleString()}
          </Typography>
          {payload[0].payload.change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {payload[0].payload.change > 0 ? (
                <TrendingUp color="error" fontSize="small" />
              ) : (
                <TrendingDown color="success" fontSize="small" />
              )}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {Math.abs(payload[0].payload.change)}% from previous
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  const getBarColor = (change: number | undefined) => {
    if (!change) return '#8884d8';
    return change > 0 ? '#ff7875' : '#52c41a';
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Daily Cost Analysis
        </Typography>
        <Chip
          label={`Total: $${data.reduce((sum, d) => sum + d.cost, 0).toFixed(2)}`}
          color="primary"
          size="small"
        />
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="cost" name="Cost ($)" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.change)} />
            ))}
          </Bar>
          <Bar yAxisId="right" dataKey="tokens" name="Tokens" fill="#82ca9d" opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CostBarChart;