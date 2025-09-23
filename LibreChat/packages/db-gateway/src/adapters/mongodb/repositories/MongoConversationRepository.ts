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
}