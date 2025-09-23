import { IRepository, ITransaction } from './IDbGateway';

/**
 * File-specific repository interface
 */

export interface IFile {
  _id: string;
  user: string;
  userId?: string;
  filename: string;
  filepath: string;
  fileKey?: string;
  type: string;
  size: number;
  usage: number;
  conversationId?: string;
  messageId?: string;
  source: string;
  height?: number;
  width?: number;
  bytes?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CreateFileDto {
  user: string;
  filename: string;
  filepath: string;
  fileKey?: string;
  type: string;
  size: number;
  source: string;
  conversationId?: string;
  messageId?: string;
  height?: number;
  width?: number;
  metadata?: any;
  expiresAt?: Date;
}

export interface UpdateFileDto {
  filename?: string;
  usage?: number;
  conversationId?: string;
  messageId?: string;
  metadata?: any;
  expiresAt?: Date;
}

export interface FileFilter {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  type?: string;
  source?: string;
  expiresAt?: { $lt?: Date; $gt?: Date };
}

export interface IFileRepository extends IRepository<IFile> {
  /**
   * Find files by user ID
   */
  findByUserId(userId: string, limit?: number): Promise<IFile[]>;

  /**
   * Find files by conversation ID
   */
  findByConversationId(conversationId: string): Promise<IFile[]>;

  /**
   * Find files by message ID
   */
  findByMessageId(messageId: string): Promise<IFile[]>;

  /**
   * Find file by filepath
   */
  findByFilepath(filepath: string): Promise<IFile | null>;

  /**
   * Find file by fileKey
   */
  findByFileKey(fileKey: string): Promise<IFile | null>;

  /**
   * Get expired files
   */
  getExpiredFiles(before?: Date): Promise<IFile[]>;

  /**
   * Delete expired files
   */
  deleteExpiredFiles(before?: Date, session?: ITransaction): Promise<number>;

  /**
   * Update file usage
   */
  updateFileUsage(
    fileId: string,
    incrementBy?: number,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Get user's total file size
   */
  getUserTotalFileSize(userId: string): Promise<number>;

  /**
   * Get files by type
   */
  getFilesByType(userId: string, type: string): Promise<IFile[]>;

  /**
   * Search files
   */
  searchFiles(
    filter: FileFilter,
    limit?: number,
    offset?: number
  ): Promise<IFile[]>;

  /**
   * Mark file for deletion
   */
  markForDeletion(
    fileId: string,
    expiresAt: Date,
    session?: ITransaction
  ): Promise<boolean>;

  /**
   * Get orphaned files (no conversation or message)
   */
  getOrphanedFiles(
    userId: string,
    olderThan: Date
  ): Promise<IFile[]>;

  /**
   * Bulk delete files
   */
  bulkDelete(
    fileIds: string[],
    session?: ITransaction
  ): Promise<number>;
}