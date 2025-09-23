import { IRepository } from './IRepository';

export interface IUserMetrics {
  _id?: any;
  userId: any;
  date: Date;
  metrics: {
    messageCount: number;
    conversationCount: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    modelUsage: Map<string, {
      count: number;
      tokens: number;
      cost: number;
    }>;
    apiCalls: number;
    errors: number;
    responseTime: {
      avg: number;
      min: number;
      max: number;
      count: number;
    };
    costBreakdown: {
      total: number;
      byModel: Map<string, number>;
    };
  };
  limits?: {
    dailyTokenLimit?: number;
    dailyMessageLimit?: number;
    monthlyBudget?: number;
    concurrentRequests?: number;
  };
  usage?: {
    dailyTokens: number;
    dailyMessages: number;
    monthlySpent: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserMetricsDto {
  userId: any;
  date: Date;
  metrics: Partial<IUserMetrics['metrics']>;
  limits?: IUserMetrics['limits'];
  usage?: IUserMetrics['usage'];
}

export interface UpdateUserMetricsDto {
  metrics?: Partial<IUserMetrics['metrics']>;
  limits?: IUserMetrics['limits'];
  usage?: IUserMetrics['usage'];
}

export interface IDailyStats {
  _id: string;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
}

export interface ITopUser {
  userId: any;
  username?: string;
  email?: string;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
}

/**
 * Repository interface for UserMetrics operations
 */
export interface IUserMetricsRepository extends IRepository<IUserMetrics> {
  /**
   * Update or increment metrics for a user
   */
  updateMetrics(
    userId: string,
    date: Date,
    metricsUpdate: Partial<IUserMetrics['metrics']>
  ): Promise<IUserMetrics>;

  /**
   * Get daily statistics for a user
   */
  getDailyStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IDailyStats[]>;

  /**
   * Get top users by various metrics
   */
  getTopUsers(
    limit?: number,
    sortBy?: 'tokens' | 'cost' | 'messages'
  ): Promise<ITopUser[]>;

  /**
   * Get metrics for a specific user and date range
   */
  getUserMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IUserMetrics[]>;

  /**
   * Aggregate metrics by time period
   */
  aggregateMetrics(
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
  }>;

  /**
   * Update user limits
   */
  updateLimits(
    userId: string,
    limits: IUserMetrics['limits']
  ): Promise<IUserMetrics | null>;

  /**
   * Reset daily usage counters
   */
  resetDailyUsage(userId?: string): Promise<number>;

  /**
   * Reset monthly spending counters
   */
  resetMonthlySpending(userId?: string): Promise<number>;

  /**
   * Check if user is within limits
   */
  checkLimits(userId: string): Promise<{
    withinLimits: boolean;
    dailyTokensRemaining?: number;
    dailyMessagesRemaining?: number;
    monthlyBudgetRemaining?: number;
  }>;

  /**
   * Get model usage breakdown for a user
   */
  getModelUsageBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, {
    count: number;
    tokens: number;
    cost: number;
  }>>;

  /**
   * Clean old metrics data
   */
  cleanOldMetrics(daysToKeep: number): Promise<number>;
}