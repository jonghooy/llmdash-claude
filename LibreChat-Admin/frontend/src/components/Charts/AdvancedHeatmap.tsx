import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Chip, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { CalendarMonth, AccessTime, TrendingUp } from '@mui/icons-material';

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
  label?: string;
}

const AdvancedHeatmap: React.FC = () => {
  const [viewMode, setViewMode] = useState<'activity' | 'errors' | 'cost'>('activity');
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number } | null>(null);
  const [data, setData] = useState<HeatmapData[]>([]);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  useEffect(() => {
    // Generate heatmap data
    const generateData = () => {
      const newData: HeatmapData[] = [];
      days.forEach(day => {
        hours.forEach(hour => {
          let value = 0;
          
          if (viewMode === 'activity') {
            // Peak hours simulation (9-17 on weekdays)
            const isWeekday = !['Sun', 'Sat'].includes(day);
            const isPeakHour = hour >= 9 && hour <= 17;
            
            if (isWeekday && isPeakHour) {
              value = Math.floor(Math.random() * 50) + 50;
            } else if (isWeekday) {
              value = Math.floor(Math.random() * 30) + 10;
            } else {
              value = Math.floor(Math.random() * 20);
            }
          } else if (viewMode === 'errors') {
            // Random errors with some patterns
            value = Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0;
          } else {
            // Cost distribution
            value = Math.floor(Math.random() * 100);
          }
          
          newData.push({
            day,
            hour,
            value,
            label: `${value} ${viewMode === 'cost' ? 'USD' : viewMode === 'errors' ? 'errors' : 'requests'}`
          });
        });
      });
      setData(newData);
    };
    
    generateData();
    const interval = setInterval(generateData, 10000);
    return () => clearInterval(interval);
  }, [viewMode]);
  
  const getColor = (value: number) => {
    if (viewMode === 'errors') {
      if (value === 0) return '#f5f5f5';
      if (value < 3) return '#ffeb3b';
      if (value < 5) return '#ff9800';
      return '#f44336';
    }
    
    const maxValue = viewMode === 'cost' ? 100 : 100;
    const intensity = value / maxValue;
    
    if (viewMode === 'cost') {
      // Green to red for cost
      const r = Math.floor(255 * intensity);
      const g = Math.floor(255 * (1 - intensity));
      return `rgb(${r}, ${g}, 100)`;
    }
    
    // Blue gradient for activity
    if (intensity === 0) return '#f0f4f8';
    if (intensity < 0.2) return '#bbdefb';
    if (intensity < 0.4) return '#90caf9';
    if (intensity < 0.6) return '#64b5f6';
    if (intensity < 0.8) return '#42a5f5';
    return '#2196f3';
  };
  
  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour);
  };
  
  const getStatistics = () => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const avg = total / data.length;
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    
    return { total, avg, max, min };
  };
  
  const stats = getStatistics();

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Activity Heatmap
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<TrendingUp />}
              label={`Peak: ${stats.max}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Avg: ${stats.avg.toFixed(1)}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="activity">Activity</ToggleButton>
          <ToggleButton value="errors">Errors</ToggleButton>
          <ToggleButton value="cost">Cost</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 0.5, minWidth: 600 }}>
          <Box sx={{ width: 40, display: 'flex', flexDirection: 'column', gap: 0.5, mt: 4 }}>
            {days.map(day => (
              <Box
                key={day}
                sx={{
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 1
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
              {hours.map(hour => (
                <Box
                  key={hour}
                  sx={{
                    width: 30,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                    {hour}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {days.map(day => (
              <Box key={day} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                {hours.map(hour => {
                  const cellData = getCellData(day, hour);
                  const isSelected = selectedCell?.day === day && selectedCell?.hour === hour;
                  
                  return (
                    <Tooltip
                      key={`${day}-${hour}`}
                      title={
                        <Box>
                          <Typography variant="caption">
                            {day} {hour}:00
                          </Typography>
                          <Typography variant="caption" display="block">
                            {cellData?.label || '0'}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        onClick={() => setSelectedCell({ day, hour })}
                        sx={{
                          width: 30,
                          height: 30,
                          backgroundColor: getColor(cellData?.value || 0),
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: isSelected ? '2px solid #1976d2' : 'none',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2,
                            zIndex: 1
                          }
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {viewMode === 'errors' ? 'Errors' : viewMode === 'cost' ? 'Cost (USD)' : 'Activity Level'}:
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Typography variant="caption">Low</Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: getColor((i + 1) * 10),
                  borderRadius: 0.5
                }}
              />
            ))}
          </Box>
          <Typography variant="caption">High</Typography>
        </Box>
      </Box>
      
      {selectedCell && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2">
            Selected: {selectedCell.day} at {selectedCell.hour}:00
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getCellData(selectedCell.day, selectedCell.hour)?.label || 'No data'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AdvancedHeatmap;