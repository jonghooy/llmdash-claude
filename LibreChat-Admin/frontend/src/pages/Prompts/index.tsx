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
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Rating,
  Tooltip,
  InputAdornment,
  Grid,
  TextareaAutosize,
  Tabs,
  Tab,
  Stack,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  PlayArrow as UseIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Variable {
  name: string;
  description: string;
  defaultValue: string;
}

interface Prompt {
  _id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: Variable[];
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  usageCount: number;
  rating: number;
  createdBy: { name: string; email: string };
  organization?: { name: string };
  teams?: { name: string }[];
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'creative', label: 'Creative' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

const PromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    prompt: '',
    variables: [] as Variable[],
    isPublic: false,
    tags: [] as string[],
    tagInput: ''
  });

  const API_BASE = '/api';

  useEffect(() => {
    fetchPrompts();
  }, [selectedCategory, searchTerm]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_BASE}/prompts`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      setPrompts(response.data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prompt?: Prompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        prompt: prompt.prompt,
        variables: prompt.variables || [],
        isPublic: prompt.isPublic,
        tags: prompt.tags || [],
        tagInput: ''
      });
    } else {
      setEditingPrompt(null);
      setFormData({
        name: '',
        description: '',
        category: 'general',
        prompt: '',
        variables: [],
        isPublic: false,
        tags: [],
        tagInput: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPrompt(null);
    setError('');
    setSuccess('');
  };

  const handleSavePrompt = async () => {
    try {
      const dataToSave = {
        ...formData,
        tags: formData.tags
      };
      delete (dataToSave as any).tagInput;

      if (editingPrompt) {
        await axios.put(
          `${API_BASE}/prompts/${editingPrompt._id}`,
          dataToSave,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        setSuccess('Prompt updated successfully');
      } else {
        await axios.post(
          `${API_BASE}/prompts`,
          dataToSave,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        setSuccess('Prompt created successfully');
      }
      handleCloseDialog();
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError('Failed to save prompt');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await axios.delete(`${API_BASE}/prompts/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      setSuccess('Prompt deleted successfully');
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError('Failed to delete prompt');
    }
  };

  const handleDuplicatePrompt = async (id: string) => {
    try {
      await axios.post(
        `${API_BASE}/prompts/${id}/duplicate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      setSuccess('Prompt duplicated successfully');
      fetchPrompts();
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      setError('Failed to duplicate prompt');
    }
  };

  const handlePreviewPrompt = (prompt: Prompt) => {
    setPreviewPrompt(prompt);
    setOpenPreviewDialog(true);
  };

  const handleAddVariable = () => {
    setFormData({
      ...formData,
      variables: [...formData.variables, { name: '', description: '', defaultValue: '' }]
    });
  };

  const handleUpdateVariable = (index: number, field: keyof Variable, value: string) => {
    const updatedVariables = [...formData.variables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setFormData({ ...formData, variables: updatedVariables });
  };

  const handleRemoveVariable = (index: number) => {
    const updatedVariables = formData.variables.filter((_, i) => i !== index);
    setFormData({ ...formData, variables: updatedVariables });
  };

  const handleAddTag = () => {
    if (formData.tagInput && !formData.tags.includes(formData.tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput],
        tagInput: ''
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: any } = {
      general: 'default',
      coding: 'primary',
      writing: 'secondary',
      analysis: 'info',
      creative: 'warning',
      business: 'success',
      education: 'error',
      other: 'default'
    };
    return colors[category] || 'default';
  };

  const filteredPrompts = tabValue === 0 
    ? prompts.filter(p => p.isPublic)
    : tabValue === 1
    ? prompts.filter(p => !p.isPublic && p.organization)
    : prompts.filter(p => !p.isPublic && !p.organization);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Prompt Library
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Prompt
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchPrompts}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Public (${prompts.filter(p => p.isPublic).length})`} />
          <Tab label={`Organization (${prompts.filter(p => !p.isPublic && p.organization).length})`} />
          <Tab label={`Private (${prompts.filter(p => !p.isPublic && !p.organization).length})`} />
        </Tabs>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Usage</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Access</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredPrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No prompts found</TableCell>
                </TableRow>
              ) : (
                filteredPrompts.map((prompt) => (
                  <TableRow key={prompt._id}>
                    <TableCell>
                      <Typography variant="subtitle2">{prompt.name}</Typography>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {prompt.tags.slice(0, 2).map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                          ))}
                          {prompt.tags.length > 2 && (
                            <Chip label={`+${prompt.tags.length - 2}`} size="small" />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={prompt.category} 
                        color={getCategoryColor(prompt.category)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 300, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {prompt.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={prompt.usageCount} color="primary">
                        <UseIcon />
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={prompt.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={prompt.isPublic ? 'Public' : 'Private'}>
                        {prompt.isPublic ? <PublicIcon /> : <PrivateIcon />}
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => handlePreviewPrompt(prompt)}>
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(prompt)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={() => handleDuplicatePrompt(prompt._id)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeletePrompt(prompt._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.slice(1).map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
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
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Prompt Template
              </Typography>
              <TextareaAutosize
                minRows={6}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Enter your prompt template here. Use {{variableName}} for variables."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              />
            </Grid>
            
            {/* Variables Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Variables</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddVariable}>
                  Add Variable
                </Button>
              </Box>
              {formData.variables.map((variable, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Variable Name"
                        value={variable.name}
                        onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                        placeholder="e.g., topic"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Description"
                        value={variable.description}
                        onChange={(e) => handleUpdateVariable(index, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Default Value"
                        value={variable.defaultValue}
                        onChange={(e) => handleUpdateVariable(index, 'defaultValue', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton onClick={() => handleRemoveVariable(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Grid>

            {/* Tags Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button size="small" onClick={handleAddTag}>Add</Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControl>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  {' '}Make this prompt public
                </label>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSavePrompt} variant="contained">
            {editingPrompt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{previewPrompt?.name}</Typography>
            <Chip label={previewPrompt?.category} color={getCategoryColor(previewPrompt?.category || '')} />
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewPrompt && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {previewPrompt.description}
              </Typography>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <CodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Prompt Template:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>
                  {previewPrompt.prompt}
                </Typography>
              </Box>

              {previewPrompt.variables && previewPrompt.variables.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Variables:</Typography>
                  {previewPrompt.variables.map((v, i) => (
                    <Box key={i} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{`{{${v.name}}}`}</strong> - {v.description}
                        {v.defaultValue && ` (Default: ${v.defaultValue})`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {previewPrompt.tags && previewPrompt.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Tags:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {previewPrompt.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Created by: {previewPrompt.createdBy?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Used {previewPrompt.usageCount} times
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptsPage;