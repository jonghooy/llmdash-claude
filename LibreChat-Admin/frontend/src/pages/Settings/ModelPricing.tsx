import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Skeleton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelPricingAPI } from '../../utils/axios';

interface ModelPricing {
  _id: string;
  modelId: string;
  modelName: string;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
    image: number;
    audio: number;
    video: number;
    currency: string;
    unit: string;
    lastUpdated: string;
  };
  quotas: {
    dailyLimit: number | null;
    monthlyLimit: number | null;
    perUserLimit: number | null;
    rateLimitRpm: number | null;
    rateLimitTpm: number | null;
  };
  features: {
    tier: string;
    supportLevel: string;
    slaUptime: number;
  };
  status: string;
  billingConfig: {
    minimumBill: number;
    freeUsageLimit: number;
    billingCycle: string;
  };
  discounts: Array<{
    type: string;
    threshold: number;
    discount: number;
    validUntil: Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PricingFormData {
  modelId: string;
  modelName: string;
  provider: string;
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    audio: string;
    video: string;
    currency: string;
    unit: string;
  };
  quotas: {
    dailyLimit: string;
    monthlyLimit: string;
    perUserLimit: string;
    rateLimitRpm: string;
    rateLimitTpm: string;
  };
  features: {
    tier: string;
    supportLevel: string;
    slaUptime: string;
  };
  status: string;
  billingConfig: {
    minimumBill: string;
    freeUsageLimit: string;
    billingCycle: string;
  };
}

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'KRW'];
const UNITS = ['1M tokens', '1K tokens', 'per message', 'per hour'];
const TIERS = ['free', 'basic', 'premium', 'enterprise'];
const SUPPORT_LEVELS = ['community', 'standard', 'priority'];
const STATUSES = ['active', 'deprecated', 'beta', 'maintenance'];
const BILLING_CYCLES = ['hourly', 'daily', 'weekly', 'monthly'];

