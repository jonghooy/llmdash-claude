import { Model } from 'mongoose';
import { MongoBaseRepository } from '../MongoBaseRepository';
import {
  IUserRepository,
  IUser,
  CreateUserDto,
  UpdateUserDto,
} from '../../../interfaces/IUserRepository';
import { ITransaction } from '../../../interfaces/IDbGateway';

/**
 * MongoDB implementation of User Repository
 */
export class MongoUserRepository
  extends MongoBaseRepository<IUser>
  implements IUserRepository
{
  constructor(model: Model<any>) {
    super(model);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    return await this.findOne({ username: username.toLowerCase() });
  }

  /**
   * Find user by provider ID
   */
  async findByProviderId(
    provider: string,
    providerId: string
  ): Promise<IUser | null> {
    return await this.findOne({ provider, providerId });
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { lastLogin: new Date() } as any);
  }

  /**
   * Find user with populated roles
   */
  async findWithRoles(userId: string): Promise<IUser | null> {
    return await this.findById(userId, {
      populate: 'role',
    });
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<boolean> {
    const result = await this.update(userId, { emailVerified: true });
    return !!result;
  }

  /**
   * Update user's password
   */
  async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<boolean> {
    const result = await this.update(userId, { password: hashedPassword } as any);
    return !!result;
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string, limit: number = 10): Promise<IUser[]> {
    const searchRegex = new RegExp(query, 'i');
    return await this.find(
      {
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { name: searchRegex },
        ],
      },
      { limit, select: '-password' }
    );
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<IUser[]> {
    return await this.find({ role }, { select: '-password' });
  }

  /**
   * Bulk create users
   */
  async bulkCreate(users: CreateUserDto[]): Promise<IUser[]> {
    return await this.createMany(users as Partial<IUser>[]);
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email: email.toLowerCase() });
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    return await this.exists({ username: username.toLowerCase() });
  }

  /**
   * Override create to handle email/username normalization
   */
  async create(data: Partial<IUser>, transaction?: ITransaction): Promise<IUser> {
    const normalizedData = {
      ...data,
      email: data.email?.toLowerCase(),
      username: data.username?.toLowerCase(),
    };
    return await super.create(normalizedData, transaction);
  }

  /**
   * Override update to handle email/username normalization
   */
  async update(
    id: string,
    data: Partial<IUser>,
    transaction?: ITransaction
  ): Promise<IUser | null> {
    const updateData: any = { ...data };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }
    if (updateData.username) {
      updateData.username = updateData.username.toLowerCase();
    }
    return await super.update(id, updateData, transaction);
  }
}