/**
 * AuthRepository - Abstract repository interface for authentication data access
 * This provides a clean abstraction over different data access implementations
 */

class AuthRepository {
  constructor(dataAccessLayer) {
    this.dal = dataAccessLayer;
  }

  /**
   * Find a user by criteria
   * @param {Object} criteria - Search criteria
   * @param {String} fields - Fields to select
   * @returns {Promise<Object|null>} User object or null
   */
  async findUser(criteria, fields = '') {
    return await this.dal.findUser(criteria, fields);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @param {Number} balance - Initial balance
   * @param {Boolean} disableTTL - Disable TTL for unverified users
   * @param {Boolean} returnUser - Whether to return the created user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, balance, disableTTL = false, returnUser = true) {
    return await this.dal.createUser(userData, balance, disableTTL, returnUser);
  }

  /**
   * Update a user by ID
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    return await this.dal.updateUser(userId, updateData);
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    return await this.dal.getUserById(userId);
  }

  /**
   * Count total users
   * @returns {Promise<Number>} User count
   */
  async countUsers() {
    return await this.dal.countUsers();
  }

  /**
   * Delete user by ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUserById(userId) {
    return await this.dal.deleteUserById(userId);
  }

  /**
   * Find a token by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Token object or null
   */
  async findToken(criteria) {
    return await this.dal.findToken(criteria);
  }

  /**
   * Create a token
   * @param {Object} tokenData - Token data
   * @returns {Promise<Object>} Created token
   */
  async createToken(tokenData) {
    return await this.dal.createToken(tokenData);
  }

  /**
   * Delete tokens by criteria
   * @param {Object} criteria - Deletion criteria
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTokens(criteria) {
    return await this.dal.deleteTokens(criteria);
  }

  /**
   * Find a session by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Session object or null
   */
  async findSession(criteria, options = {}) {
    return await this.dal.findSession(criteria, options);
  }

  /**
   * Create a session
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Session and refresh token
   */
  async createSession(userId) {
    return await this.dal.createSession(userId);
  }

  /**
   * Delete a session
   * @param {Object} criteria - Deletion criteria
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSession(criteria) {
    return await this.dal.deleteSession(criteria);
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {Promise<String>} JWT token
   */
  async generateToken(user) {
    return await this.dal.generateToken(user);
  }

  /**
   * Generate refresh token for session
   * @param {Object} session - Session object
   * @returns {Promise<String>} Refresh token
   */
  async generateRefreshToken(session) {
    return await this.dal.generateRefreshToken(session);
  }
}

module.exports = AuthRepository;