const ModelPricing: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPricing, setEditingPricing] = useState<ModelPricing | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<PricingFormData>({
    modelId: '',
    modelName: '',
    provider: 'openai',
    pricing: {
      prompt: '0',
      completion: '0',
      image: '0',
      audio: '0',
      video: '0',
      currency: 'USD',
      unit: '1M tokens'
    },
    quotas: {
      dailyLimit: '',
      monthlyLimit: '',
      perUserLimit: '',
      rateLimitRpm: '',
      rateLimitTpm: ''
    },
    features: {
      tier: 'basic',
      supportLevel: 'standard',
      slaUptime: '99.9'
    },
    status: 'active',
    billingConfig: {
      minimumBill: '0',
      freeUsageLimit: '0',
      billingCycle: 'monthly'
    }
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const queryClient = useQueryClient();

  // Query for fetching model pricing entries
  const { 
    data: pricingData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['model-pricing'],
    queryFn: async () => {
      const response = await modelPricingAPI.getAll();
      return response.data;
    },
    staleTime: 30000,
  });

  // Query for pricing statistics
  const { data: statsData } = useQuery({
    queryKey: ['model-pricing-stats'],
    queryFn: async () => {
      const response = await modelPricingAPI.getStats();
      return response.data;
    },
    staleTime: 60000,
  });

  // Mutation for creating/updating pricing
  const pricingMutation = useMutation({
    mutationFn: async ({ isEditing, data }: { isEditing: boolean; data: any }) => {
      if (isEditing && editingPricing) {
        return await modelPricingAPI.update(editingPricing._id, data);
      } else {
        return await modelPricingAPI.create(data);
      }
    },
    onSuccess: (response, { isEditing }) => {
      queryClient.invalidateQueries({ queryKey: ['model-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['model-pricing-stats'] });
      setOpenDialog(false);
      setEditingPricing(null);
      resetForm();
      showSnackbar(
        `Pricing ${isEditing ? 'updated' : 'created'} successfully!`,
        'success'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to save pricing';
      showSnackbar(message, 'error');
    }
  });

  // Mutation for deleting pricing
  const deleteMutation = useMutation({
    mutationFn: (id: string) => modelPricingAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['model-pricing-stats'] });
      showSnackbar('Pricing deleted successfully!', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete pricing';
      showSnackbar(message, 'error');
    }
  });

  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      modelPricingAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['model-pricing-stats'] });
      showSnackbar('Status updated successfully!', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update status';
      showSnackbar(message, 'error');
    }
  });

  const pricings = pricingData?.data || [];
  const stats = statsData?.data?.summary || {};

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      modelId: '',
      modelName: '',
      provider: 'openai',
      pricing: {
        prompt: '0',
        completion: '0',
        image: '0',
        audio: '0',
        video: '0',
        currency: 'USD',
        unit: '1M tokens'
      },
      quotas: {
        dailyLimit: '',
        monthlyLimit: '',
        perUserLimit: '',
        rateLimitRpm: '',
        rateLimitTpm: ''
      },
      features: {
        tier: 'basic',
        supportLevel: 'standard',
        slaUptime: '99.9'
      },
      status: 'active',
      billingConfig: {
        minimumBill: '0',
        freeUsageLimit: '0',
        billingCycle: 'monthly'
      }
    });
    setTabValue(0);
  };

  const handleOpenDialog = (pricing?: ModelPricing) => {
    if (pricing) {
      setEditingPricing(pricing);
      setFormData({
        modelId: pricing.modelId,
        modelName: pricing.modelName,
        provider: pricing.provider,
        pricing: {
          prompt: pricing.pricing.prompt.toString(),
          completion: pricing.pricing.completion.toString(),
          image: pricing.pricing.image.toString(),
          audio: pricing.pricing.audio.toString(),
          video: pricing.pricing.video.toString(),
          currency: pricing.pricing.currency,
          unit: pricing.pricing.unit
        },
        quotas: {
          dailyLimit: pricing.quotas.dailyLimit?.toString() || '',
          monthlyLimit: pricing.quotas.monthlyLimit?.toString() || '',
          perUserLimit: pricing.quotas.perUserLimit?.toString() || '',
          rateLimitRpm: pricing.quotas.rateLimitRpm?.toString() || '',
          rateLimitTpm: pricing.quotas.rateLimitTpm?.toString() || ''
        },
        features: {
          tier: pricing.features.tier,
          supportLevel: pricing.features.supportLevel,
          slaUptime: pricing.features.slaUptime.toString()
        },
        status: pricing.status,
        billingConfig: {
          minimumBill: pricing.billingConfig.minimumBill.toString(),
          freeUsageLimit: pricing.billingConfig.freeUsageLimit.toString(),
          billingCycle: pricing.billingConfig.billingCycle
        }
      });
    } else {
      setEditingPricing(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    // Convert form data to API format
    const apiData = {
      ...formData,
      pricing: {
        ...formData.pricing,
        prompt: parseFloat(formData.pricing.prompt),
        completion: parseFloat(formData.pricing.completion),
        image: parseFloat(formData.pricing.image),
        audio: parseFloat(formData.pricing.audio),
        video: parseFloat(formData.pricing.video)
      },
      quotas: {
        dailyLimit: formData.quotas.dailyLimit ? parseInt(formData.quotas.dailyLimit) : null,
        monthlyLimit: formData.quotas.monthlyLimit ? parseInt(formData.quotas.monthlyLimit) : null,
        perUserLimit: formData.quotas.perUserLimit ? parseInt(formData.quotas.perUserLimit) : null,
        rateLimitRpm: formData.quotas.rateLimitRpm ? parseInt(formData.quotas.rateLimitRpm) : null,
        rateLimitTpm: formData.quotas.rateLimitTpm ? parseInt(formData.quotas.rateLimitTpm) : null
      },
      features: {
        ...formData.features,
        slaUptime: parseFloat(formData.features.slaUptime)
      },
      billingConfig: {
        ...formData.billingConfig,
        minimumBill: parseFloat(formData.billingConfig.minimumBill),
        freeUsageLimit: parseFloat(formData.billingConfig.freeUsageLimit)
      }
    };

    pricingMutation.mutate({
      isEditing: !!editingPricing,
      data: apiData
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this pricing entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      active: 'success',
      deprecated: 'warning',
      beta: 'info',
      maintenance: 'error'
    };
    return colors[status] || 'default';
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, any> = {
      free: 'default',
      basic: 'primary',
      premium: 'secondary',
      enterprise: 'error'
    };
    return colors[tier] || 'default';
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, any> = {
      openai: 'primary',
      anthropic: 'secondary',
      google: 'warning',
      mistral: 'info',
      cohere: 'error',
      other: 'default'
    };
    return colors[provider] || 'default';
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(6)} ${currency}`;
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }>
          Failed to load model pricing: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Model Pricing
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Pricing
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Models
              </Typography>
              <Typography variant="h4">
                {isLoading ? <Skeleton width={60} /> : stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Models
              </Typography>
              <Typography variant="h4" color="success.main">
                {isLoading ? <Skeleton width={60} /> : stats.active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Prompt Price
              </Typography>
              <Typography variant="h6" color="primary.main">
                {isLoading ? (
                  <Skeleton width={80} />
                ) : (
                  `${(stats.avgPromptPrice || 0).toFixed(6)} USD`
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Completion Price
              </Typography>
              <Typography variant="h6" color="secondary.main">
                {isLoading ? (
                  <Skeleton width={80} />
                ) : (
                  `${(stats.avgCompletionPrice || 0).toFixed(6)} USD`
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pricing Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Prompt Price</TableCell>
                <TableCell>Completion Price</TableCell>
                <TableCell>Rate Limits</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pricings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1" color="textSecondary">
                      No pricing entries found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pricings.map((pricing: ModelPricing) => (
                  <TableRow key={pricing._id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {pricing.modelName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" fontFamily="monospace">
                        {pricing.modelId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pricing.provider}
                        color={getProviderColor(pricing.provider)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pricing.status}
                        color={getStatusColor(pricing.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pricing.features.tier}
                        color={getTierColor(pricing.features.tier)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatPrice(pricing.pricing.prompt, pricing.pricing.currency)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        per {pricing.pricing.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatPrice(pricing.pricing.completion, pricing.pricing.currency)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        per {pricing.pricing.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {pricing.quotas.rateLimitRpm && (
                          <Typography variant="caption" display="block">
                            {pricing.quotas.rateLimitRpm} RPM
                          </Typography>
                        )}
                        {pricing.quotas.rateLimitTpm && (
                          <Typography variant="caption" display="block">
                            {pricing.quotas.rateLimitTpm.toLocaleString()} TPM
                          </Typography>
                        )}
                        {!pricing.quotas.rateLimitRpm && !pricing.quotas.rateLimitTpm && (
                          <Typography variant="caption" color="textSecondary">
                            No limits
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(pricing.pricing.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(pricing)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(pricing._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Pricing Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingPricing ? 'Edit Model Pricing' : 'Add New Model Pricing'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="Pricing" />
              <Tab label="Quotas & Limits" />
              <Tab label="Features & Billing" />
            </Tabs>

            {/* Tab 0: Basic Info */}
            {tabValue === 0 && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Model ID"
                      value={formData.modelId}
                      onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                      required
                      disabled={!!editingPricing}
                      helperText={editingPricing ? 'Model ID cannot be changed' : 'Unique identifier for the model'}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Model Name"
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Provider</InputLabel>
                      <Select
                        value={formData.provider}
                        label="Provider"
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      >
                        {PROVIDERS.map(provider => (
                          <MenuItem key={provider} value={provider}>
                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        {STATUSES.map(status => (
                          <MenuItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 1: Pricing */}
            {tabValue === 1 && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prompt Price"
                      type="number"
                      inputProps={{ step: "0.000001" }}
                      value={formData.pricing.prompt}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { ...formData.pricing, prompt: e.target.value }
                      })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Completion Price"
                      type="number"
                      inputProps={{ step: "0.000001" }}
                      value={formData.pricing.completion}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { ...formData.pricing, completion: e.target.value }
                      })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Image Price"
                      type="number"
                      inputProps={{ step: "0.000001" }}
                      value={formData.pricing.image}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { ...formData.pricing, image: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Audio Price"
                      type="number"
                      inputProps={{ step: "0.000001" }}
                      value={formData.pricing.audio}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { ...formData.pricing, audio: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Video Price"
                      type="number"
                      inputProps={{ step: "0.000001" }}
                      value={formData.pricing.video}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pricing: { ...formData.pricing, video: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.pricing.currency}
                        label="Currency"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, currency: e.target.value }
                        })}
                      >
                        {CURRENCIES.map(currency => (
                          <MenuItem key={currency} value={currency}>
                            {currency}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={formData.pricing.unit}
                        label="Unit"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, unit: e.target.value }
                        })}
                      >
                        {UNITS.map(unit => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 2: Quotas & Limits */}
            {tabValue === 2 && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Daily Limit"
                      type="number"
                      value={formData.quotas.dailyLimit}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quotas: { ...formData.quotas, dailyLimit: e.target.value }
                      })}
                      helperText="Maximum usage per day"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monthly Limit"
                      type="number"
                      value={formData.quotas.monthlyLimit}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quotas: { ...formData.quotas, monthlyLimit: e.target.value }
                      })}
                      helperText="Maximum usage per month"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Per User Limit"
                      type="number"
                      value={formData.quotas.perUserLimit}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quotas: { ...formData.quotas, perUserLimit: e.target.value }
                      })}
                      helperText="Maximum usage per user"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rate Limit (RPM)"
                      type="number"
                      value={formData.quotas.rateLimitRpm}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quotas: { ...formData.quotas, rateLimitRpm: e.target.value }
                      })}
                      helperText="Requests per minute"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Token Rate Limit (TPM)"
                      type="number"
                      value={formData.quotas.rateLimitTpm}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quotas: { ...formData.quotas, rateLimitTpm: e.target.value }
                      })}
                      helperText="Tokens per minute"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 3: Features & Billing */}
            {tabValue === 3 && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Tier</InputLabel>
                      <Select
                        value={formData.features.tier}
                        label="Tier"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, tier: e.target.value }
                        })}
                      >
                        {TIERS.map(tier => (
                          <MenuItem key={tier} value={tier}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Support Level</InputLabel>
                      <Select
                        value={formData.features.supportLevel}
                        label="Support Level"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, supportLevel: e.target.value }
                        })}
                      >
                        {SUPPORT_LEVELS.map(level => (
                          <MenuItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="SLA Uptime (%)"
                      type="number"
                      inputProps={{ step: "0.1", min: "0", max: "100" }}
                      value={formData.features.slaUptime}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        features: { ...formData.features, slaUptime: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Minimum Bill"
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={formData.billingConfig.minimumBill}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingConfig: { ...formData.billingConfig, minimumBill: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Free Usage Limit"
                      type="number"
                      value={formData.billingConfig.freeUsageLimit}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingConfig: { ...formData.billingConfig, freeUsageLimit: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Billing Cycle</InputLabel>
                      <Select
                        value={formData.billingConfig.billingCycle}
                        label="Billing Cycle"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          billingConfig: { ...formData.billingConfig, billingCycle: e.target.value }
                        })}
                      >
                        {BILLING_CYCLES.map(cycle => (
                          <MenuItem key={cycle} value={cycle}>
                            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={pricingMutation.isPending || !formData.modelId || !formData.modelName}
          >
            {pricingMutation.isPending ? 'Saving...' : (editingPricing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModelPricing;