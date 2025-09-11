import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography
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
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<ModelTraining />} label="Model Management" />
          <Tab icon={<AttachMoney />} label="Model Pricing" />
          <Tab icon={<Security />} label="Model Permissions" />
          <Tab icon={<VpnKey />} label="API Keys" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <ModelManagement />}
          {activeTab === 1 && <ModelPricing />}
          {activeTab === 2 && <ModelPermissions />}
          {activeTab === 3 && <ApiKeys />}
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;