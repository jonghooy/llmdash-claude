import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IConversationRepository,
  IConversation,
  CreateConversationDto,
  UpdateConversationDto,
  ConversationFilter,
} from '../../../interfaces/IConversationRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Conversation Repository
 */
export class MongoConversationRepository
  extends MongoBaseRepository<IConversation>
  implements IConversationRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find conversation by conversationId
   */
  async findByConversationId(conversationId: string): Promise<IConversation | null> {
    return await this.findOne({ conversationId });
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    userId: string,
    limit: number = 100,
    offset: number = 0,
    includeArchived: boolean = false
  ): Promise<IConversation[]> {
    const query: any = { user: userId };

    if (!includeArchived) {
      query.isArchived = { $ne: true };
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      skip: offset,
      limit,
      lean: true,
    });
  }

  /**
   * Search conversations
   */
  async searchConversations(
    filter: ConversationFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<IConversation[]> {
    const query: any = {};

    if (filter.userId) {
      query.user = filter.userId;
    }

    if (filter.isArchived !== undefined) {
      query.isArchived = filter.isArchived;
    }

    if (filter.endpoint) {
      query.endpoint = filter.endpoint;
    }

    if (filter.model) {
      query.model = filter.model;
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter.searchQuery) {
      const searchRegex = new RegExp(filter.searchQuery, 'i');
      query.$or = [
        { title: searchRegex },
        { systemMessage: searchRegex },
      ];
    }

    return await this.find(query, {
      sort: { updatedAt: -1 },
      skip: offset,
      limit,
      lean: true,
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      { isArchived: true, updatedAt: new Date() },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      { isArchived: false, updatedAt: new Date() },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update conversation title
   */
  async updateTitle(
    conversationId: string,
    title: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      { title, updatedAt: new Date() },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Add tags to conversation
   */
  async addTags(
    conversationId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      {
        $addToSet: { tags: { $each: tags } },
        updatedAt: new Date()
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove tags from conversation
   */
  async removeTags(
    conversationId: string,
    tags: string[],
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      {
        $pull: { tags: { $in: tags } },
        updatedAt: new Date()
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get recent conversations
   */
  async getRecentConversations(
    userId: string,
    days: number = 7,
    limit: number = 50
  ): Promise<IConversation[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await this.find(
      {
        user: userId,
        updatedAt: { $gte: dateThreshold },
        isArchived: { $ne: true },
      },
      {
        sort: { updatedAt: -1 },
        limit,
        lean: true,
      }
    );
  }

  /**
   * Delete user conversations
   */
  async deleteUserConversations(
    userId: string,
    session?: ITransaction
  ): Promise<number> {
    return await this.deleteMany({ user: userId }, session);
  }

  /**
   * Count user conversations
   */
  async countUserConversations(
    userId: string,
    includeArchived: boolean = false
  ): Promise<number> {
    const query: any = { user: userId };

    if (!includeArchived) {
      query.isArchived = { $ne: true };
    }

    return await this.count(query);
  }

  /**
   * Get conversation with messages
   */
  async getConversationWithMessages(
    conversationId: string,
    messageLimit: number = 50
  ): Promise<IConversation & { messages?: any[] }> {
    const pipeline = [
      { $match: { conversationId } },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$conversationId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$conversationId', '$$convId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: messageLimit },
          ],
          as: 'messages',
        },
      },
    ];

    const results = await this.aggregate(pipeline);
    return results[0] || null;
  }

  /**
   * Clone conversation
   */
  async cloneConversation(
    conversationId: string,
    newUserId?: string,
    session?: ITransaction
  ): Promise<IConversation> {
    const original = await this.findByConversationId(conversationId);
    if (!original) {
      throw new Error('Conversation not found');
    }

    const cloned = {
      ...original,
      _id: undefined,
      conversationId: `${conversationId}-clone-${Date.now()}`,
      title: `${original.title} (Copy)`,
      user: newUserId || original.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    delete (cloned as any)._id;
    return await this.create(cloned, session);
  }

  /**
   * Update last message time
   */
  async updateLastMessageTime(
    conversationId: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { conversationId },
      { updatedAt: new Date() },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * LibreChat specific methods (not in interface but needed)
   */

  /**
   * Search conversation by userId, conversationId, and title
   */
  async searchConversation(userId: string, conversationId: string, title?: string): Promise<IConversation[]> {
    const query: any = { user: userId };

    if (conversationId) {
      query.conversationId = conversationId;
    }

    if (title) {
      query.title = new RegExp(title, 'i');
    }

    return await this.find(query, { sort: { updatedAt: -1 }, lean: true });
  }

  /**
   * Get conversation by userId and conversationId
   */
  async getConvo(userId: string, conversationId: string): Promise<IConversation | null> {
    return await this.findOne({ user: userId, conversationId });
  }

  /**
   * Get conversation title
   */
  async getConvoTitle(userId: string, conversationId: string): Promise<string | null> {
    const convo = await this.findOne({ user: userId, conversationId }, { select: 'title' });
    return convo ? convo.title : null;
  }

  /**
   * Save conversation (upsert)
   */
  async saveConvo(userId: string, conversationData: Partial<IConversation>): Promise<IConversation> {
    const { conversationId } = conversationData;
    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    return await this.model.findOneAndUpdate(
      { user: userId, conversationId },
      { ...conversationData, user: userId },
      { upsert: true, new: true, lean: true }
    ) as unknown as IConversation;
  }

  /**
   * Delete conversations with optional file deletion
   */
  async deleteConvos(userId: string, filter: any, deleteFiles?: boolean): Promise<{ deletedCount: number }> {
    const query = { user: userId, ...filter };
    const result = await this.model.deleteMany(query);

    // Note: File deletion should be handled separately if needed
    if (deleteFiles) {
      // This should trigger file deletion through a separate service
      console.log('File deletion requested but not implemented in repository');
    }

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Delete null or empty conversations
   */
  async deleteNullOrEmptyConversations(): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany({
      $or: [
        { conversationId: null },
        { conversationId: '' },
        { title: null },
        { title: '' }
      ]
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Get conversation files
   */
  async getConvoFiles(userId: string, conversationId: string): Promise<any[]> {
    // This should be implemented with proper file lookup
    // For now, return empty array or implement with file model
    return [];
  }

  /**
   * Get conversations by cursor (pagination) - LibreChat format
   */
  async getConvosByCursor(
    user: string,
    { cursor, limit = 25, isArchived = false, tags, search, order = 'desc' }: any = {},
  ): Promise<any> {
    const filters: any[] = [{ user }];

    if (isArchived) {
      filters.push({ isArchived: true });
    } else {
      filters.push({ $or: [{ isArchived: false }, { isArchived: { $exists: false } }] });
    }

    if (Array.isArray(tags) && tags.length > 0) {
      filters.push({ tags: { $in: tags } });
    }

    filters.push({ $or: [{ expiredAt: null }, { expiredAt: { $exists: false } }] });

    if (cursor) {
      filters.push({ updatedAt: { $lt: new Date(cursor) } });
    }

    const query = filters.length === 1 ? filters[0] : { $and: filters };

    try {
      const convos = await this.model
        .find(query)
        .select(
          'conversationId endpoint title createdAt updatedAt user model agent_id assistant_id spec iconURL',
        )
        .sort({ updatedAt: order === 'asc' ? 1 : -1 })
        .limit(limit + 1)
        .lean();

      let nextCursor = null;
      if (convos.length > limit) {
        nextCursor = convos[limit - 1].updatedAt.toISOString();
        convos.pop();
      }

      return { conversations: convos, nextCursor };
    } catch (error) {
      console.error('[getConvosByCursor] Error getting conversations', error);
      return { message: 'Error getting conversations' };
    }
  }

  /**
   * Query conversations with search
   */
  async getConvosQueried(userId: string, query: string, pageNumber: number = 1, pageSize: number = 12): Promise<{
    conversations: IConversation[];
    pageNumber: number;
    pageSize: number;
    pages: number;
  }> {
    const searchQuery = {
      user: userId,
      $or: [
        { title: new RegExp(query, 'i') },
        { conversationId: query }
      ]
    };

    const total = await this.count(searchQuery);
    const pages = Math.ceil(total / pageSize);

    const conversations = await this.find(searchQuery, {
      sort: { updatedAt: -1 },
      skip: (pageNumber - 1) * pageSize,
      limit: pageSize,
      lean: true
    });

    return {
      conversations,
      pageNumber,
      pageSize,
      pages
    };
  }

  /**
   * Bulk save conversations
   */
  async bulkSaveConvos(conversations: IConversation[]): Promise<any> {
    const bulkOps = conversations.map(convo => ({
      updateOne: {
        filter: { conversationId: convo.conversationId },
        update: { $set: convo },
        upsert: true
      }
    }));

    return await this.model.bulkWrite(bulkOps);
  }
}