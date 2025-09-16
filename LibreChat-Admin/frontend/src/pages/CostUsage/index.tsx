import React, { useState } from 'react';
import PageContainer from '../../components/Layout/PageContainer';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Fade
} from '@mui/material';
import { BarChart, AttachMoney } from '@mui/icons-material';
import Usage from '../Usage';
import CostAnalysis from '../CostAnalysis';

const CostUsage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <PageContainer title="Cost & Usage Analytics">
      <Paper sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: 64,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
            '& .Mui-selected': {
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.3s ease',
            },
            '& .MuiTab-root.Mui-selected .MuiSvgIcon-root': {
              transform: 'scale(1.2)',
            }
          }}
        >
          <Tab icon={<BarChart />} label="Usage Statistics" />
          <Tab icon={<AttachMoney />} label="Cost Analysis" />
        </Tabs>
        
        <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative', minHeight: 400 }}>
          <Fade in={activeTab === 0} timeout={500}>
            <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
              <Usage />
            </Box>
          </Fade>
          <Fade in={activeTab === 1} timeout={500}>
            <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
              <CostAnalysis />
            </Box>
          </Fade>
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default CostUsage;