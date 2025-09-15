import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Fade
} from '@mui/material';
import {
  ModelTraining,
  AttachMoney,
  Security,
  VpnKey
} from '@mui/icons-material';
import ModelManagement from './Settings/ModelManagement';
import ModelPricing from './Settings/SimpleModelPricing';
import ModelPermissions from './Settings/ModelPermissions';
import ApiKeys from './Settings/ApiKeys';



const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Model Settings
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: 64,
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateY(-2px)',
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
          <Tab icon={<ModelTraining />} label="Model Management" />
          <Tab icon={<AttachMoney />} label="Model Pricing" />
          <Tab icon={<Security />} label="Model Permissions" />
          <Tab icon={<VpnKey />} label="API Keys" />
        </Tabs>
        
        <Box sx={{ p: 3, position: 'relative', minHeight: 400 }}>
          <Fade in={activeTab === 0} timeout={500}>
            <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
              <ModelManagement />
            </Box>
          </Fade>
          <Fade in={activeTab === 1} timeout={500}>
            <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
              <ModelPricing />
            </Box>
          </Fade>
          <Fade in={activeTab === 2} timeout={500}>
            <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
              <ModelPermissions />
            </Box>
          </Fade>
          <Fade in={activeTab === 3} timeout={500}>
            <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
              <ApiKeys />
            </Box>
          </Fade>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;