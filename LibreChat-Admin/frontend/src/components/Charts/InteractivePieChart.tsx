import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector
} from 'recharts';
import { Paper, Typography, Box, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import { Refresh, TrendingUp, TrendingDown } from '@mui/icons-material';

interface ModelData {
  name: string;
  value: number;
  percentage?: number;
  trend?: number;
  cost?: number;
}

const COLORS = [
  '#8884d8',
  '#82ca9d', 
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#ffb347',
  '#67b7dc'
];

const InteractivePieChart: React.FC<{ modelData?: { [key: string]: number } }> = ({ modelData }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'usage' | 'cost'>('usage');
  const [animationKey, setAnimationKey] = useState(0);
  
  const data: ModelData[] = React.useMemo(() => {
    if (!modelData) {
      // Sample data
      return [
        { name: 'GPT-4', value: 4500, trend: 12, cost: 450 },
        { name: 'GPT-3.5', value: 8200, trend: -5, cost: 82 },
        { name: 'Claude-3', value: 3200, trend: 25, cost: 256 },
        { name: 'Gemini Pro', value: 2100, trend: 8, cost: 63 },
        { name: 'Llama-2', value: 1500, trend: -2, cost: 15 }
      ];
    }
    
    const total = Object.values(modelData).reduce((sum, val) => sum + val, 0);
    return Object.entries(modelData).map(([name, value]) => ({
      name,
      value: viewMode === 'cost' ? value * 0.1 : value,
      percentage: (value / total) * 100,
      trend: Math.floor(Math.random() * 40) - 20,
      cost: value * 0.1
    }));
  }, [modelData, viewMode]);
  
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={24} fontWeight="bold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 15}
          outerRadius={outerRadius + 18}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={14}>
          {`${viewMode === 'cost' ? '$' : ''}${value.toLocaleString()}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
        {payload.trend && (
          <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill={payload.trend > 0 ? '#4caf50' : '#f44336'} fontSize={12}>
            {`${payload.trend > 0 ? '+' : ''}${payload.trend}%`}
          </text>
        )}
      </g>
    );
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
          p: 2, 
          border: '1px solid #ccc',
          borderRadius: 1,
          boxShadow: 3
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            {viewMode === 'usage' ? 'Usage' : 'Cost'}: {viewMode === 'cost' ? '$' : ''}{data.value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {data.percentage?.toFixed(1)}%
          </Typography>
          {data.trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {data.trend > 0 ? <TrendingUp fontSize="small" color="success" /> : <TrendingDown fontSize="small" color="error" />}
              <Typography variant="body2" color={data.trend > 0 ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
                {data.trend > 0 ? '+' : ''}{data.trend}%
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };
  
  const handleRefresh = () => {
    setAnimationKey(prev => prev + 1);
    setActiveIndex(-1);
  };
  
  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => {
      setActiveIndex(0);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Model {viewMode === 'usage' ? 'Usage Distribution' : 'Cost Analysis'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'usage' | 'cost')}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="usage">Usage</MenuItem>
              <MenuItem value="cost">Cost</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart key={animationKey}>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                  cursor: 'pointer',
                  transition: 'filter 0.3s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" align="center">
          Total {viewMode === 'usage' ? 'Requests' : 'Cost'}: {viewMode === 'cost' ? '$' : ''}{totalValue.toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
          {data.map((item, index) => (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.5,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: COLORS[index % COLORS.length],
                  borderRadius: '2px'
                }}
              />
              <Typography variant="caption">
                {item.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default InteractivePieChart;