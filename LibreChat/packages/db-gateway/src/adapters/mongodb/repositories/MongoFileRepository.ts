import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IFileRepository,
  IFile,
  CreateFileDto,
  UpdateFileDto,
  FileFilter,
} from '../../../interfaces/IFileRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of File Repository
 */
export class MongoFileRepository
  extends MongoBaseRepository<IFile>
  implements IFileRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find files by user ID
   */
  async findByUserId(userId: string, limit: number = 100): Promise<IFile[]> {
    return await this.find(
      { user: userId },
      {
        sort: { createdAt: -1 },
        limit,
        lean: true,
      }
    );
  }

  /**
   * Find files by conversation ID
   */
  async findByConversationId(conversationId: string): Promise<IFile[]> {
    return await this.find(
      { conversationId },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Find files by message ID
   */
  async findByMessageId(messageId: string): Promise<IFile[]> {
    return await this.find(
      { messageId },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Find file by filepath
   */
  async findByFilepath(filepath: string): Promise<IFile | null> {
    return await this.findOne({ filepath });
  }

  /**
   * Find file by fileKey
   */
  async findByFileKey(fileKey: string): Promise<IFile | null> {
    return await this.findOne({ fileKey });
  }

  /**
   * Get expired files
   */
  async getExpiredFiles(before: Date = new Date()): Promise<IFile[]> {
    return await this.find(
      {
        expiresAt: { $lt: before },
      },
      {
        lean: true,
      }
    );
  }

  /**
   * Delete expired files
   */
  async deleteExpiredFiles(
    before: Date = new Date(),
    session?: ITransaction
  ): Promise<number> {
    return await this.deleteMany(
      {
        expiresAt: { $lt: before },
      },
      session
    );
  }

  /**
   * Update file usage
   */
  async updateFileUsage(
    fileId: string,
    incrementBy: number = 1,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: fileId },
      {
        $inc: { usage: incrementBy },
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get user's total file size
   */
  async getUserTotalFileSize(userId: string): Promise<number> {
    const result = await this.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' },
        },
      },
    ]);

    return result[0]?.totalSize || 0;
  }

  /**
   * Get files by type
   */
  async getFilesByType(userId: string, type: string): Promise<IFile[]> {
    return await this.find(
      {
        user: userId,
        type,
      },
      {
        sort: { createdAt: -1 },
        lean: true,
      }
    );
  }

  /**
   * Search files
   */
  async searchFiles(
    filter: FileFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<IFile[]> {
    const query: any = {};

    if (filter.userId) {
      query.user = filter.userId;
    }

    if (filter.conversationId) {
      query.conversationId = filter.conversationId;
    }

    if (filter.messageId) {
      query.messageId = filter.messageId;
    }

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.source) {
      query.source = filter.source;
    }

    if (filter.expiresAt) {
      query.expiresAt = filter.expiresAt;
    }

    return await this.find(query, {
      sort: { createdAt: -1 },
      skip: offset,
      limit,
      lean: true,
    });
  }

  /**
   * Mark file for deletion
   */
  async markForDeletion(
    fileId: string,
    expiresAt: Date,
    session?: ITransaction
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: fileId },
      {
        expiresAt,
        updatedAt: new Date(),
      },
      { session: this.getSession(session) }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get orphaned files
   */
  async getOrphanedFiles(
    userId: string,
    olderThan: Date
  ): Promise<IFile[]> {
    return await this.find(
      {
        user: userId,
        conversationId: null,
        messageId: null,
        createdAt: { $lt: olderThan },
      },
      {
        lean: true,
      }
    );
  }

  /**
   * Bulk delete files
   */
  async bulkDelete(
    fileIds: string[],
    session?: ITransaction
  ): Promise<number> {
    return await this.deleteMany(
      {
        _id: { $in: fileIds },
      },
      session
    );
  }
}