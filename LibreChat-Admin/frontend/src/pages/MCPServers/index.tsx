import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
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
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as HealthyIcon,
  Error as UnhealthyIcon,
  Help as UnknownIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: 'http://localhost:5001',
});

interface MCPServer {
  _id: string;
  name: string;
  description?: string;
  version: string;
  connectionType: 'stdio' | 'sse' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  isActive: boolean;
  isPublic: boolean;
  category: string;
  stats: {
    totalConnections: number;
    successfulConnections: number;
    failedConnections: number;
    totalToolCalls: number;
    lastConnected?: string;
  };
  healthCheck: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck?: string;
    responseTime?: number;
  };
  toolCount?: number;
  resourceCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MCPServers: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    connectionType: 'stdio' as 'stdio' | 'sse' | 'websocket',
    command: '',
    args: '',
    url: '',
    isActive: true,
    isPublic: false,
    category: 'custom',
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');  // Changed from 'token' to 'admin_token'
      const response = await api.get('/api/mcp-servers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServers(response.data.servers);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestServer = async (serverId: string) => {
    try {
      const token = localStorage.getItem('admin_token');  // Changed to admin_token
      const response = await api.post(
        `/api/mcp-servers/${serverId}/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResults(prev => ({ ...prev, [serverId]: response.data }));

      // Refresh server data to get updated health status
      setTimeout(fetchServers, 1000);
    } catch (error) {
      console.error('Error testing server:', error);
      setTestResults(prev => ({
        ...prev,
        [serverId]: { success: false, error: 'Test failed' },
      }));
    }
  };

  const handleSaveServer = async () => {
    try {
      const token = localStorage.getItem('admin_token');  // Changed to admin_token
      const data = {
        ...formData,
        args: formData.args ? formData.args.split(' ') : [],
      };

      if (editingServer) {
        await api.put(
          `/api/mcp-servers/${editingServer._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const response = await api.post('/api/mcp-servers', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Server created:', response.data);
      }

      setDialogOpen(false);
      setEditingServer(null);
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        connectionType: 'stdio',
        command: '',
        args: '',
        url: '',
        isActive: true,
        isPublic: false,
        category: 'custom',
      });
      fetchServers();
    } catch (error: any) {
      console.error('Error saving server:', error);
      alert(error.response?.data?.error || 'Failed to save MCP server');
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!window.confirm('Are you sure you want to delete this MCP server?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');  // Changed to admin_token
      await api.delete(`/api/mcp-servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
    }
  };

  const handleEditServer = (server: MCPServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      description: server.description || '',
      version: server.version,
      connectionType: server.connectionType,
      command: server.command || '',
      args: server.args?.join(' ') || '',
      url: server.url || '',
      isActive: server.isActive,
      isPublic: server.isPublic,
      category: server.category,
    });
    setDialogOpen(true);
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'unhealthy':
        return <UnhealthyIcon color="error" />;
      default:
        return <UnknownIcon color="disabled" />;
    }
  };

  const activeServers = servers.filter(s => s.isActive);
  const inactiveServers = servers.filter(s => !s.isActive);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">MCP Server Management</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchServers}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add MCP Server
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Servers
              </Typography>
              <Typography variant="h4">{servers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Servers
              </Typography>
              <Typography variant="h4" color="success.main">
                {activeServers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Healthy Servers
              </Typography>
              <Typography variant="h4" color="success.main">
                {servers.filter(s => s.healthCheck.status === 'healthy').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tools
              </Typography>
              <Typography variant="h4">
                {servers.reduce((sum, s) => sum + (s.toolCount || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Active (${activeServers.length})`} />
          <Tab label={`Inactive (${inactiveServers.length})`} />
          <Tab label="All Servers" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ServerTable
            servers={activeServers}
            onEdit={handleEditServer}
            onDelete={handleDeleteServer}
            onTest={handleTestServer}
            testResults={testResults}
            getHealthIcon={getHealthIcon}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ServerTable
            servers={inactiveServers}
            onEdit={handleEditServer}
            onDelete={handleDeleteServer}
            onTest={handleTestServer}
            testResults={testResults}
            getHealthIcon={getHealthIcon}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ServerTable
            servers={servers}
            onEdit={handleEditServer}
            onDelete={handleDeleteServer}
            onTest={handleTestServer}
            testResults={testResults}
            getHealthIcon={getHealthIcon}
          />
        </TabPanel>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingServer ? 'Edit MCP Server' : 'Add New MCP Server'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Connection Type</InputLabel>
                <Select
                  value={formData.connectionType}
                  onChange={e => setFormData({ ...formData, connectionType: e.target.value as any })}
                  label="Connection Type"
                >
                  <MenuItem value="stdio">Stdio</MenuItem>
                  <MenuItem value="sse">SSE</MenuItem>
                  <MenuItem value="websocket">WebSocket</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="productivity">Productivity</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="research">Research</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                  <MenuItem value="data">Data</MenuItem>
                  <MenuItem value="communication">Communication</MenuItem>
                  <MenuItem value="utility">Utility</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.connectionType === 'stdio' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Command"
                    value={formData.command}
                    onChange={e => setFormData({ ...formData, command: e.target.value })}
                    placeholder="e.g., npx, python"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Arguments"
                    value={formData.args}
                    onChange={e => setFormData({ ...formData, args: e.target.value })}
                    placeholder="e.g., -m mcp.server.stdio"
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="e.g., https://api.example.com/mcp"
                  required
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Public"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveServer} variant="contained">
            {editingServer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Server Table Component
interface ServerTableProps {
  servers: MCPServer[];
  onEdit: (server: MCPServer) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  testResults: Record<string, any>;
  getHealthIcon: (status: string) => JSX.Element;
}

const ServerTable: React.FC<ServerTableProps> = ({
  servers,
  onEdit,
  onDelete,
  onTest,
  testResults,
  getHealthIcon,
}) => {
  if (servers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="textSecondary">No servers found</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Health</TableCell>
            <TableCell>Tools</TableCell>
            <TableCell>Connections</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {servers.map(server => {
            const testResult = testResults[server._id];
            return (
              <TableRow key={server._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {server.isPublic ? <PublicIcon fontSize="small" /> : <PrivateIcon fontSize="small" />}
                    <Box>
                      <Typography variant="subtitle2">{server.name}</Typography>
                      {server.description && (
                        <Typography variant="caption" color="textSecondary">
                          {server.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={server.connectionType} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={server.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={server.isActive ? 'Active' : 'Inactive'}
                    color={server.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getHealthIcon(server.healthCheck.status)}
                    {testResult && (
                      <Typography variant="caption">
                        {testResult.responseTime}ms
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{server.toolCount || 0}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {server.stats.successfulConnections}/{server.stats.totalConnections}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Test Connection">
                    <IconButton size="small" onClick={() => onTest(server._id)}>
                      <TestIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(server)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete(server._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MCPServers;