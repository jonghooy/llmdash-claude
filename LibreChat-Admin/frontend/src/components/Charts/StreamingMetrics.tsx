import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, LinearProgress, Grid, Fade, Zoom } from '@mui/material';
import { Speed, Memory, Storage, NetworkCheck, Circle } from '@mui/icons-material';

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  max: number;
  icon: React.ReactElement;
  color: string;
  history: number[];
}

const StreamingMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: 'cpu',
      label: 'CPU Usage',
      value: 45,
      unit: '%',
      max: 100,
      icon: <Speed />,
      color: '#2196f3',
      history: Array(20).fill(0)
    },
    {
      id: 'memory',
      label: 'Memory',
      value: 3.2,
      unit: 'GB',
      max: 8,
      icon: <Memory />,
      color: '#4caf50',
      history: Array(20).fill(0)
    },
    {
      id: 'storage',
      label: 'Storage',
      value: 124,
      unit: 'GB',
      max: 500,
      icon: <Storage />,
      color: '#ff9800',
      history: Array(20).fill(0)
    },
    {
      id: 'network',
      label: 'Network I/O',
      value: 2.4,
      unit: 'Mbps',
      max: 10,
      icon: <NetworkCheck />,
      color: '#9c27b0',
      history: Array(20).fill(0)
    }
  ]);
  
  const [pulseAnimation, setPulseAnimation] = useState<{ [key: string]: boolean }>({});
  const animationTimeouts = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          // Simulate realistic value changes
          let newValue = metric.value;
          const change = (Math.random() - 0.5) * metric.max * 0.1;
          newValue = Math.max(0, Math.min(metric.max, metric.value + change));
          
          // Update history
          const newHistory = [...metric.history.slice(1), (newValue / metric.max) * 100];
          
          // Trigger pulse animation for significant changes
          if (Math.abs(change) > metric.max * 0.05) {
            setPulseAnimation(prev => ({ ...prev, [metric.id]: true }));
            
            // Clear previous timeout
            if (animationTimeouts.current[metric.id]) {
              clearTimeout(animationTimeouts.current[metric.id]);
            }
            
            // Reset animation after 500ms
            animationTimeouts.current[metric.id] = setTimeout(() => {
              setPulseAnimation(prev => ({ ...prev, [metric.id]: false }));
            }, 500);
          }
          
          return {
            ...metric,
            value: parseFloat(newValue.toFixed(1)),
            history: newHistory
          };
        })
      );
    }, 1000);
    
    return () => {
      clearInterval(interval);
      Object.values(animationTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return '#4caf50';
    if (percentage < 75) return '#ff9800';
    return '#f44336';
  };
  
  const renderSparkline = (history: number[], color: string) => {
    const width = 60;
    const height = 20;
    const points = history.map((value, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (value / 100) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} style={{ marginLeft: 'auto' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.6"
        />
        <circle
          cx={width}
          cy={height - (history[history.length - 1] / 100) * height}
          r="2"
          fill={color}
        >
          <animate
            attributeName="r"
            values="2;4;2"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        System Performance Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {metrics.map(metric => {
          const percentage = (metric.value / metric.max) * 100;
          const statusColor = getStatusColor(percentage);
          
          return (
            <Grid item xs={12} sm={6} key={metric.id}>
              <Zoom in={true} style={{ transitionDelay: `${metrics.indexOf(metric) * 100}ms` }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.3s ease',
                    transform: pulseAnimation[metric.id] ? 'scale(1.02)' : 'scale(1)',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: metric.color
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: `${metric.color}20`,
                        color: metric.color,
                        mr: 2
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {metric.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: pulseAnimation[metric.id] ? metric.color : 'text.primary',
                            transition: 'color 0.3s ease'
                          }}
                        >
                          {metric.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          / {metric.max}{metric.unit}
                        </Typography>
                      </Box>
                    </Box>
                    {renderSparkline(metric.history, metric.color)}
                  </Box>
                  
                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.300',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: statusColor,
                          borderRadius: 4,
                          transition: 'all 0.5s ease'
                        }
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        left: `${percentage}%`,
                        transform: 'translateX(-50%)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <Circle 
                        sx={{ 
                          fontSize: 12, 
                          color: statusColor,
                          animation: pulseAnimation[metric.id] ? 'pulse 0.5s ease' : 'none',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.5)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {percentage.toFixed(1)}% utilized
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: statusColor,
                        fontWeight: percentage > 75 ? 'bold' : 'normal'
                      }}
                    >
                      {percentage < 50 ? 'Normal' : percentage < 75 ? 'Moderate' : 'High'}
                    </Typography>
                  </Box>
                </Box>
              </Zoom>
            </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          System Health Score
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={85}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)'
                }
              }}
            />
          </Box>
          <Typography variant="h6" color="success.main">
            85/100
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default StreamingMetrics;