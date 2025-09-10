import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
}

const ActivityHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    // Generate initial heatmap data
    const initialData: HeatmapData[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Simulate higher activity during work hours
        const baseValue = (hour >= 9 && hour <= 17 && day < 5) ? 50 : 20;
        initialData.push({
          hour,
          day,
          value: baseValue + Math.floor(Math.random() * 50)
        });
      }
    }
    setData(initialData);

    // Update random cells every 5 seconds
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData];
        // Update 10 random cells
        for (let i = 0; i < 10; i++) {
          const randomIndex = Math.floor(Math.random() * newData.length);
          newData[randomIndex] = {
            ...newData[randomIndex],
            value: Math.floor(Math.random() * 100)
          };
        }
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getColor = (value: number) => {
    if (value === 0) return '#f0f0f0';
    if (value < 20) return '#c6e48b';
    if (value < 40) return '#7bc96f';
    if (value < 60) return '#239a3b';
    if (value < 80) return '#196127';
    return '#0e4429';
  };

  const getCellData = (day: number, hour: number) => {
    const cell = data.find(d => d.day === day && d.hour === hour);
    return cell ? cell.value : 0;
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Weekly Activity Heatmap
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 600 }}>
          {/* Hour labels */}
          <Box sx={{ display: 'flex', ml: 5 }}>
            {hours.map(hour => (
              <Box
                key={hour}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {hour % 3 === 0 ? hour : ''}
              </Box>
            ))}
          </Box>
          
          {/* Heatmap grid */}
          {days.map((day, dayIndex) => (
            <Box key={day} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 40, fontSize: 12, mr: 1 }}>{day}</Box>
              {hours.map(hour => {
                const value = getCellData(dayIndex, hour);
                return (
                  <Tooltip
                    key={`${dayIndex}-${hour}`}
                    title={`${day} ${hour}:00 - ${value} messages`}
                    arrow
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: getColor(value),
                        border: '1px solid #fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          zIndex: 1,
                          boxShadow: 2
                        }
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
          
          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, ml: 5 }}>
            <Typography variant="caption" sx={{ mr: 1 }}>Less</Typography>
            {[0, 20, 40, 60, 80].map(value => (
              <Box
                key={value}
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: getColor(value),
                  border: '1px solid #fff',
                  mr: 0.5
                }}
              />
            ))}
            <Typography variant="caption" sx={{ ml: 1 }}>More</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ActivityHeatmap;