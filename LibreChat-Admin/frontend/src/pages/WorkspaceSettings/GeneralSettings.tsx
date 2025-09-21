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
  Avatar,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Save,
  Business,
  Language,
  AccessTime,
  CalendarMonth,
  PhotoCamera,
  Delete,
  Info,
} from '@mui/icons-material';

const GeneralSettings: React.FC = () => {
  const [workspaceData, setWorkspaceData] = useState({
    name: 'Acme Corporation',
    subdomain: 'acme',
    description: 'AI-powered innovation for modern businesses',
    logo: '/api/placeholder/100/100',
    website: 'https://www.acme.com',
    industry: 'technology',
    size: '50-200',
    founded: '2020',
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStart: 'sunday',
    fiscalYearStart: 'january',
    currency: 'USD',
  });

  const [features, setFeatures] = useState({
    publicProfile: true,
    allowGuestUsers: false,
    requireEmailVerification: true,
    autoJoinTeams: true,
    enableFileSharing: true,
    enableApiAccess: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle logo upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkspaceData({ ...workspaceData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Workspace Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business />
            Workspace Information
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={workspaceData.logo}
                sx={{ width: 100, height: 100 }}
              />
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    Upload Logo
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Recommended: 200x200px, PNG or JPG
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Workspace Name"
                value={workspaceData.name}
                onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                helperText="This name will be displayed throughout the application"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subdomain"
                value={workspaceData.subdomain}
                onChange={(e) => setWorkspaceData({ ...workspaceData, subdomain: e.target.value })}
                InputProps={{
                  endAdornment: <Typography color="text.secondary">.llmdash.com</Typography>
                }}
                helperText="Your workspace URL"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={workspaceData.description}
                onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                helperText="Brief description of your organization"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={workspaceData.website}
                onChange={(e) => setWorkspaceData({ ...workspaceData, website: e.target.value })}
                type="url"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={workspaceData.industry}
                  label="Industry"
                  onChange={(e) => setWorkspaceData({ ...workspaceData, industry: e.target.value })}
                >
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="consulting">Consulting</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={workspaceData.size}
                  label="Company Size"
                  onChange={(e) => setWorkspaceData({ ...workspaceData, size: e.target.value })}
                >
                  <MenuItem value="1-10">1-10 employees</MenuItem>
                  <MenuItem value="11-50">11-50 employees</MenuItem>
                  <MenuItem value="50-200">50-200 employees</MenuItem>
                  <MenuItem value="201-500">201-500 employees</MenuItem>
                  <MenuItem value="500+">500+ employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Founded Year</InputLabel>
                <Select
                  value={workspaceData.founded}
                  label="Founded Year"
                  onChange={(e) => setWorkspaceData({ ...workspaceData, founded: e.target.value })}
                >
                  {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Regional Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Language />
            Regional Preferences
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={preferences.language}
                  label="Language"
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="ja">Japanese</MenuItem>
                  <MenuItem value="ko">Korean</MenuItem>
                  <MenuItem value="zh">Chinese</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={preferences.timezone}
                  label="Timezone"
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                >
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                  <MenuItem value="Europe/London">London (GMT)</MenuItem>
                  <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                  <MenuItem value="Asia/Seoul">Seoul (KST)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  value={preferences.dateFormat}
                  label="Date Format"
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Format</InputLabel>
                <Select
                  value={preferences.timeFormat}
                  label="Time Format"
                  onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                >
                  <MenuItem value="12h">12-hour (AM/PM)</MenuItem>
                  <MenuItem value="24h">24-hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={preferences.currency}
                  label="Currency"
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="JPY">JPY (¥)</MenuItem>
                  <MenuItem value="KRW">KRW (₩)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Week Starts On</InputLabel>
                <Select
                  value={preferences.weekStart}
                  label="Week Starts On"
                  onChange={(e) => setPreferences({ ...preferences, weekStart: e.target.value })}
                >
                  <MenuItem value="sunday">Sunday</MenuItem>
                  <MenuItem value="monday">Monday</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fiscal Year Starts</InputLabel>
                <Select
                  value={preferences.fiscalYearStart}
                  label="Fiscal Year Starts"
                  onChange={(e) => setPreferences({ ...preferences, fiscalYearStart: e.target.value })}
                >
                  <MenuItem value="january">January</MenuItem>
                  <MenuItem value="april">April</MenuItem>
                  <MenuItem value="july">July</MenuItem>
                  <MenuItem value="october">October</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Workspace Features */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workspace Features
          </Typography>
          <Divider sx={{ my: 2 }} />

          <FormGroup>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.publicProfile}
                      onChange={(e) => setFeatures({ ...features, publicProfile: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Public Profile</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Make your workspace profile visible to non-members
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.allowGuestUsers}
                      onChange={(e) => setFeatures({ ...features, allowGuestUsers: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Allow Guest Users</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allow external users to join as guests
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.requireEmailVerification}
                      onChange={(e) => setFeatures({ ...features, requireEmailVerification: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Require Email Verification</Typography>
                      <Typography variant="body2" color="text.secondary">
                        New users must verify their email address
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.autoJoinTeams}
                      onChange={(e) => setFeatures({ ...features, autoJoinTeams: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Auto-join Teams</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Automatically add new users to default teams
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableFileSharing}
                      onChange={(e) => setFeatures({ ...features, enableFileSharing: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Enable File Sharing</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allow users to share files in conversations
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableApiAccess}
                      onChange={(e) => setFeatures({ ...features, enableApiAccess: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Enable API Access</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allow API access for integrations
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </FormGroup>
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
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default GeneralSettings;