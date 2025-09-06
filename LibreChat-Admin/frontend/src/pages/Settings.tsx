import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Slider
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface Settings {
  rateLimits: {
    messagePerMinute: number;
    tokensPerDay: number;
    concurrentRequests: number;
  };
  models: {
    openai: string[];
    anthropic: string[];
    google: string[];
  };
  features: {
    registration: boolean;
    socialLogin: boolean;
    fileUpload: boolean;
    plugins: boolean;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSettings(response.data);
      return response.data;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (updatedSettings: Settings) => {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        '/admin/api/settings',
        updatedSettings,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      setSuccessMessage('Settings updated successfully');
    }
  });

  const handleSave = () => {
    if (settings) {
      updateSettings.mutate(settings);
    }
  };

  const handleRateLimitChange = (field: string, value: number) => {
    if (settings) {
      setSettings({
        ...settings,
        rateLimits: {
          ...settings.rateLimits,
          [field]: value
        }
      });
    }
  };

  const handleFeatureToggle = (feature: string) => {
    if (settings) {
      setSettings({
        ...settings,
        features: {
          ...settings.features,
          [feature]: !settings.features[feature as keyof typeof settings.features]
        }
      });
    }
  };

  if (isLoading || !settings) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate Limits
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Messages per Minute: {settings.rateLimits.messagePerMinute}
                </Typography>
                <Slider
                  value={settings.rateLimits.messagePerMinute}
                  onChange={(_, value) => handleRateLimitChange('messagePerMinute', value as number)}
                  min={1}
                  max={60}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Tokens per Day: {settings.rateLimits.tokensPerDay.toLocaleString()}
                </Typography>
                <Slider
                  value={settings.rateLimits.tokensPerDay}
                  onChange={(_, value) => handleRateLimitChange('tokensPerDay', value as number)}
                  min={1000}
                  max={1000000}
                  step={1000}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Concurrent Requests: {settings.rateLimits.concurrentRequests}
                </Typography>
                <Slider
                  value={settings.rateLimits.concurrentRequests}
                  onChange={(_, value) => handleRateLimitChange('concurrentRequests', value as number)}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features.registration}
                    onChange={() => handleFeatureToggle('registration')}
                  />
                }
                label="User Registration"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features.socialLogin}
                    onChange={() => handleFeatureToggle('socialLogin')}
                  />
                }
                label="Social Login"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features.fileUpload}
                    onChange={() => handleFeatureToggle('fileUpload')}
                  />
                }
                label="File Upload"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features.plugins}
                    onChange={() => handleFeatureToggle('plugins')}
                  />
                }
                label="Plugins"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Models
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    OpenAI Models
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={settings.models.openai.join('\n')}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        models: {
                          ...settings.models,
                          openai: e.target.value.split('\n').filter(m => m.trim())
                        }
                      });
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Anthropic Models
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={settings.models.anthropic.join('\n')}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        models: {
                          ...settings.models,
                          anthropic: e.target.value.split('\n').filter(m => m.trim())
                        }
                      });
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Google Models
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={settings.models.google.join('\n')}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        models: {
                          ...settings.models,
                          google: e.target.value.split('\n').filter(m => m.trim())
                        }
                      });
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;