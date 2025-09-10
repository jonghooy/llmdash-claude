import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ModelData {
  name: string;
  value: number;
}

interface SimplePieChartProps {
  modelData?: { [key: string]: number };
}

const SimplePieChart: React.FC<SimplePieChartProps> = ({ modelData }) => {
  // Transform model data for pie chart
  const data: ModelData[] = modelData 
    ? Object.entries(modelData).map(([name, value]) => ({
        name,
        value
      }))
    : [
        { name: 'GPT-4', value: 45 },
        { name: 'GPT-3.5', value: 30 },
        { name: 'Claude', value: 15 },
        { name: 'Others', value: 10 }
      ];

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}`;
  };

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Model Usage Distribution
      </Typography>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SimplePieChart;