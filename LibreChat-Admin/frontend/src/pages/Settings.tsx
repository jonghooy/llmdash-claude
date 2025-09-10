import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import ModelManagement from './Settings/ModelManagement';
import ModelPricing from './Settings/SimpleModelPricing';
import ModelPermissions from './Settings/ModelPermissions';
import ApiKeys from './Settings/ApiKeys';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Model Settings
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
        >
          <Tab label="Model Management" {...a11yProps(0)} />
          <Tab label="Model Pricing" {...a11yProps(1)} />
          <Tab label="Model Permissions" {...a11yProps(2)} />
          <Tab label="API Keys" {...a11yProps(3)} />
        </Tabs>
      </Paper>

      <TabPanel value={value} index={0}>
        <ModelManagement />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ModelPricing />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ModelPermissions />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <ApiKeys />
      </TabPanel>
    </Box>
  );
};

export default SettingsPage;