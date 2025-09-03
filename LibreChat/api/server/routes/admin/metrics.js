const express = require('express');
const router = express.Router();
const UserMetrics = require('../../../models/UserMetrics');
const AuditLog = require('../../../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Get system-wide metrics overview
 */
router.get('/overview', async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    let startDate = new Date();
    if (period === 'hour') {
      startDate.setHours(startDate.getHours() - 1);
    } else if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const metrics = await UserMetrics.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$metrics.messageCount' },
          totalConversations: { $sum: '$metrics.conversationCount' },
          totalTokens: { $sum: '$metrics.tokenUsage.total' },
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          totalApiCalls: { $sum: '$metrics.apiCalls' },
          totalErrors: { $sum: '$metrics.errors' },
          activeUsers: { $addToSet: '$userId' },
          avgResponseTime: { $avg: '$metrics.responseTime.avg' }
        }
      },
      {
        $project: {
          totalMessages: 1,
          totalConversations: 1,
          totalTokens: 1,
          totalCost: { $round: ['$totalCost', 2] },
          totalApiCalls: 1,
          totalErrors: 1,
          activeUsers: { $size: '$activeUsers' },
          avgResponseTime: { $round: ['$avgResponseTime', 0] }
        }
      }
    ]);

    // Get model usage breakdown
    const modelUsage = await UserMetrics.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $project: {
          modelUsage: { $objectToArray: '$metrics.modelUsage' }
        }
      },
      {
        $unwind: '$modelUsage'
      },
      {
        $group: {
          _id: '$modelUsage.k',
          count: { $sum: '$modelUsage.v.count' },
          tokens: { $sum: '$modelUsage.v.tokens' },
          cost: { $sum: '$modelUsage.v.cost' }
        }
      },
      {
        $sort: { tokens: -1 }
      }
    ]);

    res.json({
      overview: metrics[0] || {
        totalMessages: 0,
        totalConversations: 0,
        totalTokens: 0,
        totalCost: 0,
        totalApiCalls: 0,
        totalErrors: 0,
        activeUsers: 0,
        avgResponseTime: 0
      },
      modelUsage,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get time-series metrics
 */
router.get('/timeseries', async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      granularity = 'hour',
      metric = 'messages'
    } = req.query;

    const groupBy = granularity === 'hour' 
      ? { $dateToString: { format: '%Y-%m-%d %H:00', date: '$date' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$date' } };

    const metricField = metric === 'tokens' 
      ? '$metrics.tokenUsage.total'
      : metric === 'cost'
      ? '$metrics.costBreakdown.total'
      : metric === 'errors'
      ? '$metrics.errors'
      : '$metrics.messageCount';

    const data = await UserMetrics.aggregate([
      {
        $match: {
          date: { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          value: { $sum: metricField },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      data,
      metric,
      granularity,
      startDate,
      endDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get top users by various metrics
 */
router.get('/top-users', async (req, res) => {
  try {
    const { 
      sortBy = 'tokens',
      limit = 10,
      period = 'day'
    } = req.query;

    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const sortField = sortBy === 'cost' 
      ? 'totalCost' 
      : sortBy === 'messages' 
      ? 'totalMessages' 
      : sortBy === 'errors'
      ? 'totalErrors'
      : 'totalTokens';

    const users = await UserMetrics.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalMessages: { $sum: '$metrics.messageCount' },
          totalTokens: { $sum: '$metrics.tokenUsage.total' },
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          totalErrors: { $sum: '$metrics.errors' },
          avgResponseTime: { $avg: '$metrics.responseTime.avg' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          totalMessages: 1,
          totalTokens: 1,
          totalCost: { $round: ['$totalCost', 2] },
          totalErrors: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 0] }
        }
      },
      { $sort: { [sortField]: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      users,
      sortBy,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get error trends
 */
router.get('/errors', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get error logs from audit
    const errors = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
          severity: { $in: ['ERROR', 'CRITICAL'] }
        }
      },
      {
        $group: {
          _id: {
            hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
            error: '$details.error.message',
            path: '$details.path'
          },
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $group: {
          _id: '$_id.hour',
          errors: {
            $push: {
              message: '$_id.error',
              path: '$_id.path',
              count: '$count',
              affectedUsers: { $size: '$users' }
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top errors
    const topErrors = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: since },
          severity: { $in: ['ERROR', 'CRITICAL'] }
        }
      },
      {
        $group: {
          _id: '$details.error.message',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' },
          affectedUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          error: '$_id',
          count: 1,
          lastOccurrence: 1,
          affectedUsers: { $size: '$affectedUsers' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      timeline: errors,
      topErrors,
      hours
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get cost analysis
 */
router.get('/costs', async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      groupBy = 'day'
    } = req.query;

    const dateFormat = groupBy === 'day' 
      ? '%Y-%m-%d'
      : groupBy === 'week'
      ? '%Y-%U'
      : '%Y-%m';

    const costAnalysis = await UserMetrics.aggregate([
      {
        $match: {
          date: { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          byModel: { $push: '$metrics.costBreakdown.byModel' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate total and average
    const summary = await UserMetrics.aggregate([
      {
        $match: {
          date: { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          avgDailyCost: { $avg: '$metrics.costBreakdown.total' },
          maxDailyCost: { $max: '$metrics.costBreakdown.total' },
          minDailyCost: { $min: '$metrics.costBreakdown.total' }
        }
      }
    ]);

    res.json({
      timeline: costAnalysis,
      summary: summary[0] || {
        totalCost: 0,
        avgDailyCost: 0,
        maxDailyCost: 0,
        minDailyCost: 0
      },
      period: { startDate, endDate, groupBy }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get real-time stats (for dashboard)
 */
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now - 60000);
    const oneHourAgo = new Date(now - 3600000);

    // Current active users (activity in last 5 minutes)
    const activeUsers = await UserMetrics.distinct('userId', {
      date: { $gte: new Date(now - 300000) }
    });

    // Messages in last minute
    const recentMessages = await UserMetrics.aggregate([
      {
        $match: {
          date: { $gte: oneMinuteAgo }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: '$metrics.messageCount' }
        }
      }
    ]);

    // Average response time in last hour
    const responseTime = await UserMetrics.aggregate([
      {
        $match: {
          date: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$metrics.responseTime.avg' }
        }
      }
    ]);

    // Error rate in last hour
    const errorRate = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: {
            $sum: {
              $cond: [
                { $in: ['$severity', ['ERROR', 'CRITICAL']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          errorRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$errors', '$total'] }, 100] }
            ]
          }
        }
      }
    ]);

    res.json({
      activeUsers: activeUsers.length,
      messagesPerMinute: recentMessages[0]?.count || 0,
      avgResponseTime: Math.round(responseTime[0]?.avg || 0),
      errorRate: errorRate[0]?.errorRate || 0,
      timestamp: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;