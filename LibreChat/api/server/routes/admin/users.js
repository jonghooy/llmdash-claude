const express = require('express');
const router = express.Router();
const User = require('../../../models/User');
const UserMetrics = require('../../../models/UserMetrics');
const AuditLog = require('../../../models/AuditLog');

/**
 * Get all users with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') }
      ];
    }
    
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await User.countDocuments(query);

    // Get metrics for each user
    const userIds = users.map(u => u._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await UserMetrics.find({
      userId: { $in: userIds },
      date: today
    }).lean();

    const metricsMap = metrics.reduce((acc, m) => {
      acc[m.userId] = m;
      return acc;
    }, {});

    const usersWithMetrics = users.map(user => ({
      ...user,
      todayMetrics: metricsMap[user._id] || null
    }));

    res.json({
      users: usersWithMetrics,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single user details with full metrics
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get metrics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await UserMetrics.find({
      userId: userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 }).lean();

    // Get recent activity
    const recentActivity = await AuditLog.find({
      userId: userId
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

    res.json({
      user,
      metrics,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user (admin actions)
 */
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Allowed updates
    const allowedUpdates = [
      'isActive',
      'role',
      'limits',
      'permissions',
      'emailVerified'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await AuditLog.create({
      userId: req.user._id,
      action: `UPDATE_USER`,
      category: 'ADMIN',
      severity: 'INFO',
      details: {
        targetUserId: userId,
        updates: filteredUpdates
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Suspend/Activate user
 */
router.post('/:userId/suspend', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        suspendedAt: new Date(),
        suspendReason: reason,
        suspendDuration: duration
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await AuditLog.create({
      userId: req.user._id,
      action: 'SUSPEND_USER',
      category: 'ADMIN',
      severity: 'WARNING',
      details: {
        targetUserId: userId,
        reason,
        duration
      }
    });

    // TODO: Terminate active sessions for this user

    res.json({ message: 'User suspended', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activate suspended user
 */
router.post('/:userId/activate', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        suspendedAt: null,
        suspendReason: null,
        suspendDuration: null
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await AuditLog.create({
      userId: req.user._id,
      action: 'ACTIVATE_USER',
      category: 'ADMIN',
      severity: 'INFO',
      details: {
        targetUserId: userId
      }
    });

    res.json({ message: 'User activated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set user limits
 */
router.put('/:userId/limits', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      dailyTokenLimit,
      dailyMessageLimit,
      monthlyBudget,
      concurrentRequests
    } = req.body;

    // Update or create today's metrics with limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await UserMetrics.findOneAndUpdate(
      {
        userId: userId,
        date: today
      },
      {
        $set: {
          limits: {
            dailyTokenLimit,
            dailyMessageLimit,
            monthlyBudget,
            concurrentRequests
          }
        }
      },
      { upsert: true }
    );

    // Also update user document
    await User.findByIdAndUpdate(userId, {
      limits: {
        dailyTokenLimit,
        dailyMessageLimit,
        monthlyBudget,
        concurrentRequests
      }
    });

    // Log admin action
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_USER_LIMITS',
      category: 'ADMIN',
      severity: 'INFO',
      details: {
        targetUserId: userId,
        limits: {
          dailyTokenLimit,
          dailyMessageLimit,
          monthlyBudget,
          concurrentRequests
        }
      }
    });

    res.json({ 
      message: 'Limits updated',
      limits: {
        dailyTokenLimit,
        dailyMessageLimit,
        monthlyBudget,
        concurrentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete user (soft delete)
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_USER',
      category: 'ADMIN',
      severity: 'WARNING',
      details: {
        targetUserId: userId
      }
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;