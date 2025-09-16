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
    <PageContainer title="Organization Management">
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
          <Tab icon={<People />} label="Users" />
          <Tab icon={<HowToReg />} label="Approvals" />
          <Tab icon={<Business />} label="Departments & Teams" />
        </Tabs>
        
        <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative', minHeight: 400 }}>
          <Fade in={activeTab === 0} timeout={500}>
            <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
              <Users />
            </Box>
          </Fade>
          <Fade in={activeTab === 1} timeout={500}>
            <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
              <Approvals />
            </Box>
          </Fade>
          <Fade in={activeTab === 2} timeout={500}>
            <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
              <DepartmentManagement />
            </Box>
          </Fade>
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default Organization;