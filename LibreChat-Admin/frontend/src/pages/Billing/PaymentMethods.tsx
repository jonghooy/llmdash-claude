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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormGroup,
  Tooltip,
} from '@mui/material';
import {
  CreditCard,
  Add,
  Delete,
  Edit,
  Check,
  Warning,
  AccountBalance,
  Payment,
  Security,
  Star,
  StarBorder,
  Info,
  VerifiedUser,
  LocalAtm,
  QrCode,
  Apple,
  Google,
} from '@mui/icons-material';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal' | 'other';
  name: string;
  details: string;
  isDefault: boolean;
  expiryDate?: string;
  status: 'active' | 'expired' | 'invalid';
  lastUsed?: string;
  brand?: string;
}

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 1234',
      details: '**** **** **** 1234',
      isDefault: true,
      expiryDate: '12/2025',
      status: 'active',
      lastUsed: '2024-01-15',
      brand: 'visa',
    },
    {
      id: '2',
      type: 'card',
      name: 'Mastercard ending in 5678',
      details: '**** **** **** 5678',
      isDefault: false,
      expiryDate: '08/2024',
      status: 'active',
      lastUsed: '2023-11-20',
      brand: 'mastercard',
    },
    {
      id: '3',
      type: 'bank',
      name: 'Chase Business Account',
      details: 'Account ending in 9012',
      isDefault: false,
      status: 'active',
      lastUsed: '2023-10-15',
    },
  ]);

  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentType, setPaymentType] = useState<'card' | 'bank' | 'paypal'>('card');
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [backupPaymentEnabled, setBackupPaymentEnabled] = useState(true);

  // Form fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const handleAddPaymentMethod = () => {
    // Implement add payment method logic
    setAddDialog(false);
  };

  const handleEditPaymentMethod = () => {
    // Implement edit payment method logic
    setEditDialog(false);
  };

  const handleDeletePaymentMethod = () => {
    if (selectedMethod) {
      setPaymentMethods(methods => methods.filter(m => m.id !== selectedMethod.id));
    }
    setDeleteDialog(false);
  };

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
  };

  const getCardIcon = (brand?: string) => {
    switch (brand) {
      case 'visa':
        return <CreditCard sx={{ color: '#1A1F71' }} />;
      case 'mastercard':
        return <CreditCard sx={{ color: '#EB001B' }} />;
      case 'amex':
        return <CreditCard sx={{ color: '#006FCF' }} />;
      default:
        return <CreditCard />;
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard />;
      case 'bank':
        return <AccountBalance />;
      case 'paypal':
        return <Payment />;
      default:
        return <Payment />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Payment Methods</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialog(true)}
        >
          Add Payment Method
        </Button>
      </Box>

      {/* Payment Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Settings
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={autoPayEnabled}
                  onChange={(e) => setAutoPayEnabled(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography>Auto-pay enabled</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically charge your default payment method on the billing date
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={backupPaymentEnabled}
                  onChange={(e) => setBackupPaymentEnabled(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography>Backup payment method</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use secondary payment method if primary fails
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Grid container spacing={3}>
        {paymentMethods.map((method) => (
          <Grid item xs={12} md={6} key={method.id}>
            <Card
              sx={{
                border: method.isDefault ? 2 : 1,
                borderColor: method.isDefault ? 'primary.main' : 'divider',
                position: 'relative',
              }}
            >
              {method.isDefault && (
                <Chip
                  label="DEFAULT"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                  }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {method.type === 'card' ? getCardIcon(method.brand) : getMethodIcon(method.type)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {method.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {method.details}
                    </Typography>
                    {method.expiryDate && (
                      <Typography variant="body2" color="text.secondary">
                        Expires: {method.expiryDate}
                      </Typography>
                    )}
                    {method.lastUsed && (
                      <Typography variant="body2" color="text.secondary">
                        Last used: {method.lastUsed}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {!method.isDefault && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedMethod(method);
                      setEditDialog(true);
                    }}
                  >
                    Edit
                  </Button>
                  {!method.isDefault && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedMethod(method);
                        setDeleteDialog(true);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Add New Method Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => setAddDialog(true)}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Add sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Add New Payment Method
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Security />
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Your payment information is secure
            </Typography>
            <Typography variant="body2">
              We use industry-standard encryption to protect your payment details. Your card information
              is never stored on our servers and is processed securely through our PCI-compliant payment provider.
            </Typography>
          </Box>
        </Box>
      </Alert>

      {/* Supported Payment Methods */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported Payment Methods
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <CreditCard sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="body2">Credit/Debit Cards</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="body2">Bank Transfer</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Payment sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="body2">PayPal</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <LocalAtm sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="body2">Wire Transfer</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as any)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="card" control={<Radio />} label="Credit/Debit Card" />
            <FormControlLabel value="bank" control={<Radio />} label="Bank Account" />
            <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
          </RadioGroup>

          {paymentType === 'card' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiry Month</InputLabel>
                  <Select
                    value={expiryMonth}
                    label="Expiry Month"
                    onChange={(e) => setExpiryMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiry Year</InputLabel>
                  <Select
                    value={expiryYear}
                    label="Expiry Year"
                    onChange={(e) => setExpiryYear(e.target.value)}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i} value={String(2024 + i)}>
                        {2024 + i}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Billing Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={billingAddress.line1}
                  onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2 (Optional)"
                  value={billingAddress.line2}
                  onChange={(e) => setBillingAddress({ ...billingAddress, line2: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="State"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="ZIP"
                  value={billingAddress.zip}
                  onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {paymentType === 'bank' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Account Holder Name" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Routing Number" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Account Number" />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Account Type</InputLabel>
                  <Select label="Account Type">
                    <MenuItem value="checking">Checking</MenuItem>
                    <MenuItem value="savings">Savings</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {paymentType === 'paypal' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Payment sx={{ fontSize: 60, color: '#00457C', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Connect your PayPal account
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You will be redirected to PayPal to authorize payments
              </Typography>
              <Button variant="contained" fullWidth>
                Connect PayPal Account
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPaymentMethod}>
            Add Payment Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to remove this payment method?
          </Alert>
          {selectedMethod && (
            <Typography variant="body2">
              You are about to remove: <strong>{selectedMethod.name}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeletePaymentMethod}>
            Remove Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethods;