import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IAuditLogRepository,
  IAuditLog,
  CreateAuditLogDto,
  UpdateAuditLogDto,
  ISecurityEvent,
  IFailedAuth,
  ISystemError,
} from '../../../interfaces/IAuditLogRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of AuditLog Repository
 */
export class MongoAuditLogRepository
  extends MongoBaseRepository<IAuditLog>
  implements IAuditLogRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Log an audit event
   */
  async log(auditData: CreateAuditLogDto): Promise<IAuditLog> {
    const data = {
      ...auditData,
      timestamp: auditData.timestamp || new Date(),
      createdAt: new Date(),
    };

    const doc = new this.model(data);
    await doc.save();
    return doc.toObject() as IAuditLog;
  }

  /**
   * Get logs for a specific user
   */
  async getUserLogs(userId: string, limit: number = 100, offset: number = 0): Promise<IAuditLog[]> {
    return await this.find(
      { userId },
      {
        sort: { timestamp: -1 },
        limit,
        skip: offset,
        lean: true,
      }
    );
  }

  /**
   * Get logs by category
   */
  async getLogsByCategory(
    category: string,
    since?: Date,
    limit: number = 100
  ): Promise<IAuditLog[]> {
    const query: any = { category };

    if (since) {
      query.timestamp = { $gte: since };
    }

    return await this.find(query, {
      sort: { timestamp: -1 },
      limit,
      lean: true,
    });
  }

  /**
   * Get logs by severity
   */
  async getLogsBySeverity(
    severity: string,
    since?: Date,
    limit: number = 100
  ): Promise<IAuditLog[]> {
    const query: any = { severity };

    if (since) {
      query.timestamp = { $gte: since };
    }

    return await this.find(query, {
      sort: { timestamp: -1 },
      limit,
      lean: true,
    });
  }

  /**
   * Get security events aggregated by hour
   */
  async getSecurityEvents(hours: number = 24): Promise<ISecurityEvent[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.model.aggregate([
      {
        $match: {
          category: { $in: ['SECURITY', 'AUTH'] },
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            hour: { $dateToString: { format: '%Y-%m-%d-%H', date: '$timestamp' } },
            category: '$category',
            severity: '$severity',
          },
          count: { $sum: 1 },
          users: { $addToSet: '$userId' },
        },
      },
      {
        $sort: { '_id.hour': -1 },
      },
    ]).exec();

    return result as ISecurityEvent[];
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, days: number = 30): Promise<IAuditLog[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.find(
      {
        userId,
        timestamp: { $gte: since },
      },
      {
        sort: { timestamp: -1 },
        lean: true,
      }
    );
  }

  /**
   * Get failed authentication attempts
   */
  async getFailedAuthentications(hours: number = 24): Promise<IFailedAuth[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.model.aggregate([
      {
        $match: {
          category: 'AUTH',
          'details.response.status': { $in: [401, 403] },
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$details.ip',
          attempts: { $sum: 1 },
          users: { $addToSet: '$userId' },
          lastAttempt: { $max: '$timestamp' },
        },
      },
      {
        $match: {
          attempts: { $gte: 3 }, // Only show IPs with 3+ failed attempts
        },
      },
      {
        $sort: { attempts: -1 },
      },
    ]).exec();

    return result as IFailedAuth[];
  }

  /**
   * Get system errors
   */
  async getSystemErrors(hours: number = 24): Promise<ISystemError[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.model.aggregate([
      {
        $match: {
          severity: { $in: ['ERROR', 'CRITICAL'] },
          category: 'SYSTEM',
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            error: '$details.error.message',
            path: '$details.path',
          },
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' },
          affectedUsers: { $addToSet: '$userId' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 100,
      },
    ]).exec();

    return result as ISystemError[];
  }

  /**
   * Clean old logs
   */
  async cleanOldLogs(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.model.deleteMany({
      timestamp: { $lt: cutoffDate },
      severity: { $nin: ['ERROR', 'CRITICAL'] }, // Keep error logs longer
    }).exec();

    return result.deletedCount || 0;
  }

  /**
   * Get logs by time range
   */
  async getLogsByTimeRange(startDate: Date, endDate: Date): Promise<IAuditLog[]> {
    return await this.find(
      {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      {
        sort: { timestamp: -1 },
        lean: true,
      }
    );
  }

  /**
   * Count logs by criteria
   */
  async countLogs(criteria: any): Promise<number> {
    return await this.model.countDocuments(criteria).exec();
  }

  /**
   * Override create to set timestamp if not provided
   */
  async create(data: CreateAuditLogDto, transaction?: ITransaction): Promise<IAuditLog> {
    const session = this.getSession(transaction);

    const auditData = {
      ...data,
      timestamp: data.timestamp || new Date(),
      createdAt: new Date(),
    };

    const doc = new this.model(auditData);
    await doc.save({ session });
    return doc.toObject() as IAuditLog;
  }
}