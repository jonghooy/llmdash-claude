import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Storage,
  Email,
  Language,
  Schedule,
  CloudUpload,
  Notifications
} from '@mui/icons-material';

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireMFA: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecial: boolean;
    allowRegistration: boolean;
    emailVerificationRequired: boolean;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    storageProvider: 'local' | 's3' | 'azure';
    s3Bucket?: string;
    azureContainer?: string;
    retentionDays: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    emailFrom: string;
    emailFromName: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    maxRequestsPerUser: number;
    skipSuccessfulRequests: boolean;
  };
  logging: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logToFile: boolean;
    logToConsole: boolean;
    logRetentionDays: number;
  };
}

const SystemConfiguration: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'LibreChat Admin',
      siteUrl: 'https://www.llmdash.com',
      adminEmail: 'admin@librechat.local',
      supportEmail: 'support@librechat.local',
      timezone: 'Asia/Seoul',
      language: 'ko',
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.'
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      requireMFA: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: true,
      allowRegistration: true,
      emailVerificationRequired: false
    },
    storage: {
      maxFileSize: 104857600, // 100MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif'],
      storageProvider: 'local',
      retentionDays: 90
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      emailFrom: 'noreply@librechat.local',
      emailFromName: 'LibreChat'
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100,
      maxRequestsPerUser: 50,
      skipSuccessfulRequests: false
    },
    logging: {
      logLevel: 'info',
      logToFile: true,
      logToConsole: true,
      logRetentionDays: 30
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('general');

  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/system-config`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching config:', err);
      // Use default config if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/system-config`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchConfig();
    setSuccess('Configuration reset to saved values');
    setTimeout(() => setSuccess(null), 3000);
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderGeneralSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Language sx={{ mr: 1, verticalAlign: 'middle' }} />
          General Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Site Name"
              value={config.general.siteName}
              onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Site URL"
              value={config.general.siteUrl}
              onChange={(e) => updateConfig('general', 'siteUrl', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Admin Email"
              type="email"
              value={config.general.adminEmail}
              onChange={(e) => updateConfig('general', 'adminEmail', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Support Email"
              type="email"
              value={config.general.supportEmail}
              onChange={(e) => updateConfig('general', 'supportEmail', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={config.general.timezone}
                onChange={(e) => updateConfig('general', 'timezone', e.target.value)}
                label="Timezone"
              >
                <MenuItem value="Asia/Seoul">Asia/Seoul</MenuItem>
                <MenuItem value="America/New_York">America/New_York</MenuItem>
                <MenuItem value="Europe/London">Europe/London</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={config.general.language}
                onChange={(e) => updateConfig('general', 'language', e.target.value)}
                label="Language"
              >
                <MenuItem value="ko">한국어</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.general.maintenanceMode}
                  onChange={(e) => updateConfig('general', 'maintenanceMode', e.target.checked)}
                />
              }
              label="Maintenance Mode"
            />
          </Grid>
          {config.general.maintenanceMode && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Maintenance Message"
                multiline
                rows={2}
                value={config.general.maintenanceMessage}
                onChange={(e) => updateConfig('general', 'maintenanceMessage', e.target.value)}
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          Security Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Session Timeout (seconds)"
              type="number"
              value={config.security.sessionTimeout}
              onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Max Login Attempts"
              type="number"
              value={config.security.maxLoginAttempts}
              onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Lockout Duration (seconds)"
              type="number"
              value={config.security.lockoutDuration}
              onChange={(e) => updateConfig('security', 'lockoutDuration', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Password Requirements</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Password Length"
              type="number"
              value={config.security.passwordMinLength}
              onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.passwordRequireUppercase}
                    onChange={(e) => updateConfig('security', 'passwordRequireUppercase', e.target.checked)}
                  />
                }
                label="Require Uppercase"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.passwordRequireNumbers}
                    onChange={(e) => updateConfig('security', 'passwordRequireNumbers', e.target.checked)}
                  />
                }
                label="Require Numbers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.passwordRequireSpecial}
                    onChange={(e) => updateConfig('security', 'passwordRequireSpecial', e.target.checked)}
                  />
                }
                label="Require Special Characters"
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.requireMFA}
                  onChange={(e) => updateConfig('security', 'requireMFA', e.target.checked)}
                />
              }
              label="Require MFA"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.allowRegistration}
                  onChange={(e) => updateConfig('security', 'allowRegistration', e.target.checked)}
                />
              }
              label="Allow Registration"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.emailVerificationRequired}
                  onChange={(e) => updateConfig('security', 'emailVerificationRequired', e.target.checked)}
                />
              }
              label="Email Verification Required"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStorageSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
          Storage Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max File Size (bytes)"
              type="number"
              value={config.storage.maxFileSize}
              onChange={(e) => updateConfig('storage', 'maxFileSize', parseInt(e.target.value))}
              helperText={`Current: ${(config.storage.maxFileSize / 1048576).toFixed(2)} MB`}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Retention Days"
              type="number"
              value={config.storage.retentionDays}
              onChange={(e) => updateConfig('storage', 'retentionDays', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Storage Provider</InputLabel>
              <Select
                value={config.storage.storageProvider}
                onChange={(e) => updateConfig('storage', 'storageProvider', e.target.value)}
                label="Storage Provider"
              >
                <MenuItem value="local">Local Storage</MenuItem>
                <MenuItem value="s3">Amazon S3</MenuItem>
                <MenuItem value="azure">Azure Blob Storage</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {config.storage.storageProvider === 's3' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="S3 Bucket Name"
                value={config.storage.s3Bucket || ''}
                onChange={(e) => updateConfig('storage', 's3Bucket', e.target.value)}
              />
            </Grid>
          )}
          {config.storage.storageProvider === 'azure' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Azure Container Name"
                value={config.storage.azureContainer || ''}
                onChange={(e) => updateConfig('storage', 'azureContainer', e.target.value)}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Allowed File Types</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {config.storage.allowedFileTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onDelete={() => {
                    updateConfig('storage', 'allowedFileTypes', 
                      config.storage.allowedFileTypes.filter(t => t !== type)
                    );
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderEmailSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
          Email Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP Host"
              value={config.email.smtpHost}
              onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="SMTP Port"
              type="number"
              value={config.email.smtpPort}
              onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.email.smtpSecure}
                  onChange={(e) => updateConfig('email', 'smtpSecure', e.target.checked)}
                />
              }
              label="Use TLS/SSL"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP Username"
              value={config.email.smtpUser}
              onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP Password"
              type="password"
              value={config.email.smtpPassword}
              onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="From Email"
              type="email"
              value={config.email.emailFrom}
              onChange={(e) => updateConfig('email', 'emailFrom', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="From Name"
              value={config.email.emailFromName}
              onChange={(e) => updateConfig('email', 'emailFromName', e.target.value)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRateLimitSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
          Rate Limiting
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Window (ms)"
              type="number"
              value={config.rateLimit.windowMs}
              onChange={(e) => updateConfig('rateLimit', 'windowMs', parseInt(e.target.value))}
              helperText={`Current: ${config.rateLimit.windowMs / 1000} seconds`}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Requests"
              type="number"
              value={config.rateLimit.maxRequests}
              onChange={(e) => updateConfig('rateLimit', 'maxRequests', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Requests Per User"
              type="number"
              value={config.rateLimit.maxRequestsPerUser}
              onChange={(e) => updateConfig('rateLimit', 'maxRequestsPerUser', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.rateLimit.skipSuccessfulRequests}
                  onChange={(e) => updateConfig('rateLimit', 'skipSuccessfulRequests', e.target.checked)}
                />
              }
              label="Skip Successful Requests"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderLoggingSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
          Logging Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Log Level</InputLabel>
              <Select
                value={config.logging.logLevel}
                onChange={(e) => updateConfig('logging', 'logLevel', e.target.value)}
                label="Log Level"
              >
                <MenuItem value="debug">Debug</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Log Retention Days"
              type="number"
              value={config.logging.logRetentionDays}
              onChange={(e) => updateConfig('logging', 'logRetentionDays', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.logging.logToFile}
                  onChange={(e) => updateConfig('logging', 'logToFile', e.target.checked)}
                />
              }
              label="Log to File"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.logging.logToConsole}
                  onChange={(e) => updateConfig('logging', 'logToConsole', e.target.checked)}
                />
              }
              label="Log to Console"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Configuration
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderGeneralSettings()}
        </Grid>
        <Grid item xs={12}>
          {renderSecuritySettings()}
        </Grid>
        <Grid item xs={12}>
          {renderStorageSettings()}
        </Grid>
        <Grid item xs={12}>
          {renderEmailSettings()}
        </Grid>
        <Grid item xs={12}>
          {renderRateLimitSettings()}
        </Grid>
        <Grid item xs={12}>
          {renderLoggingSettings()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemConfiguration;