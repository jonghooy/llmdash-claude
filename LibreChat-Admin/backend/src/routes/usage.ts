import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Get usage statistics
router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { range = '7d' } = req.query;
    
    // Parse range
    let days = 7;
    if (range === '24h') days = 1;
    else if (range === '7d') days = 7;
    else if (range === '30d') days = 30;
    else if (range === '90d') days = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const messagesCollection = db.collection('messages');
    const usersCollection = db.collection('users');
    
    // Get daily usage data
    const dailyData = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt' 
            }
          },
          messages: { $sum: 1 },
          tokens: { $sum: 100 }, // Estimate 100 tokens per message
          users: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id',
          messages: 1,
          tokens: 1,
          users: { $size: '$users' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]).toArray();
    
    // Get model usage
    const modelUsageData = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 },
          tokens: { $sum: 100 }
        }
      },
      {
        $project: {
          model: { $ifNull: ['$_id', 'Unknown'] },
          count: 1,
          tokens: 1
        }
      }
    ]).toArray();
    
    // Get top users
    const topUsersData = await messagesCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          messages: { $sum: 1 },
          tokens: { $sum: 100 }
        }
      },
      {
        $sort: { messages: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();
    
    // Lookup user details for top users
    const userIds = topUsersData.map(u => u._id);
    const users = await usersCollection.find(
      { _id: { $in: userIds.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch {
          return id;
        }
      }) } },
      { projection: { username: 1, name: 1, email: 1 } }
    ).toArray();
    
    const userMap: any = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.username || u.name || u.email || 'Unknown';
    });
    
    const topUsers = topUsersData.map(u => ({
      username: userMap[u._id] || 'Unknown',
      messages: u.messages,
      tokens: u.tokens
    }));
    
    // Calculate summary stats
    const totalMessages = await messagesCollection.countDocuments();
    const totalTokens = totalMessages * 100;
    const totalUsers = await usersCollection.countDocuments();
    const periodMessages = dailyData.reduce((sum, d) => sum + d.messages, 0);
    const periodTokens = periodMessages * 100;
    
    res.json({
      daily: dailyData,
      modelUsage: modelUsageData,
      topUsers,
      summary: {
        totalMessages,
        totalTokens,
        totalUsers,
        avgMessagesPerUser: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0,
        avgTokensPerMessage: 100
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost analysis
router.get('/costs', async (req, res) => {
  try {
    // Mock cost data for now
    const costs = {
      total: 1234.56,
      byModel: {
        'gpt-4': 890.12,
        'gpt-3.5-turbo': 234.44,
        'claude-2': 110.00
      },
      projection: {
        daily: 41.15,
        monthly: 1234.56,
        yearly: 14814.72
      }
    };
    
    res.json(costs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;