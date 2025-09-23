import { ITokenRepository } from '../../interfaces/ITokenRepository';
import { MongoBaseRepository } from './MongoBaseRepository';
import { Model, Document } from 'mongoose';

interface TokenDocument extends Document {
  userId: string;
  email?: string;
  type?: string;
  identifier?: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Map<string, any>;
}

export class MongoTokenRepository extends MongoBaseRepository<TokenDocument> implements ITokenRepository {
  constructor(model: Model<TokenDocument>) {
    super(model);
  }

  async findByEmail(email: string): Promise<TokenDocument | null> {
    const result = await this.model.findOne({ email }).lean();
    return result as unknown as TokenDocument | null;
  }

  async findByUserId(userId: string): Promise<TokenDocument | null> {
    const result = await this.model.findOne({ userId }).lean();
    return result as unknown as TokenDocument | null;
  }

  async findByIdentifier(identifier: string): Promise<TokenDocument | null> {
    const result = await this.model.findOne({ identifier }).lean();
    return result as unknown as TokenDocument | null;
  }

  async findToken(query: {
    userId?: string;
    token?: string;
    email?: string;
    identifier?: string;
  }): Promise<TokenDocument | null> {
    const conditions = [];

    if (query.userId) {
      conditions.push({ userId: query.userId });
    }
    if (query.token) {
      conditions.push({ token: query.token });
    }
    if (query.email) {
      conditions.push({ email: query.email });
    }
    if (query.identifier) {
      conditions.push({ identifier: query.identifier });
    }

    if (conditions.length === 0) {
      return null;
    }

    const result = await this.model.findOne({ $and: conditions }).lean();
    return result as unknown as TokenDocument | null;
  }

  async createToken(tokenData: {
    userId: string;
    email?: string;
    type?: string;
    identifier?: string;
    token: string;
    expiresIn: number; // seconds
    metadata?: Record<string, any>;
  }): Promise<TokenDocument> {
    const currentTime = new Date();
    const expiresAt = new Date(currentTime.getTime() + tokenData.expiresIn * 1000);

    const newTokenData = {
      userId: tokenData.userId,
      email: tokenData.email,
      type: tokenData.type,
      identifier: tokenData.identifier,
      token: tokenData.token,
      createdAt: currentTime,
      expiresAt,
      metadata: tokenData.metadata ? new Map(Object.entries(tokenData.metadata)) : undefined,
    };

    return this.model.create(newTokenData);
  }

  async deleteTokens(query: {
    userId?: string;
    token?: string;
    email?: string;
    identifier?: string;
  }): Promise<{ deletedCount: number }> {
    const conditions = [];

    if (query.userId) {
      conditions.push({ userId: query.userId });
    }
    if (query.token) {
      conditions.push({ token: query.token });
    }
    if (query.email) {
      conditions.push({ email: query.email });
    }
    if (query.identifier) {
      conditions.push({ identifier: query.identifier });
    }

    if (conditions.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await this.model.deleteMany({ $or: conditions });
    return { deletedCount: result.deletedCount || 0 };
  }

  async deleteExpiredTokens(): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return { deletedCount: result.deletedCount || 0 };
  }
}