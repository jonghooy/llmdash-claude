const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Simple auth middleware for approval routes
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 승인 대기 중인 사용자 목록 조회
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const User = mongoose.models.User;
    
    const pendingUsers = await User.find({ 
      approvalStatus: 'pending' 
    })
    .select('email name division team position createdAt usageStats')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending users' 
    });
  }
});

// 사용자 승인
router.post('/approve/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    const User = mongoose.models.User;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        approvalStatus: 'approved',
        'approvalInfo.approvedBy': adminId,
        'approvalInfo.approvedAt': new Date()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        division: user.division,
        team: user.team
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve user' 
    });
  }
});

// 사용자 거절
router.post('/reject/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const User = mongoose.models.User;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        approvalStatus: 'rejected',
        'approvalInfo.approvedBy': adminId,
        'approvalInfo.approvedAt': new Date(),
        'approvalInfo.rejectionReason': reason || 'No reason provided'
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User registration rejected',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject user' 
    });
  }
});

// 승인 통계
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const User = mongoose.models.User;
    
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      if (stat._id) {
        formattedStats[stat._id] = stat.count;
      }
    });
    
    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch approval statistics' 
    });
  }
});

module.exports = router;