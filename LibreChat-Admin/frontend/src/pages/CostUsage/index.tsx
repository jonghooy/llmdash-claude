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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cost-usage-tabpanel-${index}`}
      aria-labelledby={`cost-usage-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cost-usage-tab-${index}`,
    'aria-controls': `cost-usage-tabpanel-${index}`,
  };
}

const CostUsage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cost & Usage Analytics
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="cost usage tabs">
            <Tab 
              label="Usage Statistics" 
              icon={<BarChart />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Cost Analysis" 
              icon={<AttachMoney />}
              iconPosition="start"
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Usage />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <CostAnalysis />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CostUsage;