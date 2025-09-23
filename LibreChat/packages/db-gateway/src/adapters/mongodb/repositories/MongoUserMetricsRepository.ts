import { Model, Types } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IUserMetricsRepository,
  IUserMetrics,
  CreateUserMetricsDto,
  UpdateUserMetricsDto,
  IDailyStats,
  ITopUser,
} from '../../../interfaces/IUserMetricsRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of UserMetrics Repository
 */
export class MongoUserMetricsRepository
  extends MongoBaseRepository<IUserMetrics>
  implements IUserMetricsRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Update or increment metrics for a user
   */
  async updateMetrics(
    userId: string,
    date: Date,
    metricsUpdate: Partial<IUserMetrics['metrics']>
  ): Promise<IUserMetrics> {
    // Start of current hour for time series
    const hourDate = new Date(date);
    hourDate.setMinutes(0, 0, 0);

    const update: any = {};

    // Build increment operations for metrics
    if (metricsUpdate.messageCount !== undefined) {
      update.$inc = update.$inc || {};
      update.$inc['metrics.messageCount'] = metricsUpdate.messageCount;
    }
    if (metricsUpdate.conversationCount !== undefined) {
      update.$inc = update.$inc || {};
      update.$inc['metrics.conversationCount'] = metricsUpdate.conversationCount;
    }
    if (metricsUpdate.apiCalls !== undefined) {
      update.$inc = update.$inc || {};
      update.$inc['metrics.apiCalls'] = metricsUpdate.apiCalls;
    }
    if (metricsUpdate.errors !== undefined) {
      update.$inc = update.$inc || {};
      update.$inc['metrics.errors'] = metricsUpdate.errors;
    }

    // Handle token usage
    if (metricsUpdate.tokenUsage) {
      update.$inc = update.$inc || {};
      if (metricsUpdate.tokenUsage.input) {
        update.$inc['metrics.tokenUsage.input'] = metricsUpdate.tokenUsage.input;
      }
      if (metricsUpdate.tokenUsage.output) {
        update.$inc['metrics.tokenUsage.output'] = metricsUpdate.tokenUsage.output;
      }
      if (metricsUpdate.tokenUsage.total) {
        update.$inc['metrics.tokenUsage.total'] = metricsUpdate.tokenUsage.total;
      }
    }

    // Handle cost breakdown
    if (metricsUpdate.costBreakdown?.total) {
      update.$inc = update.$inc || {};
      update.$inc['metrics.costBreakdown.total'] = metricsUpdate.costBreakdown.total;
    }

    // Handle response time (requires custom aggregation logic)
    if (metricsUpdate.responseTime) {
      update.$set = update.$set || {};
      // This would need more complex logic in production to properly average
      update.$set['metrics.responseTime'] = metricsUpdate.responseTime;
    }

    const doc = await this.model.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        date: hourDate,
      },
      update,
      {
        new: true,
        upsert: true,
        lean: true,
      }
    ).exec();

    return doc as IUserMetrics;
  }

  /**
   * Get daily statistics for a user
   */
  async getDailyStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IDailyStats[]> {
    const result = await this.model.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalMessages: { $sum: '$metrics.messageCount' },
          totalTokens: { $sum: '$metrics.tokenUsage.total' },
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          avgResponseTime: { $avg: '$metrics.responseTime.avg' },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return result as IDailyStats[];
  }

  /**
   * Get top users by various metrics
   */
  async getTopUsers(
    limit: number = 10,
    sortBy: 'tokens' | 'cost' | 'messages' = 'tokens'
  ): Promise<ITopUser[]> {
    const sortField =
      sortBy === 'cost' ? 'totalCost' :
      sortBy === 'messages' ? 'totalMessages' :
      'totalTokens';

    const result = await this.model.aggregate([
      {
        $group: {
          _id: '$userId',
          totalMessages: { $sum: '$metrics.messageCount' },
          totalTokens: { $sum: '$metrics.tokenUsage.total' },
          totalCost: { $sum: '$metrics.costBreakdown.total' },
          avgResponseTime: { $avg: '$metrics.responseTime.avg' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
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
          avgResponseTime: 1,
        },
      },
      { $sort: { [sortField]: -1 } },
      { $limit: limit },
    ]).exec();

    return result as ITopUser[];
  }

  /**
   * Get metrics for a specific user and date range
   */
  async getUserMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IUserMetrics[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return await this.find(query, {
      sort: { date: -1 },
      lean: true,
    });
  }

  /**
   * Aggregate metrics by time period
   */
  async aggregateMetrics(
    period: 'hour' | 'day' | 'week' | 'month',
    startDate?: Date
  ): Promise<{
    totalMessages: number;
    totalConversations: number;
    totalTokens: number;
    totalCost: number;
    totalApiCalls: number;
    totalErrors: number;
    activeUsers: number;
    avgResponseTime: number;
  }> {
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

    const result = await this.model.aggregate([
      {
        $match: {
          date: { $gte: dateThreshold },
        },
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
    ]).exec();

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
  async updateLimits(
    userId: string,
    limits: IUserMetrics['limits']
  ): Promise<IUserMetrics | null> {
    // Find the most recent metrics entry for the user
    const doc = await this.model.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { limits } },
      {
        new: true,
        sort: { date: -1 },
        lean: true,
      }
    ).exec();

    return doc as IUserMetrics | null;
  }

  /**
   * Reset daily usage counters
   */
  async resetDailyUsage(userId?: string): Promise<number> {
    const query: any = {};
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.date = { $gte: today };

    const result = await this.model.updateMany(
      query,
      {
        $set: {
          'usage.dailyTokens': 0,
          'usage.dailyMessages': 0,
        },
      }
    ).exec();

    return result.modifiedCount || 0;
  }

  /**
   * Reset monthly spending counters
   */
  async resetMonthlySpending(userId?: string): Promise<number> {
    const query: any = {};
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    query.date = { $gte: firstOfMonth };

    const result = await this.model.updateMany(
      query,
      {
        $set: {
          'usage.monthlySpent': 0,
        },
      }
    ).exec();

    return result.modifiedCount || 0;
  }

  /**
   * Check if user is within limits
   */
  async checkLimits(userId: string): Promise<{
    withinLimits: boolean;
    dailyTokensRemaining?: number;
    dailyMessagesRemaining?: number;
    monthlyBudgetRemaining?: number;
  }> {
    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await this.model.findOne({
      userId: new Types.ObjectId(userId),
      date: { $gte: today },
    })
      .sort({ date: -1 })
      .lean()
      .exec();

    if (!metrics || !metrics.limits) {
      return { withinLimits: true };
    }

    const result: any = { withinLimits: true };

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
  async getModelUsageBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, {
    count: number;
    tokens: number;
    cost: number;
  }>> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const metrics = await this.model.find(query).lean().exec();

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
  async cleanOldMetrics(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.model.deleteMany({
      date: { $lt: cutoffDate },
    }).exec();

    return result.deletedCount || 0;
  }
}