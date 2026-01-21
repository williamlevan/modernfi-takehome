/**
 * Simple logging utility with timestamped messages
 * Provides consistent logging format across the application
 */

// Generate ISO timestamp for log entries
const getTimestamp = () => new Date().toISOString();

export const logger = {
  /**
   * Logs informational messages
   * Only includes data if it's provided and not empty
   */
  info: (message: string, data?: any) => {
    if (data !== undefined && data !== null && data !== '') {
      console.log(`[${getTimestamp()}] INFO: ${message}`, data);
    } else {
      console.log(`[${getTimestamp()}] INFO: ${message}`);
    }
  },

  /**
   * Logs error messages
   * Only includes error details if provided and not empty
   */
  error: (message: string, error?: any) => {
    if (error !== undefined && error !== null && error !== '') {
      console.error(`[${getTimestamp()}] ERROR: ${message}`, error);
    } else {
      console.error(`[${getTimestamp()}] ERROR: ${message}`);
    }
  },

  /**
   * Logs warning messages
   * Only includes data if it's provided and not empty
   */
  warn: (message: string, data?: any) => {
    if (data !== undefined && data !== null && data !== '') {
      console.warn(`[${getTimestamp()}] WARN: ${message}`, data);
    } else {
      console.warn(`[${getTimestamp()}] WARN: ${message}`);
    }
  },
};