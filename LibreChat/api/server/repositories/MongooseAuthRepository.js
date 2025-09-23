/**
 * MongooseAuthRepository - Mongoose implementation of AuthRepository
 * This wraps the existing Mongoose models for backward compatibility
 */

class MongooseAuthRepository {
  constructor() {
    // Import all the model functions we need
    const models = require('~/models');

    // Bind all model functions to this instance
    this.findUser = models.findUser;
    this.createUser = models.createUser;
    this.updateUser = models.updateUser;
    this.getUserById = models.getUserById;
    this.countUsers = models.countUsers;
    this.deleteUserById = models.deleteUserById;
    this.findToken = models.findToken;
    this.createToken = models.createToken;
    this.deleteTokens = models.deleteTokens;
    this.findSession = models.findSession;
    this.createSession = models.createSession;
    this.deleteSession = models.deleteSession;
    this.generateToken = models.generateToken;
    this.generateRefreshToken = models.generateRefreshToken;
  }
}

module.exports = MongooseAuthRepository;