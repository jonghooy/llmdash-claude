/**
 * UserService using Database Gateway
 * This is an example of how to migrate existing services to use dbGateway
 */

const { getRepository } = require('~/db/gateway');
const { logger } = require('@librechat/data-schemas');

class UserServiceWithDbGateway {
  constructor() {
    this.userRepo = null;
    this.fileRepo = null;
    this.conversationRepo = null;
    this.messageRepo = null;
  }

  /**
   * Get user repository (lazy loading)
   */
  getUserRepo() {
    if (!this.userRepo) {
      this.userRepo = getRepository('User');
    }
    return this.userRepo;
  }

  /**
   * Get file repository (lazy loading)
   */
  getFileRepo() {
    if (!this.fileRepo) {
      this.fileRepo = getRepository('File');
    }
    return this.fileRepo;
  }

  /**
   * Get conversation repository
   */
  getConversationRepo() {
    if (!this.conversationRepo) {
      this.conversationRepo = getRepository('Conversation');
    }
    return this.conversationRepo;
  }

  /**
   * Get message repository
   */
  getMessageRepo() {
    if (!this.messageRepo) {
      this.messageRepo = getRepository('Message');
    }
    return this.messageRepo;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await this.getUserRepo().findById(userId, {
        select: '-password -totpSecret -backupCodes',
      });
      return user;
    } catch (error) {
      logger.error('[UserService] Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const user = await this.getUserRepo().findByEmail(email);
      if (user) {
        // Remove sensitive fields
        delete user.password;
        delete user.totpSecret;
        delete user.backupCodes;
      }
      return user;
    } catch (error) {
      logger.error('[UserService] Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    try {
      // Remove sensitive fields from update
      delete updateData.password;
      delete updateData.totpSecret;
      delete updateData.backupCodes;

      const user = await this.getUserRepo().update(userId, updateData);
      if (user) {
        // Remove sensitive fields from response
        delete user.password;
        delete user.totpSecret;
        delete user.backupCodes;
      }
      return user;
    } catch (error) {
      logger.error('[UserService] Error updating user:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query, limit = 10) {
    try {
      const users = await this.getUserRepo().searchUsers(query, limit);
      // Remove sensitive fields from all users
      return users.map((user) => {
        delete user.password;
        delete user.totpSecret;
        delete user.backupCodes;
        return user;
      });
    } catch (error) {
      logger.error('[UserService] Error searching users:', error);
      throw error;
    }
  }

  /**
   * Delete user and all related data
   */
  async deleteUserAccount(userId) {
    try {
      const { executeTransaction } = require('~/db/gateway');

      // Use transaction to ensure atomic deletion
      const result = await executeTransaction(async (transaction) => {
        // Delete user's files
        const filesDeleted = await this.getFileRepo().deleteMany(
          { user: userId },
          transaction
        );

        // Delete user's messages
        const messagesDeleted = await this.getMessageRepo().deleteMany(
          { user: userId },
          transaction
        );

        // Delete user's conversations
        const conversationsDeleted = await this.getConversationRepo().deleteMany(
          { user: userId },
          transaction
        );

        // Finally delete the user
        const userDeleted = await this.getUserRepo().delete(userId, transaction);

        return {
          success: userDeleted,
          filesDeleted,
          messagesDeleted,
          conversationsDeleted,
        };
      });

      logger.info(`[UserService] Deleted user account ${userId}:`, result);
      return result;
    } catch (error) {
      logger.error('[UserService] Error deleting user account:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const [user, conversationCount, messageCount, fileCount, totalFileSize] =
        await Promise.all([
          this.getUserRepo().findById(userId, { select: '-password' }),
          this.getConversationRepo().count({ user: userId }),
          this.getMessageRepo().count({ user: userId }),
          this.getFileRepo().count({ user: userId }),
          this.getFileRepo().getUserTotalFileSize(userId),
        ]);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        stats: {
          conversations: conversationCount,
          messages: messageCount,
          files: fileCount,
          totalFileSize,
        },
      };
    } catch (error) {
      logger.error('[UserService] Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Verify if user exists
   */
  async userExists(identifier, type = 'email') {
    try {
      if (type === 'email') {
        return await this.getUserRepo().emailExists(identifier);
      } else if (type === 'username') {
        return await this.getUserRepo().usernameExists(identifier);
      } else {
        throw new Error('Invalid identifier type');
      }
    } catch (error) {
      logger.error('[UserService] Error checking user existence:', error);
      throw error;
    }
  }

  /**
   * Get users with pagination
   */
  async getUsers(filter = {}, page = 1, limit = 20) {
    try {
      const result = await this.getUserRepo().findWithPagination(filter, {
        page,
        limit,
        sort: { createdAt: -1 },
      });

      // Remove sensitive fields from all users
      result.data = result.data.map((user) => {
        delete user.password;
        delete user.totpSecret;
        delete user.backupCodes;
        return user;
      });

      return result;
    } catch (error) {
      logger.error('[UserService] Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId, hashedPassword) {
    try {
      return await this.getUserRepo().updatePassword(userId, hashedPassword);
    } catch (error) {
      logger.error('[UserService] Error updating password:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   */
  async verifyUserEmail(userId) {
    try {
      return await this.getUserRepo().verifyEmail(userId);
    } catch (error) {
      logger.error('[UserService] Error verifying email:', error);
      throw error;
    }
  }
}

module.exports = UserServiceWithDbGateway;