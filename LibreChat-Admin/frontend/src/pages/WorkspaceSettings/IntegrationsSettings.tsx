import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Typography,
  Switch,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Link,
} from '@mui/material';
import {
  Extension,
  Check,
  Close,
  Settings,
  OpenInNew,
  Add,
  Delete,
  Refresh,
  Code,
  Cloud,
  Storage,
  Email,
  Chat,
  CalendarMonth,
  Description,
  GitHub,
  Google,
  Microsoft,
} from '@mui/icons-material';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config?: any;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
}

const IntegrationsSettings: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send notifications and updates to Slack channels',
      icon: <Chat />,
      category: 'Communication',
      status: 'connected',
      lastSync: '2 hours ago',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect repositories and sync code',
      icon: <GitHub />,
      category: 'Development',
      status: 'disconnected',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Access and share files from Google Drive',
      icon: <Google />,
      category: 'Storage',
      status: 'connected',
      lastSync: '1 day ago',
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Collaborate with Teams channels',
      icon: <Microsoft />,
      category: 'Communication',
      status: 'disconnected',
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Sync tasks and projects with Jira',
      icon: <Description />,
      category: 'Project Management',
      status: 'error',
      lastSync: '3 days ago',
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Integrate CRM data and workflows',
      icon: <Cloud />,
      category: 'CRM',
      status: 'disconnected',
    },
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Production Alerts',
      url: 'https://api.example.com/webhooks/alerts',
      events: ['error', 'warning'],
      active: true,
      lastTriggered: '1 hour ago',
    },
    {
      id: '2',
      name: 'User Activity',
      url: 'https://api.example.com/webhooks/activity',
      events: ['user.login', 'user.logout', 'user.created'],
      active: true,
      lastTriggered: '30 minutes ago',
    },
  ]);

  const [configureDialog, setConfigureDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const categories = ['All', 'Communication', 'Development', 'Storage', 'Project Management', 'CRM'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const availableWebhookEvents = [
    'user.login',
    'user.logout',
    'user.created',
    'user.updated',
    'user.deleted',
    'team.created',
    'team.updated',
    'conversation.created',
    'conversation.completed',
    'error',
    'warning',
    'quota.exceeded',
  ];

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigureDialog(true);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(integrations.map(int =>
      int.id === integrationId
        ? { ...int, status: 'disconnected', lastSync: undefined }
        : int
    ));
  };

  const handleRefresh = (integrationId: string) => {
    // Simulate refresh
    setIntegrations(integrations.map(int =>
      int.id === integrationId
        ? { ...int, lastSync: 'Just now' }
        : int
    ));
  };

  const handleAddWebhook = () => {
    const webhook: Webhook = {
      id: String(webhooks.length + 1),
      ...newWebhook,
      active: true,
    };
    setWebhooks([...webhooks, webhook]);
    setWebhookDialog(false);
    setNewWebhook({ name: '', url: '', events: [] });
  };

  const handleToggleWebhook = (webhookId: string) => {
    setWebhooks(webhooks.map(webhook =>
      webhook.id === webhookId
        ? { ...webhook, active: !webhook.active }
        : webhook
    ));
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(webhook => webhook.id !== webhookId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredIntegrations = selectedCategory === 'All'
    ? integrations
    : integrations.filter(int => int.category === selectedCategory);

  return (
    <Box>
      {/* Available Integrations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Extension />
            Available Integrations
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* Category Filter */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
              />
            ))}
          </Box>

          {/* Integrations Grid */}
          <Grid container spacing={3}>
            {filteredIntegrations.map((integration) => (
              <Grid item xs={12} md={6} lg={4} key={integration.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        {integration.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6">
                            {integration.name}
                          </Typography>
                          <Chip
                            label={integration.status}
                            color={getStatusColor(integration.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {integration.description}
                        </Typography>
                        {integration.lastSync && (
                          <Typography variant="caption" color="text.secondary">
                            Last synced: {integration.lastSync}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {integration.status === 'disconnected' ? (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleConnect(integration)}
                        >
                          Connect
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleConnect(integration)}
                            startIcon={<Settings />}
                          >
                            Configure
                          </Button>
                          {integration.status === 'connected' && (
                            <IconButton
                              size="small"
                              onClick={() => handleRefresh(integration.id)}
                            >
                              <Refresh />
                            </IconButton>
                          )}
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            Disconnect
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code />
              Webhooks
            </Typography>
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={() => setWebhookDialog(true)}
            >
              Add Webhook
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Webhooks allow you to receive real-time notifications when events occur in your workspace.
          </Alert>

          <List>
            {webhooks.map((webhook) => (
              <ListItem key={webhook.id} divider>
                <ListItemText
                  primary={webhook.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {webhook.url}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {webhook.events.map((event) => (
                          <Chip key={event} label={event} size="small" variant="outlined" />
                        ))}
                      </Box>
                      {webhook.lastTriggered && (
                        <Typography variant="caption" color="text.secondary">
                          Last triggered: {webhook.lastTriggered}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={webhook.active}
                    onChange={() => handleToggleWebhook(webhook.id)}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {webhooks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No webhooks configured. Add one to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            API Documentation
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                REST API
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Use our REST API to integrate with your applications and automate workflows.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<OpenInNew />}
                component={Link}
                href="https://docs.llmdash.com/api"
                target="_blank"
              >
                View REST API Docs
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                GraphQL API
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Query exactly what you need with our GraphQL API.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<OpenInNew />}
                component={Link}
                href="https://docs.llmdash.com/graphql"
                target="_blank"
              >
                View GraphQL Docs
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                API Endpoint
              </Typography>
              <TextField
                fullWidth
                value="https://api.llmdash.com/v1"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton>
                      <OpenInNew />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Configure Integration Dialog */}
      <Dialog open={configureDialog} onClose={() => setConfigureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          {selectedIntegration?.id === 'slack' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Channel"
                  placeholder="#general"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Notification Types</InputLabel>
                  <Select multiple value={[]} label="Notification Types">
                    <MenuItem value="errors">Errors</MenuItem>
                    <MenuItem value="warnings">Warnings</MenuItem>
                    <MenuItem value="user_activity">User Activity</MenuItem>
                    <MenuItem value="system_updates">System Updates</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
          {/* Add more integration-specific configurations */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigureDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConfigureDialog(false)}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Webhook Dialog */}
      <Dialog open={webhookDialog} onClose={() => setWebhookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Webhook</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook Name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Events</InputLabel>
                <Select
                  multiple
                  value={newWebhook.events}
                  label="Events"
                  onChange={(e) => setNewWebhook({ ...newWebhook, events: e.target.value as string[] })}
                >
                  {availableWebhookEvents.map((event) => (
                    <MenuItem key={event} value={event}>
                      {event}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWebhook}>
            Add Webhook
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsSettings;