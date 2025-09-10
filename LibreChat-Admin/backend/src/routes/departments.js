const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get single department
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create department
router.post('/', async (req, res) => {
  try {
    const { name, teams } = req.body;
    
    // Check if department already exists
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    const department = new Department({
      name,
      teams: teams || []
    });

    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { name, teams } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (name) department.name = name;
    if (teams) department.teams = teams;
    
    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Add team to department
router.post('/:id/teams', async (req, res) => {
  try {
    const { name, manager, description } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if team already exists
    const existingTeam = department.teams.find(t => t.name === name);
    if (existingTeam) {
      return res.status(400).json({ error: 'Team already exists in this department' });
    }

    department.teams.push({
      name,
      manager: manager || '',
      description: description || '',
      memberCount: 0
    });

    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Error adding team:', error);
    res.status(500).json({ error: 'Failed to add team' });
  }
});

// Update team in department
router.put('/:departmentId/teams/:teamName', async (req, res) => {
  try {
    const { name, manager, description, memberCount } = req.body;
    
    const department = await Department.findById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const team = department.teams.find(t => t.name === req.params.teamName);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (name) team.name = name;
    if (manager !== undefined) team.manager = manager;
    if (description !== undefined) team.description = description;
    if (memberCount !== undefined) team.memberCount = memberCount;

    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team from department
router.delete('/:departmentId/teams/:teamName', async (req, res) => {
  try {
    const department = await Department.findById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    department.teams = department.teams.filter(t => t.name !== req.params.teamName);
    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Delete department (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    department.isActive = false;
    await department.save();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Initialize default departments
router.post('/initialize', async (req, res) => {
  try {
    // Check if already initialized
    const existingDepts = await Department.find();
    if (existingDepts.length > 0) {
      return res.status(400).json({ error: 'Departments already initialized' });
    }

    const defaultDepartments = [
      {
        name: '팀벨',
        teams: [
          { name: '팀벨', memberCount: 0 },
          { name: 'AI연구소', memberCount: 0 },
          { name: '선행개발1팀', memberCount: 0 },
          { name: '선행개발2팀', memberCount: 0 },
          { name: '선행개발3팀', memberCount: 0 }
        ]
      },
      {
        name: '경영지원',
        teams: [
          { name: '경영지원', memberCount: 0 },
          { name: '인사총무팀', memberCount: 0 },
          { name: '회계팀', memberCount: 0 },
          { name: '사업관리팀', memberCount: 0 },
          { name: '홍보마케팅팀', memberCount: 0 },
          { name: '미디어사업팀', memberCount: 0 },
          { name: '기술지원팀', memberCount: 0 }
        ]
      },
      {
        name: '글로벌사업부',
        teams: [
          { name: '사업개발팀', memberCount: 0 },
          { name: '인도법인', memberCount: 0 }
        ]
      },
      {
        name: 'AI사업부',
        teams: [
          { name: 'AI사업', memberCount: 0 },
          { name: 'A1팀', memberCount: 0 },
          { name: 'A2팀', memberCount: 0 }
        ]
      },
      {
        name: '솔루션사업부',
        teams: [
          { name: '솔루션사업', memberCount: 0 },
          { name: 'B파트', memberCount: 0 },
          { name: 'F파트', memberCount: 0 },
          { name: '데이터파트', memberCount: 0 },
          { name: '영업파트', memberCount: 0 }
        ]
      },
      {
        name: '미디어자막사업부',
        teams: [
          { name: '미디어자막사업', memberCount: 0 },
          { name: '캡션1팀', memberCount: 0 },
          { name: '캡션2팀', memberCount: 0 },
          { name: '캡션3팀', memberCount: 0 },
          { name: '기술파트', memberCount: 0 },
          { name: '영업파트', memberCount: 0 }
        ]
      },
      {
        name: '소리자바사업부',
        teams: [
          { name: '상담기획팀', memberCount: 0 },
          { name: '상담팀', memberCount: 0 },
          { name: '속기교육팀', memberCount: 0 },
          { name: '기술지원팀', memberCount: 0 }
        ]
      }
    ];

    const departments = await Department.insertMany(defaultDepartments);
    res.json({ message: 'Default departments initialized', departments });
  } catch (error) {
    console.error('Error initializing departments:', error);
    res.status(500).json({ error: 'Failed to initialize departments' });
  }
});

module.exports = router;