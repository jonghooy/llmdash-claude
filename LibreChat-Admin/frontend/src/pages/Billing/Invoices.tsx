import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Download,
  Search,
  FilterList,
  Receipt,
  Email,
  Print,
  CheckCircle,
  Warning,
  Schedule,
  CreditCard,
  DateRange,
  AttachMoney,
  Info,
  ContentCopy,
  Visibility,
} from '@mui/icons-material';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  paymentMethod: string;
  billingPeriod: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock invoice data
  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'INV-2024-001',
      date: '2024-01-15',
      dueDate: '2024-01-15',
      amount: 99.00,
      status: 'paid',
      paymentMethod: 'Credit Card ****1234',
      billingPeriod: 'Jan 1 - Jan 31, 2024',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 99.00, amount: 99.00 },
      ],
    },
    {
      id: '2',
      number: 'INV-2023-012',
      date: '2023-12-15',
      dueDate: '2023-12-15',
      amount: 99.00,
      status: 'paid',
      paymentMethod: 'Credit Card ****1234',
      billingPeriod: 'Dec 1 - Dec 31, 2023',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 99.00, amount: 99.00 },
      ],
    },
    {
      id: '3',
      number: 'INV-2023-011',
      date: '2023-11-15',
      dueDate: '2023-11-15',
      amount: 114.00,
      status: 'paid',
      paymentMethod: 'Credit Card ****1234',
      billingPeriod: 'Nov 1 - Nov 30, 2023',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 99.00, amount: 99.00 },
        { description: 'Additional Seats', quantity: 1, unitPrice: 15.00, amount: 15.00 },
      ],
    },
    {
      id: '4',
      number: 'INV-2024-002',
      date: '2024-02-15',
      dueDate: '2024-02-15',
      amount: 99.00,
      status: 'processing',
      paymentMethod: 'Credit Card ****1234',
      billingPeriod: 'Feb 1 - Feb 29, 2024',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 99.00, amount: 99.00 },
      ],
    },
    {
      id: '5',
      number: 'INV-2024-003',
      date: '2024-03-15',
      dueDate: '2024-03-15',
      amount: 99.00,
      status: 'pending',
      paymentMethod: 'Not paid',
      billingPeriod: 'Mar 1 - Mar 31, 2024',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 99.00, amount: 99.00 },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle fontSize="small" />;
      case 'pending':
        return <Schedule fontSize="small" />;
      case 'overdue':
        return <Warning fontSize="small" />;
      case 'processing':
        return <Schedule fontSize="small" />;
      default:
        return null;
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialog(true);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Downloading invoice:', invoiceId);
    // Implement download logic
  };

  const handleEmailInvoice = (invoiceId: string) => {
    console.log('Emailing invoice:', invoiceId);
    // Implement email logic
  };

  const handlePrintInvoice = (invoiceId: string) => {
    console.log('Printing invoice:', invoiceId);
    // Implement print logic
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.billingPeriod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'pending' || inv.status === 'processing')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Billed
                  </Typography>
                  <Typography variant="h4">
                    ${totalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredInvoices.length} invoices
                  </Typography>
                </Box>
                <AttachMoney color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Paid
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ${paidAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredInvoices.filter(inv => inv.status === 'paid').length} invoices
                  </Typography>
                </Box>
                <CheckCircle color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    ${pendingAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'processing').length} invoices
                  </Typography>
                </Box>
                <Schedule color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="last30">Last 30 Days</MenuItem>
                <MenuItem value="last90">Last 90 Days</MenuItem>
                <MenuItem value="thisYear">This Year</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Billing Period</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {invoice.number}
                        </Typography>
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.billingPeriod}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          ${invoice.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status.toUpperCase()}
                          color={getStatusColor(invoice.status) as any}
                          size="small"
                          icon={getStatusIcon(invoice.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditCard fontSize="small" />
                          <Typography variant="body2">
                            {invoice.paymentMethod}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(invoice)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Email Invoice">
                            <IconButton
                              size="small"
                              onClick={() => handleEmailInvoice(invoice.id)}
                            >
                              <Email fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintInvoice(invoice.id)}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInvoices.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Invoice Details</Typography>
                <Chip
                  label={selectedInvoice.status.toUpperCase()}
                  color={getStatusColor(selectedInvoice.status) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Invoice Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Invoice Number"
                        secondary={selectedInvoice.number}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Issue Date"
                        secondary={selectedInvoice.date}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Due Date"
                        secondary={selectedInvoice.dueDate}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Billing Period"
                        secondary={selectedInvoice.billingPeriod}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Payment Method"
                        secondary={selectedInvoice.paymentMethod}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={selectedInvoice.status.toUpperCase()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Amount"
                        secondary={`$${selectedInvoice.amount.toFixed(2)}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Invoice Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          ${selectedInvoice.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedInvoice.status === 'pending' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This invoice is pending payment. Please update your payment method to avoid service interruption.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
              <Button
                startIcon={<Download />}
                onClick={() => handleDownloadInvoice(selectedInvoice.id)}
              >
                Download PDF
              </Button>
              <Button
                startIcon={<Email />}
                onClick={() => handleEmailInvoice(selectedInvoice.id)}
              >
                Email Invoice
              </Button>
              {selectedInvoice.status === 'pending' && (
                <Button variant="contained" startIcon={<CreditCard />}>
                  Pay Now
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Invoices;