import { TranslationKeys } from '~/hooks';

const getLoginError = (errorText: string): TranslationKeys | string => {
  const defaultError: TranslationKeys = 'com_auth_error_login';

  if (!errorText) {
    return defaultError;
  }

  // Check if the error contains a custom message from the backend
  // This is for approval status messages
  if (errorText.includes('승인 대기') || errorText.includes('계정 승인') || errorText.includes('거부')) {
    // Extract the message from the error response
    try {
      const parsed = JSON.parse(errorText);
      return parsed.message || errorText;
    } catch {
      // If it's not JSON, check if it contains the message directly
      if (errorText.includes('계정')) {
        return errorText;
      }
    }
  }

  switch (true) {
    case errorText.includes('429'):
      return 'com_auth_error_login_rl';
    case errorText.includes('403'):
      // Don't use the ban message for 403 errors - let the actual message through
      return defaultError;
    case errorText.includes('500'):
      return 'com_auth_error_login_server';
    case errorText.includes('422'):
      return 'com_auth_error_login_unverified';
    default:
      return defaultError;
  }
};

export default getLoginError;
