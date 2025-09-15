const express = require('express');
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware/');

const router = express.Router();

// Admin Dashboard에서 만든 프롬프트 가져오기
router.get('/', requireJwtAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const userId = req.user.id;
    
    // MongoDB 직접 접근
    const db = mongoose.connection.db;
    const promptsCollection = db.collection('prompts');
    
    const filter = { 
      isActive: true,
      isPublic: true  // 공개 프롬프트만 조회
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const prompts = await promptsCollection
      .find(filter)
      .sort({ usageCount: -1, rating: -1 })
      .limit(20)
      .toArray();
    
    res.json({ prompts });
  } catch (error) {
    console.error('Error fetching admin prompts:', error);
    res.status(500).json({ error: 'Failed to fetch admin prompts' });
  }
});

// 특정 프롬프트 상세 조회
router.get('/:id', requireJwtAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = mongoose.connection.db;
    const promptsCollection = db.collection('prompts');
    
    const prompt = await promptsCollection.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isActive: true,
      isPublic: true
    });
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// 프롬프트 변수 적용
router.post('/:id/apply', requireJwtAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;
    
    const db = mongoose.connection.db;
    const promptsCollection = db.collection('prompts');
    
    const prompt = await promptsCollection.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isActive: true,
      isPublic: true
    });
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // 변수 치환
    let appliedPrompt = prompt.prompt;
    if (variables && prompt.variables) {
      prompt.variables.forEach(v => {
        const value = variables[v.name] || v.defaultValue || '';
        const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'g');
        appliedPrompt = appliedPrompt.replace(regex, value);
      });
    }
    
    // 사용 횟수 증가
    await promptsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $inc: { usageCount: 1 } }
    );
    
    res.json({ 
      prompt: appliedPrompt,
      original: prompt.prompt,
      variables: prompt.variables,
      name: prompt.name,
      description: prompt.description
    });
  } catch (error) {
    console.error('Error applying prompt:', error);
    res.status(500).json({ error: 'Failed to apply prompt' });
  }
});

module.exports = router;