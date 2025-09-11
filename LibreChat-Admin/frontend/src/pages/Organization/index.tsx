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

const Organization: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Organization Management
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
          <Tab icon={<People />} label="Users" />
          <Tab icon={<HowToReg />} label="Approvals" />
          <Tab icon={<Business />} label="Departments & Teams" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <Users />}
          {activeTab === 1 && <Approvals />}
          {activeTab === 2 && <DepartmentManagement />}
        </Box>
      </Paper>
    </Box>
  );
};

export default Organization;