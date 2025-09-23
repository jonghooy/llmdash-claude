import { IRepository } from './IDbGateway';

/**
 * User-specific repository interface
 */

export interface IUser {
  _id: string;
  id?: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  role?: string;
  provider?: string;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  toObject?: () => any;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  role?: string;
  provider?: string;
  providerId?: string;
  emailVerified?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  avatar?: string;
  role?: string;
  emailVerified?: boolean;
  lastLogin?: Date;
}

export interface IUserRepository extends IRepository<IUser> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<IUser | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<IUser | null>;

  /**
   * Find user by provider ID
   */
  findByProviderId(provider: string, providerId: string): Promise<IUser | null>;

  /**
   * Update user's last login time
   */
  updateLastLogin(userId: string): Promise<void>;

  /**
   * Find user with populated roles
   */
  findWithRoles(userId: string): Promise<IUser | null>;

  /**
   * Verify user's email
   */
  verifyEmail(userId: string): Promise<boolean>;

  /**
   * Update user's password
   */
  updatePassword(userId: string, hashedPassword: string): Promise<boolean>;

  /**
   * Search users by query
   */
  searchUsers(query: string, limit?: number): Promise<IUser[]>;

  /**
   * Get users by role
   */
  getUsersByRole(role: string): Promise<IUser[]>;

  /**
   * Bulk create users
   */
  bulkCreate(users: CreateUserDto[]): Promise<IUser[]>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;
}