import { IRepository } from './IDbGateway';
import { ITransaction } from './IDbGateway';

/**
 * AuditLog document interface
 */
export interface IAuditLog {
  _id?: string;
  userId?: string;
  action: string;
  category: 'AUTH' | 'API' | 'ADMIN' | 'SECURITY' | 'DATA' | 'SYSTEM' | 'CONVERSATION' | 'MODEL';
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    query?: any;
    body?: any;
    response?: {
      status?: number;
      message?: string;
      time?: number;
    };
    error?: {
      message?: string;
      stack?: string;
      code?: string;
    };
  };
  metadata?: {
    conversationId?: string;
    messageId?: string;
    model?: string;
    endpoint?: string;
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
    };
    cost?: number;
    duration?: number;
    sessionId?: string;
    requestId?: string;
  };
  security?: {
    threat?: {
      type?: string;
      level?: string;
      description?: string;
    };
    blocked?: boolean;
    reason?: string;
  };
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * AuditLog Create DTO
 */
export interface CreateAuditLogDto extends Omit<IAuditLog, '_id' | 'createdAt' | 'updatedAt'> {}

/**
 * AuditLog Update DTO
 */
export interface UpdateAuditLogDto extends Partial<CreateAuditLogDto> {}

/**
 * Security event aggregation result
 */
export interface ISecurityEvent {
  _id: {
    hour: string;
    category: string;
    severity: string;
  };
  count: number;
  users: string[];
}

/**
 * Failed authentication aggregation result
 */
export interface IFailedAuth {
  _id: string; // IP address
  attempts: number;
  users: string[];
  lastAttempt: Date;
}

/**
 * System error aggregation result
 */
export interface ISystemError {
  _id: {
    error: string;
    path: string;
  };
  count: number;
  lastOccurrence: Date;
  affectedUsers: string[];
}

/**
 * AuditLog Repository Interface
 */
export interface IAuditLogRepository extends IRepository<IAuditLog> {
  /**
   * Log an audit event
   */
  log(auditData: CreateAuditLogDto): Promise<IAuditLog>;

  /**
   * Get logs for a specific user
   */
  getUserLogs(userId: string, limit?: number, offset?: number): Promise<IAuditLog[]>;

  /**
   * Get logs by category
   */
  getLogsByCategory(
    category: string,
    since?: Date,
    limit?: number
  ): Promise<IAuditLog[]>;

  /**
   * Get logs by severity
   */
  getLogsBySeverity(
    severity: string,
    since?: Date,
    limit?: number
  ): Promise<IAuditLog[]>;

  /**
   * Get security events
   */
  getSecurityEvents(hours?: number): Promise<ISecurityEvent[]>;

  /**
   * Get user activity
   */
  getUserActivity(userId: string, days?: number): Promise<IAuditLog[]>;

  /**
   * Get failed authentication attempts
   */
  getFailedAuthentications(hours?: number): Promise<IFailedAuth[]>;

  /**
   * Get system errors
   */
  getSystemErrors(hours?: number): Promise<ISystemError[]>;

  /**
   * Clean old logs
   */
  cleanOldLogs(daysToKeep: number): Promise<number>;

  /**
   * Get logs by time range
   */
  getLogsByTimeRange(startDate: Date, endDate: Date): Promise<IAuditLog[]>;

  /**
   * Count logs by criteria
   */
  countLogs(criteria: any): Promise<number>;
}