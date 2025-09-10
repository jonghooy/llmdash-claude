import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import { People, HowToReg, Business } from '@mui/icons-material';
import Users from '../Users';
import Approvals from '../Approvals';
import DepartmentManagement from './DepartmentManagement';

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
      id={`organization-tabpanel-${index}`}
      aria-labelledby={`organization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `organization-tab-${index}`,
    'aria-controls': `organization-tabpanel-${index}`,
  };
}

const Organization: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Organization Management
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="organization tabs">
            <Tab 
              label="Users" 
              icon={<People />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Approvals" 
              icon={<HowToReg />}
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label="Departments & Teams" 
              icon={<Business />}
              iconPosition="start"
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Users />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Approvals />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <DepartmentManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Organization;