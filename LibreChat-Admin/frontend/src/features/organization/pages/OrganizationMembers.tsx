import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Search,
  PersonAdd,
  MoreVert,
  Edit,
  Delete,
  Block,
  CheckCircle,
  FilterList,
  Download,
  Upload,
  Mail,
  Phone,
  Business,
  CalendarMonth
} from '@mui/icons-material';
import PageContainer from '../../../components/Layout/PageContainer';
import { db } from '../../../lib/supabase/client';
import type { Database } from '../../../lib/supabase/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const OrganizationMembers: React.FC = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    superAdmins: 0,
    orgAdmins: 0,
    members: 0
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.profiles()
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);

      // Calculate stats
      const membersList = data || [];
      setStats({
        total: membersList.length,
        active: membersList.filter(m => m.status === 'active').length,
        inactive: membersList.filter(m => m.status !== 'active').length,
        superAdmins: membersList.filter(m => m.role === 'super_admin').length,
        orgAdmins: membersList.filter(m => m.role === 'org_admin').length,
        members: membersList.filter(m => m.role === 'member').length
      });
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Profile) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleEditMember = () => {
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    if (confirm(`Delete ${selectedMember.full_name || selectedMember.email}?`)) {
      try {
        const { error } = await db.profiles()
          .delete()
          .eq('id', selectedMember.id);

        if (error) throw error;
        await loadMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    if (!selectedMember) return;

    try {
      const newStatus = selectedMember.status === 'active' ? 'inactive' : 'active';
      const { error } = await db.profiles()
        .update({ status: newStatus })
        .eq('id', selectedMember.id);

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
    handleMenuClose();
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await db.profiles()
        .update({
          full_name: selectedMember.full_name,
          role: selectedMember.role,
          job_title: selectedMember.job_title,
          phone: selectedMember.phone
        })
        .eq('id', selectedMember.id);

      if (error) throw error;
      await loadMembers();
      setOpenEditDialog(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'secondary';
      case 'org_admin': return 'primary';
      case 'member': return 'default';
      default: return 'default';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <PageContainer title="Organization Members">
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Total Members
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Active
              </Typography>
              <Typography variant="h4" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Inactive
              </Typography>
              <Typography variant="h4" color="error.main">{stats.inactive}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Super Admins
              </Typography>
              <Typography variant="h4" color="secondary.main">{stats.superAdmins}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Org Admins
              </Typography>
              <Typography variant="h4" color="primary.main">{stats.orgAdmins}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Members
              </Typography>
              <Typography variant="h4">{stats.members}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="All Members" />
            <Tab label="Active" />
            <Tab label="Inactive" />
            <Tab label="Admins" />
          </Tabs>
        </Box>

        {/* Filters and Search */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search members..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
              <MenuItem value="org_admin">Org Admin</MenuItem>
              <MenuItem value="member">Member</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {/* Handle add member */}}
          >
            Add Member
          </Button>

          <IconButton>
            <Download />
          </IconButton>

          <IconButton>
            <Upload />
          </IconButton>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={member.avatar_url || undefined}>
                          {member.full_name?.[0] || member.email[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.full_name || 'Unnamed'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.role.replace('_', ' ')}
                        size="small"
                        color={getRoleBadgeColor(member.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {member.job_title || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        size="small"
                        color={getStatusBadgeColor(member.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {member.phone && (
                          <Typography variant="caption" display="block">
                            <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                            {member.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(member.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, member)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMember}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedMember?.status === 'active' ?
            <Block sx={{ mr: 1, fontSize: 20 }} /> :
            <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
          }
          {selectedMember?.status === 'active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={handleDeleteMember} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={selectedMember.full_name || ''}
                onChange={(e) => setSelectedMember({ ...selectedMember, full_name: e.target.value })}
              />
              <TextField
                label="Email"
                fullWidth
                value={selectedMember.email}
                disabled
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedMember.role}
                  label="Role"
                  onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value as Profile['role'] })}
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="org_admin">Org Admin</MenuItem>
                  <MenuItem value="member">Member</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Job Title"
                fullWidth
                value={selectedMember.job_title || ''}
                onChange={(e) => setSelectedMember({ ...selectedMember, job_title: e.target.value })}
              />
              <TextField
                label="Phone"
                fullWidth
                value={selectedMember.phone || ''}
                onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateMember} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};