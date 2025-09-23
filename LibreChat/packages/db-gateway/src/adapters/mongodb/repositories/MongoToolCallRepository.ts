import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IToolCallRepository,
  IToolCall,
  CreateToolCallDto,
  UpdateToolCallDto,
} from '../../../interfaces/IToolCallRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of ToolCall Repository
 */
export class MongoToolCallRepository
  extends MongoBaseRepository<IToolCall>
  implements IToolCallRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Get tool call by ID
   */
  async getToolCallById(id: string): Promise<IToolCall | null> {
    return await this.findById(id);
  }

  /**
   * Get tool calls by message ID and user
   */
  async getToolCallsByMessage(messageId: string, userId: string): Promise<IToolCall[]> {
    return await this.find({ messageId, user: userId }, { lean: true });
  }

  /**
   * Get tool calls by conversation ID and user
   */
  async getToolCallsByConvo(conversationId: string, userId: string): Promise<IToolCall[]> {
    return await this.find({ conversationId, user: userId }, { lean: true });
  }

  /**
   * Update a tool call
   */
  async updateToolCall(id: string, updateData: UpdateToolCallDto): Promise<IToolCall | null> {
    const result = await this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, lean: true }
    ).exec();

    return result as IToolCall | null;
  }

  /**
   * Delete tool calls
   */
  async deleteToolCalls(userId: string, conversationId?: string): Promise<number> {
    const query: any = { user: userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const result = await this.model.deleteMany(query).exec();
    return result.deletedCount || 0;
  }

  /**
   * Get tool calls by tool ID
   */
  async getToolCallsByToolId(toolId: string, userId?: string): Promise<IToolCall[]> {
    const query: any = { toolId };
    if (userId) {
      query.user = userId;
    }

    return await this.find(query, { lean: true });
  }

  /**
   * Bulk create tool calls
   */
  async bulkCreateToolCalls(toolCalls: CreateToolCallDto[]): Promise<IToolCall[]> {
    const docs = toolCalls.map(data => new this.model(data));
    const results = await this.model.insertMany(docs);
    return results.map(doc => doc.toObject()) as IToolCall[];
  }

  /**
   * Update tool call result
   */
  async updateToolCallResult(id: string, result: any): Promise<boolean> {
    const updateResult = await this.model.updateOne(
      { _id: id },
      { $set: { result, updatedAt: new Date() } }
    ).exec();

    return updateResult.modifiedCount > 0;
  }

  /**
   * Get tool calls with pagination
   */
  async getToolCallsPaginated(
    userId: string,
    options: { limit?: number; offset?: number; conversationId?: string }
  ): Promise<{ data: IToolCall[]; total: number }> {
    const query: any = { user: userId };
    if (options.conversationId) {
      query.conversationId = options.conversationId;
    }

    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const [data, total] = await Promise.all([
      this.find(query, {
        limit,
        skip: offset,
        sort: { createdAt: -1 },
        lean: true,
      }),
      this.model.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  /**
   * Delete tool calls by message ID
   */
  async deleteToolCallsByMessage(messageId: string, userId: string): Promise<number> {
    const result = await this.model.deleteMany({
      messageId,
      user: userId,
    }).exec();

    return result.deletedCount || 0;
  }

  /**
   * Override create to ensure required fields
   */
  async create(data: CreateToolCallDto, transaction?: ITransaction): Promise<IToolCall> {
    const session = this.getSession(transaction);

    // Ensure required fields
    if (!data.conversationId || !data.messageId || !data.toolId || !data.user) {
      throw new Error('conversationId, messageId, toolId, and user are required');
    }

    const doc = new this.model({
      ...data,
      createdAt: new Date(),
    });

    await doc.save({ session });
    return doc.toObject() as IToolCall;
  }
}