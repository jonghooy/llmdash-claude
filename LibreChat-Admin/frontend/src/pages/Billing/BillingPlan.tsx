import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Star,
  TrendingUp,
  Speed,
  Security,
  Support,
  CloudUpload,
  Group,
  Api,
  Storage,
  Timeline,
  CreditCard,
  Info,
  Warning,
  Upgrade,
  Download,
  Email,
} from '@mui/icons-material';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeature[];
  recommended?: boolean;
  maxUsers: number;
  maxTokens: number;
  maxModels: number;
  support: string;
}

const BillingPlan: React.FC = () => {
  const [currentPlan] = useState({
    name: 'Professional',
    price: 99,
    billingCycle: 'monthly' as const,
    renewalDate: '2024-02-15',
    status: 'active',
    seats: 10,
    usedSeats: 7,
    tokens: 1000000,
    usedTokens: 650000,
    storage: 100,
    usedStorage: 45,
  });

  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [addSeatsDialog, setAddSeatsDialog] = useState(false);
  const [additionalSeats, setAdditionalSeats] = useState(1);

  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingCycle === 'monthly' ? 29 : 290,
      billingCycle,
      maxUsers: 5,
      maxTokens: 100000,
      maxModels: 3,
      support: 'Email',
      features: [
        { name: 'Basic AI Models', included: true },
        { name: 'Chat History (30 days)', included: true },
        { name: 'File Upload (10MB)', included: true },
        { name: 'API Access', included: false },
        { name: 'Custom Prompts', included: false },
        { name: 'Team Collaboration', included: false },
        { name: 'Analytics Dashboard', included: false },
        { name: 'Priority Support', included: false },
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'monthly' ? 99 : 990,
      billingCycle,
      maxUsers: 50,
      maxTokens: 1000000,
      maxModels: 10,
      support: 'Email + Chat',
      recommended: true,
      features: [
        { name: 'All AI Models', included: true },
        { name: 'Unlimited Chat History', included: true },
        { name: 'File Upload (100MB)', included: true },
        { name: 'API Access', included: true, limit: '10,000 calls/month' },
        { name: 'Custom Prompts', included: true },
        { name: 'Team Collaboration', included: true },
        { name: 'Analytics Dashboard', included: true },
        { name: 'Priority Support', included: false },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? 499 : 4990,
      billingCycle,
      maxUsers: 999,
      maxTokens: 10000000,
      maxModels: 999,
      support: '24/7 Dedicated',
      features: [
        { name: 'All AI Models + Custom', included: true },
        { name: 'Unlimited Chat History', included: true },
        { name: 'File Upload (Unlimited)', included: true },
        { name: 'API Access', included: true, limit: 'Unlimited' },
        { name: 'Custom Prompts', included: true },
        { name: 'Team Collaboration', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Priority Support', included: true },
        { name: 'SSO/SAML', included: true },
        { name: 'Custom Integration', included: true },
        { name: 'SLA Guarantee', included: true },
        { name: 'Dedicated Account Manager', included: true },
      ],
    },
  ];

  const usagePercentage = (used: number, total: number) => (used / total) * 100;

  const handleUpgrade = () => {
    setUpgradeDialog(false);
    // Implement upgrade logic
  };

  const handleCancel = () => {
    setCancelDialog(false);
    // Implement cancellation logic
  };

  const handleAddSeats = () => {
    setAddSeatsDialog(false);
    // Implement add seats logic
  };

  return (
    <Box>
      {/* Current Plan Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Current Subscription
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" color="primary">
                      {currentPlan.name}
                    </Typography>
                    <Chip
                      label={currentPlan.status.toUpperCase()}
                      color="success"
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Renews on {currentPlan.renewalDate}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CreditCard />}
                    onClick={() => {}}
                  >
                    Update Payment
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Upgrade />}
                    onClick={() => setUpgradeDialog(true)}
                  >
                    Upgrade Plan
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Team Seats
                      </Typography>
                      <Typography variant="body2">
                        {currentPlan.usedSeats} / {currentPlan.seats}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={usagePercentage(currentPlan.usedSeats, currentPlan.seats)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => setAddSeatsDialog(true)}
                    >
                      Add More Seats
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Token Usage
                      </Typography>
                      <Typography variant="body2">
                        {(currentPlan.usedTokens / 1000).toFixed(0)}k / {(currentPlan.tokens / 1000).toFixed(0)}k
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={usagePercentage(currentPlan.usedTokens, currentPlan.tokens)}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={usagePercentage(currentPlan.usedTokens, currentPlan.tokens) > 80 ? 'warning' : 'primary'}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Storage
                      </Typography>
                      <Typography variant="body2">
                        {currentPlan.usedStorage} GB / {currentPlan.storage} GB
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={usagePercentage(currentPlan.usedStorage, currentPlan.storage)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" />
                  <Typography variant="body2">
                    You're using 65% of your token quota. Consider upgrading to Enterprise for unlimited tokens.
                  </Typography>
                  <Button size="small" sx={{ ml: 'auto' }}>
                    View Usage Details
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pricing Plans */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Available Plans
          </Typography>
          <FormControl size="small">
            <Select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
            >
              <MenuItem value="monthly">Monthly Billing</MenuItem>
              <MenuItem value="yearly">
                Yearly Billing (Save 20%)
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: plan.recommended ? 2 : 1,
                  borderColor: plan.recommended ? 'primary.main' : 'divider',
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Star fontSize="small" />
                    <Typography variant="caption" fontWeight="bold">
                      RECOMMENDED
                    </Typography>
                  </Box>
                )}

                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                    {plan.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" component="span">
                      ${plan.price}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Group fontSize="small" />
                      <Typography variant="body2">
                        Up to {plan.maxUsers} users
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Api fontSize="small" />
                      <Typography variant="body2">
                        {(plan.maxTokens / 1000).toFixed(0)}k tokens/month
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Storage fontSize="small" />
                      <Typography variant="body2">
                        {plan.maxModels} AI models
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Support fontSize="small" />
                      <Typography variant="body2">
                        {plan.support} support
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {feature.included ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="disabled" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              color={feature.included ? 'text.primary' : 'text.disabled'}
                            >
                              {feature.name}
                              {feature.limit && (
                                <Typography variant="caption" color="text.secondary">
                                  {' '}({feature.limit})
                                </Typography>
                              )}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    fullWidth
                    variant={plan.id === currentPlan.name.toLowerCase() ? 'outlined' : 'contained'}
                    disabled={plan.id === currentPlan.name.toLowerCase()}
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setUpgradeDialog(true);
                    }}
                  >
                    {plan.id === currentPlan.name.toLowerCase() ? 'Current Plan' :
                     plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Billing History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Billing History
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>2024-01-15</TableCell>
                <TableCell>Professional Plan - Monthly</TableCell>
                <TableCell>$99.00</TableCell>
                <TableCell>
                  <Chip label="Paid" color="success" size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Download fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2023-12-15</TableCell>
                <TableCell>Professional Plan - Monthly</TableCell>
                <TableCell>$99.00</TableCell>
                <TableCell>
                  <Chip label="Paid" color="success" size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Download fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upgrade Your Plan</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You're upgrading from Professional to {selectedPlan}. The change will take effect immediately.
          </Alert>
          <Typography variant="body2" paragraph>
            Your new billing amount will be prorated for the current billing period.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpgrade}>
            Confirm Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription? You'll lose access to premium features.
          </Alert>
          <Typography variant="body2" paragraph>
            Your subscription will remain active until {currentPlan.renewalDate}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Keep Subscription</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Seats Dialog */}
      <Dialog open={addSeatsDialog} onClose={() => setAddSeatsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add More Seats</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Add more team seats to your subscription. Each additional seat costs $15/month.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Number of Seats"
            value={additionalSeats}
            onChange={(e) => setAdditionalSeats(parseInt(e.target.value))}
            inputProps={{ min: 1, max: 10 }}
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              Additional cost: ${additionalSeats * 15}/month
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSeatsDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSeats}>
            Add Seats
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingPlan;