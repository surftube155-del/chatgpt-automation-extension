// content.js - Runs inside ChatGPT page
const TEXTAREA_SELECTORS = [
  '[contenteditable="true"][data-testid="chat-input-textarea"]',
  '[data-testid="chat-input-textarea"]',
  'textarea[data-testid="chat-input"]',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="message"]',
  '[contenteditable="true"][role="textbox"]',
  'textarea'
];

const SEND_BUTTON_SELECTORS = [
  '[data-testid="send-button"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="send"]',
  'button:has(svg[data-name="paper-plane"])',
  'button[class*="send"]'
];

const logger = {
  log: (msg, data) => console.log(`[ChatGPT-Auto] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ChatGPT-Auto] ERROR: ${msg}`, err || '')
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Find element with fallback selectors
function findElement(selectors, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const search = () => {
      for (const selector of selectors) {
        try {
          const el = document.querySelector(selector);
          if (el && el.offsetParent !== null) {
            resolve(el);
            return;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }

      if (Date.now() - startTime < timeout) {
        setTimeout(search, 100);
      } else {
        resolve(null);
      }
    };

    search();
  });
}

// Wait for ChatGPT to be ready
async function waitForChatGPTReady() {
  let attempts = 0;
  while (attempts < 30) {
    const textarea = await findElement(TEXTAREA_SELECTORS, 1000);
    if (textarea) {
      logger.log('ChatGPT ready');
      return true;
    }
    attempts++;
    await delay(500);
  }
  logger.error('ChatGPT not ready after timeout');
  return false;
}

// Inject text into textarea
async function injectText(text) {
  const textarea = await findElement(TEXTAREA_SELECTORS, 5000);
  
  if (!textarea) {
    logger.error('Textarea not found');
    return false;
  }

  try {
    // For contenteditable elements
    if (textarea.contentEditable === 'true') {
      textarea.textContent = text;
      textarea.innerHTML = text;
    } else {
      // For textarea elements
      textarea.value = text;
    }

    // Trigger input event for React
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', { bubbles: true });
    textarea.dispatchEvent(changeEvent);

    logger.log('Text injected successfully');
    return true;
  } catch (err) {
    logger.error('Failed to inject text', err);
    return false;
  }
}

// Click send button
async function clickSend() {
  const sendButton = await findElement(SEND_BUTTON_SELECTORS, 5000);
  
  if (!sendButton) {
    logger.error('Send button not found');
    return false;
  }

  try {
    sendButton.click();
    logger.log('Send button clicked');
    return true;
  } catch (err) {
    logger.error('Failed to click send button', err);
    return false;
  }
}

// Wait for response completion
async function waitForResponseCompletion(timeout = 120000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let wasLoading = false;

    const checkCompletion = () => {
      // Look for any loading indicators
      const loadingIndicators = document.querySelectorAll('[data-testid="response-loading"]');
      const isLoading = loadingIndicators.length > 0;

      if (isLoading) {
        wasLoading = true;
      }

      // If was loading and now not loading, response is complete
      if (wasLoading && !isLoading) {
        logger.log('Response complete');
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeout) {
        logger.log('Response completion timeout');
        resolve(false);
        return;
      }

      setTimeout(checkCompletion, 500);
    };

    checkCompletion();
  });
}

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'INJECT_AND_SEND') {
        logger.log('Processing INJECT_AND_SEND', request.payload);

        // Wait for ChatGPT to be ready
        const ready = await waitForChatGPTReady();
        if (!ready) {
          sendResponse({ success: false, error: 'ChatGPT not ready' });
          return;
        }

        // Inject text
        const injected = await injectText(request.payload.prompt);
        if (!injected) {
          sendResponse({ success: false, error: 'Failed to inject text' });
          return;
        }

        // Wait for textarea to be ready
        await delay(500);

        // Click send
        const sent = await clickSend();
        if (!sent) {
          sendResponse({ success: false, error: 'Failed to click send' });
          return;
        }

        // Wait for response
        const completed = await waitForResponseCompletion(120000);
        if (!completed) {
          sendResponse({ success: false, error: 'Response timeout' });
          return;
        }

        sendResponse({ success: true });
      }
    } catch (err) {
      logger.error('Unexpected error in content script', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  // Return true to indicate we'll send response asynchronously
  return true;
});

// Confirm content script loaded
logger.log('Content script loaded and listening');
