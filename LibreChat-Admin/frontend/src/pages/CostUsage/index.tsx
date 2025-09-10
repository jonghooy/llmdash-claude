import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { BarChart, AttachMoney, TrendingUp } from '@mui/icons-material';
import Usage from '../Usage';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cost-usage-tab-${index}`,
    'aria-controls': `cost-usage-tabpanel-${index}`,
  };
}

const CostOverview: React.FC = () => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cost (This Month)
              </Typography>
              <Typography variant="h4">
                $0.00
              </Typography>
              <Typography variant="body2" color="success.main">
                ↑ 0% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Cost per User
              </Typography>
              <Typography variant="h4">
                $0.00
              </Typography>
              <Typography variant="body2" color="textSecondary">
                0 active users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Most Used Model
              </Typography>
              <Typography variant="h5">
                N/A
              </Typography>
              <Typography variant="body2" color="textSecondary">
                $0.00 total cost
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cost by Model
          </Typography>
          <Typography color="textSecondary">
            No cost data available yet
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cost Trends
          </Typography>
          <Typography color="textSecondary">
            Cost tracking will be available once models are configured
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

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
          <CostOverview />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CostUsage;