// constants.js - Configuration constants
const CONSTANTS = {
  CHUNK_MIN_SIZE: 250,
  CHUNK_MAX_SIZE: 350,
  OVERLAP_SIZE: 3, // sentences
  WAIT_FOR_RESPONSE_TIMEOUT: 120000, // 2 minutes
  DOM_WAIT_TIMEOUT: 5000,
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  MESSAGE_DEBOUNCE_MS: 500,
  CHATGPT_DOMAINS: [
    'chatgpt.com',
    'chat.openai.com'
  ],
  TEXTAREA_SELECTORS: [
    '[contenteditable="true"][data-testid="chat-input-textarea"]',
    '[data-testid="chat-input-textarea"]',
    'textarea[data-testid="chat-input"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="message"]',
    '.chat-input',
    '[contenteditable="true"][role="textbox"]',
    'textarea'
  ],
  SEND_BUTTON_SELECTORS: [
    '[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button svg[data-name="paper-plane"]',
    'button:has(svg[data-name="paper-plane"])',
    'button[class*="send"]'
  ],
  RESPONSE_INDICATORS: [
    '[data-testid="response-loading"]',
    '.response-loading',
    '[class*="streaming"]'
  ]
};

export default CONSTANTS;
