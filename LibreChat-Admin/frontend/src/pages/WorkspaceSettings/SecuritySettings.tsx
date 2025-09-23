import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
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
} from '@mui/material';
import {
  Save,
  Security,
  Lock,
  Key,
  Shield,
  Warning,
  Delete,
  Add,
  VpnKey,
  Fingerprint,
  PhoneAndroid,
  CheckCircle,
  Block,
} from '@mui/icons-material';

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface IPRule {
  id: string;
  type: 'allow' | 'deny';
  ip: string;
  description: string;
  createdAt: string;
}

const SecuritySettings: React.FC = () => {
  const [authSettings, setAuthSettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpirationDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    requireMFA: false,
    mfaMethod: 'totp',
  });

  const [ssoSettings, setSsoSettings] = useState({
    enableSSO: false,
    ssoProvider: 'saml',
    ssoEntityId: '',
    ssoLoginUrl: '',
    ssoCertificate: '',
    allowPasswordLogin: true,
  });

  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, US',
      ip: '192.168.1.100',
      lastActive: '5 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on MacOS',
      location: 'San Francisco, US',
      ip: '192.168.1.101',
      lastActive: '1 hour ago',
      current: false,
    },
  ]);

  const [ipRules, setIpRules] = useState<IPRule[]>([
    {
      id: '1',
      type: 'allow',
      ip: '192.168.1.0/24',
      description: 'Office network',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      type: 'deny',
      ip: '10.0.0.5',
      description: 'Suspicious activity',
      createdAt: '2024-01-20',
    },
  ]);

  const [addIpDialog, setAddIpDialog] = useState(false);
  const [newIpRule, setNewIpRule] = useState({
    type: 'allow' as const,
    ip: '',
    description: '',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
  };

  const handleAddIpRule = () => {
    const newRule: IPRule = {
      id: String(ipRules.length + 1),
      ...newIpRule,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setIpRules([...ipRules, newRule]);
    setAddIpDialog(false);
    setNewIpRule({ type: 'allow', ip: '', description: '' });
  };

  const handleDeleteIpRule = (ruleId: string) => {
    setIpRules(ipRules.filter(rule => rule.id !== ruleId));
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Security settings saved successfully!
        </Alert>
      )}

      {/* Authentication Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock />
            Authentication Settings
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Password Requirements
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Password Length"
                value={authSettings.passwordMinLength}
                onChange={(e) => setAuthSettings({ ...authSettings, passwordMinLength: parseInt(e.target.value) })}
                inputProps={{ min: 6, max: 32 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Password Expiration (days)"
                value={authSettings.passwordExpirationDays}
                onChange={(e) => setAuthSettings({ ...authSettings, passwordExpirationDays: parseInt(e.target.value) })}
                helperText="0 for no expiration"
              />
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={authSettings.passwordRequireUppercase}
                      onChange={(e) => setAuthSettings({ ...authSettings, passwordRequireUppercase: e.target.checked })}
                    />
                  }
                  label="Require uppercase letters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={authSettings.passwordRequireLowercase}
                      onChange={(e) => setAuthSettings({ ...authSettings, passwordRequireLowercase: e.target.checked })}
                    />
                  }
                  label="Require lowercase letters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={authSettings.passwordRequireNumbers}
                      onChange={(e) => setAuthSettings({ ...authSettings, passwordRequireNumbers: e.target.checked })}
                    />
                  }
                  label="Require numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={authSettings.passwordRequireSpecialChars}
                      onChange={(e) => setAuthSettings({ ...authSettings, passwordRequireSpecialChars: e.target.checked })}
                    />
                  }
                  label="Require special characters"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Login Security
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Login Attempts"
                value={authSettings.maxLoginAttempts}
                onChange={(e) => setAuthSettings({ ...authSettings, maxLoginAttempts: parseInt(e.target.value) })}
                inputProps={{ min: 3, max: 10 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Lockout Duration (minutes)"
                value={authSettings.lockoutDuration}
                onChange={(e) => setAuthSettings({ ...authSettings, lockoutDuration: parseInt(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Session Timeout (minutes)"
                value={authSettings.sessionTimeout}
                onChange={(e) => setAuthSettings({ ...authSettings, sessionTimeout: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Multi-Factor Authentication */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Fingerprint />
            Multi-Factor Authentication (MFA)
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={authSettings.requireMFA}
                    onChange={(e) => setAuthSettings({ ...authSettings, requireMFA: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Require MFA for all users</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Users must set up two-factor authentication to access the workspace
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!authSettings.requireMFA}>
                <InputLabel>MFA Method</InputLabel>
                <Select
                  value={authSettings.mfaMethod}
                  label="MFA Method"
                  onChange={(e) => setAuthSettings({ ...authSettings, mfaMethod: e.target.value })}
                >
                  <MenuItem value="totp">Authenticator App (TOTP)</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="both">User's Choice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SSO Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKey />
            Single Sign-On (SSO)
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ssoSettings.enableSSO}
                    onChange={(e) => setSsoSettings({ ...ssoSettings, enableSSO: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Enable SSO</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allow users to sign in using your organization's identity provider
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {ssoSettings.enableSSO && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>SSO Provider</InputLabel>
                    <Select
                      value={ssoSettings.ssoProvider}
                      label="SSO Provider"
                      onChange={(e) => setSsoSettings({ ...ssoSettings, ssoProvider: e.target.value })}
                    >
                      <MenuItem value="saml">SAML 2.0</MenuItem>
                      <MenuItem value="oauth">OAuth 2.0</MenuItem>
                      <MenuItem value="oidc">OpenID Connect</MenuItem>
                      <MenuItem value="azure">Azure AD</MenuItem>
                      <MenuItem value="google">Google Workspace</MenuItem>
                      <MenuItem value="okta">Okta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={ssoSettings.allowPasswordLogin}
                        onChange={(e) => setSsoSettings({ ...ssoSettings, allowPasswordLogin: e.target.checked })}
                      />
                    }
                    label="Allow password login alongside SSO"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Entity ID"
                    value={ssoSettings.ssoEntityId}
                    onChange={(e) => setSsoSettings({ ...ssoSettings, ssoEntityId: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SSO Login URL"
                    value={ssoSettings.ssoLoginUrl}
                    onChange={(e) => setSsoSettings({ ...ssoSettings, ssoLoginUrl: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="X.509 Certificate"
                    value={ssoSettings.ssoCertificate}
                    onChange={(e) => setSsoSettings({ ...ssoSettings, ssoCertificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroid />
            Active Sessions
          </Typography>
          <Divider sx={{ my: 2 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {session.device}
                        {session.current && (
                          <Chip label="Current" color="primary" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>{session.ip}</TableCell>
                    <TableCell>{session.lastActive}</TableCell>
                    <TableCell>
                      {!session.current && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2 }}>
            <Button color="error" variant="outlined">
              Terminate All Other Sessions
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* IP Restrictions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield />
              IP Restrictions
            </Typography>
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={() => setAddIpDialog(true)}
            >
              Add Rule
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>IP Address/Range</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ipRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Chip
                        label={rule.type.toUpperCase()}
                        color={rule.type === 'allow' ? 'success' : 'error'}
                        size="small"
                        icon={rule.type === 'allow' ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell>{rule.ip}</TableCell>
                    <TableCell>{rule.description}</TableCell>
                    <TableCell>{rule.createdAt}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteIpRule(rule.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* API Security - Simplified without problematic content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Key />
            API Security
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            API keys allow external applications to access your workspace. Keep them secure and rotate regularly.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" paragraph>
                API keys are managed through the main API Keys settings page. For security reasons,
                API keys should never be displayed in plain text or stored in client-side code.
              </Typography>
              <Button variant="outlined" startIcon={<Key />}>
                Go to API Keys Settings
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" color="warning">
                Regenerate All API Keys
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
          Save Security Settings
        </Button>
      </Box>

      {/* Add IP Rule Dialog */}
      <Dialog open={addIpDialog} onClose={() => setAddIpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add IP Restriction Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={newIpRule.type}
                  label="Rule Type"
                  onChange={(e) => setNewIpRule({ ...newIpRule, type: e.target.value as any })}
                >
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="deny">Deny</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IP Address or Range"
                value={newIpRule.ip}
                onChange={(e) => setNewIpRule({ ...newIpRule, ip: e.target.value })}
                placeholder="e.g., 192.168.1.0/24 or 10.0.0.5"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newIpRule.description}
                onChange={(e) => setNewIpRule({ ...newIpRule, description: e.target.value })}
                placeholder="e.g., Office network"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddIpDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddIpRule}>
            Add Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;