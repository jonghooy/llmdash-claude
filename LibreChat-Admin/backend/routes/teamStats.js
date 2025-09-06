const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const orgConfig = require('../../../LibreChat/api/config/organization.config');

// 사업부별 통계
router.get('/by-division', authMiddleware, async (req, res) => {
  try {
    const User = mongoose.models.User;
    const Message = mongoose.models.Message;
    
    // 사업부별 사용자 수 및 활동 통계
    const divisionStats = await User.aggregate([
      {
        $match: { 
          company: orgConfig.company.name,
          approvalStatus: 'approved'
        }
      },
      {
        $group: {
          _id: '$division',
          userCount: { $sum: 1 },
          totalMessages: { $sum: '$usageStats.totalMessages' },
          totalTokens: { $sum: '$usageStats.totalTokens' },
          monthlyMessages: { $sum: '$usageStats.monthlyMessages' },
          monthlyTokens: { $sum: '$usageStats.monthlyTokens' },
          teams: { $addToSet: '$team' }
        }
      },
      {
        $project: {
          division: '$_id',
          _id: 0,
          userCount: 1,
          totalMessages: 1,
          totalTokens: 1,
          monthlyMessages: 1,
          monthlyTokens: 1,
          teamCount: { $size: '$teams' },
          avgMessagesPerUser: { 
            $cond: [
              { $eq: ['$userCount', 0] },
              0,
              { $divide: ['$totalMessages', '$userCount'] }
            ]
          },
          avgTokensPerUser: { 
            $cond: [
              { $eq: ['$userCount', 0] },
              0,
              { $divide: ['$totalTokens', '$userCount'] }
            ]
          }
        }
      },
      { $sort: { totalMessages: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: divisionStats
    });
  } catch (error) {
    console.error('Error fetching division stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch division statistics' 
    });
  }
});

// 팀별 통계
router.get('/by-team', authMiddleware, async (req, res) => {
  try {
    const { division } = req.query;
    const User = mongoose.models.User;
    
    const matchCondition = {
      company: orgConfig.company.name,
      approvalStatus: 'approved'
    };
    
    if (division) {
      matchCondition.division = division;
    }
    
    const teamStats = await User.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            division: '$division',
            team: '$team'
          },
          userCount: { $sum: 1 },
          totalMessages: { $sum: '$usageStats.totalMessages' },
          totalTokens: { $sum: '$usageStats.totalTokens' },
          monthlyMessages: { $sum: '$usageStats.monthlyMessages' },
          monthlyTokens: { $sum: '$usageStats.monthlyTokens' },
          lastActive: { $max: '$usageStats.lastActive' }
        }
      },
      {
        $project: {
          _id: 0,
          division: '$_id.division',
          team: '$_id.team',
          userCount: 1,
          totalMessages: 1,
          totalTokens: 1,
          monthlyMessages: 1,
          monthlyTokens: 1,
          lastActive: 1,
          avgMessagesPerUser: { 
            $cond: [
              { $eq: ['$userCount', 0] },
              0,
              { $divide: ['$totalMessages', '$userCount'] }
            ]
          }
        }
      },
      { $sort: { division: 1, totalMessages: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: teamStats
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch team statistics' 
    });
  }
});

// 시간대별 사용량 통계
router.get('/usage-timeline', authMiddleware, async (req, res) => {
  try {
    const { division, team, days = 30 } = req.query;
    const Message = mongoose.models.Message;
    const User = mongoose.models.User;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // 필터링할 사용자 ID 가져오기
    const userFilter = {
      company: orgConfig.company.name,
      approvalStatus: 'approved'
    };
    
    if (division) userFilter.division = division;
    if (team) userFilter.team = team;
    
    const users = await User.find(userFilter).select('_id');
    const userIds = users.map(u => u._id);
    
    // 일별 메시지 및 토큰 사용량
    const timeline = await Message.aggregate([
      {
        $match: {
          user: { $in: userIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          messageCount: { $sum: 1 },
          tokenCount: { $sum: { $ifNull: ['$tokenCount', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          messageCount: 1,
          tokenCount: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json({
      success: true,
      timeline,
      period: {
        start: startDate,
        end: new Date(),
        days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error fetching usage timeline:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch usage timeline' 
    });
  }
});

// Top 사용자 통계
router.get('/top-users', authMiddleware, async (req, res) => {
  try {
    const { division, team, limit = 10 } = req.query;
    const User = mongoose.models.User;
    
    const matchCondition = {
      company: orgConfig.company.name,
      approvalStatus: 'approved'
    };
    
    if (division) matchCondition.division = division;
    if (team) matchCondition.team = team;
    
    const topUsers = await User.find(matchCondition)
      .select('email name division team usageStats')
      .sort({ 'usageStats.totalMessages': -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      users: topUsers
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch top users' 
    });
  }
});

// 전체 회사 통계 요약
router.get('/company-summary', authMiddleware, async (req, res) => {
  try {
    const User = mongoose.models.User;
    
    const summary = await User.aggregate([
      {
        $match: { 
          company: 'Timbel'
        }
      },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalMessages: { 
            $sum: { 
              $cond: [
                { $eq: ['$approvalStatus', 'approved'] },
                '$usageStats.totalMessages',
                0
              ]
            }
          },
          totalTokens: { 
            $sum: { 
              $cond: [
                { $eq: ['$approvalStatus', 'approved'] },
                '$usageStats.totalTokens',
                0
              ]
            }
          }
        }
      }
    ]);
    
    const divisionCount = await User.distinct('division', { 
      company: orgConfig.company.name,
      approvalStatus: 'approved'
    });
    
    const teamCount = await User.distinct('team', { 
      company: orgConfig.company.name,
      approvalStatus: 'approved'
    });
    
    const formattedSummary = {
      totalUsers: 0,
      approvedUsers: 0,
      pendingUsers: 0,
      rejectedUsers: 0,
      totalMessages: 0,
      totalTokens: 0,
      divisionCount: divisionCount.length,
      teamCount: teamCount.length
    };
    
    summary.forEach(item => {
      formattedSummary.totalUsers += item.count;
      if (item._id === 'approved') {
        formattedSummary.approvedUsers = item.count;
        formattedSummary.totalMessages = item.totalMessages;
        formattedSummary.totalTokens = item.totalTokens;
      } else if (item._id === 'pending') {
        formattedSummary.pendingUsers = item.count;
      } else if (item._id === 'rejected') {
        formattedSummary.rejectedUsers = item.count;
      }
    });
    
    res.json({
      success: true,
      summary: formattedSummary
    });
  } catch (error) {
    console.error('Error fetching company summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch company summary' 
    });
  }
});

module.exports = router;