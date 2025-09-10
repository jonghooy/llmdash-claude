import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Brush,
  ReferenceLine,
  Dot
} from 'recharts';
import { Paper, Typography, Box, IconButton, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import { ZoomIn, ZoomOut, Refresh, Timeline, ShowChart, BarChart } from '@mui/icons-material';

interface ChartData {
  time: string;
  messages: number;
  users: number;
  tokens: number;
  responseTime?: number;
  errors?: number;
  timestamp?: number;
}

const RealtimeLineChart: React.FC<{ data?: ChartData[] }> = ({ data: initialData }) => {
  const [data, setData] = useState<ChartData[]>(() => {
    // Initialize with sample data
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const timestamp = now.getTime() - (29 - i) * 3000;
      return {
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        messages: Math.floor(Math.random() * 100) + 20,
        users: Math.floor(Math.random() * 30) + 5,
        tokens: Math.floor(Math.random() * 1000) + 100,
        responseTime: Math.floor(Math.random() * 200) + 50,
        errors: Math.floor(Math.random() * 5),
        timestamp
      };
    });
  });
  
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [isPaused, setIsPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState(['messages', 'users']);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isPaused) {
      // Update chart data with smooth animation
      const interval = setInterval(() => {
        setData(prevData => {
          const newData = [...prevData.slice(1)];
          const now = new Date();
          const timestamp = now.getTime();
          
          // Generate realistic data patterns
          const lastItem = prevData[prevData.length - 1];
          const lastMessages = lastItem?.messages || 50;
          const lastUsers = lastItem?.users || 15;
          const lastResponseTime = lastItem?.responseTime || 100;
          
          newData.push({
            time: now.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            }),
            messages: Math.max(10, Math.min(200, lastMessages + (Math.random() - 0.5) * 40)),
            users: Math.max(5, Math.min(50, lastUsers + (Math.random() - 0.5) * 10)),
            tokens: Math.floor(Math.random() * 1000) + 100,
            responseTime: Math.max(20, Math.min(300, lastResponseTime + (Math.random() - 0.5) * 50)),
            errors: Math.random() > 0.9 ? Math.floor(Math.random() * 10) : 0,
            timestamp
          });
          return newData;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isPaused]);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setIsPaused(false);
  };
  
  const getStrokeColor = (metric: string) => {
    const colors: { [key: string]: string } = {
      messages: '#8884d8',
      users: '#82ca9d',
      tokens: '#ffc658',
      responseTime: '#ff7c7c',
      errors: '#ff0000'
    };
    return colors[metric] || '#8884d8';
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
          p: 1.5, 
          border: '1px solid #ccc',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  const visibleData = data.slice(-Math.floor(30 / zoom));

  return (
    <Paper sx={{ p: 3, height: '100%', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Real-time Activity Monitor
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={isPaused ? 'Paused' : 'Live'} 
              color={isPaused ? 'default' : 'success'} 
              size="small"
              onClick={() => setIsPaused(!isPaused)}
            />
            <Chip 
              label={`Zoom: ${(zoom * 100).toFixed(0)}%`} 
              size="small"
              variant="outlined"
            />
            {(data[data.length - 1]?.errors || 0) > 0 && (
              <Chip 
                label={`${data[data.length - 1]?.errors || 0} errors`} 
                color="error" 
                size="small"
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, value) => value && setChartType(value)}
            size="small"
          >
            <ToggleButton value="area">
              <Timeline />
            </ToggleButton>
            <ToggleButton value="line">
              <ShowChart />
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton size="small" onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
          <IconButton size="small" onClick={handleZoomOut}>
            <ZoomOut />
          </IconButton>
          <IconButton size="small" onClick={handleReset}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart 
          data={visibleData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
        >
          <defs>
            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff7c7c" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ff7c7c" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            domain={[0, 'dataMax + 10']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          
          {/* Dynamic rendering based on chart type */}
          {chartType === 'area' ? (
            <>
              <Area 
                type="monotone" 
                dataKey="messages" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorMessages)"
                strokeWidth={2}
                animationDuration={500}
                dot={false}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorUsers)"
                strokeWidth={2}
                animationDuration={500}
                dot={false}
              />
              <Area 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#ff7c7c" 
                fillOpacity={1} 
                fill="url(#colorResponseTime)"
                strokeWidth={2}
                animationDuration={500}
                dot={false}
                yAxisId="right"
              />
            </>
          ) : (
            <>
              <Line 
                type="monotone" 
                dataKey="messages" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={500}
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={500}
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#ff7c7c" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={500}
              />
            </>
          )}
          
          {/* Show error indicators */}
          {visibleData.filter(d => (d.errors || 0) > 0).map((entry, index) => (
            <ReferenceLine 
              key={`error-${index}`}
              x={entry.time} 
              stroke="red" 
              strokeDasharray="3 3"
              opacity={0.5}
            />
          ))}
          
          <Brush 
            dataKey="time" 
            height={30} 
            stroke="#8884d8"
            fill="#f0f0f0"
            travellerWidth={10}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default RealtimeLineChart;