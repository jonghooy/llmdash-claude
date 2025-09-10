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
    
    const query: any = {
      // Exclude only pending users - they should only appear in Approvals page
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } }, // Users without approvalStatus field (legacy users)
        { approvalStatus: { $ne: 'pending' } } // Any status except pending
      ]
    };
    
    if (search) {
      query.$and = [
        query.$or,
        {
          $or: [
            { username: new RegExp(String(search), 'i') },
            { email: new RegExp(String(search), 'i') },
            { name: new RegExp(String(search), 'i') }
          ]
        }
      ];
      delete query.$or;
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
        name: user.name,
        role: user.role || 'USER',
        division: user.division,
        team: user.team,
        position: user.position,
        approvalStatus: user.approvalStatus,
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

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { 
      name, 
      username, 
      email, 
      role, 
      division, 
      team, 
      position, 
      approvalStatus 
    } = req.body;
    
    const usersCollection = db.collection('users');
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (division !== undefined) updateData.division = division;
    if (team !== undefined) updateData.team = team;
    if (position !== undefined) updateData.position = position;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
    
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.put('/:userId/status', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { status } = req.body;
    const isActive = status === 'active';
    
    const usersCollection = db.collection('users');
    
    const updateData: any = {
      isActive,
      updatedAt: new Date()
    };
    
    if (!isActive && req.body.reason) {
      updateData.suspendReason = req.body.reason;
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

// Soft delete user (deactivate)
router.delete('/:userId/soft', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    
    const usersCollection = db.collection('users');
    
    // Update user to soft deleted state
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          deletedBy: (req as any).user?.id || 'admin',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Invalidate all user sessions
    const sessionsCollection = db.collection('sessions');
    await sessionsCollection.deleteMany({ userId: userId });
    
    res.json({ 
      success: true,
      message: 'User deactivated successfully (soft delete)'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hard delete user (permanent deletion with all data) - ADMIN ONLY
router.delete('/:userId/hard', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { userId } = req.params;
    const { confirmPhrase } = req.body;
    
    // Require confirmation phrase for hard delete
    if (confirmPhrase !== 'PERMANENTLY DELETE USER') {
      return res.status(400).json({ 
        error: 'Confirmation phrase required. Please type: PERMANENTLY DELETE USER' 
      });
    }
    
    const usersCollection = db.collection('users');
    
    // First check if user exists
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete only core user data (conversations and messages)
    const conversationsCollection = db.collection('conversations');
    const messagesCollection = db.collection('messages');
    
    // Delete only conversations and messages
    await conversationsCollection.deleteMany({ user: userId });
    await messagesCollection.deleteMany({ user: userId });
    
    // Note: Keeping files, transactions, sessions, agents, and projects for audit/recovery purposes
    
    // Delete the user
    const result = await usersCollection.deleteOne(
      { _id: new mongoose.Types.ObjectId(userId) }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User delete failed' });
    }
    
    res.json({ 
      success: true,
      message: 'User account and chat history permanently deleted',
      deletedData: {
        user: user.email,
        conversations: 'All conversations deleted',
        messages: 'All messages deleted'
      },
      retained: {
        files: 'Files retained for recovery',
        transactions: 'Transaction records retained for audit',
        agents: 'AI agents retained',
        projects: 'Projects retained'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;