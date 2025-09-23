import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  ITransactionRepository,
  ITokenTransaction,
  CreateTransactionDto,
  TransactionFilter,
  TransactionSummary,
} from '../../../interfaces/ITransactionRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Transaction Repository
 */
export class MongoTransactionRepository
  extends MongoBaseRepository<ITokenTransaction>
  implements ITransactionRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find transactions by user
   */
  async findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ITokenTransaction[]> {
    const query: any = { user: userId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lt = endDate;
    }

    return await this.find(query, {
      sort: { createdAt: -1 },
      lean: true,
    });
  }

  /**
   * Find transactions by conversation
   */
  async findByConversation(conversationId: string): Promise<ITokenTransaction[]> {
    return await this.find(
      { conversationId },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Find transactions by message
   */
  async findByMessage(messageId: string): Promise<ITokenTransaction[]> {
    return await this.find(
      { messageId },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Create bulk transactions
   */
  async createBulkTransactions(
    transactions: CreateTransactionDto[],
    session?: ITransaction
  ): Promise<ITokenTransaction[]> {
    return await this.createMany(transactions as Partial<ITokenTransaction>[], session);
  }

  /**
   * Get user token usage summary
   */
  async getUserSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TransactionSummary> {
    const pipeline: any[] = [
      { $match: { user: userId } },
    ];

    if (startDate || endDate) {
      const dateMatch: any = {};
      if (startDate) dateMatch.$gte = startDate;
      if (endDate) dateMatch.$lt = endDate;
      pipeline[0].$match.createdAt = dateMatch;
    }

    pipeline.push(
      {
        $group: {
          _id: {
            tokenType: '$tokenType',
            model: '$model',
          },
          totalTokens: { $sum: '$rawAmount' },
          totalCost: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$totalCost' },
          transactionCount: { $sum: '$count' },
          promptTokens: {
            $sum: {
              $cond: [{ $eq: ['$_id.tokenType', 'prompt'] }, '$totalTokens', 0],
            },
          },
          completionTokens: {
            $sum: {
              $cond: [{ $eq: ['$_id.tokenType', 'completion'] }, '$totalTokens', 0],
            },
          },
          byModel: {
            $push: {
              model: '$_id.model',
              tokens: '$totalTokens',
              cost: '$totalCost',
              count: '$count',
            },
          },
        },
      },
    );

    const results = await this.aggregate(pipeline);

    if (results.length === 0) {
      return {
        totalTokens: 0,
        totalCost: 0,
        promptTokens: 0,
        completionTokens: 0,
        transactionCount: 0,
        byModel: {},
      };
    }

    const summary = results[0];

    // Convert byModel array to object
    const byModel: Record<string, any> = {};
    if (summary.byModel) {
      summary.byModel.forEach((item: any) => {
        if (item.model) {
          byModel[item.model] = {
            tokens: item.tokens,
            cost: item.cost,
            count: item.count,
          };
        }
      });
    }

    return {
      totalTokens: summary.totalTokens || 0,
      totalCost: summary.totalCost || 0,
      promptTokens: summary.promptTokens || 0,
      completionTokens: summary.completionTokens || 0,
      transactionCount: summary.transactionCount || 0,
      byModel,
    };
  }

  /**
   * Get conversation token usage
   */
  async getConversationTokens(conversationId: string): Promise<number> {
    const result = await this.aggregate([
      { $match: { conversationId } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$rawAmount' },
        },
      },
    ]);

    return result[0]?.totalTokens || 0;
  }

  /**
   * Get user daily usage
   */
  async getUserDailyUsage(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: Date; tokens: number; cost: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          tokens: { $sum: '$rawAmount' },
          cost: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.aggregate(pipeline);

    return results.map((r) => ({
      date: new Date(r._id),
      tokens: r.tokens,
      cost: r.cost || 0,
    }));
  }

  /**
   * Get model usage statistics
   */
  async getModelUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    model: string;
    provider: string;
    totalTokens: number;
    totalCost: number;
    transactionCount: number;
  }>> {
    const pipeline: any[] = [];

    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lt = endDate;
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            model: '$model',
            provider: '$provider',
          },
          totalTokens: { $sum: '$rawAmount' },
          totalCost: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalTokens: -1 } }
    );

    const results = await this.aggregate(pipeline);

    return results.map((r) => ({
      model: r._id.model || 'unknown',
      provider: r._id.provider || 'unknown',
      totalTokens: r.totalTokens,
      totalCost: r.totalCost || 0,
      transactionCount: r.transactionCount,
    }));
  }

  /**
   * Delete old transactions
   */
  async deleteOldTransactions(
    beforeDate: Date,
    session?: ITransaction
  ): Promise<number> {
    return await this.deleteMany(
      { createdAt: { $lt: beforeDate } },
      session
    );
  }

  /**
   * Get top users by usage
   */
  async getTopUsersByUsage(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ userId: string; totalTokens: number; totalCost: number }>> {
    const pipeline: any[] = [];

    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lt = endDate;
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      {
        $group: {
          _id: '$user',
          totalTokens: { $sum: '$rawAmount' },
          totalCost: { $sum: '$amount' },
        },
      },
      { $sort: { totalTokens: -1 } },
      { $limit: limit }
    );

    const results = await this.aggregate(pipeline);

    return results.map((r) => ({
      userId: r._id,
      totalTokens: r.totalTokens,
      totalCost: r.totalCost || 0,
    }));
  }

  /**
   * Calculate total cost for user
   */
  async calculateUserCost(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const pipeline: any[] = [
      { $match: { user: userId } },
    ];

    if (startDate || endDate) {
      const dateMatch: any = {};
      if (startDate) dateMatch.$gte = startDate;
      if (endDate) dateMatch.$lt = endDate;
      pipeline[0].$match.createdAt = dateMatch;
    }

    pipeline.push({
      $group: {
        _id: null,
        totalCost: { $sum: '$amount' },
      },
    });

    const results = await this.aggregate(pipeline);
    return results[0]?.totalCost || 0;
  }

  /**
   * Search transactions
   */
  async searchTransactions(
    filter: TransactionFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<ITokenTransaction[]> {
    const query: any = {};

    if (filter.user) query.user = filter.user;
    if (filter.conversationId) query.conversationId = filter.conversationId;
    if (filter.messageId) query.messageId = filter.messageId;
    if (filter.model) query.model = filter.model;
    if (filter.provider) query.provider = filter.provider;
    if (filter.tokenType) query.tokenType = filter.tokenType;
    if (filter.createdAt) query.createdAt = filter.createdAt;

    return await this.find(query, {
      sort: { createdAt: -1 },
      skip: offset,
      limit,
      lean: true,
    });
  }
}