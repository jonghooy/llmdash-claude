import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  TextField,
  Button,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as EnabledIcon,
  Cancel as DisabledIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ModelPermission {
  modelId: string;
  provider: string;
  enabled: boolean;
  disabledReason?: string;
  restrictions?: {
    maxTokens?: number;
    maxRequestsPerDay?: number;
    allowedUsers?: string[];
    blockedUsers?: string[];
  };
  updatedAt?: string;
}

const ModelPermissions: React.FC = () => {
  const [permissions, setPermissions] = useState<ModelPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [disableDialog, setDisableDialog] = useState<{ open: boolean; modelId: string; modelName: string }>({
    open: false,
    modelId: '',
    modelName: ''
  });
  const [disableReason, setDisableReason] = useState('');

  // Model display names
  const modelNames: { [key: string]: string } = {
    'claude-opus-4-1-20250805': 'Claude Opus 4.1',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gpt-4.1': 'GPT-4.1',
    'gpt-5': 'GPT-5'
  };

  // Provider colors
  const providerColors: { [key: string]: string } = {
    anthropic: '#D97757',
    google: '#4285F4',
    openai: '#10A37F'
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Use full path for production
      const apiUrl = window.location.hostname === 'localhost' 
        ? '/api/model-permissions'
        : '/admin/api/model-permissions';
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
        
        // Count enabled/disabled models
        const enabledCount = data.filter((p: ModelPermission) => p.enabled).length;
        const disabledCount = data.length - enabledCount;
        
        setMessage({
          type: 'info',
          text: `${enabledCount} models enabled, ${disabledCount} models disabled`
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch model permissions' });
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setMessage({ type: 'error', text: 'Error loading model permissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (modelId: string, currentEnabled: boolean, provider: string) => {
    // If disabling, show dialog to get reason
    if (currentEnabled) {
      const modelName = modelNames[modelId] || modelId;
      setDisableDialog({ open: true, modelId, modelName });
      setDisableReason('');
      return;
    }
    
    // If enabling, proceed directly
    await updatePermission(modelId, true, '', provider);
  };

  const handleDisableConfirm = async () => {
    const { modelId } = disableDialog;
    const provider = permissions.find(p => p.modelId === modelId)?.provider || 'unknown';
    await updatePermission(modelId, false, disableReason, provider);
    setDisableDialog({ open: false, modelId: '', modelName: '' });
    setDisableReason('');
  };

  const updatePermission = async (modelId: string, enabled: boolean, reason: string, provider: string) => {
    try {
      // Use full path for production
      const apiUrl = window.location.hostname === 'localhost'
        ? `/api/model-permissions/${modelId}/toggle`
        : `/admin/api/model-permissions/${modelId}/toggle`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          disabledReason: reason,
          provider
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setPermissions(prev => prev.map(p => 
          p.modelId === modelId 
            ? { ...p, enabled, disabledReason: reason }
            : p
        ));
        
        setMessage({
          type: 'success',
          text: `${modelNames[modelId] || modelId} has been ${enabled ? 'enabled' : 'disabled'}`
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to update model permission' });
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      setMessage({ type: 'error', text: 'Error updating model permission' });
    }
  };

  const handleRefresh = () => {
    fetchPermissions();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Model Permissions
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
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

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Enable/Disable</TableCell>
                  <TableCell>Disabled Reason</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.modelId}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="500">
                        {modelNames[permission.modelId] || permission.modelId}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {permission.modelId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permission.provider}
                        size="small"
                        sx={{
                          backgroundColor: providerColors[permission.provider] + '20',
                          color: providerColors[permission.provider],
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {permission.enabled ? (
                        <Chip
                          icon={<EnabledIcon />}
                          label="Enabled"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<DisabledIcon />}
                          label="Disabled"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={permission.enabled}
                        onChange={() => handleToggle(
                          permission.modelId,
                          permission.enabled,
                          permission.provider
                        )}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      {!permission.enabled && permission.disabledReason ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="warning" fontSize="small" />
                          <Typography variant="body2" color="textSecondary">
                            {permission.disabledReason}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Advanced Settings (Coming Soon)">
                        <span>
                          <IconButton size="small" disabled>
                            <SettingsIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" color="info" />
            <Typography variant="subtitle2" color="textSecondary">
              About Model Permissions
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Control which AI models are available to users in LibreChat. Disabled models will not appear
            in the model selection dropdown. You can disable models temporarily for maintenance or
            permanently if they are no longer needed.
          </Typography>
        </Box>
      </Paper>

      {/* Disable Reason Dialog */}
      <Dialog
        open={disableDialog.open}
        onClose={() => setDisableDialog({ open: false, modelId: '', modelName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Disable {disableDialog.modelName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please provide a reason for disabling this model (optional):
          </Typography>
          <TextField
            fullWidth
            label="Reason for disabling"
            value={disableReason}
            onChange={(e) => setDisableReason(e.target.value)}
            placeholder="e.g., Maintenance, Cost reduction, Performance issues..."
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDisableDialog({ open: false, modelId: '', modelName: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDisableConfirm}
            variant="contained"
            color="error"
          >
            Disable Model
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelPermissions;