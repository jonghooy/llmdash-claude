import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * ToolCall document interface
 */
export interface IToolCall {
  _id?: string;
  conversationId: string;
  messageId: string;
  toolId: string;
  user: string;
  result?: any;
  attachments?: any[];
  blockIndex?: number;
  partIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ToolCall Create DTO
 */
export interface CreateToolCallDto extends Omit<IToolCall, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * ToolCall Update DTO
 */
export interface UpdateToolCallDto extends Partial<CreateToolCallDto> {}

/**
 * ToolCall Repository Interface
 */
export interface IToolCallRepository extends IRepository<IToolCall> {
  /**
   * Get tool call by ID
   */
  getToolCallById(id: string): Promise<IToolCall | null>;

  /**
   * Get tool calls by message ID and user
   */
  getToolCallsByMessage(messageId: string, userId: string): Promise<IToolCall[]>;

  /**
   * Get tool calls by conversation ID and user
   */
  getToolCallsByConvo(conversationId: string, userId: string): Promise<IToolCall[]>;

  /**
   * Update a tool call
   */
  updateToolCall(id: string, updateData: UpdateToolCallDto): Promise<IToolCall | null>;

  /**
   * Delete tool calls
   */
  deleteToolCalls(userId: string, conversationId?: string): Promise<number>;

  /**
   * Get tool calls by tool ID
   */
  getToolCallsByToolId(toolId: string, userId?: string): Promise<IToolCall[]>;

  /**
   * Bulk create tool calls
   */
  bulkCreateToolCalls(toolCalls: CreateToolCallDto[]): Promise<IToolCall[]>;

  /**
   * Update tool call result
   */
  updateToolCallResult(id: string, result: any): Promise<boolean>;

  /**
   * Get tool calls with pagination
   */
  getToolCallsPaginated(
    userId: string,
    options: { limit?: number; offset?: number; conversationId?: string }
  ): Promise<{ data: IToolCall[]; total: number }>;

  /**
   * Delete tool calls by message ID
   */
  deleteToolCallsByMessage(messageId: string, userId: string): Promise<number>;
}