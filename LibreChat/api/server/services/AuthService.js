/**
 * AuthService - Main entry point with lazy loading
 * Uses lazy loading to avoid circular dependencies
 * Loads the appropriate implementation only when functions are called
 */

// Cache for the loaded module
let AuthServiceModule = null;

// Function to get the appropriate module
function getAuthServiceModule() {
  if (AuthServiceModule === null) {
    const useDbGateway = process.env.USE_DB_GATEWAY === 'true';
    AuthServiceModule = useDbGateway
      ? require('./AuthService.refactored')
      : require('./AuthService.mongoose');
  }
  return AuthServiceModule;
}

// Export functions with lazy loading
module.exports = {
  logoutUser: (...args) => getAuthServiceModule().logoutUser(...args),
  verifyEmail: (...args) => getAuthServiceModule().verifyEmail(...args),
  registerUser: (...args) => getAuthServiceModule().registerUser(...args),
  setAuthTokens: (...args) => getAuthServiceModule().setAuthTokens(...args),
  resetPassword: (...args) => getAuthServiceModule().resetPassword(...args),
  setOpenIDAuthTokens: (...args) => getAuthServiceModule().setOpenIDAuthTokens(...args),
  requestPasswordReset: (...args) => getAuthServiceModule().requestPasswordReset(...args),
  resendVerificationEmail: (...args) => getAuthServiceModule().resendVerificationEmail(...args),
};