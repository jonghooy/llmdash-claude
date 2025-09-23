const UserMetrics = require('./UserMetrics');
const mongoose = require('mongoose');

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get the dbGateway lazily to avoid circular dependencies
 */
function getLazyGateway() {
  return require('../server/services/dbGateway');
}

/**
 * Update or increment metrics for a user
 */
async function updateMetrics(userId, date, metricsUpdate) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.updateMetrics(userId, date, metricsUpdate);
  }
  // Fallback to Mongoose
  const hourDate = new Date(date);
  hourDate.setMinutes(0, 0, 0);

  const update = {};
  if (metricsUpdate.messageCount !== undefined) {
    update.$inc = update.$inc || {};
    update.$inc['metrics.messageCount'] = metricsUpdate.messageCount;
  }
  // ... similar logic for other fields

  return await UserMetrics.findOneAndUpdate(
    { userId: mongoose.Types.ObjectId(userId), date: hourDate },
    update,
    { new: true, upsert: true }
  );
}

/**
 * Get daily statistics for a user
 */
async function getDailyStats(userId, startDate, endDate) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.getDailyStats(userId, startDate, endDate);
  }
  // Fallback to Mongoose static method
  return await UserMetrics.getDailyStats(userId, startDate, endDate);
}

/**
 * Get top users by various metrics
 */
async function getTopUsers(limit = 10, sortBy = 'tokens') {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.getTopUsers(limit, sortBy);
  }
  // Fallback to Mongoose static method
  return await UserMetrics.getTopUsers(limit, sortBy);
}

/**
 * Get metrics for a specific user and date range
 */
async function getUserMetrics(userId, startDate = null, endDate = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.getUserMetrics(userId, startDate, endDate);
  }
  // Fallback to Mongoose
  const query = { userId: mongoose.Types.ObjectId(userId) };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return await UserMetrics.find(query).sort({ date: -1 }).lean();
}

/**
 * Aggregate metrics by time period
 */
async function aggregateMetrics(period = 'day', startDate = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.aggregateMetrics(period, startDate);
  }
  // Fallback to Mongoose
  let dateThreshold = new Date();
  if (startDate) {
    dateThreshold = startDate;
  } else {
    switch (period) {
      case 'hour':
        dateThreshold.setHours(dateThreshold.getHours() - 1);
        break;
      case 'day':
        dateThreshold.setDate(dateThreshold.getDate() - 1);
        break;
      case 'week':
        dateThreshold.setDate(dateThreshold.getDate() - 7);
        break;
      case 'month':
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
    }
  }

  const result = await UserMetrics.aggregate([
    { $match: { date: { $gte: dateThreshold } } },
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
        avgResponseTime: { $avg: '$metrics.responseTime.avg' },
      },
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
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
      },
    },
  ]);

  return result[0] || {
    totalMessages: 0,
    totalConversations: 0,
    totalTokens: 0,
    totalCost: 0,
    totalApiCalls: 0,
    totalErrors: 0,
    activeUsers: 0,
    avgResponseTime: 0,
  };
}

/**
 * Update user limits
 */
async function updateLimits(userId, limits) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.updateLimits(userId, limits);
  }
  // Fallback to Mongoose
  return await UserMetrics.findOneAndUpdate(
    { userId: mongoose.Types.ObjectId(userId) },
    { $set: { limits } },
    { new: true, sort: { date: -1 } }
  );
}

/**
 * Reset daily usage counters
 */
async function resetDailyUsage(userId = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.resetDailyUsage(userId);
  }
  // Fallback to Mongoose
  const query = {};
  if (userId) {
    query.userId = mongoose.Types.ObjectId(userId);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  query.date = { $gte: today };

  const result = await UserMetrics.updateMany(query, {
    $set: {
      'usage.dailyTokens': 0,
      'usage.dailyMessages': 0,
    },
  });
  return result.modifiedCount || 0;
}

/**
 * Reset monthly spending counters
 */
