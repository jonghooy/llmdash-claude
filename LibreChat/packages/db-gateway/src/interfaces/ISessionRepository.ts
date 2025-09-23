import { IRepository } from './IDbGateway';

export interface ISessionRepository extends IRepository<any> {
  findByUserId(userId: string): Promise<any[]>;
  findSession(params: {
    refreshToken?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<any>;
  createSession(userId: string, options?: {
    expiration?: Date;
    refreshToken?: string;
  }): Promise<{ session: any; refreshToken: string }>;
  deleteSession(params: {
    refreshToken?: string;
    sessionId?: string;
  }): Promise<{ deletedCount: number }>;
  deleteAllUserSessions(userId: string, options?: {
    excludeCurrentSession?: boolean;
    currentSessionId?: string;
  }): Promise<{ deletedCount: number }>;
  updateExpiration(sessionId: string, expiration: Date): Promise<any>;
  countActiveSessions(userId: string): Promise<number>;
  deleteExpiredSessions(): Promise<{ deletedCount: number }>;
  generateRefreshToken(session: any): Promise<string>;
}