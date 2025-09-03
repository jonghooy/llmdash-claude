import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get collections from LibreChat database
    const usersCollection = db.collection('users');
    const conversationsCollection = db.collection('conversations');
    const messagesCollection = db.collection('messages');
    
    // Get basic stats
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const totalConversations = await conversationsCollection.countDocuments();
    const totalMessages = await messagesCollection.countDocuments();
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = await messagesCollection.countDocuments({
      createdAt: { $gte: today }
    });
    
    const todayConversations = await conversationsCollection.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Get model usage (last 24 hours)
    const modelUsageData = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    // Transform model usage data to object format
    const models: { [key: string]: number } = {};
    modelUsageData.forEach(item => {
      if (item._id) {
        models[item._id] = item.count;
      }
    });
    
    // Calculate tokens (estimate: 100 tokens per message average)
    const totalTokens = totalMessages * 100;
    const todayTokens = todayMessages * 100;
    
    // Get new users today
    const newUsersToday = await usersCollection.countDocuments({
      createdAt: { $gte: today }
    });
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsersToday
      },
      messages: {
        total: totalMessages,
        today: todayMessages
      },
      tokens: {
        total: totalTokens,
        today: todayTokens
      },
      models,
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time metrics
router.get('/metrics', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const messagesCollection = db.collection('messages');
    
    // Messages per minute (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentMessages = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: fiveMinutesAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d %H:%M', 
              date: '$createdAt' 
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    // Active sessions
    const usersCollection = db.collection('users');
    const activeSessions = await usersCollection.countDocuments({
      lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });
    
    // Average response time (mock for now)
    const avgResponseTime = Math.floor(Math.random() * 200) + 100;
    
    // Error rate (mock for now)
    const errorRate = Math.random() * 5;
    
    res.json({
      messagesPerMinute: recentMessages,
      activeSessions,
      avgResponseTime,
      errorRate: errorRate.toFixed(2),
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity timeline
router.get('/activity', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { hours = 24 } = req.query;
    
    const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);
    
    // Get message activity
    const messagesCollection = db.collection('messages');
    const messageActivity = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d %H:00', 
              date: '$createdAt' 
            }
          },
          messages: { $sum: 1 },
          users: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          hour: '$_id',
          messages: 1,
          uniqueUsers: { $size: '$users' }
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]).toArray();
    
    res.json({
      activity: messageActivity,
      period: `${hours} hours`,
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;