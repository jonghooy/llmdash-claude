import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
} from '@mui/material';
import {
  PrivacyTip,
  Cookie,
  Analytics,
  Storage,
  CloudDownload,
  Delete,
  Info,
  Warning,
  CheckCircle,
  Download,
  Save,
  History,
  Visibility,
  VisibilityOff,
  PersonRemove,
  DataUsage,
} from '@mui/icons-material';

interface DataRetention {
  dataType: string;
  retentionPeriod: string;
  autoDelete: boolean;
}

interface DataExportRequest {
  id: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: string;
  downloadUrl?: string;
}

const PrivacySettings: React.FC = () => {
  const [dataCollection, setDataCollection] = useState({
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
    userBehavior: false,
    marketingData: false,
  });

  const [dataRetention, setDataRetention] = useState<DataRetention[]>([
    { dataType: 'Chat History', retentionPeriod: '365', autoDelete: true },
    { dataType: 'User Activity Logs', retentionPeriod: '90', autoDelete: true },
    { dataType: 'File Uploads', retentionPeriod: '180', autoDelete: false },
    { dataType: 'API Logs', retentionPeriod: '30', autoDelete: true },
    { dataType: 'Error Logs', retentionPeriod: '60', autoDelete: true },
  ]);

  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
    thirdParty: false,
  });

  const [dataSharing, setDataSharing] = useState({
    shareWithPartners: false,
    shareForImprovement: true,
    anonymizeData: true,
    optOutAvailable: true,
  });

  const [exportRequests] = useState<DataExportRequest[]>([
    {
      id: '1',
      requestedBy: 'admin@company.com',
      requestedAt: '2024-01-20',
      status: 'completed',
      size: '2.3 GB',
      downloadUrl: 'https://download.example.com/export1',
    },
    {
      id: '2',
      requestedBy: 'user@company.com',
      requestedAt: '2024-01-25',
      status: 'processing',
    },
  ]);

  const [dataRequestDialog, setDataRequestDialog] = useState(false);
  const [deleteDataDialog, setDeleteDataDialog] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRetentionChange = (index: number, field: string, value: any) => {
    const updated = [...dataRetention];
    updated[index] = { ...updated[index], [field]: value };
    setDataRetention(updated);
  };

  const handleExportData = () => {
    console.log('Exporting data...');
    setDataRequestDialog(false);
  };

  const handleDeleteData = () => {
    console.log('Deleting data...');
    setDeleteDataDialog(false);
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Privacy settings saved successfully!
        </Alert>
      )}

      {/* Data Collection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DataUsage />
            Data Collection
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Control what types of data are collected to improve our services and your experience.
          </Alert>

          <FormGroup>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCollection.analytics}
                      onChange={(e) => setDataCollection({ ...dataCollection, analytics: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Usage Analytics</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Collect anonymous usage statistics to improve features
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCollection.errorReporting}
                      onChange={(e) => setDataCollection({ ...dataCollection, errorReporting: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Error Reporting</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Automatically report errors to help us fix issues
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCollection.performanceMonitoring}
                      onChange={(e) => setDataCollection({ ...dataCollection, performanceMonitoring: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Performance Monitoring</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monitor app performance and loading times
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCollection.userBehavior}
                      onChange={(e) => setDataCollection({ ...dataCollection, userBehavior: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>User Behavior Tracking</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track user interactions to improve UX
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCollection.marketingData}
                      onChange={(e) => setDataCollection({ ...dataCollection, marketingData: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography>Marketing Data</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Collect data for marketing and promotional purposes
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            Data Retention
          </Typography>
          <Divider sx={{ my: 2 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Retention Period (days)</TableCell>
                  <TableCell>Auto-Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataRetention.map((item, index) => (
                  <TableRow key={item.dataType}>
                    <TableCell>{item.dataType}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.retentionPeriod}
                        onChange={(e) => handleRetentionChange(index, 'retentionPeriod', e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.autoDelete}
                        onChange={(e) => handleRetentionChange(index, 'autoDelete', e.target.checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Data retention policies help comply with privacy regulations. Ensure settings align with your legal requirements.
          </Alert>
        </CardContent>
      </Card>

      {/* Cookie Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cookie />
            Cookie Settings
          </Typography>
          <Divider sx={{ my: 2 }} />

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={cookieSettings.essential}
                  disabled
                />
              }
              label={
                <Box>
                  <Typography>Essential Cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Required for basic site functionality (cannot be disabled)
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={cookieSettings.functional}
                  onChange={(e) => setCookieSettings({ ...cookieSettings, functional: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Functional Cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remember user preferences and settings
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={cookieSettings.analytics}
                  onChange={(e) => setCookieSettings({ ...cookieSettings, analytics: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Analytics Cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Help us understand how users interact with our service
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={cookieSettings.marketing}
                  onChange={(e) => setCookieSettings({ ...cookieSettings, marketing: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Marketing Cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used for targeted advertising and promotions
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={cookieSettings.thirdParty}
                  onChange={(e) => setCookieSettings({ ...cookieSettings, thirdParty: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Third-Party Cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allow cookies from external services and partners
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility />
            Data Sharing & Transparency
          </Typography>
          <Divider sx={{ my: 2 }} />

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={dataSharing.shareWithPartners}
                  onChange={(e) => setDataSharing({ ...dataSharing, shareWithPartners: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Share with Partners</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share anonymized data with trusted partners
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dataSharing.shareForImprovement}
                  onChange={(e) => setDataSharing({ ...dataSharing, shareForImprovement: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Product Improvement</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use data to improve AI models and features
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dataSharing.anonymizeData}
                  onChange={(e) => setDataSharing({ ...dataSharing, anonymizeData: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>Anonymize Data</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remove personally identifiable information before sharing
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dataSharing.optOutAvailable}
                  onChange={(e) => setDataSharing({ ...dataSharing, optOutAvailable: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography>User Opt-Out</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allow users to opt out of data sharing
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Data Export & Deletion */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDownload />
            Data Export & Deletion Requests
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setDataRequestDialog(true)}
              sx={{ mr: 2 }}
            >
              Export My Data
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemove />}
              onClick={() => setDeleteDataDialog(true)}
            >
              Delete My Data
            </Button>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Recent Export Requests
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.requestedBy}</TableCell>
                    <TableCell>{request.requestedAt}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={
                          request.status === 'completed' ? 'success' :
                          request.status === 'processing' ? 'warning' :
                          request.status === 'failed' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{request.size || '-'}</TableCell>
                    <TableCell>
                      {request.status === 'completed' && (
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle />
            Compliance & Certifications
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography>GDPR Compliant</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                We comply with the General Data Protection Regulation (EU)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography>CCPA Compliant</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                California Consumer Privacy Act compliance
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography>SOC 2 Type II</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Security and availability standards certification
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography>ISO 27001</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Information security management certification
              </Typography>
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
          Save Privacy Settings
        </Button>
      </Box>

      {/* Export Data Dialog */}
      <Dialog open={dataRequestDialog} onClose={() => setDataRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your data export will include all personal information, chat history, and usage data associated with your account.
          </Alert>
          <Typography variant="body2" paragraph>
            The export process may take several hours depending on the amount of data. You'll receive an email notification when it's ready.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select defaultValue="json" label="Export Format">
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExportData}>
            Request Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Data Dialog */}
      <Dialog open={deleteDataDialog} onClose={() => setDeleteDataDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Your Data</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Warning: This action is irreversible. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2" paragraph>
            This includes:
          </Typography>
          <ul>
            <li>All chat history and conversations</li>
            <li>Uploaded files and documents</li>
            <li>User preferences and settings</li>
            <li>Usage statistics and analytics</li>
          </ul>
          <TextField
            fullWidth
            label="Type 'DELETE' to confirm"
            placeholder="DELETE"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDataDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteData}>
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrivacySettings;