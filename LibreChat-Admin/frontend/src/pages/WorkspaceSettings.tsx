import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security,
  Extension,
  Notifications,
  PrivacyTip,
} from '@mui/icons-material';
import PageContainer from '../components/Layout/PageContainer';
import GeneralSettings from './WorkspaceSettings/GeneralSettings';
import SecuritySettings from './WorkspaceSettings/SecuritySettings';
import IntegrationsSettings from './WorkspaceSettings/IntegrationsSettings';
import NotificationsSettings from './WorkspaceSettings/NotificationsSettings';
import PrivacySettings from './WorkspaceSettings/PrivacySettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workspace-tabpanel-${index}`}
      aria-labelledby={`workspace-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const WorkspaceSettings: React.FC = () => {
  const location = useLocation();

  // Map URL paths to tab indices
  const getTabFromPath = (path: string) => {
    if (path.includes('/settings/general')) return 0;
    if (path.includes('/settings/security')) return 1;
    if (path.includes('/settings/integrations')) return 2;
    if (path.includes('/settings/notifications')) return 3;
    if (path.includes('/settings/privacy')) return 4;
    return 0; // Default to general
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <PageContainer title="Workspace Settings">
      <Paper sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="workspace settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="General"
              id="workspace-tab-0"
              aria-controls="workspace-tabpanel-0"
            />
            <Tab
              icon={<Security />}
              iconPosition="start"
              label="Security"
              id="workspace-tab-1"
              aria-controls="workspace-tabpanel-1"
            />
            <Tab
              icon={<Extension />}
              iconPosition="start"
              label="Integrations"
              id="workspace-tab-2"
              aria-controls="workspace-tabpanel-2"
            />
            <Tab
              icon={<Notifications />}
              iconPosition="start"
              label="Notifications"
              id="workspace-tab-3"
              aria-controls="workspace-tabpanel-3"
            />
            <Tab
              icon={<PrivacyTip />}
              iconPosition="start"
              label="Privacy"
              id="workspace-tab-4"
              aria-controls="workspace-tabpanel-4"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <GeneralSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <SecuritySettings />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <IntegrationsSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <NotificationsSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <PrivacySettings />
          </TabPanel>
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default WorkspaceSettings;