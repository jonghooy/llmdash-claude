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
  Typography,
  IconButton,
  Chip,
  TablePagination,
  TextField,
  InputAdornment,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Search,
  Edit,
  Block,
  CheckCircle,
  Warning,
  Delete,
  Person,
  Email,
  Business,
  Group
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  role?: string;
  division?: string;
  team?: string;
  position?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  status: 'active' | 'suspended' | 'banned';
  messageCount: number;
  tokenUsage: number;
  lastActive: string;
}

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null; type: 'soft' | 'hard' }>({ open: false, user: null, type: 'soft' });
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const { data, isLoading, refetch } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users', page, rowsPerPage, searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0 // Always consider data stale
  });

  // Refetch data when component mounts or navigation occurs
  useEffect(() => {
    refetch();
  }, []); // Run once on mount

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `/admin/api/users/${userId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `/admin/api/users/${userId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditDialog({ open: false, user: null });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async ({ userId, type, confirmPhrase }: { userId: string; type: 'soft' | 'hard'; confirmPhrase?: string }) => {
      const token = localStorage.getItem('admin_token');
      const endpoint = type === 'hard' ? `/admin/api/users/${userId}/hard` : `/admin/api/users/${userId}/soft`;
      
      const config: any = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      if (type === 'hard') {
        await axios.delete(endpoint, {
          ...config,
          data: { confirmPhrase }
        });
      } else {
        await axios.delete(endpoint, config);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialog({ open: false, user: null, type: 'soft' });
      setConfirmPhrase('');
    }
  });

  const handleStatusToggle = (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUserStatus.mutate({ userId: user._id, status: newStatus });
  };

  const handleEditOpen = (user: User) => {
    setEditForm({
      name: user.name || '',
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      division: user.division || '',
      team: user.team || '',
      position: user.position || '',
      approvalStatus: user.approvalStatus || 'approved'
    });
    setEditDialog({ open: true, user });
  };

  const handleEditSave = () => {
    if (editDialog.user) {
      updateUser.mutate({ userId: editDialog.user._id, data: editForm });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.user) {
      if (deleteDialog.type === 'hard' && confirmPhrase !== 'PERMANENTLY DELETE USER') {
        return;
      }
      deleteUser.mutate({ 
        userId: deleteDialog.user._id, 
        type: deleteDialog.type,
        confirmPhrase: deleteDialog.type === 'hard' ? confirmPhrase : undefined
      });
    }
  };

  const getStatusChip = (status: string) => {
    const config = {
      active: { color: 'success' as const, icon: <CheckCircle fontSize="small" /> },
      suspended: { color: 'warning' as const, icon: <Warning fontSize="small" /> },
      banned: { color: 'error' as const, icon: <Block fontSize="small" /> }
    };

    const { color, icon } = config[status as keyof typeof config] || config.active;

    return (
      <Chip
        label={status}
        color={color}
        size="small"
        icon={icon}
      />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Division</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Messages</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && data?.users?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.division ? (
                      <Chip 
                        label={user.division} 
                        size="small" 
                        variant="outlined"
                        icon={<Business fontSize="small" />}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {user.team ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{user.team}</Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{user.position || '-'}</TableCell>
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell align="right">{user.messageCount?.toLocaleString()}</TableCell>
                  <TableCell align="right">{user.tokenUsage?.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit User">
                      <IconButton size="small" onClick={() => handleEditOpen(user)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user.status === 'active' ? 'Suspend User' : 'Activate User'}>
                      <Switch
                        checked={user.status === 'active'}
                        onChange={() => handleStatusToggle(user)}
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Deactivate User (Soft Delete)">
                      <IconButton 
                        size="small" 
                        color="warning"
                        onClick={() => setDeleteDialog({ open: true, user, type: 'soft' })}
                      >
                        <Block fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {/* Only show hard delete for admin role */}
                    {user.role !== 'admin' && (
                      <Tooltip title="Permanently Delete User">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, user, type: 'hard' })}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={data?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            Edit User
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Username"
              value={editForm.username || ''}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role || 'user'}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Division"
              value={editForm.division || ''}
              onChange={(e) => setEditForm({ ...editForm, division: e.target.value })}
              fullWidth
            />
            <TextField
              label="Team"
              value={editForm.team || ''}
              onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
              fullWidth
            />
            <TextField
              label="Position"
              value={editForm.position || ''}
              onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
              fullWidth
            />
            {editForm.approvalStatus && (
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={editForm.approvalStatus || 'approved'}
                  onChange={(e) => setEditForm({ ...editForm, approvalStatus: e.target.value as 'pending' | 'approved' | 'rejected' })}
                  label="Approval Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={updateUser.isPending}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => {
          setDeleteDialog({ open: false, user: null, type: 'soft' });
          setConfirmPhrase('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {deleteDialog.type === 'hard' ? 'Permanently Delete User' : 'Deactivate User'}
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity={deleteDialog.type === 'hard' ? 'error' : 'warning'} 
            sx={{ mt: 2 }}
          >
            {deleteDialog.type === 'hard' 
              ? 'This will permanently delete the user and ALL their data. This action cannot be undone!'
              : 'This will deactivate the user account. The data will be preserved and the account can be reactivated later.'}
          </Alert>
          
          {deleteDialog.user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2"><strong>Username:</strong> {deleteDialog.user.username}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {deleteDialog.user.email}</Typography>
              {deleteDialog.user.messageCount > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Total Messages:</strong> {deleteDialog.user.messageCount}
                </Typography>
              )}
            </Box>
          )}
          
          {deleteDialog.type === 'hard' && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ⚠️ This will permanently delete:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>User account</li>
                  <li>All conversations</li>
                  <li>All messages</li>
                </ul>
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                  ✅ The following will be retained:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Uploaded files (for recovery)</li>
                  <li>Transaction records (for audit)</li>
                  <li>AI agents</li>
                  <li>Projects</li>
                </ul>
              </Alert>
              <TextField
                fullWidth
                label="Type confirmation phrase"
                placeholder="PERMANENTLY DELETE USER"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                helperText="Type exactly: PERMANENTLY DELETE USER"
                error={confirmPhrase !== '' && confirmPhrase !== 'PERMANENTLY DELETE USER'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialog({ open: false, user: null, type: 'soft' });
              setConfirmPhrase('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color={deleteDialog.type === 'hard' ? 'error' : 'warning'} 
            variant="contained"
            disabled={
              deleteUser.isPending || 
              (deleteDialog.type === 'hard' && confirmPhrase !== 'PERMANENTLY DELETE USER')
            }
          >
            {deleteDialog.type === 'hard' ? 'Permanently Delete' : 'Deactivate User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;