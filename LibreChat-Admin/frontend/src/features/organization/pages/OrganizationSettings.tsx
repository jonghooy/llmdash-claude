import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Slider,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Save,
  Business,
  AttachMoney,
  Security,
  Notifications,
  ModelTraining,
  CloudUpload,
  Delete,
  Add,
  Warning,
  Info,
  CheckCircle,
  Schedule,
  Api,
  VpnKey,
  Block
} from '@mui/icons-material';
import PageContainer from '../../../components/Layout/PageContainer';

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
      id={`org-settings-tabpanel-${index}`}
      aria-labelledby={`org-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const OrganizationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    organizationName: 'Acme Corporation',
    organizationCode: 'ACME',
    description: 'Leading technology company',
    website: 'https://acme.com',
    timezone: 'America/New_York',
    language: 'en',
    fiscalYearStart: '01'
  });

  // Budget & Limits
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: 10000,
    budgetAlertThreshold: 80,
    tokenLimit: 1000000,
    fileUploadLimit: 100,
    maxFileSize: 50,
    concurrentUsers: 100,
    apiRateLimit: 1000
  });

  // Model Permissions
  const [modelPermissions, setModelPermissions] = useState({
    allowedModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'],
    defaultModel: 'gpt-3.5-turbo',
    maxTokensPerRequest: 4000,
    temperatureRange: [0, 1],
    allowFineTuning: false,
    allowCustomPrompts: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    require2FA: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    passwordPolicy: 'strong',
    dataRetention: 90,
    auditLogging: true,
    encryptData: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    securityAlerts: true,
    usageReports: 'weekly',
    adminEmails: ['admin@acme.com'],
    slackWebhook: '',
    teamsWebhook: ''
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    setHasChanges(false);
  };

  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'llama-2-70b', name: 'Llama 2 70B', provider: 'Meta' }
  ];

  return (
    <PageContainer title="Organization Settings">
      {hasChanges && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleSaveSettings}>
              Save Changes
            </Button>
          }
        >
          You have unsaved changes
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            aria-label="organization settings tabs"
            sx={{ px: 2 }}
          >
            <Tab icon={<Business />} label="General" />
            <Tab icon={<AttachMoney />} label="Budget & Limits" />
            <Tab icon={<ModelTraining />} label="Model Permissions" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Notifications" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* General Settings Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={generalSettings.organizationName}
                  onChange={(e) => {
                    setGeneralSettings({ ...generalSettings, organizationName: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organization Code"
                  value={generalSettings.organizationCode}
                  onChange={(e) => {
                    setGeneralSettings({ ...generalSettings, organizationCode: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={generalSettings.description}
                  onChange={(e) => {
                    setGeneralSettings({ ...generalSettings, description: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={generalSettings.website}
                  onChange={(e) => {
                    setGeneralSettings({ ...generalSettings, website: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    label="Timezone"
                    onChange={(e) => {
                      setGeneralSettings({ ...generalSettings, timezone: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={generalSettings.language}
                    label="Language"
                    onChange={(e) => {
                      setGeneralSettings({ ...generalSettings, language: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="ja">Japanese</MenuItem>
                    <MenuItem value="ko">Korean</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Fiscal Year Start</InputLabel>
                  <Select
                    value={generalSettings.fiscalYearStart}
                    label="Fiscal Year Start"
                    onChange={(e) => {
                      setGeneralSettings({ ...generalSettings, fiscalYearStart: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    <MenuItem value="01">January</MenuItem>
                    <MenuItem value="04">April</MenuItem>
                    <MenuItem value="07">July</MenuItem>
                    <MenuItem value="10">October</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Budget & Limits Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Budget Configuration
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Monthly Budget"
                          value={budgetSettings.monthlyBudget}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, monthlyBudget: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Alert Threshold: {budgetSettings.budgetAlertThreshold}%
                        </Typography>
                        <Slider
                          value={budgetSettings.budgetAlertThreshold}
                          onChange={(e, v) => {
                            setBudgetSettings({ ...budgetSettings, budgetAlertThreshold: v as number });
                            setHasChanges(true);
                          }}
                          min={50}
                          max={100}
                          marks
                          step={5}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Usage Limits
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Monthly Token Limit"
                          value={budgetSettings.tokenLimit}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, tokenLimit: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Concurrent Users"
                          value={budgetSettings.concurrentUsers}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, concurrentUsers: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="File Upload Limit (per month)"
                          value={budgetSettings.fileUploadLimit}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, fileUploadLimit: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Max File Size (MB)"
                          value={budgetSettings.maxFileSize}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, maxFileSize: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="API Rate Limit (per hour)"
                          value={budgetSettings.apiRateLimit}
                          onChange={(e) => {
                            setBudgetSettings({ ...budgetSettings, apiRateLimit: Number(e.target.value) });
                            setHasChanges(true);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Model Permissions Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Allowed Models
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Select which AI models are available for this organization
                    </Typography>
                    <FormGroup>
                      {availableModels.map((model) => (
                        <FormControlLabel
                          key={model.id}
                          control={
                            <Checkbox
                              checked={modelPermissions.allowedModels.includes(model.id)}
                              onChange={(e) => {
                                const newModels = e.target.checked
                                  ? [...modelPermissions.allowedModels, model.id]
                                  : modelPermissions.allowedModels.filter(m => m !== model.id);
                                setModelPermissions({ ...modelPermissions, allowedModels: newModels });
                                setHasChanges(true);
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{model.name}</Typography>
                              <Chip label={model.provider} size="small" />
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Model</InputLabel>
                  <Select
                    value={modelPermissions.defaultModel}
                    label="Default Model"
                    onChange={(e) => {
                      setModelPermissions({ ...modelPermissions, defaultModel: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    {modelPermissions.allowedModels.map(modelId => {
                      const model = availableModels.find(m => m.id === modelId);
                      return model ? (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name}
                        </MenuItem>
                      ) : null;
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Tokens Per Request"
                  value={modelPermissions.maxTokensPerRequest}
                  onChange={(e) => {
                    setModelPermissions({ ...modelPermissions, maxTokensPerRequest: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={modelPermissions.allowFineTuning}
                        onChange={(e) => {
                          setModelPermissions({ ...modelPermissions, allowFineTuning: e.target.checked });
                          setHasChanges(true);
                        }}
                      />
                    }
                    label="Allow Fine-tuning"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={modelPermissions.allowCustomPrompts}
                        onChange={(e) => {
                          setModelPermissions({ ...modelPermissions, allowCustomPrompts: e.target.checked });
                          setHasChanges(true);
                        }}
                      />
                    }
                    label="Allow Custom System Prompts"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Authentication & Access
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.require2FA}
                            onChange={(e) => {
                              setSecuritySettings({ ...securitySettings, require2FA: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Require Two-Factor Authentication"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.auditLogging}
                            onChange={(e) => {
                              setSecuritySettings({ ...securitySettings, auditLogging: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Enable Audit Logging"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.encryptData}
                            onChange={(e) => {
                              setSecuritySettings({ ...securitySettings, encryptData: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Encrypt Data at Rest"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => {
                    setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Data Retention (days)"
                  value={securitySettings.dataRetention}
                  onChange={(e) => {
                    setSecuritySettings({ ...securitySettings, dataRetention: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Password Policy</InputLabel>
                  <Select
                    value={securitySettings.passwordPolicy}
                    label="Password Policy"
                    onChange={(e) => {
                      setSecuritySettings({ ...securitySettings, passwordPolicy: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    <MenuItem value="basic">Basic (8+ characters)</MenuItem>
                    <MenuItem value="strong">Strong (12+ chars, mixed case, numbers, symbols)</MenuItem>
                    <MenuItem value="enterprise">Enterprise (16+ chars, complexity requirements)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notification Preferences
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => {
                              setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.budgetAlerts}
                            onChange={(e) => {
                              setNotificationSettings({ ...notificationSettings, budgetAlerts: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Budget Alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.securityAlerts}
                            onChange={(e) => {
                              setNotificationSettings({ ...notificationSettings, securityAlerts: e.target.checked });
                              setHasChanges(true);
                            }}
                          />
                        }
                        label="Security Alerts"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Usage Reports</InputLabel>
                  <Select
                    value={notificationSettings.usageReports}
                    label="Usage Reports"
                    onChange={(e) => {
                      setNotificationSettings({ ...notificationSettings, usageReports: e.target.value });
                      setHasChanges(true);
                    }}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Admin Email Addresses"
                  value={notificationSettings.adminEmails.join(', ')}
                  onChange={(e) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      adminEmails: e.target.value.split(',').map(email => email.trim())
                    });
                    setHasChanges(true);
                  }}
                  helperText="Comma-separated list of email addresses"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Slack Webhook URL"
                  value={notificationSettings.slackWebhook}
                  onChange={(e) => {
                    setNotificationSettings({ ...notificationSettings, slackWebhook: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teams Webhook URL"
                  value={notificationSettings.teamsWebhook}
                  onChange={(e) => {
                    setNotificationSettings({ ...notificationSettings, teamsWebhook: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              disabled={!hasChanges}
              onClick={() => {
                // Reset changes
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              disabled={!hasChanges || saving}
              onClick={handleSaveSettings}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </PageContainer>
  );
};