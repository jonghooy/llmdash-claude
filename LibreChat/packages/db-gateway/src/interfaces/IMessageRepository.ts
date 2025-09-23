import { IRepository, ITransaction } from './IDbGateway';

/**
 * Message-specific repository interface
 */

export interface IMessage {
  _id: string;
  messageId: string;
  conversationId: string;
  parentMessageId?: string;
  sender: string;
  text: string;
  isCreatedByUser: boolean;
  error?: boolean;
  createdAt: Date;
  updatedAt: Date;
  endpoint?: string;
  model?: string;
  unfinished?: boolean;
  cancelled?: boolean;
  tokenCount?: number;
  completionTokens?: number;
  promptTokens?: number;
  plugin?: any;
  plugins?: string[];
  user?: string;
  searchResult?: boolean;
  finish_reason?: string;
  files?: any[];
}

export interface CreateMessageDto {
  messageId: string;
  conversationId: string;
  parentMessageId?: string;
  sender: string;
  text: string;
  isCreatedByUser: boolean;
  endpoint?: string;
  model?: string;
  user?: string;
  error?: boolean;
  unfinished?: boolean;
  files?: any[];
  tokenCount?: number;
}

export interface UpdateMessageDto {
  text?: string;
  error?: boolean;
  unfinished?: boolean;
  cancelled?: boolean;
  tokenCount?: number;
  completionTokens?: number;
  promptTokens?: number;
  finish_reason?: string;
}

export interface IMessageRepository extends IRepository<IMessage> {
  /**
   * Find messages by conversation ID
   */
  findByConversationId(
    conversationId: string,
    limit?: number
  ): Promise<IMessage[]>;

  /**
   * Find message by messageId
   */
  findByMessageId(messageId: string): Promise<IMessage | null>;

  /**
   * Get conversation messages with pagination
   */
  getConversationMessages(
    conversationId: string,
    before?: Date,
    limit?: number
  ): Promise<IMessage[]>;

  /**
   * Delete messages by conversation ID
   */
  deleteByConversationId(
    conversationId: string,
    session?: ITransaction
  ): Promise<number>;

  /**
   * Delete messages since a specific message
   */
  deleteMessagesSince(
    conversationId: string,
    messageId: string,
    session?: ITransaction
  ): Promise<number>;

  /**
   * Update message text
   */
  updateMessageText(
    messageId: string,
    text: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Mark message as finished
   */
  markAsFinished(
    messageId: string,
    finish_reason?: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Get message thread
   */
  getMessageThread(messageId: string): Promise<IMessage[]>;

  /**
   * Count messages by user
   */
  countUserMessages(userId: string, since?: Date): Promise<number>;

  /**
   * Get latest message in conversation
   */
  getLatestMessage(conversationId: string): Promise<IMessage | null>;

  /**
   * Search messages
   */
  searchMessages(
    userId: string,
    query: string,
    limit?: number
  ): Promise<IMessage[]>;

  /**
   * Update token counts
   */
  updateTokenCounts(
    messageId: string,
    promptTokens: number,
    completionTokens: number,
    session?: ITransaction
  ): Promise<boolean>;
}