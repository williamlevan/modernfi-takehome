const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, data?: any) => {
    if (data !== undefined && data !== null && data !== '') {
      console.log(`[${getTimestamp()}] INFO: ${message}`, data);
    } else {
      console.log(`[${getTimestamp()}] INFO: ${message}`);
    }
  },

  error: (message: string, error?: any) => {
    if (error !== undefined && error !== null && error !== '') {
      console.error(`[${getTimestamp()}] ERROR: ${message}`, error);
    } else {
      console.error(`[${getTimestamp()}] ERROR: ${message}`);
    }
  },

  warn: (message: string, data?: any) => {
    if (data !== undefined && data !== null && data !== '') {
      console.warn(`[${getTimestamp()}] WARN: ${message}`, data);
    } else {
      console.warn(`[${getTimestamp()}] WARN: ${message}`);
    }
  },
};