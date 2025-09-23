import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IMessageRepository,
  IMessage,
  CreateMessageDto,
  UpdateMessageDto,
} from '../../../interfaces/IMessageRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of Message Repository
 */
export class MongoMessageRepository
  extends MongoBaseRepository<IMessage>
  implements IMessageRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find messages by conversation ID
   */
  async findByConversationId(
    conversationId: string,
    limit: number = 100
  ): Promise<IMessage[]> {
    return await this.find(
      { conversationId },
      {
        sort: { createdAt: -1 },
        limit,
        lean: true,
      }
    );
  }

  /**
   * Find message by messageId
   */
  async findByMessageId(messageId: string): Promise<IMessage | null> {
    return await this.findOne({ messageId });
  }

  /**
   * Override update to use messageId instead of _id
   */
  async update(
    messageId: string,
    data: Partial<IMessage>,
    transaction?: ITransaction
  ): Promise<IMessage | null> {
    const session = this.getSession(transaction);
    const result = await this.model
      .findOneAndUpdate({ messageId }, data, { new: true, session })
      .lean()
      .exec();
    return result as IMessage | null;
  }

  /**
   * Override delete to use messageId instead of _id
   */
  async delete(messageId: string, transaction?: ITransaction): Promise<boolean> {
    const session = this.getSession(transaction);
    const result = await this.model.findOneAndDelete({ messageId }, { session });
    return !!result;
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(
    conversationId: string,
    before?: Date,
    limit: number = 50
  ): Promise<IMessage[]> {
    const query: any = { conversationId };

    if (before) {
      query.createdAt = { $lt: before };
    }

    return await this.find(query, {
      sort: { createdAt: -1 },
      limit,
      lean: true,
    });
  }

  /**
   * Delete messages by conversation ID
   */
  async deleteByConversationId(
    conversationId: string,
    session?: ITransaction
  ): Promise<number> {
    return await this.deleteMany({ conversationId }, session);
  }

  /**
   * Override findById to use messageId instead of MongoDB _id
   */
  async findById(messageId: string, options?: any): Promise<IMessage | null> {
    return await this.findByMessageId(messageId);
  }

  /**
   * Delete messages since a specific message
   */
  async deleteMessagesSince(
    conversationId: string,
    messageId: string,
    session?: ITransaction
  ): Promise<number> {
    // First find the message to get its timestamp
    const message = await this.findByMessageId(messageId);
    if (!message) {
      return 0;
    }

    // Delete all messages in the conversation created after this message
    return await this.deleteMany(
      {
        conversationId,
        createdAt: { $gte: message.createdAt },
        messageId: { $ne: messageId }, // Don't delete the reference message
      },
      session
    );
  }

  /**
   * Update message text
   */
  async updateMessageText(
    messageId: string,
    text: string,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { messageId },
      { text, updatedAt: new Date() },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Mark message as finished
   */
  async markAsFinished(
    messageId: string,
    finish_reason: string = 'stop',
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { messageId },
      {
        unfinished: false,
        finish_reason,
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get message thread
   */
  async getMessageThread(messageId: string): Promise<IMessage[]> {
    const message = await this.findByMessageId(messageId);
    if (!message) {
      return [];
    }

    const messages: IMessage[] = [message];
    let currentMessage = message;

    // Walk up the parent chain
    while (currentMessage.parentMessageId) {
      const parent = await this.findByMessageId(currentMessage.parentMessageId);
      if (!parent) break;
      messages.unshift(parent);
      currentMessage = parent;
    }

    // Walk down to get any children
    const children = await this.find({
      parentMessageId: messageId,
    });
    messages.push(...children);

    return messages;
  }

  /**
   * Count messages by user
   */
  async countUserMessages(userId: string, since?: Date): Promise<number> {
    const query: any = { user: userId };

    if (since) {
      query.createdAt = { $gte: since };
    }

    return await this.count(query);
  }

  /**
   * Get latest message in conversation
   */
  async getLatestMessage(conversationId: string): Promise<IMessage | null> {
    return await this.findOne(
      { conversationId },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    query: string,
    limit: number = 50
  ): Promise<IMessage[]> {
    const searchRegex = new RegExp(query, 'i');

    return await this.find(
      {
        user: userId,
        text: searchRegex,
      },
      {
        sort: { createdAt: -1 },
        limit,
        lean: true,
      }
    );
  }

  /**
   * Update token counts
   */
  async updateTokenCounts(
    messageId: string,
    promptTokens: number,
    completionTokens: number,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { messageId },
      {
        promptTokens,
        completionTokens,
        tokenCount: promptTokens + completionTokens,
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }
}