async function resetMonthlySpending(userId = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.resetMonthlySpending(userId);
  }
  // Fallback to Mongoose
  const query = {};
  if (userId) {
    query.userId = mongoose.Types.ObjectId(userId);
  }
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);
  query.date = { $gte: firstOfMonth };

  const result = await UserMetrics.updateMany(query, {
    $set: { 'usage.monthlySpent': 0 },
  });
  return result.modifiedCount || 0;
}

/**
 * Check if user is within limits
 */
async function checkLimits(userId) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.checkLimits(userId);
  }
  // Fallback to Mongoose
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const metrics = await UserMetrics.findOne({
    userId: mongoose.Types.ObjectId(userId),
    date: { $gte: today },
  })
    .sort({ date: -1 })
    .lean();

  if (!metrics || !metrics.limits) {
    return { withinLimits: true };
  }

  const result = { withinLimits: true };

  if (metrics.limits.dailyTokenLimit) {
    const remaining = metrics.limits.dailyTokenLimit - (metrics.usage?.dailyTokens || 0);
    result.dailyTokensRemaining = Math.max(0, remaining);
    if (remaining <= 0) result.withinLimits = false;
  }

  if (metrics.limits.dailyMessageLimit) {
    const remaining = metrics.limits.dailyMessageLimit - (metrics.usage?.dailyMessages || 0);
    result.dailyMessagesRemaining = Math.max(0, remaining);
    if (remaining <= 0) result.withinLimits = false;
  }

  if (metrics.limits.monthlyBudget) {
    const remaining = metrics.limits.monthlyBudget - (metrics.usage?.monthlySpent || 0);
    result.monthlyBudgetRemaining = Math.max(0, remaining);
    if (remaining <= 0) result.withinLimits = false;
  }

  return result;
}

/**
 * Get model usage breakdown for a user
 */
async function getModelUsageBreakdown(userId, startDate = null, endDate = null) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.getModelUsageBreakdown(userId, startDate, endDate);
  }
  // Fallback to Mongoose
  const query = { userId: mongoose.Types.ObjectId(userId) };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const metrics = await UserMetrics.find(query).lean();
  const breakdown = new Map();

  for (const metric of metrics) {
    if (metric.metrics?.modelUsage) {
      for (const [model, usage] of metric.metrics.modelUsage.entries()) {
        const existing = breakdown.get(model) || { count: 0, tokens: 0, cost: 0 };
        existing.count += usage.count || 0;
        existing.tokens += usage.tokens || 0;
        existing.cost += usage.cost || 0;
        breakdown.set(model, existing);
      }
    }
  }

  return breakdown;
}

/**
 * Clean old metrics data
 */
async function cleanOldMetrics(daysToKeep = 90) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.cleanOldMetrics(daysToKeep);
  }
  // Fallback to Mongoose
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await UserMetrics.deleteMany({ date: { $lt: cutoffDate } });
  return result.deletedCount || 0;
}

/**
 * Create a new metrics entry
 */
async function createMetrics(metricsData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.create(metricsData);
  }
  // Fallback to Mongoose
  const metrics = new UserMetrics(metricsData);
  return await metrics.save();
}

/**
 * Find metrics by criteria
 */
async function findMetrics(criteria, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.find(criteria, options);
  }
  // Fallback to Mongoose
  let query = UserMetrics.find(criteria);
  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);
  if (options.skip) query = query.skip(options.skip);
  return await query.lean();
}

/**
 * Find one metrics entry by criteria
 */
async function findOneMetrics(criteria) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const metricsRepo = await getRepository('UserMetrics');
    return await metricsRepo.findOne(criteria);
  }
  // Fallback to Mongoose
  return await UserMetrics.findOne(criteria).lean();
}

module.exports = {
  updateMetrics,
  getDailyStats,
  getTopUsers,
  getUserMetrics,
  aggregateMetrics,
  updateLimits,
  resetDailyUsage,
  resetMonthlySpending,
  checkLimits,
  getModelUsageBreakdown,
  cleanOldMetrics,
  createMetrics,
  findMetrics,
  findOneMetrics,
};