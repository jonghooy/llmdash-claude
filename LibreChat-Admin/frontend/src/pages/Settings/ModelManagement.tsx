import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Tabs,
  Tab,
  FormGroup,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings,
  ModelTraining,
  ContentCopy,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/axios';

interface Model {
  _id?: string;
  modelId: string;
  modelName: string;
  provider: string;
  enabled: boolean;
  defaultEnabled: boolean;
  userSelectable: boolean;
  maxTokens?: number;
  contextWindow?: number;
  description?: string;
  capabilities?: {
    vision?: boolean;
    functionCalling?: boolean;
    streaming?: boolean;
    plugins?: boolean;
  };
  pricing?: {
    inputCost?: number;
    outputCost?: number;
    unit?: string;
  };
  restrictions?: {
    organizations?: string[];
    teams?: string[];
    users?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ModelManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<Partial<Model>>({
    modelId: '',
    modelName: '',
    provider: '',
    enabled: true,
    defaultEnabled: false,
    userSelectable: true,
    capabilities: {
      vision: false,
      functionCalling: false,
      streaming: true,
      plugins: false
    }
  });

  const providers = [
    'openai',
    'anthropic',
    'google',
    'azure',
    'custom',
    'bedrock',
    'cohere',
    'mistral',
    'groq',
    'perplexity'
  ];

  // Fetch registered models
  const { data: modelsData, isLoading } = useQuery({
    queryKey: ['registeredModels'],
    queryFn: async () => {
      const response = await axios.get('/api/model-registry');
      return response.data;
    }
  });

  // Create/Update model mutation
  const saveModelMutation = useMutation({
    mutationFn: async (data: Partial<Model>) => {
      if (selectedModel?._id) {
        return axios.put(`/api/model-registry/${selectedModel._id}`, data);
      } else {
        return axios.post('/api/model-registry', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredModels'] });
      handleCloseDialog();
    }
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/model-registry/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredModels'] });
    }
  });

  // Toggle model enabled status
  const toggleModelMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return axios.patch(`/api/model-registry/${id}/toggle`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredModels'] });
    }
  });

  const handleOpenDialog = (model?: Model) => {
    if (model) {
      setSelectedModel(model);
      setFormData(model);
    } else {
      setSelectedModel(null);
      setFormData({
        modelId: '',
        modelName: '',
        provider: '',
        enabled: true,
        defaultEnabled: false,
        userSelectable: true,
        capabilities: {
          vision: false,
          functionCalling: false,
          streaming: true,
          plugins: false
        }
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedModel(null);
    setTabValue(0);
  };

  const handleSaveModel = () => {
    saveModelMutation.mutate(formData);
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      deleteModelMutation.mutate(id);
    }
  };

  const handleToggleModel = (id: string, enabled: boolean) => {
    toggleModelMutation.mutate({ id, enabled });
  };

  const groupedModels = modelsData?.data?.reduce((acc: any, model: Model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {}) || {};

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Model Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Register Model
        </Button>
      </Box>

      {/* Model Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Models
              </Typography>
              <Typography variant="h4">
                {modelsData?.data?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Enabled Models
              </Typography>
              <Typography variant="h4">
                {modelsData?.data?.filter((m: Model) => m.enabled).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Providers
              </Typography>
              <Typography variant="h4">
                {Object.keys(groupedModels).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Default Models
              </Typography>
              <Typography variant="h4">
                {modelsData?.data?.filter((m: Model) => m.defaultEnabled).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Models Table by Provider */}
      {Object.entries(groupedModels).map(([provider, models]: [string, any]) => (
        <Card key={provider} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
              {provider} Models
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Model ID</TableCell>
                    <TableCell>Model Name</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Default</TableCell>
                    <TableCell align="center">User Select</TableCell>
                    <TableCell align="center">Capabilities</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map((model: Model) => (
                    <TableRow key={model._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {model.modelId}
                        </Typography>
                      </TableCell>
                      <TableCell>{model.modelName}</TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={model.enabled}
                          onChange={(e) => handleToggleModel(model._id!, e.target.checked)}
                          color={model.enabled ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {model.defaultEnabled ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="disabled" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {model.userSelectable ? (
                          <CheckCircle color="primary" fontSize="small" />
                        ) : (
                          <Cancel color="disabled" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {model.capabilities?.vision && (
                            <Tooltip title="Vision">
                              <Visibility fontSize="small" color="primary" />
                            </Tooltip>
                          )}
                          {model.capabilities?.functionCalling && (
                            <Tooltip title="Function Calling">
                              <Settings fontSize="small" color="primary" />
                            </Tooltip>
                          )}
                          {model.capabilities?.streaming && (
                            <Tooltip title="Streaming">
                              <ModelTraining fontSize="small" color="primary" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(model)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteModel(model._id!)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Model Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedModel ? 'Edit Model' : 'Register New Model'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Basic Info" />
            <Tab label="Capabilities" />
            <Tab label="Pricing" />
            <Tab label="Restrictions" />
          </Tabs>

          {tabValue === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model ID"
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  helperText="Unique identifier (e.g., gpt-4, claude-3-opus)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  helperText="Display name for users"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    label="Provider"
                  >
                    {providers.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Context Window"
                  type="number"
                  value={formData.contextWindow || ''}
                  onChange={(e) => setFormData({ ...formData, contextWindow: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      />
                    }
                    label="Enabled"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.defaultEnabled}
                        onChange={(e) => setFormData({ ...formData, defaultEnabled: e.target.checked })}
                      />
                    }
                    label="Default Model"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.userSelectable}
                        onChange={(e) => setFormData({ ...formData, userSelectable: e.target.checked })}
                      />
                    }
                    label="User Selectable"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.capabilities?.vision || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, vision: e.target.checked }
                    })}
                  />
                }
                label="Vision (Image Input)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.capabilities?.functionCalling || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, functionCalling: e.target.checked }
                    })}
                  />
                }
                label="Function Calling"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.capabilities?.streaming || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, streaming: e.target.checked }
                    })}
                  />
                }
                label="Streaming Support"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.capabilities?.plugins || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, plugins: e.target.checked }
                    })}
                  />
                }
                label="Plugin Support"
              />
            </FormGroup>
          )}

          {tabValue === 2 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Input Cost"
                  type="number"
                  value={formData.pricing?.inputCost || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, inputCost: parseFloat(e.target.value) }
                  })}
                  helperText="Cost per 1M tokens"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Output Cost"
                  type="number"
                  value={formData.pricing?.outputCost || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, outputCost: parseFloat(e.target.value) }
                  })}
                  helperText="Cost per 1M tokens"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.pricing?.unit || '1M tokens'}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, unit: e.target.value }
                  })}
                  helperText="Default: 1M tokens"
                  disabled
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 3 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Model restrictions can be configured in the Model Permissions section after creation.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveModel} variant="contained">
            {selectedModel ? 'Update' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelManagementPage;