/**
 * DbGatewayAuthRepository - DbGateway implementation of AuthRepository
 * This uses the dbGateway abstraction layer for database operations
 */

const { generateToken, generateRefreshToken } = require('~/models');

class DbGatewayAuthRepository {
  constructor() {
    // We'll get repositories lazily as needed
    this.getRepo = (name) => {
      const { getRepository } = require('~/db');
      return getRepository(name);
    };

    // Import token generation functions directly as they don't need DB access
    this.generateToken = generateToken;
    this.generateRefreshToken = generateRefreshToken;
  }

  async findUser(criteria, fields = '') {
    const userRepo = this.getRepo('User');
    const options = fields ? { select: fields.split(' ') } : {};
    return await userRepo.findOne(criteria, options);
  }

  async createUser(userData, balance, disableTTL = false, returnUser = true) {
    const userRepo = this.getRepo('User');

    // Create the user
    const user = await userRepo.create(userData);

    // Handle balance if provided
    if (balance !== undefined && balance !== null) {
      // Create balance record if needed
      // This would need to be implemented in the repository
      // For now, we'll skip balance handling in dbGateway version
    }

    return returnUser ? user : { _id: user._id };
  }

  async updateUser(userId, updateData) {
    const userRepo = this.getRepo('User');
    return await userRepo.update(userId, updateData);
  }

  async getUserById(userId) {
    const userRepo = this.getRepo('User');
    return await userRepo.findById(userId);
  }

  async countUsers() {
    const userRepo = this.getRepo('User');
    return await userRepo.count({});
  }

  async deleteUserById(userId) {
    const userRepo = this.getRepo('User');
    return await userRepo.delete(userId);
  }

  async findToken(criteria) {
    const transactionRepo = this.getRepo('Transaction');
    // Tokens are stored in the Transaction collection in LibreChat
    // We need to adapt the criteria for token operations
    if (criteria.userId || criteria.email) {
      return await transactionRepo.findOne({
        user: criteria.userId,
        tokenType: 'verification',
        ...criteria
      });
    }
    return await transactionRepo.findOne(criteria);
  }

  async createToken(tokenData) {
    const transactionRepo = this.getRepo('Transaction');
    // Adapt token data to transaction format
    const transactionData = {
      user: tokenData.userId,
      tokenType: 'verification',
      token: tokenData.token,
      email: tokenData.email,
      createdAt: tokenData.createdAt || Date.now(),
      expiresAt: new Date(Date.now() + (tokenData.expiresIn || 900) * 1000)
    };
    return await transactionRepo.create(transactionData);
  }

  async deleteTokens(criteria) {
    const transactionRepo = this.getRepo('Transaction');
    // Adapt criteria for transaction deletion
    const deleteCriteria = {
      tokenType: 'verification',
      ...criteria
    };
    if (criteria.userId) {
      deleteCriteria.user = criteria.userId;
      delete deleteCriteria.userId;
    }
    return await transactionRepo.deleteMany(deleteCriteria);
  }

  async findSession(criteria, options = {}) {
    const userRepo = this.getRepo('User');
    // Sessions are typically stored with users in LibreChat
    // This would need proper session management implementation
    // For now, return a mock implementation
    if (criteria.sessionId) {
      const user = await userRepo.findOne({ 'sessions.sessionId': criteria.sessionId });
      if (user && user.sessions) {
        const session = user.sessions.find(s => s.sessionId === criteria.sessionId);
        return options.lean === false ? session : { ...session };
      }
    }
    return null;
  }

  async createSession(userId) {
    const userRepo = this.getRepo('User');
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    const refreshToken = require('crypto').randomBytes(32).toString('hex');

    // Create session object
    const session = {
      sessionId,
      userId,
      createdAt: new Date(),
      expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Store session with user (simplified implementation)
    await userRepo.update(userId, {
      $push: { sessions: session }
    });

    return {
      session,
      refreshToken
    };
  }

  async deleteSession(criteria) {
    const userRepo = this.getRepo('User');
    if (criteria.sessionId) {
      // Remove session from user
      const users = await userRepo.findAll({ 'sessions.sessionId': criteria.sessionId });
      for (const user of users) {
        await userRepo.update(user._id, {
          $pull: { sessions: { sessionId: criteria.sessionId } }
        });
      }
      return { acknowledged: true };
    }
    return { acknowledged: false };
  }
}

module.exports = DbGatewayAuthRepository;