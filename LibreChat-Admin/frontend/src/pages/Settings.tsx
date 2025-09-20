import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageContainer from '../components/Layout/PageContainer';
import { Paper } from '@mui/material';
import ModelManagement from './Settings/ModelManagement';
import ModelPricing from './Settings/SimpleModelPricing';
import ModelPermissions from './Settings/ModelPermissions';
import ApiKeys from './Settings/ApiKeys';



const SettingsPage: React.FC = () => {
  const location = useLocation();

  // Map URL paths to tab indices
  const getTabFromPath = (path: string) => {
    if (path.includes('/ai-models/management')) return 0;
    if (path.includes('/ai-models/pricing')) return 1;
    if (path.includes('/ai-models/permissions')) return 2;
    if (path.includes('/ai-models/api-keys')) return 3;
    return 0; // Default to first tab
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Get page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 0: return 'Model Management';
      case 1: return 'Model Pricing';
      case 2: return 'Model Permissions';
      case 3: return 'API Keys';
      default: return 'AI Models';
    }
  };

  return (
    <PageContainer title={getPageTitle()}>
      <Paper sx={{ borderRadius: 2, boxShadow: 1, p: { xs: 2, sm: 3 } }}>
        {activeTab === 0 && <ModelManagement />}
        {activeTab === 1 && <ModelPricing />}
        {activeTab === 2 && <ModelPermissions />}
        {activeTab === 3 && <ApiKeys />}
      </Paper>
    </PageContainer>
  );
};

export default SettingsPage;