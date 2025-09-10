import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Science as TestIcon,
  Save as SaveIcon
} from '@mui/icons-material';

interface ApiKeyData {
  provider: string;
  displayKey: string;
  isValid: boolean;
  lastTested?: string;
  testResult?: string;
  enabled?: boolean;
}

interface ApiKeyInput {
  openai: string;
  google: string;
  anthropic: string;
}

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [inputKeys, setInputKeys] = useState<ApiKeyInput>({
    openai: '',
    google: '',
    anthropic: ''
  });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    openai: false,
    google: false,
    anthropic: false
  });
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({
    openai: false,
    google: false,
    anthropic: false
  });
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({
    openai: false,
    google: false,
    anthropic: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const providerInfo = {
    openai: {
      name: 'OpenAI',
      color: '#10A37F',
      description: 'GPT-4, GPT-4.1, GPT-5 models',
      docsUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...'
    },
    google: {
      name: 'Google AI',
      color: '#4285F4',
      description: 'Gemini Pro, Gemini Flash models',
      docsUrl: 'https://makersuite.google.com/app/apikey',
      placeholder: 'AIza...'
    },
    anthropic: {
      name: 'Anthropic',
      color: '#D97757',
      description: 'Claude 3 Opus, Sonnet, Haiku models',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      placeholder: 'sk-ant-...'
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? '/api/api-keys'
        : '/admin/api/api-keys';
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch API keys' });
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setMessage({ type: 'error', text: 'Error loading API keys' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (provider: string, value: string) => {
    setInputKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSave = async (provider: string) => {
    const apiKey = inputKeys[provider as keyof ApiKeyInput];
    
    if (!apiKey) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }
    
    setSaving({ ...saving, [provider]: true });
    
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? '/api/api-keys'
        : '/admin/api/api-keys';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          apiKey
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
        
        // Update local state
        setApiKeys(prev => prev.map(k => 
          k.provider === provider 
            ? { ...k, displayKey: result.data.displayKey, isValid: false }
            : k
        ));
        
        // Clear input
        setInputKeys(prev => ({ ...prev, [provider]: '' }));
      } else {
        setMessage({ type: 'error', text: 'Failed to save API key' });
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: 'Error saving API key' });
    } finally {
      setSaving({ ...saving, [provider]: false });
    }
  };

  const handleTest = async (provider: string) => {
    const apiKey = inputKeys[provider as keyof ApiKeyInput];
    const existingKey = apiKeys.find(k => k.provider === provider);
    
    if (!apiKey && (!existingKey || existingKey.displayKey === 'Not configured')) {
      setMessage({ type: 'error', text: 'Please enter or save an API key first' });
      return;
    }
    
    setTesting({ ...testing, [provider]: true });
    
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? '/api/api-keys/test'
        : '/admin/api/api-keys/test';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || 'use-stored-key' // Backend will use stored key if this is placeholder
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.isValid) {
        setMessage({ type: 'success', text: result.message });
        
        // Update validation status
        setApiKeys(prev => prev.map(k => 
          k.provider === provider 
            ? { ...k, isValid: true, testResult: result.message }
            : k
        ));
      } else {
        setMessage({ type: 'error', text: result.message });
        
        // Update validation status
        setApiKeys(prev => prev.map(k => 
          k.provider === provider 
            ? { ...k, isValid: false, testResult: result.message }
            : k
        ));
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setMessage({ type: 'error', text: 'Error testing API key' });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete the ${providerInfo[provider as keyof typeof providerInfo].name} API key?`)) {
      return;
    }
    
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? `/api/api-keys/${provider}`
        : `/admin/api/api-keys/${provider}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${providerInfo[provider as keyof typeof providerInfo].name} API key deleted` });
        
        // Update local state
        setApiKeys(prev => prev.map(k => 
          k.provider === provider 
            ? { ...k, displayKey: 'Not configured', isValid: false }
            : k
        ));
      } else {
        setMessage({ type: 'error', text: 'Failed to delete API key' });
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      setMessage({ type: 'error', text: 'Error deleting API key' });
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'info', text: 'API key copied to clipboard' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          API Keys Management
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchApiKeys}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {Object.entries(providerInfo).map(([provider, info]) => {
            const keyData = apiKeys.find(k => k.provider === provider) || {
              provider,
              displayKey: 'Not configured',
              isValid: false
            };
            
            return (
              <Grid item xs={12} md={4} key={provider}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: info.color,
                          fontWeight: 600,
                          flex: 1
                        }}
                      >
                        {info.name}
                      </Typography>
                      {keyData.isValid ? (
                        <Tooltip title="API key is valid">
                          <ValidIcon color="success" />
                        </Tooltip>
                      ) : keyData.displayKey !== 'Not configured' ? (
                        <Tooltip title="API key not validated">
                          <WarningIcon color="warning" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="No API key configured">
                          <InvalidIcon color="error" />
                        </Tooltip>
                      )}
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {info.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        Current Key:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip
                          label={keyData.displayKey}
                          size="small"
                          variant={keyData.displayKey !== 'Not configured' ? 'filled' : 'outlined'}
                          color={keyData.isValid ? 'success' : 'default'}
                        />
                        {keyData.displayKey !== 'Not configured' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(provider)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      type={showKeys[provider] ? 'text' : 'password'}
                      placeholder={info.placeholder}
                      value={inputKeys[provider as keyof ApiKeyInput]}
                      onChange={(e) => handleInputChange(provider, e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => toggleShowKey(provider)}
                              edge="end"
                            >
                              {showKeys[provider] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={saving[provider] ? <CircularProgress size={16} /> : <SaveIcon />}
                        onClick={() => handleSave(provider)}
                        disabled={!inputKeys[provider as keyof ApiKeyInput] || saving[provider]}
                        sx={{ flex: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={testing[provider] ? <CircularProgress size={16} /> : <TestIcon />}
                        onClick={() => handleTest(provider)}
                        disabled={testing[provider]}
                        sx={{ flex: 1 }}
                      >
                        Test
                      </Button>
                    </Box>

                    {keyData.testResult && (
                      <Alert 
                        severity={keyData.isValid ? 'success' : 'error'} 
                        sx={{ mt: 2 }}
                        onClose={() => {
                          setApiKeys(prev => prev.map(k => 
                            k.provider === provider 
                              ? { ...k, testResult: undefined }
                              : k
                          ));
                        }}
                      >
                        <Typography variant="caption">
                          {keyData.testResult}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      href={info.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get API Key
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Paper sx={{ mt: 3, p: 2, backgroundColor: 'action.hover' }}>
        <Typography variant="subtitle2" gutterBottom>
          Security Notes
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • API keys are encrypted before storage in the database<br/>
          • Keys are never displayed in full after saving<br/>
          • Test your keys regularly to ensure they remain valid<br/>
          • Delete unused keys to maintain security
        </Typography>
      </Paper>
    </Box>
  );
};

export default ApiKeys;