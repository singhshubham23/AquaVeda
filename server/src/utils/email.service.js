import logger from "../config/logger.js";

/**
 * Mock Email Service
 * In a real environment, integrate with SendGrid, AWS SES, Resend, etc.
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  // This prevents the token from being exposed in the API response while still letting us test
  logger.info(`[MOCK EMAIL] To: ${email}`);
  logger.info(`[MOCK EMAIL] Subject: Password Reset Request`);
  logger.info(`[MOCK EMAIL] Body: Your reset token is ${resetToken}. In a real app, this would be a link.`);
  
  // Return a resolved promise to mimic async email sending
  return Promise.resolve(true);
};
