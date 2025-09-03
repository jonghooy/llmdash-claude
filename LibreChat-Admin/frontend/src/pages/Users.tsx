import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Search,
  Edit,
  Block,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
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

  const { data, isLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users', page, rowsPerPage, searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('http://localhost:5001/api/users', {
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
    }
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `http://localhost:5001/api/users/${userId}/status`,
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

  const handleStatusToggle = (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUserStatus.mutate({ userId: user._id, status: newStatus });
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
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell align="right">{user.messageCount?.toLocaleString()}</TableCell>
                  <TableCell align="right">{user.tokenUsage?.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit User">
                      <IconButton size="small">
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
    </Box>
  );
};

export default Users;