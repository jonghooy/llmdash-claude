import { IRepository } from './IDbGateway';

export interface ITokenRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any>;
  findByUserId(userId: string): Promise<any>;
  findByIdentifier(identifier: string): Promise<any>;
  findToken(query: {
    userId?: string;
    token?: string;
    email?: string;
    identifier?: string;
  }): Promise<any>;
  createToken(tokenData: {
    userId: string;
    email?: string;
    type?: string;
    identifier?: string;
    token: string;
    expiresIn: number;
    metadata?: Record<string, any>;
  }): Promise<any>;
  deleteTokens(query: {
    userId?: string;
    token?: string;
    email?: string;
    identifier?: string;
  }): Promise<{ deletedCount: number }>;
  deleteExpiredTokens(): Promise<{ deletedCount: number }>;
}