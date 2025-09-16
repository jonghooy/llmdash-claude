import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  TextareaAutosize,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  Storage as StorageIcon,
  Category as CategoryIcon,
  AccessTime as AccessTimeIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import api from '../../utils/axios';
import PageContainer from '../../components/Layout/PageContainer';

// API calls will use the configured axios instance which handles base URL automatically
import { useTheme } from '../../contexts/ThemeContext';

interface Memory {
  _id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  isPublic: boolean;
  accessLevel: 'public' | 'team' | 'organization' | 'admin';
  organizationId?: string;
  teamId?: string;
  tags: string[];
  metadata: {
    lastAccessed?: Date;
    accessCount: number;
    createdBy?: string;
    updatedBy?: string;
  };
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Memory() {
  const theme = useTheme();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  const [bulkData, setBulkData] = useState('');

  const [formData, setFormData] = useState({
    key: '',
    value: '' as any,
    type: 'string' as Memory['type'],
    category: 'general',
    description: '',
    isPublic: true,
    accessLevel: 'public' as Memory['accessLevel'],
    tags: [] as string[],
    expiresAt: '',
  });

  const valueTypes = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'object', label: 'Object (JSON)' },
    { value: 'array', label: 'Array' }
  ];

  const accessLevels = [
    { value: 'public', label: 'Public' },
    { value: 'team', label: 'Team' },
    { value: 'organization', label: 'Organization' },
    { value: 'admin', label: 'Admin Only' }
  ];

  useEffect(() => {
    fetchMemories();
    fetchCategories();
    fetchStats();
  }, [categoryFilter, search]);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/api/memory?${params}`);
      setMemories(response.data.memories || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/memory/meta/categories');
      setCategories(response.data.categories || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/memory/meta/stats');
      setStats(response.data.stats || response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      
      // Parse value based on type
      let parsedValue: any = formData.value;
      if (formData.type === 'number') {
        parsedValue = Number(formData.value);
      } else if (formData.type === 'boolean') {
        parsedValue = String(formData.value) === 'true' || String(formData.value) === '1';
      } else if (formData.type === 'object' || formData.type === 'array') {
        try {
          parsedValue = JSON.parse(String(formData.value));
        } catch {
          alert('Invalid JSON format');
          return;
        }
      }

      const memoryData = {
        ...formData,
        value: parsedValue,
        tags: typeof formData.tags === 'string' 
          ? (formData.tags as string).split(',').map((t: string) => t.trim()).filter((t: string) => t)
          : formData.tags,
        expiresAt: formData.expiresAt || undefined
      };

      if (editingMemory) {
        await api.put(`/api/memory/${editingMemory._id}`, memoryData);
      } else {
        await api.post('/api/memory', memoryData);
      }

      setDialogOpen(false);
      setEditingMemory(null);
      resetForm();
      fetchMemories();
      fetchStats();
    } catch (error: any) {
      console.error('Error saving memory:', error);
      alert(error.response?.data?.error || 'Failed to save memory');
    }
  };

  const handleBulkImport = async () => {
    try {
      const memories = JSON.parse(bulkData);
      
      if (!Array.isArray(memories)) {
        alert('Data must be a JSON array');
        return;
      }

      const response = await api.post('/api/memory/bulk', { memories });

      alert(`Successfully imported: ${response.data.upserted} new, ${response.data.modified} updated`);
      setBulkImportDialog(false);
      setBulkData('');
      fetchMemories();
      fetchStats();
    } catch (error: any) {
      console.error('Error bulk importing:', error);
      alert(error.response?.data?.error || 'Failed to import memories');
    }
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      key: memory.key,
      value: typeof memory.value === 'object' 
        ? JSON.stringify(memory.value, null, 2)
        : String(memory.value),
      type: memory.type,
      category: memory.category,
      description: memory.description || '',
      isPublic: memory.isPublic,
      accessLevel: memory.accessLevel,
      tags: memory.tags,
      expiresAt: memory.expiresAt ? new Date(memory.expiresAt).toISOString().slice(0, 16) : ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await api.delete(`/api/memory/${id}`);
      fetchMemories();
      fetchStats();
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      type: 'string',
      category: 'general',
      description: '',
      isPublic: true,
      accessLevel: 'public',
      tags: [],
      expiresAt: ''
    });
  };

  const formatValue = (memory: Memory) => {
    if (memory.type === 'object' || memory.type === 'array') {
      return <pre style={{ margin: 0, fontSize: '0.875rem' }}>{JSON.stringify(memory.value, null, 2)}</pre>;
    }
    return String(memory.value);
  };

  return (
    <PageContainer
      title="Memory Management"
      headerAction={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchMemories();
              fetchStats();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={() => setBulkImportDialog(true)}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setEditingMemory(null);
              setDialogOpen(true);
            }}
          >
            Add Memory
          </Button>
        </Box>
      }
    >

      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{stats?.overall?.total || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Memories</Typography>
                  </Box>
                </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{stats?.overall?.totalAccess || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Accesses</Typography>
                  </Box>
                </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NumbersIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{stats?.overall?.avgAccess?.toFixed(1) || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg Access/Memory</Typography>
                  </Box>
                </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{stats?.overall?.categories?.length || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Categories</Typography>
                  </Box>
                </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: 64,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
            '& .Mui-selected': {
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }
          }}
        >
          <Tab label="All Memories" />
          <Tab label="By Category" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative', minHeight: 400 }}>
          <Fade in={tabValue === 0} timeout={500}>
            <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
              size="small"
              placeholder="Search memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                {(categories || []).map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
              </FormControl>
            </Box>

              <TableContainer>
                <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Access Level</TableCell>
                  <TableCell>Access Count</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memories.map((memory) => (
                  <TableRow key={memory._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <KeyIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {memory.key}
                        </Typography>
                      </Box>
                      {memory.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {memory.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={<Box sx={{ maxWidth: 400 }}>{formatValue(memory)}</Box>}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: memory.type === 'object' || memory.type === 'array' ? 'monospace' : 'inherit'
                          }}
                        >
                          {typeof memory.value === 'object' ? JSON.stringify(memory.value) : String(memory.value)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip label={memory.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{memory.category}</TableCell>
                    <TableCell>
                      <Chip 
                        label={memory.accessLevel} 
                        size="small"
                        color={memory.accessLevel === 'public' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{memory.metadata.accessCount}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(memory)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(memory._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Fade>

          <Fade in={tabValue === 1} timeout={500}>
            <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
              <Grid container spacing={2}>
            {stats?.byCategory?.map((cat: any) => (
              <Grid item xs={12} sm={6} md={4} key={cat._id}>
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6">{cat._id || 'Uncategorized'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cat.count} memories
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cat.totalAccess} total accesses
                    </Typography>
                    </Paper>
              </Grid>
            ))}
              </Grid>
            </Box>
          </Fade>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingMemory ? 'Edit Memory' : 'Add Memory'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                required
                helperText="Unique identifier for this memory"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Memory['type'] })}
                  label="Type"
                >
                  {valueTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                helperText={
                  formData.type === 'object' || formData.type === 'array' 
                    ? 'Enter valid JSON' 
                    : formData.type === 'boolean'
                    ? 'Enter true or false'
                    : formData.type === 'number'
                    ? 'Enter a number'
                    : 'Enter text value'
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as Memory['accessLevel'] })}
                  label="Access Level"
                >
                  {accessLevels.map(level => (
                    <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                helperText="Optional description of what this memory is for"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                helperText="Optional tags for categorization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Public"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Expires At"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Optional expiration date"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMemory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialog} onClose={() => setBulkImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Import Memories</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste a JSON array of memory objects. Each object should have: key, value, type, category, etc.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder={`[
  {
    "key": "api_endpoint",
    "value": "https://api.example.com",
    "type": "string",
    "category": "config"
  },
  {
    "key": "max_retries",
    "value": 3,
    "type": "number",
    "category": "config"
  }
]`}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkImport} variant="contained">Import</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}