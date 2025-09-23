import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IConversationTagRepository,
  IConversationTag,
  CreateConversationTagDto,
  UpdateConversationTagDto,
} from '../../../interfaces/IConversationTagRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of ConversationTag Repository
 */
export class MongoConversationTagRepository
  extends MongoBaseRepository<IConversationTag>
  implements IConversationTagRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Get all tags for a user, sorted by position
   */
  async getUserTags(user: string): Promise<IConversationTag[]> {
    return await this.find({ user }, { sort: { position: 1 }, lean: true });
  }

  /**
   * Find a tag by user and tag name
   */
  async findUserTag(user: string, tag: string): Promise<IConversationTag | null> {
    return await this.findOne({ user, tag });
  }

  /**
   * Create or update a tag
   */
  async upsertTag(user: string, tag: string, data: Partial<IConversationTag>): Promise<IConversationTag> {
    const updateData = {
      ...data,
      tag,
      user,
      $setOnInsert: { createdAt: new Date() },
    };

    const result = await this.model
      .findOneAndUpdate(
        { tag, user },
        updateData,
        { new: true, upsert: true, lean: true }
      )
      .exec();

    if (!result) {
      throw new Error('Failed to upsert tag');
    }

    return result as unknown as IConversationTag;
  }

  /**
   * Update tag position
   */
  async updateTagPosition(user: string, tag: string, newPosition: number): Promise<boolean> {
    const result = await this.model.updateOne(
      { user, tag },
      { position: newPosition, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Adjust positions when a tag is moved or deleted
   */
  async adjustPositions(
    user: string,
    startPosition: number,
    endPosition: number,
    increment: number
  ): Promise<number> {
    const position = startPosition < endPosition
      ? { $gt: startPosition, $lte: endPosition }
      : { $gte: endPosition, $lt: startPosition };

    const result = await this.model.updateMany(
      { user, position },
      { $inc: { position: increment } }
    );

    return result.modifiedCount;
  }

  /**
   * Delete a user's tag
   */
  async deleteUserTag(user: string, tag: string): Promise<IConversationTag | null> {
    const result = await this.model.findOneAndDelete({ user, tag }).lean().exec();
    return result as IConversationTag | null;
  }

  /**
   * Increment tag count
   */
  async incrementTagCount(user: string, tag: string, increment: number = 1): Promise<boolean> {
    const result = await this.model.updateOne(
      { user, tag },
      { $inc: { count: increment }, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get max position for user tags
   */
  async getMaxPosition(user: string): Promise<number> {
    const maxTag = await this.model.findOne({ user }).sort('-position').lean().exec();
    return (maxTag as any)?.position || 0;
  }

  /**
   * Update tag description
   */
  async updateTagDescription(user: string, tag: string, description?: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { user, tag },
      { description, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Rename a tag
   */
  async renameTag(user: string, oldTag: string, newTag: string): Promise<boolean> {
    // Check if new tag already exists
    const existing = await this.findOne({ user, tag: newTag });
    if (existing) {
      throw new Error('Tag already exists');
    }

    const result = await this.model.updateOne(
      { user, tag: oldTag },
      { tag: newTag, updatedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Bulk update tag counts
   */
  async bulkUpdateCounts(tagCounts: { user: string; tag: string; count: number }[]): Promise<number> {
    const bulkOps = tagCounts.map(({ user, tag, count }) => ({
      updateOne: {
        filter: { user, tag },
        update: { $set: { count, updatedAt: new Date() } },
      },
    }));

    const result = await this.model.bulkWrite(bulkOps);
    return result.modifiedCount;
  }

  /**
   * Override create to ensure unique tag per user
   */
  async create(data: CreateConversationTagDto, transaction?: ITransaction): Promise<IConversationTag> {
    const session = this.getSession(transaction);

    // Ensure tag is unique per user
    const existing = await this.findOne({ tag: data.tag, user: data.user });
    if (existing) {
      throw new Error(`Tag ${data.tag} already exists for this user`);
    }

    // If no position specified, use max position + 1
    if (data.position === undefined) {
      const maxPosition = await this.getMaxPosition(data.user);
      data.position = maxPosition + 1;
    }

    const doc = new this.model(data);
    await doc.save({ session });
    return doc.toObject() as IConversationTag;
  }
}