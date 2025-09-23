const mongoose = require('mongoose');
const { Schema } = mongoose;
const operations = require('./userMetricsOperations');

const UserMetricsSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  date: { 
    type: Date, 
    required: true,
    index: true 
  },
  metrics: {
    messageCount: { type: Number, default: 0 },
    conversationCount: { type: Number, default: 0 },
    tokenUsage: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    modelUsage: {
      type: Map,
      of: {
        count: { type: Number, default: 0 },
        tokens: { type: Number, default: 0 },
        cost: { type: Number, default: 0 }
      }
    },
    apiCalls: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    responseTime: {
      avg: { type: Number, default: 0 },
      min: { type: Number, default: Number.MAX_VALUE },
      max: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    costBreakdown: {
      total: { type: Number, default: 0 },
      byModel: {
        type: Map,
        of: Number
      }
    }
  },
  limits: {
    dailyTokenLimit: { type: Number },
    dailyMessageLimit: { type: Number },
    monthlyBudget: { type: Number },
    concurrentRequests: { type: Number, default: 5 }
  },
  usage: {
    dailyTokens: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    monthlySpent: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  // MongoDB Time Series Collection for efficient metrics storage
  timeseries: {
    timeField: 'date',
    metaField: 'userId',
    granularity: 'hours'
  }
});

// Indexes for efficient querying
UserMetricsSchema.index({ userId: 1, date: -1 });
UserMetricsSchema.index({ 'metrics.tokenUsage.total': -1 });
UserMetricsSchema.index({ 'metrics.costBreakdown.total': -1 });

// Static methods for aggregation
UserMetricsSchema.statics.getDailyStats = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalMessages: { $sum: '$metrics.messageCount' },
        totalTokens: { $sum: '$metrics.tokenUsage.total' },
        totalCost: { $sum: '$metrics.costBreakdown.total' },
        avgResponseTime: { $avg: '$metrics.responseTime.avg' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

UserMetricsSchema.statics.getTopUsers = async function(limit = 10, sortBy = 'tokens') {
  const sortField = sortBy === 'cost' 
    ? 'totalCost' 
    : sortBy === 'messages' 
    ? 'totalMessages' 
    : 'totalTokens';
    
  return this.aggregate([
    {
      $group: {
        _id: '$userId',
        totalMessages: { $sum: '$metrics.messageCount' },
        totalTokens: { $sum: '$metrics.tokenUsage.total' },
        totalCost: { $sum: '$metrics.costBreakdown.total' },
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
        totalCost: 1,
        avgResponseTime: 1
      }
    },
    { $sort: { [sortField]: -1 } },
    { $limit: limit }
  ]);
};

const UserMetrics = mongoose.model('UserMetrics', UserMetricsSchema);

// Export model with operations
module.exports = Object.assign(UserMetrics, operations);

// Also export the model directly for backward compatibility
module.exports.Model = UserMetrics;