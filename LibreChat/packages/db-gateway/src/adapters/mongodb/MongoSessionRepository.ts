import { ISessionRepository } from '../../interfaces/ISessionRepository';
import { MongoBaseRepository } from './MongoBaseRepository';
import { Model, Document } from 'mongoose';
import * as crypto from 'crypto';

interface SessionDocument extends Document {
  refreshTokenHash: string;
  expiration: Date;
  user: string;
}

export class MongoSessionRepository extends MongoBaseRepository<SessionDocument> implements ISessionRepository {
  constructor(model: Model<SessionDocument>) {
    super(model);
  }

  /**
   * Hash a token using SHA256
   */
  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async findByUserId(userId: string): Promise<SessionDocument[]> {
    const result = await this.model.find({
      user: userId,
      expiration: { $gt: new Date() }
    }).lean();
    return result as unknown as SessionDocument[];
  }

  async findSession(params: {
    refreshToken?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<SessionDocument | null> {
    const query: any = {};

    if (params.refreshToken) {
      query.refreshTokenHash = await this.hashToken(params.refreshToken);
    }

    if (params.userId) {
      query.user = params.userId;
    }

    if (params.sessionId) {
      query._id = params.sessionId;
    }

    // Add expiration check to only return valid sessions
    query.expiration = { $gt: new Date() };

    const result = await this.model.findOne(query).lean();
    return result as unknown as SessionDocument | null;
  }

  async createSession(userId: string, options: {
    expiration?: Date;
    refreshToken?: string;
  } = {}): Promise<{ session: SessionDocument; refreshToken: string }> {
    const { REFRESH_TOKEN_EXPIRY } = process.env ?? {};
    const expires = REFRESH_TOKEN_EXPIRY ? eval(REFRESH_TOKEN_EXPIRY) : 1000 * 60 * 60 * 24 * 7; // 7 days default

    const sessionData = {
      user: userId,
      expiration: options.expiration || new Date(Date.now() + expires),
      refreshTokenHash: '', // Will be set after generating token
    };

    const session = await this.model.create(sessionData);

    // Generate refresh token (simplified version - in production, use JWT)
    const refreshToken = options.refreshToken || crypto.randomBytes(32).toString('hex');
    session.refreshTokenHash = await this.hashToken(refreshToken);
    await session.save();

    return { session, refreshToken };
  }

  async deleteSession(params: {
    refreshToken?: string;
    sessionId?: string;
  }): Promise<{ deletedCount: number }> {
    if (!params.refreshToken && !params.sessionId) {
      throw new Error('Either refreshToken or sessionId is required');
    }

    const query: any = {};

    if (params.refreshToken) {
      query.refreshTokenHash = await this.hashToken(params.refreshToken);
    }

    if (params.sessionId) {
      query._id = params.sessionId;
    }

    const result = await this.model.deleteOne(query);
    return { deletedCount: result.deletedCount || 0 };
  }

  async deleteAllUserSessions(userId: string, options: {
    excludeCurrentSession?: boolean;
    currentSessionId?: string;
  } = {}): Promise<{ deletedCount: number }> {
    const query: any = { user: userId };

    if (options.excludeCurrentSession && options.currentSessionId) {
      query._id = { $ne: options.currentSessionId };
    }

    const result = await this.model.deleteMany(query);
    return { deletedCount: result.deletedCount || 0 };
  }

  async updateExpiration(sessionId: string, expiration: Date): Promise<SessionDocument | null> {
    const result = await this.model.findByIdAndUpdate(
      sessionId,
      { expiration },
      { new: true }
    ).lean();
    return result as unknown as SessionDocument | null;
  }

  async countActiveSessions(userId: string): Promise<number> {
    return this.model.countDocuments({
      user: userId,
      expiration: { $gt: new Date() }
    });
  }

  async deleteExpiredSessions(): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany({
      expiration: { $lt: new Date() }
    });
    return { deletedCount: result.deletedCount || 0 };
  }

  async generateRefreshToken(session: SessionDocument): Promise<string> {
    // This is a simplified version - in production, use proper JWT signing
    const refreshToken = crypto.randomBytes(32).toString('hex');
    session.refreshTokenHash = await this.hashToken(refreshToken);
    await session.save();
    return refreshToken;
  }
}