import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Switch,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Security,
  AdminPanelSettings,
  Person,
  SupervisorAccount,
  ExpandLess,
  ExpandMore,
  Check,
  Close,
  ContentCopy,
  VpnKey,
  Description,
  ModelTraining,
  Storage,
  People,
  Settings,
  Analytics,
  AttachMoney,
  Warning
} from '@mui/icons-material';

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  isEditable: boolean;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full platform access with all permissions',
      type: 'system',
      userCount: 2,
      permissions: ['all'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      isEditable: false
    },
    {
      id: '2',
      name: 'Customer Admin',
      description: 'Tenant administrator with full workspace control',
      type: 'system',
      userCount: 5,
      permissions: ['workspace.manage', 'billing.view', 'users.manage', 'teams.manage'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      isEditable: false
    },
    {
      id: '3',
      name: 'Team Leader',
      description: 'Team management and member oversight',
      type: 'system',
      userCount: 12,
      permissions: ['team.manage', 'team.members', 'reports.view'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      isEditable: false
    },
    {
      id: '4',
      name: 'Developer',
      description: 'API access and technical resources',
      type: 'custom',
      userCount: 25,
      permissions: ['api.access', 'models.use', 'prompts.create', 'agents.use'],
      createdAt: '2024-02-15',
      updatedAt: '2024-03-01',
      isEditable: true
    },
    {
      id: '5',
      name: 'Analyst',
      description: 'Read-only access to reports and analytics',
      type: 'custom',
      userCount: 8,
      permissions: ['reports.view', 'analytics.view', 'usage.view'],
      createdAt: '2024-02-20',
      updatedAt: '2024-02-20',
      isEditable: true
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const permissionCategories = {
    'Workspace Management': [
      { id: 'workspace.manage', name: 'Manage Workspace', description: 'Full workspace control' },
      { id: 'workspace.settings', name: 'Workspace Settings', description: 'Modify workspace settings' },
      { id: 'workspace.delete', name: 'Delete Workspace', description: 'Delete workspace and data' }
    ],
    'User Management': [
      { id: 'users.manage', name: 'Manage Users', description: 'Add, edit, remove users' },
      { id: 'users.invite', name: 'Invite Users', description: 'Send invitations' },
      { id: 'users.roles', name: 'Assign Roles', description: 'Change user roles' },
      { id: 'users.suspend', name: 'Suspend Users', description: 'Suspend user accounts' }
    ],
    'Team Management': [
      { id: 'teams.manage', name: 'Manage Teams', description: 'Create and manage teams' },
      { id: 'teams.members', name: 'Manage Team Members', description: 'Add/remove team members' },
      { id: 'teams.quotas', name: 'Set Team Quotas', description: 'Allocate team resources' }
    ],
    'AI & Models': [
      { id: 'models.use', name: 'Use AI Models', description: 'Access AI models' },
      { id: 'models.configure', name: 'Configure Models', description: 'Modify model settings' },
      { id: 'prompts.create', name: 'Create Prompts', description: 'Create custom prompts' },
      { id: 'prompts.share', name: 'Share Prompts', description: 'Share prompts with team' },
      { id: 'agents.use', name: 'Use Agents', description: 'Access AI agents' },
      { id: 'agents.create', name: 'Create Agents', description: 'Create custom agents' }
    ],
    'Billing & Usage': [
      { id: 'billing.view', name: 'View Billing', description: 'View billing information' },
      { id: 'billing.manage', name: 'Manage Billing', description: 'Modify payment methods' },
      { id: 'usage.view', name: 'View Usage', description: 'View usage reports' },
      { id: 'usage.export', name: 'Export Usage', description: 'Export usage data' }
    ],
    'API & Integration': [
      { id: 'api.access', name: 'API Access', description: 'Use API endpoints' },
      { id: 'api.keys', name: 'Manage API Keys', description: 'Create/revoke API keys' },
      { id: 'integrations.manage', name: 'Manage Integrations', description: 'Configure integrations' }
    ],
    'Reports & Analytics': [
      { id: 'reports.view', name: 'View Reports', description: 'Access reports' },
      { id: 'reports.create', name: 'Create Reports', description: 'Generate custom reports' },
      { id: 'analytics.view', name: 'View Analytics', description: 'Access analytics dashboard' }
    ]
  };

  const handleCreateRole = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setSelectedRole(null);
    setOpenDialog(true);
  };

  const handleEditRole = (role: Role) => {
    if (!role.isEditable) {
      return;
    }
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setSelectedRole(role);
    setOpenDialog(true);
  };

  const handleDuplicateRole = (role: Role) => {
    setFormData({
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: [...role.permissions]
    });
    setSelectedRole(null);
    setOpenDialog(true);
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setOpenPermissionsDialog(true);
  };

  const handleSaveRole = () => {
    // Save logic here
    setOpenDialog(false);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Super Admin':
        return <AdminPanelSettings />;
      case 'Customer Admin':
        return <Security />;
      case 'Team Leader':
        return <SupervisorAccount />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (type: string) => {
    return type === 'system' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user roles and their permissions across the workspace
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateRole}
        >
          Create Custom Role
        </Button>
      </Box>

      {/* Warning Alert */}
      <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
        System roles cannot be edited or deleted. You can create custom roles based on your needs.
      </Alert>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {roles.length}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Total Roles
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">System: {roles.filter(r => r.type === 'system').length}</Typography>
                <Typography variant="body2">Custom: {roles.filter(r => r.type === 'custom').length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {roles.reduce((acc, role) => acc + role.userCount, 0)}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Total Users
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Across all roles
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <VpnKey />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {Object.values(permissionCategories).flat().length}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Permissions
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Available permissions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    85%
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Permission Usage
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Permissions in use
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Roles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="center">Users</TableCell>
              <TableCell align="center">Permissions</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: `${getRoleColor(role.type)}.main`, width: 36, height: 36 }}>
                      {getRoleIcon(role.name)}
                    </Avatar>
                    <Typography variant="body1" fontWeight="medium">
                      {role.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={role.type}
                    color={getRoleColor(role.type) as any}
                    size="small"
                    variant={role.type === 'system' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${role.userCount} users`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  {role.permissions[0] === 'all' ? (
                    <Chip label="All Permissions" color="success" size="small" />
                  ) : (
                    <Button
                      size="small"
                      onClick={() => handleViewPermissions(role)}
                    >
                      View ({role.permissions.length})
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(role.updatedAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Duplicate Role">
                    <IconButton size="small" onClick={() => handleDuplicateRole(role)}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  {role.isEditable ? (
                    <>
                      <IconButton size="small" onClick={() => handleEditRole(role)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </>
                  ) : (
                    <Tooltip title="System role cannot be modified">
                      <IconButton size="small" disabled>
                        <Settings />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Role Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Edit Custom Role' : 'Create Custom Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                helperText="Choose a descriptive name for this role"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                helperText="Describe the purpose and responsibilities of this role"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the permissions this role should have
              </Typography>

              <List>
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <React.Fragment key={category}>
                    <ListItem button onClick={() => toggleCategory(category)}>
                      <ListItemText primary={category} />
                      {expandedCategories[category] ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={expandedCategories[category]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {permissions.map((permission) => (
                          <ListItem key={permission.id} sx={{ pl: 4 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2">{permission.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {permission.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ width: '100%' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRole}>
            {selectedRole ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Permissions Dialog */}
      <Dialog
        open={openPermissionsDialog}
        onClose={() => setOpenPermissionsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRole?.name} - Permissions
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedRole?.permissions.map((permId) => {
              const permission = Object.values(permissionCategories)
                .flat()
                .find(p => p.id === permId);
              return permission ? (
                <ListItem key={permId}>
                  <ListItemIcon>
                    <Check color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={permission.name}
                    secondary={permission.description}
                  />
                </ListItem>
              ) : null;
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;