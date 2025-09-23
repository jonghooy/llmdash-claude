import { IRepository, ITransaction } from './IDbGateway';

/**
 * Transaction-specific repository interface (for token/credit transactions, not DB transactions)
 */

export interface ITokenTransaction {
  _id: string;
  user: string;
  conversationId?: string;
  messageId?: string;
  model?: string;
  provider?: string;
  tokenType: 'prompt' | 'completion' | 'total';
  rawAmount: number;
  amount?: number;
  rate?: number;
  createdAt: Date;
  context?: string;
  endpointTokenConfig?: any;
}

export interface CreateTransactionDto {
  user: string;
  conversationId?: string;
  messageId?: string;
  model?: string;
  provider?: string;
  tokenType: 'prompt' | 'completion' | 'total';
  rawAmount: number;
  amount?: number;
  rate?: number;
  context?: string;
  endpointTokenConfig?: any;
}

export interface TransactionFilter {
  user?: string;
  conversationId?: string;
  messageId?: string;
  model?: string;
  provider?: string;
  tokenType?: 'prompt' | 'completion' | 'total';
  createdAt?: { $gte?: Date; $lt?: Date };
}

export interface TransactionSummary {
  totalTokens: number;
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
  transactionCount: number;
  byModel?: Record<string, {
    tokens: number;
    cost: number;
    count: number;
  }>;
}

export interface ITransactionRepository extends IRepository<ITokenTransaction> {
  /**
   * Find transactions by user
   */
  findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ITokenTransaction[]>;

  /**
   * Find transactions by conversation
   */
  findByConversation(conversationId: string): Promise<ITokenTransaction[]>;

  /**
   * Find transactions by message
   */
  findByMessage(messageId: string): Promise<ITokenTransaction[]>;

  /**
   * Create bulk transactions
   */
  createBulkTransactions(
    transactions: CreateTransactionDto[],
    session?: ITransaction
  ): Promise<ITokenTransaction[]>;

  /**
   * Get user token usage summary
   */
  getUserSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TransactionSummary>;

  /**
   * Get conversation token usage
   */
  getConversationTokens(conversationId: string): Promise<number>;

  /**
   * Get user daily usage
   */
  getUserDailyUsage(
    userId: string,
    days?: number
  ): Promise<Array<{
    date: Date;
    tokens: number;
    cost: number;
  }>>;

  /**
   * Get model usage statistics
   */
  getModelUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    model: string;
    provider: string;
    totalTokens: number;
    totalCost: number;
    transactionCount: number;
  }>>;

  /**
   * Delete old transactions
   */
  deleteOldTransactions(
    beforeDate: Date,
    session?: ITransaction
  ): Promise<number>;

  /**
   * Get top users by usage
   */
  getTopUsersByUsage(
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    userId: string;
    totalTokens: number;
    totalCost: number;
  }>>;

  /**
   * Calculate total cost for user
   */
  calculateUserCost(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number>;

  /**
   * Search transactions
   */
  searchTransactions(
    filter: TransactionFilter,
    limit?: number,
    offset?: number
  ): Promise<ITokenTransaction[]>;
}