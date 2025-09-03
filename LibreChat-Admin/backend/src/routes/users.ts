import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all users with pagination
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all'
    } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { username: new RegExp(String(search), 'i') },
        { email: new RegExp(String(search), 'i') },
        { name: new RegExp(String(search), 'i') }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await usersCollection
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();
    
    const total = await usersCollection.countDocuments(query);
    
    // Get usage stats for each user
    const messagesCollection = db.collection('messages');
    const userIds = users.map(u => u._id);
    
    const usageStats = await messagesCollection.aggregate([
      {
        $match: {
          user: { $in: userIds.map(id => id.toString()) }
        }
      },
      {
        $group: {
          _id: '$user',
          messageCount: { $sum: 1 },
          lastMessage: { $max: '$createdAt' }
        }
      }
    ]).toArray();
    
    const usageMap = usageStats.reduce((acc: any, stat) => {
      acc[stat._id] = stat;
      return acc;
    }, {});
    
    const usersWithStats = users.map(user => {
      const stats = usageMap[user._id.toString()] || {
        messageCount: 0,
        lastMessage: null
      };
      
      return {
        _id: user._id,
        username: user.username || user.name || 'Unknown',
        email: user.email,
        createdAt: user.createdAt || new Date(),
        status: user.isActive === false ? 'suspended' : 'active',
        messageCount: stats.messageCount,
        tokenUsage: stats.messageCount * 100, // Estimate 100 tokens per message
        lastActive: stats.lastMessage || user.lastLogin || user.createdAt || new Date()
      };
    });
    
    res.json({
      users: usersWithStats,
      total
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user details
router.get('/:userId', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's conversation history
    const conversationsCollection = db.collection('conversations');
    const conversations = await conversationsCollection
      .find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();
    
    // Get user's message stats
    const messagesCollection = db.collection('messages');
    const messageStats = await messagesCollection.aggregate([
      {
        $match: { user: userId }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          firstMessage: { $min: '$createdAt' },
          lastMessage: { $max: '$createdAt' }
        }
      }
    ]).toArray();
    
    // Get model usage
    const modelUsage = await messagesCollection.aggregate([
      {
        $match: { user: userId }
      },
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    res.json({
      user,
      conversations,
      stats: messageStats[0] || {
        totalMessages: 0,
        firstMessage: null,
        lastMessage: null
      },
      modelUsage
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.patch('/:userId/status', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { isActive, reason } = req.body;
    
    const usersCollection = db.collection('users');
    
    const updateData: any = {
      isActive,
      updatedAt: new Date()
    };
    
    if (!isActive && reason) {
      updateData.suspendReason = reason;
      updateData.suspendedAt = new Date();
    } else if (isActive) {
      updateData.suspendReason = null;
      updateData.suspendedAt = null;
    }
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: isActive ? 'User activated' : 'User suspended'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set user limits
router.put('/:userId/limits', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { 
      dailyMessageLimit,
      dailyTokenLimit,
      monthlyBudget
    } = req.body;
    
    const usersCollection = db.collection('users');
    
    const limits = {
      dailyMessageLimit: Number(dailyMessageLimit) || 100,
      dailyTokenLimit: Number(dailyTokenLimit) || 100000,
      monthlyBudget: Number(monthlyBudget) || 50
    };
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          limits,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      limits,
      message: 'User limits updated'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user password
router.post('/:userId/reset-password', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      });
    }
    
    const usersCollection = db.collection('users');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          passwordChangedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (soft delete)
router.delete('/:userId', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;