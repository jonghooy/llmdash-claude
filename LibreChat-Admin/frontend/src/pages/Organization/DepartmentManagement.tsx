import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Collapse,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  Business,
  Group,
  PersonAdd,
  Refresh
} from '@mui/icons-material';

interface Team {
  name: string;
  memberCount: number;
  manager?: string;
  description?: string;
}

interface Department {
  _id: string;
  name: string;
  teams: Team[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add-dept' | 'edit-dept' | 'add-team' | 'edit-team'>('add-dept');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    deptName: '',
    teamName: '',
    manager: '',
    description: ''
  });

  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/departments`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No departments yet, initialize
          await initializeDepartments();
          return;
        }
        throw new Error('Failed to fetch departments');
      }
      
      const data = await response.json();
      setDepartments(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeDepartments = async () => {
    try {
      const response = await fetch(`${apiUrl}/departments/initialize`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Departments already initialized') {
          // Already initialized, just fetch them
          await fetchDepartments();
          return;
        }
        throw new Error(errorData.error || 'Failed to initialize departments');
      }
      
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error initializing departments:', err);
      setError(err.message);
    }
  };

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const handleAddDepartment = () => {
    setDialogMode('add-dept');
    setFormData({ deptName: '', teamName: '', manager: '', description: '' });
    setOpenDialog(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setDialogMode('edit-dept');
    setSelectedDept(dept);
    setFormData({ deptName: dept.name, teamName: '', manager: '', description: '' });
    setOpenDialog(true);
  };

  const handleAddTeam = (dept: Department) => {
    setDialogMode('add-team');
    setSelectedDept(dept);
    setFormData({ deptName: dept.name, teamName: '', manager: '', description: '' });
    setOpenDialog(true);
  };

  const handleEditTeam = (dept: Department, team: Team) => {
    setDialogMode('edit-team');
    setSelectedDept(dept);
    setSelectedTeam(team);
    setFormData({
      deptName: dept.name,
      teamName: team.name,
      manager: team.manager || '',
      description: team.description || ''
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (dialogMode === 'add-dept') {
        const response = await fetch(`${apiUrl}/departments`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.deptName, teams: [] })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add department');
        }
      } else if (dialogMode === 'edit-dept' && selectedDept) {
        const response = await fetch(`${apiUrl}/departments/${selectedDept._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.deptName })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update department');
        }
      } else if (dialogMode === 'add-team' && selectedDept) {
        const response = await fetch(`${apiUrl}/departments/${selectedDept._id}/teams`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.teamName,
            manager: formData.manager,
            description: formData.description
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add team');
        }
      } else if (dialogMode === 'edit-team' && selectedDept && selectedTeam) {
        const response = await fetch(
          `${apiUrl}/departments/${selectedDept._id}/teams/${encodeURIComponent(selectedTeam.name)}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.teamName,
              manager: formData.manager,
              description: formData.description,
              memberCount: selectedTeam.memberCount
            })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update team');
        }
      }
      
      setOpenDialog(false);
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.message);
    }
  };

  const handleDeleteTeam = async (dept: Department, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(
        `${apiUrl}/departments/${dept._id}/teams/${encodeURIComponent(teamName)}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }
      
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error deleting team:', err);
      setError(err.message);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/departments/${deptId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete department');
      }
      
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.message);
    }
  };

  const getTotalTeams = () => {
    return departments.reduce((sum, dept) => sum + dept.teams.length, 0);
  };

  const getTotalMembers = () => {
    return departments.reduce((sum, dept) => 
      sum + dept.teams.reduce((teamSum, team) => teamSum + team.memberCount, 0), 0
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading departments...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Departments
                  </Typography>
                  <Typography variant="h4">
                    {departments.length}
                  </Typography>
                </Box>
                <Business fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Teams
                  </Typography>
                  <Typography variant="h4">
                    {getTotalTeams()}
                  </Typography>
                </Box>
                <Group fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Members
                  </Typography>
                  <Typography variant="h4">
                    {getTotalMembers()}
                  </Typography>
                </Box>
                <PersonAdd fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddDepartment}
        >
          Add Department
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDepartments}
        >
          Refresh
        </Button>
      </Box>

      {/* Departments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="center">Teams</TableCell>
              <TableCell align="center">Total Members</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <React.Fragment key={dept._id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleExpand(dept._id)}
                    >
                      {expandedDepts.has(dept._id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {dept.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={dept.teams.length} size="small" color="primary" />
                  </TableCell>
                  <TableCell align="center">
                    {dept.teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(dept.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Add Team">
                      <IconButton
                        size="small"
                        onClick={() => handleAddTeam(dept)}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Department">
                      <IconButton
                        size="small"
                        onClick={() => handleEditDepartment(dept)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Department">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDepartment(dept._id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <Collapse in={expandedDepts.has(dept._id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom>
                          Teams in {dept.name}
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Team Name</TableCell>
                              <TableCell>Manager</TableCell>
                              <TableCell>Members</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dept.teams.map((team) => (
                              <TableRow key={team.name}>
                                <TableCell>{team.name}</TableCell>
                                <TableCell>{team.manager || '-'}</TableCell>
                                <TableCell>{team.memberCount}</TableCell>
                                <TableCell>{team.description || '-'}</TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditTeam(dept, team)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteTeam(dept, team.name)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            {dept.teams.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} align="center">
                                  <Typography variant="body2" color="textSecondary">
                                    No teams in this department
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add-dept' && 'Add New Department'}
          {dialogMode === 'edit-dept' && 'Edit Department'}
          {dialogMode === 'add-team' && `Add Team to ${formData.deptName}`}
          {dialogMode === 'edit-team' && `Edit Team in ${formData.deptName}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {(dialogMode === 'add-dept' || dialogMode === 'edit-dept') && (
              <TextField
                label="Department Name"
                value={formData.deptName}
                onChange={(e) => setFormData({ ...formData, deptName: e.target.value })}
                fullWidth
                required
              />
            )}
            {(dialogMode === 'add-team' || dialogMode === 'edit-team') && (
              <>
                <TextField
                  label="Team Name"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentManagement;