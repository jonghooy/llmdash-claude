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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  Person,
  Settings,
  Share,
  TrendingUp,
  Storage,
  Message,
  Groups,
  BusinessCenter,
  MoreVert,
  FolderShared,
  Description,
  SmartToy
} from '@mui/icons-material';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  parentTeamId?: string;
  parentTeamName?: string;
  status: 'active' | 'suspended';
  usage: {
    tokensUsed: number;
    tokensLimit: number;
    messagesUsed: number;
    messagesLimit: number;
  };
  createdAt: string;
  members?: TeamMember[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'moderator' | 'admin';
  avatar?: string;
  joinedAt: string;
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'Engineering',
      slug: 'engineering',
      description: 'Product development team',
      leaderId: 'user1',
      leaderName: 'John Doe',
      memberCount: 12,
      status: 'active',
      usage: {
        tokensUsed: 45000,
        tokensLimit: 100000,
        messagesUsed: 450,
        messagesLimit: 1000
      },
      createdAt: '2024-01-15',
      members: [
        { id: 'u1', name: 'John Doe', email: 'john@acme.com', role: 'admin', joinedAt: '2024-01-15' },
        { id: 'u2', name: 'Jane Smith', email: 'jane@acme.com', role: 'moderator', joinedAt: '2024-01-20' },
        { id: 'u3', name: 'Bob Wilson', email: 'bob@acme.com', role: 'member', joinedAt: '2024-02-01' }
      ]
    },
    {
      id: '2',
      name: 'Frontend Team',
      slug: 'frontend',
      description: 'UI/UX development',
      leaderId: 'user2',
      leaderName: 'Jane Smith',
      memberCount: 5,
      parentTeamId: '1',
      parentTeamName: 'Engineering',
      status: 'active',
      usage: {
        tokensUsed: 20000,
        tokensLimit: 50000,
        messagesUsed: 200,
        messagesLimit: 500
      },
      createdAt: '2024-02-01'
    },
    {
      id: '3',
      name: 'Marketing',
      slug: 'marketing',
      description: 'Marketing and growth team',
      leaderId: 'user3',
      leaderName: 'Alice Brown',
      memberCount: 8,
      status: 'active',
      usage: {
        tokensUsed: 30000,
        tokensLimit: 80000,
        messagesUsed: 300,
        messagesLimit: 800
      },
      createdAt: '2024-01-20'
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    leaderId: '',
    parentTeamId: '',
    maxMembers: 50,
    monthlyTokens: 100000,
    monthlyMessages: 1000,
    allowedModels: [] as string[],
    allowedFeatures: [] as string[]
  });

  const handleCreateTeam = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      leaderId: '',
      parentTeamId: '',
      maxMembers: 50,
      monthlyTokens: 100000,
      monthlyMessages: 1000,
      allowedModels: [],
      allowedFeatures: []
    });
    setSelectedTeam(null);
    setOpenDialog(true);
  };

  const handleEditTeam = (team: Team) => {
    setFormData({
      name: team.name,
      slug: team.slug,
      description: team.description,
      leaderId: team.leaderId,
      parentTeamId: team.parentTeamId || '',
      maxMembers: 50,
      monthlyTokens: team.usage.tokensLimit,
      monthlyMessages: team.usage.messagesLimit,
      allowedModels: [],
      allowedFeatures: []
    });
    setSelectedTeam(team);
    setOpenDialog(true);
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setOpenMembersDialog(true);
  };

  const handleSaveTeam = () => {
    // Save logic here
    setOpenDialog(false);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Teams Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your workspace into teams for better resource management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTeam}
        >
          Create Team
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Teams
              </Typography>
              <Typography variant="h4">
                {teams.length}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Groups sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="success.main">
                  +2 this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Members
              </Typography>
              <Typography variant="h4">
                {teams.reduce((acc, team) => acc + team.memberCount, 0)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="success.main">
                  +5 this week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Token Usage
              </Typography>
              <Typography variant="h4">
                95K
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Storage sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2" color="warning.main">
                  95% of quota
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Message Usage
              </Typography>
              <Typography variant="h4">
                950
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Message sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2" color="success.main">
                  47% of quota
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="All Teams" />
          <Tab label="Hierarchy View" />
          <Tab label="Usage Analytics" />
        </Tabs>
      </Paper>

      {/* Teams Table */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Leader</TableCell>
                <TableCell align="center">Members</TableCell>
                <TableCell>Parent Team</TableCell>
                <TableCell>Token Usage</TableCell>
                <TableCell>Message Usage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => {
                const tokenPercentage = getUsagePercentage(team.usage.tokensUsed, team.usage.tokensLimit);
                const messagePercentage = getUsagePercentage(team.usage.messagesUsed, team.usage.messagesLimit);

                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Groups />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {team.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {team.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                          <Person sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">{team.leaderName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <AvatarGroup max={3} sx={{ justifyContent: 'center' }}>
                        {[...Array(Math.min(team.memberCount, 3))].map((_, i) => (
                          <Avatar key={i} sx={{ width: 24, height: 24 }}>
                            {i + 1}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                      <Typography variant="caption" display="block">
                        {team.memberCount} members
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {team.parentTeamName ? (
                        <Chip
                          label={team.parentTeamName}
                          size="small"
                          icon={<BusinessCenter sx={{ fontSize: 16 }} />}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">
                            {Math.round(team.usage.tokensUsed / 1000)}K
                          </Typography>
                          <Typography variant="caption">
                            {Math.round(team.usage.tokensLimit / 1000)}K
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={tokenPercentage}
                          color={getUsageColor(tokenPercentage) as any}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">
                            {team.usage.messagesUsed}
                          </Typography>
                          <Typography variant="caption">
                            {team.usage.messagesLimit}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={messagePercentage}
                          color={getUsageColor(messagePercentage) as any}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={team.status}
                        color={team.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewMembers(team)}>
                        <People />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditTeam(team)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Hierarchy View */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Team hierarchy shows the organizational structure of teams and sub-teams
          </Alert>
          <List>
            {teams.filter(t => !t.parentTeamId).map(parentTeam => (
              <React.Fragment key={parentTeam.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Groups />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={parentTeam.name}
                    secondary={`${parentTeam.memberCount} members • Led by ${parentTeam.leaderName}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {teams.filter(t => t.parentTeamId === parentTeam.id).map(childTeam => (
                  <ListItem key={childTeam.id} sx={{ pl: 8 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                        <Groups sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={childTeam.name}
                      secondary={`${childTeam.memberCount} members • Led by ${childTeam.leaderName}`}
                    />
                  </ListItem>
                ))}
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Create/Edit Team Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTeam ? 'Edit Team' : 'Create New Team'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="URL-friendly identifier"
                required
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Team Leader</InputLabel>
                <Select
                  value={formData.leaderId}
                  label="Team Leader"
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                >
                  <MenuItem value="user1">John Doe</MenuItem>
                  <MenuItem value="user2">Jane Smith</MenuItem>
                  <MenuItem value="user3">Alice Brown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Team (Optional)</InputLabel>
                <Select
                  value={formData.parentTeamId}
                  label="Parent Team (Optional)"
                  onChange={(e) => setFormData({ ...formData, parentTeamId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="1">Engineering</MenuItem>
                  <MenuItem value="3">Marketing</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Resource Quotas
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Members"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Tokens"
                value={formData.monthlyTokens}
                onChange={(e) => setFormData({ ...formData, monthlyTokens: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Messages"
                value={formData.monthlyMessages}
                onChange={(e) => setFormData({ ...formData, monthlyMessages: parseInt(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allowed AI Models
              </Typography>
              <FormGroup row>
                {['GPT-5', 'GPT-5-mini', 'Claude Sonnet', 'Gemini 2.5'].map((model) => (
                  <FormControlLabel
                    key={model}
                    control={<Checkbox />}
                    label={model}
                  />
                ))}
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allowed Features
              </Typography>
              <FormGroup row>
                {['File Upload', 'Memory Agent', 'MCP Servers', 'API Access', 'Custom Prompts'].map((feature) => (
                  <FormControlLabel
                    key={feature}
                    control={<Checkbox />}
                    label={feature}
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTeam}>
            {selectedTeam ? 'Update Team' : 'Create Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={openMembersDialog} onClose={() => setOpenMembersDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedTeam?.name} - Team Members
            </Typography>
            <Button variant="outlined" size="small" startIcon={<Add />}>
              Add Member
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedTeam?.members?.map((member) => (
              <React.Fragment key={member.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{member.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {member.email}
                        </Typography>
                        <Chip
                          label={member.role}
                          size="small"
                          color={member.role === 'admin' ? 'primary' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small">
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" size="small" color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;