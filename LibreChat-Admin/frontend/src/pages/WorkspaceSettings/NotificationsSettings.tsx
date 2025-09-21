import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  RadioGroup,
  Radio,
  TextField,
} from '@mui/material';
import {
  Notifications,
  Email,
  Sms,
  NotificationsActive,
  NotificationsOff,
  Schedule,
  Person,
  Group,
  Security,
  AttachMoney,
  Warning,
  Info,
  Save,
  DoNotDisturb,
  VolumeUp,
} from '@mui/icons-material';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: {
    email: boolean;
    inApp: boolean;
    push: boolean;
    sms: boolean;
  };
}

const NotificationsSettings: React.FC = () => {
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'account',
      name: 'Account & Security',
      description: 'Login alerts, password changes, security warnings',
      icon: <Security />,
      settings: {
        email: true,
        inApp: true,
        push: true,
        sms: false,
      },
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      description: 'Invoices, payment confirmations, subscription changes',
      icon: <AttachMoney />,
      settings: {
        email: true,
        inApp: true,
        push: false,
        sms: false,
      },
    },
    {
      id: 'team',
      name: 'Team Activity',
      description: 'New members, role changes, team updates',
      icon: <Group />,
      settings: {
        email: true,
        inApp: true,
        push: false,
        sms: false,
      },
    },
    {
      id: 'system',
      name: 'System Updates',
      description: 'Maintenance, new features, system status',
      icon: <Info />,
      settings: {
        email: false,
        inApp: true,
        push: false,
        sms: false,
      },
    },
    {
      id: 'usage',
      name: 'Usage Alerts',
      description: 'Quota warnings, usage limits, resource alerts',
      icon: <Warning />,
      settings: {
        email: true,
        inApp: true,
        push: true,
        sms: false,
      },
    },
  ]);

  const [digestSettings, setDigestSettings] = useState({
    enabled: true,
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
  });

  const [quietHours, setQuietHours] = useState({
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'America/New_York',
    exceptions: ['security', 'critical'],
  });

  const [emailSettings, setEmailSettings] = useState({
    primaryEmail: 'admin@company.com',
    alternateEmail: '',
    format: 'html',
    unsubscribeFooter: true,
  });

  const [saved, setSaved] = useState(false);

  const handleCategoryToggle = (categoryId: string, channel: string) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          settings: {
            ...cat.settings,
            [channel]: !cat.settings[channel as keyof typeof cat.settings],
          },
        };
      }
      return cat;
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Notification settings saved successfully!
        </Alert>
      )}

      {/* Notification Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            Notification Preferences
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Configure how and when you receive notifications for different types of events.
          </Alert>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    Category
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <Email sx={{ fontSize: 20 }} />
                    <Typography variant="caption" display="block">Email</Typography>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <NotificationsActive sx={{ fontSize: 20 }} />
                    <Typography variant="caption" display="block">In-App</Typography>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <VolumeUp sx={{ fontSize: 20 }} />
                    <Typography variant="caption" display="block">Push</Typography>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <Sms sx={{ fontSize: 20 }} />
                    <Typography variant="caption" display="block">SMS</Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Switch
                        checked={category.settings.email}
                        onChange={() => handleCategoryToggle(category.id, 'email')}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Switch
                        checked={category.settings.inApp}
                        onChange={() => handleCategoryToggle(category.id, 'inApp')}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Switch
                        checked={category.settings.push}
                        onChange={() => handleCategoryToggle(category.id, 'push')}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Switch
                        checked={category.settings.sms}
                        onChange={() => handleCategoryToggle(category.id, 'sms')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email />
            Email Settings
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Email Address"
                value={emailSettings.primaryEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, primaryEmail: e.target.value })}
                type="email"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Alternate Email Address (Optional)"
                value={emailSettings.alternateEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, alternateEmail: e.target.value })}
                type="email"
                placeholder="backup@company.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Email Format</InputLabel>
                <Select
                  value={emailSettings.format}
                  label="Email Format"
                  onChange={(e) => setEmailSettings({ ...emailSettings, format: e.target.value })}
                >
                  <MenuItem value="html">HTML (Rich Text)</MenuItem>
                  <MenuItem value="plain">Plain Text</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailSettings.unsubscribeFooter}
                    onChange={(e) => setEmailSettings({ ...emailSettings, unsubscribeFooter: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Include unsubscribe link</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add an unsubscribe link to all notification emails
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule />
            Email Digest
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={digestSettings.enabled}
                    onChange={(e) => setDigestSettings({ ...digestSettings, enabled: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Enable email digest</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Combine multiple notifications into a single summary email
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {digestSettings.enabled && (
              <>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={digestSettings.frequency}
                      label="Frequency"
                      onChange={(e) => setDigestSettings({ ...digestSettings, frequency: e.target.value })}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {digestSettings.frequency === 'weekly' && (
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Day of Week</InputLabel>
                      <Select
                        value={digestSettings.day}
                        label="Day of Week"
                        onChange={(e) => setDigestSettings({ ...digestSettings, day: e.target.value })}
                      >
                        <MenuItem value="monday">Monday</MenuItem>
                        <MenuItem value="tuesday">Tuesday</MenuItem>
                        <MenuItem value="wednesday">Wednesday</MenuItem>
                        <MenuItem value="thursday">Thursday</MenuItem>
                        <MenuItem value="friday">Friday</MenuItem>
                        <MenuItem value="saturday">Saturday</MenuItem>
                        <MenuItem value="sunday">Sunday</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={digestSettings.time}
                    onChange={(e) => setDigestSettings({ ...digestSettings, time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DoNotDisturb />
            Quiet Hours
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={quietHours.enabled}
                    onChange={(e) => setQuietHours({ ...quietHours, enabled: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Enable quiet hours</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Suppress non-critical notifications during specified hours
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {quietHours.enabled && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={quietHours.startTime}
                    onChange={(e) => setQuietHours({ ...quietHours, startTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={quietHours.endTime}
                    onChange={(e) => setQuietHours({ ...quietHours, endTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={quietHours.timezone}
                      label="Timezone"
                      onChange={(e) => setQuietHours({ ...quietHours, timezone: e.target.value })}
                    >
                      <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                      <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                      <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                      <MenuItem value="Europe/London">London (GMT)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Exceptions (always notify for):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['Security Alerts', 'Critical Errors', 'Billing Issues'].map((exception) => (
                      <Chip
                        key={exception}
                        label={exception}
                        onDelete={() => {}}
                      />
                    ))}
                    <Button size="small">Add Exception</Button>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Notifications
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" paragraph>
            Send a test notification to verify your settings are working correctly.
          </Typography>

          <Grid container spacing={2}>
            <Grid item>
              <Button variant="outlined" startIcon={<Email />}>
                Send Test Email
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" startIcon={<NotificationsActive />}>
                Send In-App Alert
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" startIcon={<VolumeUp />}>
                Send Push Notification
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" startIcon={<Sms />}>
                Send Test SMS
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
        >
          Save Notification Settings
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationsSettings;