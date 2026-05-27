// delay.js - Utility for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const exponentialBackoff = async (attempt, baseDelay = 1000) => {
  const delayMs = baseDelay * Math.pow(2, attempt);
  await delay(delayMs);
};

const waitFor = async (condition, timeout = 5000, checkInterval = 100) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await delay(checkInterval);
  }
  return false;
};

export { delay, exponentialBackoff, waitFor };
