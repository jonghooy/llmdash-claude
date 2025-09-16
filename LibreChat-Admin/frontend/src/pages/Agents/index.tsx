import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Slider,
  Autocomplete,
  Avatar,
  Rating,
  Tooltip,
  Badge,
  Stack,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon,
  SmartToy as AgentIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import api from '../../utils/axios';

interface Agent {
  _id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  systemPrompt: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: any[];
  mcpServers: any[];
  tools: any[];
  capabilities: {
    codeExecution: boolean;
    fileAccess: boolean;
    webSearch: boolean;
    imageGeneration: boolean;
    dataAnalysis: boolean;
  };
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    type: 'assistant',
    category: 'general',
    systemPrompt: '',
    instructions: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    prompts: [],
    mcpServers: [],
    tools: [],
    capabilities: {
      codeExecution: false,
      fileAccess: false,
      webSearch: false,
      imageGeneration: false,
      dataAnalysis: false
    },
    isPublic: false,
    isActive: true,
    tags: []
  });

  useEffect(() => {
    fetchAgents();
    fetchPrompts();
    fetchMCPServers();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/agents');
      setAgents(response.data.agents || []);
    } catch (err) {
      setError('Failed to fetch agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await api.get('/api/prompts');
      setPrompts(response.data.prompts || []);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    }
  };

  const fetchMCPServers = async () => {
    try {
      const response = await api.get('/api/mcp-servers', {
        params: { isActive: true }
      });
      setMcpServers(response.data.servers || []);
    } catch (err) {
      console.error('Failed to fetch MCP servers:', err);
    }
  };

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setSelectedAgent(agent);
      setFormData(agent);
    } else {
      setSelectedAgent(null);
      setFormData({
        name: '',
        description: '',
        type: 'assistant',
        category: 'general',
        systemPrompt: '',
        instructions: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000,
        prompts: [],
        mcpServers: [],
        tools: [],
        capabilities: {
          codeExecution: false,
          fileAccess: false,
          webSearch: false,
          imageGeneration: false,
          dataAnalysis: false
        },
        isPublic: false,
        isActive: true,
        tags: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAgent(null);
    setTestResult(null);
  };

  const handleSave = async () => {
    try {
      if (selectedAgent) {
        await api.put(`/api/agents/${selectedAgent._id}`, formData);
      } else {
        await api.post('/api/agents', formData);
      }
      fetchAgents();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save agent');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this agent?')) return;

    try {
      await api.delete(`/api/agents/${id}`);
      fetchAgents();
    } catch (err) {
      setError('Failed to delete agent');
      console.error(err);
    }
  };

  const handleDuplicate = async (agent: Agent) => {
    try {
      await api.post(`/api/agents/${agent._id}/duplicate`, { name: `${agent.name} (Copy)` });
      fetchAgents();
    } catch (err) {
      setError('Failed to duplicate agent');
      console.error(err);
    }
  };

  const handleTest = async (agent: Agent) => {
    try {
      const response = await api.post(`/api/agents/${agent._id}/test`, {});
      setTestResult(response.data);
    } catch (err) {
      setError('Failed to test agent');
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'specialist':
        return <PsychologyIcon />;
      case 'workflow':
        return <BuildIcon />;
      case 'custom':
        return <CodeIcon />;
      default:
        return <AgentIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'default',
      coding: 'primary',
      writing: 'secondary',
      analysis: 'info',
      creative: 'warning',
      research: 'success',
      support: 'error',
      automation: 'primary'
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Agent Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAgents}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Agent
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AgentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Agents
                  </Typography>
                  <Typography variant="h4">
                    {agents.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Agents
                  </Typography>
                  <Typography variant="h4">
                    {agents.filter(a => a.isActive).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BuildIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    With MCP Tools
                  </Typography>
                  <Typography variant="h4">
                    {agents.filter(a => a.mcpServers?.length > 0).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MemoryIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Usage
                  </Typography>
                  <Typography variant="h4">
                    {agents.reduce((sum, a) => sum + a.usageCount, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="All Agents" />
        <Tab label="Active" />
        <Tab label="Public" />
        <Tab label="With Tools" />
      </Tabs>

      {/* Agents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Tools</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents
              .filter(agent => {
                if (tabValue === 1) return agent.isActive;
                if (tabValue === 2) return agent.isPublic;
                if (tabValue === 3) return agent.mcpServers?.length > 0;
                return true;
              })
              .map((agent) => (
              <TableRow key={agent._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getTypeIcon(agent.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{agent.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {agent.description.substring(0, 50)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={agent.type}
                    size="small"
                    icon={getTypeIcon(agent.type)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={agent.category}
                    size="small"
                    color={getCategoryColor(agent.category) as any}
                  />
                </TableCell>
                <TableCell>{agent.model}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {agent.mcpServers?.length > 0 && (
                      <Tooltip title="MCP Servers">
                        <Badge badgeContent={agent.mcpServers.length} color="primary">
                          <BuildIcon fontSize="small" />
                        </Badge>
                      </Tooltip>
                    )}
                    {agent.prompts?.length > 0 && (
                      <Tooltip title="Prompts">
                        <Badge badgeContent={agent.prompts.length} color="secondary">
                          <PsychologyIcon fontSize="small" />
                        </Badge>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{agent.usageCount}</TableCell>
                <TableCell>
                  <Rating value={agent.rating} readOnly size="small" />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {agent.isActive && (
                      <Chip label="Active" color="success" size="small" />
                    )}
                    {agent.isPublic && (
                      <Chip label="Public" color="info" size="small" />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(agent)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDuplicate(agent)} size="small">
                    <CopyIcon />
                  </IconButton>
                  <IconButton onClick={() => handleTest(agent)} size="small">
                    <TestIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(agent._id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Test Result */}
      {testResult && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Test Result</Typography>
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAgent ? 'Edit Agent' : 'Create New Agent'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="assistant">Assistant</MenuItem>
                  <MenuItem value="specialist">Specialist</MenuItem>
                  <MenuItem value="workflow">Workflow</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="coding">Coding</MenuItem>
                  <MenuItem value="writing">Writing</MenuItem>
                  <MenuItem value="analysis">Analysis</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                  <MenuItem value="research">Research</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                  <MenuItem value="automation">Automation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={formData.model}
                  label="Model"
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <MenuItem value="gpt-4">GPT-4</MenuItem>
                  <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
                  <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
                  <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="System Prompt"
                multiline
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                helperText="Define the agent's personality and behavior"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                helperText="Additional instructions for the agent"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Temperature: {formData.temperature}</Typography>
              <Slider
                value={formData.temperature}
                onChange={(e, v) => setFormData({ ...formData, temperature: v as number })}
                min={0}
                max={2}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Tokens"
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={prompts}
                getOptionLabel={(option) => option.name}
                value={prompts.filter(p => formData.prompts?.includes(p._id))}
                onChange={(e, value) => setFormData({ ...formData, prompts: value.map(v => v._id) })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Connected Prompts"
                    placeholder="Select prompts"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={mcpServers}
                getOptionLabel={(option) => option.name}
                value={mcpServers.filter(s => formData.mcpServers?.includes(s._id))}
                onChange={(e, value) => setFormData({ ...formData, mcpServers: value.map(v => v._id) })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="MCP Servers"
                    placeholder="Select MCP servers"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Capabilities</Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.capabilities?.codeExecution || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: { ...formData.capabilities!, codeExecution: e.target.checked }
                      })}
                    />
                  }
                  label="Code Execution"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.capabilities?.fileAccess || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: { ...formData.capabilities!, fileAccess: e.target.checked }
                      })}
                    />
                  }
                  label="File Access"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.capabilities?.webSearch || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: { ...formData.capabilities!, webSearch: e.target.checked }
                      })}
                    />
                  }
                  label="Web Search"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.capabilities?.imageGeneration || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: { ...formData.capabilities!, imageGeneration: e.target.checked }
                      })}
                    />
                  }
                  label="Image Generation"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.capabilities?.dataAnalysis || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: { ...formData.capabilities!, dataAnalysis: e.target.checked }
                      })}
                    />
                  }
                  label="Data Analysis"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags || []}
                onChange={(e, value) => setFormData({ ...formData, tags: value })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic || false}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Public (Available to all users)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedAgent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Agents;