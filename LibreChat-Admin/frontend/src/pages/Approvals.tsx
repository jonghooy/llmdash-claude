import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as DivisionIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface PendingUser {
  _id: string;
  email: string;
  name: string;
  division: string;
  team: string;
  position?: string;
  createdAt: string;
  usageStats?: {
    lastActive: string;
  };
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

const Approvals: React.FC = () => {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  });
  const [rejectReason, setRejectReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);

  // Fetch pending users
  const { data: pendingData, isLoading, refetch } = useQuery<{ users: PendingUser[]; count: number }>({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/approval/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Fetch approval statistics
  const { data: statsData } = useQuery<{ stats: ApprovalStats }>({
    queryKey: ['approvalStats'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/admin/api/approval/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('admin_token');
      await axios.post(`/admin/api/approval/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
    }
  });

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const token = localStorage.getItem('admin_token');
      await axios.post(`/admin/api/approval/reject/${userId}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      setRejectDialog({ open: false, userId: null });
      setRejectReason('');
    }
  });

  const handleApprove = (user: PendingUser) => {
    if (window.confirm(`Approve registration for ${user.email}?`)) {
      approveMutation.mutate(user._id);
    }
  };

  const handleReject = () => {
    if (rejectDialog.userId) {
      rejectMutation.mutate({ userId: rejectDialog.userId, reason: rejectReason });
    }
  };

  const getDivisionColor = (division: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'primary',
      'Sales': 'success',
      'Marketing': 'warning',
      'HR': 'info',
      'Finance': 'secondary',
      'R&D': 'error',
      'Product': 'primary',
      'Other': 'default'
    };
    return colors[division] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Registration Approvals
        </Typography>
        <IconButton onClick={() => refetch()} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      {statsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Approval
                    </Typography>
                    <Typography variant="h3" color="warning.main">
                      {statsData.stats.pending}
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Approved
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      {statsData.stats.approved}
                    </Typography>
                  </Box>
                  <ApproveIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Rejected
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {statsData.stats.rejected}
                    </Typography>
                  </Box>
                  <RejectIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Pending Users Table */}
      <Paper elevation={1}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingData?.users.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No pending registrations
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingData?.users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.division} 
                        size="small" 
                        color={getDivisionColor(user.division) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TeamIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{user.team}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.position || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="success"
                        onClick={() => handleApprove(user)}
                        disabled={approveMutation.isPending}
                        title="Approve"
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setSelectedUser(user);
                          setRejectDialog({ open: true, userId: user._id });
                        }}
                        disabled={rejectMutation.isPending}
                        title="Reject"
                      >
                        <RejectIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, userId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reject Registration
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Rejecting registration for: <strong>{selectedUser.email}</strong>
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, userId: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Approvals;