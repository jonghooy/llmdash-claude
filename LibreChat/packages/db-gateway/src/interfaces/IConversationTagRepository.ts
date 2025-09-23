import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * ConversationTag document interface
 */
export interface IConversationTag {
  _id?: string;
  tag: string;
  user: string;
  description?: string;
  count?: number;
  position?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ConversationTag Create DTO
 */
export interface CreateConversationTagDto extends Omit<IConversationTag, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * ConversationTag Update DTO
 */
export interface UpdateConversationTagDto extends Partial<CreateConversationTagDto> {}

/**
 * ConversationTag Repository Interface
 */
export interface IConversationTagRepository extends IRepository<IConversationTag> {
  /**
   * Get all tags for a user
   */
  getUserTags(user: string): Promise<IConversationTag[]>;

  /**
   * Find a tag by user and tag name
   */
  findUserTag(user: string, tag: string): Promise<IConversationTag | null>;

  /**
   * Create or update a tag
   */
  upsertTag(user: string, tag: string, data: Partial<IConversationTag>): Promise<IConversationTag>;

  /**
   * Update tag position
   */
  updateTagPosition(user: string, tag: string, newPosition: number): Promise<boolean>;

  /**
   * Adjust positions when a tag is moved or deleted
   */
  adjustPositions(
    user: string,
    startPosition: number,
    endPosition: number,
    increment: number
  ): Promise<number>;

  /**
   * Delete a user's tag
   */
  deleteUserTag(user: string, tag: string): Promise<IConversationTag | null>;

  /**
   * Increment tag count
   */
  incrementTagCount(user: string, tag: string, increment?: number): Promise<boolean>;

  /**
   * Get max position for user tags
   */
  getMaxPosition(user: string): Promise<number>;

  /**
   * Update tag description
   */
  updateTagDescription(user: string, tag: string, description?: string): Promise<boolean>;

  /**
   * Rename a tag
   */
  renameTag(user: string, oldTag: string, newTag: string): Promise<boolean>;

  /**
   * Bulk update tag counts
   */
  bulkUpdateCounts(tagCounts: { user: string; tag: string; count: number }[]): Promise<number>;
}