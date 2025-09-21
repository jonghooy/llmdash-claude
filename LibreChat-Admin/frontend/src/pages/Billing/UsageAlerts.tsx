import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  NotificationsActive,
  NotificationsOff,
  Email,
  Sms,
  Warning,
  TrendingUp,
  AttachMoney,
  Api,
  Group,
  Speed,
  Info,
  CheckCircle,
  Error,
  Schedule,
  Notifications,
} from '@mui/icons-material';

interface UsageAlert {
  id: string;
  name: string;
  type: 'tokens' | 'cost' | 'requests' | 'users';
  threshold: number;
  thresholdType: 'percentage' | 'absolute';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  channels: string[];
  enabled: boolean;
  lastTriggered?: string;
  status: 'active' | 'triggered' | 'disabled';
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack';
  name: string;
  destination: string;
  enabled: boolean;
  verified: boolean;
}

const UsageAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<UsageAlert[]>([
    {
      id: '1',
      name: 'High Token Usage',
      type: 'tokens',
      threshold: 80,
      thresholdType: 'percentage',
      frequency: 'once',
      channels: ['email', 'slack'],
      enabled: true,
      lastTriggered: '2024-01-10',
      status: 'active',
    },
    {
      id: '2',
      name: 'Monthly Budget Alert',
      type: 'cost',
      threshold: 500,
      thresholdType: 'absolute',
      frequency: 'monthly',
      channels: ['email'],
      enabled: true,
      status: 'active',
    },
    {
      id: '3',
      name: 'API Request Spike',
      type: 'requests',
      threshold: 10000,
      thresholdType: 'absolute',
      frequency: 'daily',
      channels: ['email', 'sms'],
      enabled: false,
      status: 'disabled',
    },
  ]);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: '1',
      type: 'email',
      name: 'Primary Email',
      destination: 'admin@company.com',
      enabled: true,
      verified: true,
    },
    {
      id: '2',
      type: 'email',
      name: 'Finance Team',
      destination: 'finance@company.com',
      enabled: true,
      verified: true,
    },
    {
      id: '3',
      type: 'sms',
      name: 'Admin Phone',
      destination: '+1 555-0123',
      enabled: true,
      verified: false,
    },
    {
      id: '4',
      type: 'slack',
      name: 'DevOps Channel',
      destination: '#devops-alerts',
      enabled: true,
      verified: true,
    },
  ]);

  const [createAlertDialog, setCreateAlertDialog] = useState(false);
  const [editAlertDialog, setEditAlertDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<UsageAlert | null>(null);
  const [addChannelDialog, setAddChannelDialog] = useState(false);

  // Form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    type: 'tokens' as const,
    threshold: 80,
    thresholdType: 'percentage' as const,
    frequency: 'once' as const,
    channels: [] as string[],
  });

  const [channelForm, setChannelForm] = useState({
    type: 'email' as const,
    name: '',
    destination: '',
  });

  const [globalSettings, setGlobalSettings] = useState({
    emailDigest: true,
    digestFrequency: 'weekly',
    quietHours: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    maxAlertsPerDay: 10,
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'tokens':
        return <Api />;
      case 'cost':
        return <AttachMoney />;
      case 'requests':
        return <Speed />;
      case 'users':
        return <Group />;
      default:
        return <Warning />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Email />;
      case 'sms':
        return <Sms />;
      case 'slack':
        return <Notifications />;
      case 'webhook':
        return <Api />;
      default:
        return <Notifications />;
    }
  };

  const handleCreateAlert = () => {
    const newAlert: UsageAlert = {
      id: String(alerts.length + 1),
      ...alertForm,
      enabled: true,
      status: 'active',
    };
    setAlerts([...alerts, newAlert]);
    setCreateAlertDialog(false);
    setAlertForm({
      name: '',
      type: 'tokens',
      threshold: 80,
      thresholdType: 'percentage',
      frequency: 'once',
      channels: [],
    });
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, enabled: !alert.enabled, status: !alert.enabled ? 'active' : 'disabled' }
        : alert
    ));
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const handleAddChannel = () => {
    const newChannel: NotificationChannel = {
      id: String(channels.length + 1),
      ...channelForm,
      enabled: true,
      verified: false,
    };
    setChannels([...channels, newChannel]);
    setAddChannelDialog(false);
    setChannelForm({
      type: 'email',
      name: '',
      destination: '',
    });
  };

  const handleVerifyChannel = (channelId: string) => {
    setChannels(channels.map(channel =>
      channel.id === channelId
        ? { ...channel, verified: true }
        : channel
    ));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Usage Alerts</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateAlertDialog(true)}
        >
          Create Alert
        </Button>
      </Box>

      {/* Alert Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h4">
                    {alerts.filter(a => a.enabled).length}
                  </Typography>
                </Box>
                <NotificationsActive color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Triggered Today
                  </Typography>
                  <Typography variant="h4">3</Typography>
                </Box>
                <Warning color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Channels
                  </Typography>
                  <Typography variant="h4">{channels.length}</Typography>
                </Box>
                <Email color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Last Alert
                  </Typography>
                  <Typography variant="body1">2 hours ago</Typography>
                </Box>
                <Schedule color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert Rules
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Channels</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAlertIcon(alert.type)}
                        <Typography>{alert.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={alert.type.toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell>
                      {alert.threshold}
                      {alert.thresholdType === 'percentage' ? '%' : ''}
                    </TableCell>
                    <TableCell>{alert.frequency}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {alert.channels.map((channel) => (
                          <Chip
                            key={channel}
                            label={channel}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.enabled}
                        onChange={() => handleToggleAlert(alert.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setEditAlertDialog(true);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAlert(alert.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notification Channels</Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setAddChannelDialog(true)}
            >
              Add Channel
            </Button>
          </Box>
          <Grid container spacing={2}>
            {channels.map((channel) => (
              <Grid item xs={12} md={6} key={channel.id}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getChannelIcon(channel.type)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{channel.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {channel.destination}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {channel.verified ? (
                        <Chip
                          label="Verified"
                          size="small"
                          color="success"
                          icon={<CheckCircle />}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleVerifyChannel(channel.id)}
                        >
                          Verify
                        </Button>
                      )}
                      <Switch
                        checked={channel.enabled}
                        size="small"
                        onChange={() => {
                          setChannels(channels.map(ch =>
                            ch.id === channel.id
                              ? { ...ch, enabled: !ch.enabled }
                              : ch
                          ));
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Global Alert Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Alert Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.emailDigest}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        emailDigest: e.target.checked
                      })}
                    />
                  }
                  label="Email Digest"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Combine multiple alerts into a single digest email
                </Typography>

                <FormControl size="small" sx={{ ml: 4, mb: 2 }}>
                  <InputLabel>Digest Frequency</InputLabel>
                  <Select
                    value={globalSettings.digestFrequency}
                    label="Digest Frequency"
                    onChange={(e) => setGlobalSettings({
                      ...globalSettings,
                      digestFrequency: e.target.value
                    })}
                    disabled={!globalSettings.emailDigest}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </FormGroup>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.quietHours}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        quietHours: e.target.checked
                      })}
                    />
                  }
                  label="Quiet Hours"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Suppress non-critical alerts during specified hours
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
                  <TextField
                    size="small"
                    label="Start"
                    type="time"
                    value={globalSettings.quietHoursStart}
                    onChange={(e) => setGlobalSettings({
                      ...globalSettings,
                      quietHoursStart: e.target.value
                    })}
                    disabled={!globalSettings.quietHours}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="End"
                    type="time"
                    value={globalSettings.quietHoursEnd}
                    onChange={(e) => setGlobalSettings({
                      ...globalSettings,
                      quietHoursEnd: e.target.value
                    })}
                    disabled={!globalSettings.quietHours}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Maximum Alerts per Day
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={globalSettings.maxAlertsPerDay}
                  onChange={(_, value) => setGlobalSettings({
                    ...globalSettings,
                    maxAlertsPerDay: value as number
                  })}
                  min={1}
                  max={50}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1, maxWidth: 300 }}
                />
                <Typography>{globalSettings.maxAlertsPerDay} alerts</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Alert History */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Alert History
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="High Token Usage Alert"
                secondary="Token usage reached 82% of monthly quota - 2 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AttachMoney color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Monthly Budget Alert"
                secondary="Spending reached $450 of $500 budget - Yesterday"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Speed color="error" />
              </ListItemIcon>
              <ListItemText
                primary="API Request Spike"
                secondary="Request rate exceeded 15,000 requests - 3 days ago"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={createAlertDialog} onClose={() => setCreateAlertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Usage Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alert Name"
                value={alertForm.name}
                onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={alertForm.type}
                  label="Alert Type"
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value as any })}
                >
                  <MenuItem value="tokens">Token Usage</MenuItem>
                  <MenuItem value="cost">Cost/Spending</MenuItem>
                  <MenuItem value="requests">API Requests</MenuItem>
                  <MenuItem value="users">Active Users</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                value={alertForm.threshold}
                onChange={(e) => setAlertForm({ ...alertForm, threshold: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Threshold Type</InputLabel>
                <Select
                  value={alertForm.thresholdType}
                  label="Threshold Type"
                  onChange={(e) => setAlertForm({ ...alertForm, thresholdType: e.target.value as any })}
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="absolute">Absolute Value</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Alert Frequency</InputLabel>
                <Select
                  value={alertForm.frequency}
                  label="Alert Frequency"
                  onChange={(e) => setAlertForm({ ...alertForm, frequency: e.target.value as any })}
                >
                  <MenuItem value="once">Once per period</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Notification Channels
              </Typography>
              <FormGroup>
                {channels.filter(ch => ch.verified).map((channel) => (
                  <FormControlLabel
                    key={channel.id}
                    control={
                      <Checkbox
                        checked={alertForm.channels.includes(channel.type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAlertForm({
                              ...alertForm,
                              channels: [...alertForm.channels, channel.type]
                            });
                          } else {
                            setAlertForm({
                              ...alertForm,
                              channels: alertForm.channels.filter(ch => ch !== channel.type)
                            });
                          }
                        }}
                      />
                    }
                    label={`${channel.name} (${channel.destination})`}
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAlertDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAlert}>
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Channel Dialog */}
      <Dialog open={addChannelDialog} onClose={() => setAddChannelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Notification Channel</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Channel Type</InputLabel>
                <Select
                  value={channelForm.type}
                  label="Channel Type"
                  onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as any })}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                  <MenuItem value="webhook">Webhook</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Channel Name"
                value={channelForm.name}
                onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                placeholder="e.g., Team Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={
                  channelForm.type === 'email' ? 'Email Address' :
                  channelForm.type === 'sms' ? 'Phone Number' :
                  channelForm.type === 'slack' ? 'Slack Channel' :
                  'Webhook URL'
                }
                value={channelForm.destination}
                onChange={(e) => setChannelForm({ ...channelForm, destination: e.target.value })}
                placeholder={
                  channelForm.type === 'email' ? 'alerts@company.com' :
                  channelForm.type === 'sms' ? '+1 555-0123' :
                  channelForm.type === 'slack' ? '#alerts' :
                  'https://webhook.site/...'
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChannelDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddChannel}>
            Add Channel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsageAlerts;