import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cost & Usage Analytics
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<BarChart />} label="Usage Statistics" />
          <Tab icon={<AttachMoney />} label="Cost Analysis" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <Usage />}
          {activeTab === 1 && <CostAnalysis />}
        </Box>
      </Paper>
    </Box>
  );
};

export default CostUsage;