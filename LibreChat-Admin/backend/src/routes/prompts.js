const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Simple JWT decode (in production, use proper validation)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_please_change_this');
    req.userId = decoded.userId || decoded.id || 'admin';
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 모든 프롬프트 조회 (필터링 포함)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, isPublic, organization, team, search, page = 1, limit = 20 } = req.query;
    
    // 필터 조건 구성
    const filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }
    
    if (organization) {
      filter.organization = organization;
    }
    
    if (team) {
      filter.teams = team;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [prompts, total] = await Promise.all([
      Prompt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Prompt.countDocuments(filter)
    ]);
    
    res.json({
      prompts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// 프롬프트 상세 조회
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// 프롬프트 생성
router.post('/', authMiddleware, async (req, res) => {
  try {
    const promptData = {
      ...req.body,
      createdBy: req.userId
    };
    
    const prompt = new Prompt(promptData);
    await prompt.save();
    
    const populatedPrompt = await Prompt.findById(prompt._id);
    
    res.status(201).json(populatedPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// 프롬프트 수정
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.userId
    };
    
    const prompt = await Prompt.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// 프롬프트 삭제 (소프트 삭제)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const prompt = await Prompt.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedBy: req.userId
      },
      { new: true }
    );
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// 프롬프트 복제
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const originalPrompt = await Prompt.findById(req.params.id);
    
    if (!originalPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    const duplicatedData = originalPrompt.toObject();
    delete duplicatedData._id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    
    duplicatedData.name = `${duplicatedData.name} (Copy)`;
    duplicatedData.createdBy = req.userId;
    duplicatedData.usageCount = 0;
    
    const newPrompt = new Prompt(duplicatedData);
    await newPrompt.save();
    
    const populatedPrompt = await Prompt.findById(newPrompt._id);
    
    res.status(201).json(populatedPrompt);
  } catch (error) {
    console.error('Error duplicating prompt:', error);
    res.status(500).json({ error: 'Failed to duplicate prompt' });
  }
});

// 프롬프트 사용 횟수 증가
router.post('/:id/use', authMiddleware, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    await prompt.incrementUsage();
    res.json({ message: 'Usage count incremented', usageCount: prompt.usageCount });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: 'Failed to increment usage' });
  }
});

// 프롬프트 평점 업데이트
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }
    
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { rating },
      { new: true }
    );
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json({ message: 'Rating updated', rating: prompt.rating });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

// 카테고리 목록 조회
router.get('/meta/categories', authMiddleware, async (req, res) => {
  try {
    const categories = [
      { value: 'general', label: 'General' },
      { value: 'coding', label: 'Coding' },
      { value: 'writing', label: 'Writing' },
      { value: 'analysis', label: 'Analysis' },
      { value: 'creative', label: 'Creative' },
      { value: 'business', label: 'Business' },
      { value: 'education', label: 'Education' },
      { value: 'other', label: 'Other' }
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 변수가 있는 프롬프트 렌더링
router.post('/:id/render', authMiddleware, async (req, res) => {
  try {
    const { variables } = req.body;
    const prompt = await Prompt.findById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    const renderedPrompt = prompt.applyVariables(variables);
    
    res.json({ 
      prompt: renderedPrompt,
      variables: prompt.variables
    });
  } catch (error) {
    console.error('Error rendering prompt:', error);
    res.status(500).json({ error: 'Failed to render prompt' });
  }
});

module.exports = router;