// logger.js - Logging utility
const logger = {
  log: (message, data = null) => {
    console.log(`[ChatGPT-Auto] ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`[ChatGPT-Auto] ERROR: ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`[ChatGPT-Auto] WARNING: ${message}`, data || '');
  },
  debug: (message, data = null) => {
    if (process.env.DEBUG) {
      console.debug(`[ChatGPT-Auto] DEBUG: ${message}`, data || '');
    }
  }
};

export default logger;
