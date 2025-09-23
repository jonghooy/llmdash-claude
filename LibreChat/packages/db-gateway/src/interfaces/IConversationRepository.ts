import { IRepository, ITransaction } from './IDbGateway';

/**
 * Conversation-specific repository interface
 */

export interface IConversation {
  _id: string;
  conversationId: string;
  title: string;
  user?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  endpoint?: string;
  model?: string;
  chatGptLabel?: string;
  promptPrefix?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  context?: string;
  systemMessage?: string;
  messageLimit?: number;
  attachments?: any[];
  artifact?: any;
  isArchived?: boolean;
  tags?: string[];
  modelLabel?: string;
  examples?: any[];
  agentOptions?: any;
  spec?: any;
}

export interface CreateConversationDto {
  conversationId: string;
  title: string;
  userId: string;
  endpoint?: string;
  model?: string;
  systemMessage?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  agentOptions?: any;
}

export interface UpdateConversationDto {
  title?: string;
  endpoint?: string;
  model?: string;
  systemMessage?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  isArchived?: boolean;
  tags?: string[];
  agentOptions?: any;
  artifact?: any;
}

export interface ConversationFilter {
  userId?: string;
  isArchived?: boolean;
  endpoint?: string;
  model?: string;
  tags?: string[];
  searchQuery?: string;
}

export interface IConversationRepository extends IRepository<IConversation> {
  /**
   * Find conversation by conversationId
   */
  findByConversationId(conversationId: string): Promise<IConversation | null>;

  /**
   * Get user conversations
   */
  getUserConversations(
    userId: string,
    limit?: number,
    offset?: number,
    includeArchived?: boolean
  ): Promise<IConversation[]>;

  /**
   * Search conversations
   */
  searchConversations(
    filter: ConversationFilter,
    limit?: number,
    offset?: number
  ): Promise<IConversation[]>;

  /**
   * Archive conversation
   */
  archiveConversation(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Unarchive conversation
   */
  unarchiveConversation(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Update conversation title
   */
  updateTitle(
    conversationId: string,
    title: string,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Add tags to conversation
   */
  addTags(
    conversationId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Remove tags from conversation
   */
  removeTags(
    conversationId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Get recent conversations
   */
  getRecentConversations(
    userId: string,
    days?: number,
    limit?: number
  ): Promise<IConversation[]>;

  /**
   * Delete user conversations
   */
  deleteUserConversations(
    userId: string,
    session?: ITransaction
  ): Promise<number>;

  /**
   * Count user conversations
   */
  countUserConversations(
    userId: string,
    includeArchived?: boolean
  ): Promise<number>;

  /**
   * Get conversation with messages
   */
  getConversationWithMessages(
    conversationId: string,
    messageLimit?: number
  ): Promise<IConversation & { messages?: any[] }>;

  /**
   * Clone conversation
   */
  cloneConversation(
    conversationId: string,
    newUserId?: string,
    session?: ITransaction
  ): Promise<IConversation>;

  /**
   * Update last message time
   */
  updateLastMessageTime(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean>;
}