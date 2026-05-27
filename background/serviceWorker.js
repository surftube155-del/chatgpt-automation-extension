// background/serviceWorker.js - Main coordinator
const logger = {
  log: (msg, data) => console.log(`[ChatGPT-Auto-BG] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ChatGPT-Auto-BG] ERROR: ${msg}`, err || '')
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Chunker {
  constructor(text, minSize = 250, maxSize = 350) {
    this.text = text;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.sentences = this.extractSentences(text);
  }

  extractSentences(text) {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) || [];
  }

  createChunks() {
    const chunks = [];
    let currentChunk = '';

    for (const sentence of this.sentences) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (testChunk.length <= this.maxSize) {
        currentChunk = testChunk;
      } else {
        if (currentChunk.length >= this.minSize) {
          chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk = testChunk;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  getChunks() {
    return this.createChunks();
  }
}

class OverlapEngine {
  constructor(sentenceCount = 3) {
    this.sentenceCount = sentenceCount;
  }

  extractLastNSentences(text, n) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(-n).join(' ').trim();
  }

  addMemoryPrefix(previousChunks = []) {
    if (previousChunks.length === 0) return '';
    const lastChunk = previousChunks[previousChunks.length - 1];
    const memory = this.extractLastNSentences(lastChunk, 2);
    return memory ? `[Previous context: ${memory}]\n` : '';
  }
}

class AutomationEngine {
  constructor() {
    this.state = {
      status: 'idle',
      chunks: [],
      currentIndex: 0,
      fixedPrompt: '',
      processedChunks: [],
      tabId: null
    };
  }

  async findChatGPTTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        const chatgptTab = tabs.find(tab => 
          tab.url && (
            tab.url.includes('chatgpt.com') || 
            tab.url.includes('chat.openai.com')
          )
        );
        resolve(chatgptTab?.id || null);
      });
    });
  }

  async initialize(fixedPrompt, story) {
    try {
      const tabId = await this.findChatGPTTab();
      if (!tabId) {
        throw new Error('ChatGPT tab not found. Please open ChatGPT in a tab.');
      }

      this.state.tabId = tabId;
      this.state.fixedPrompt = fixedPrompt;

      const chunker = new Chunker(story);
      this.state.chunks = chunker.getChunks();
      this.state.currentIndex = 0;
      this.state.processedChunks = [];
      this.state.status = 'running';

      logger.log(`Initialized with ${this.state.chunks.length} chunks`);
      return true;
    } catch (err) {
      logger.error('Initialization failed', err);
      this.state.status = 'error';
      throw err;
    }
  }

  buildPrompt(chunkIndex) {
    const overlapEngine = new OverlapEngine();
    const memoryPrefix = overlapEngine.addMemoryPrefix(this.state.processedChunks);
    const chunk = this.state.chunks[chunkIndex];
    return `${this.state.fixedPrompt}\n\n${memoryPrefix}${chunk}`;
  }

  async processChunk(chunkIndex) {
    try {
      const prompt = this.buildPrompt(chunkIndex);
      
      logger.log(`Processing chunk ${chunkIndex + 1}/${this.state.chunks.length}`);

      // Send message to content script
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          this.state.tabId,
          {
            action: 'INJECT_AND_SEND',
            payload: { prompt }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              logger.error('Tab message failed', chrome.runtime.lastError);
              resolve(false);
            } else if (response?.success) {
              this.state.processedChunks.push(this.state.chunks[chunkIndex]);
              logger.log(`Chunk ${chunkIndex + 1} processed successfully`);
              resolve(true);
            } else {
              logger.error('Chunk processing failed', response?.error);
              resolve(false);
            }
          }
        );
      });
    } catch (err) {
      logger.error('Error processing chunk', err);
      return false;
    }
  }

  async runAutomation() {
    try {
      while (this.state.currentIndex < this.state.chunks.length) {
        if (this.state.status === 'paused') {
          await new Promise(resolve => {
            const checkPause = setInterval(() => {
              if (this.state.status !== 'paused') {
                clearInterval(checkPause);
                resolve();
              }
            }, 500);
          });
        }

        if (this.state.status === 'stopped') {
          break;
        }

        const success = await this.processChunk(this.state.currentIndex);
        
        if (!success) {
          logger.warn(`Retry chunk ${this.state.currentIndex}`);
          // Wait before retry
          await delay(2000);
          continue;
        }

        // Save progress
        await this.saveProgress();

        // Update popup
        chrome.runtime.sendMessage({
          action: 'UPDATE_PROGRESS',
          current: this.state.currentIndex + 1,
          total: this.state.chunks.length
        }).catch(() => {});

        this.state.currentIndex++;
        
        // Wait between chunks
        await delay(1000);
      }

      this.state.status = 'completed';
      logger.log('Automation completed');
      await this.saveProgress();
    } catch (err) {
      logger.error('Automation error', err);
      this.state.status = 'error';
    }
  }

  async saveProgress() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        automation_progress: {
          currentIndex: this.state.currentIndex,
          totalChunks: this.state.chunks.length,
          status: this.state.status,
          processedCount: this.state.processedChunks.length
        }
      }, resolve);
    });
  }

  pause() {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
      logger.log('Automation paused');
    }
  }

  resume() {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
      logger.log('Automation resumed');
    }
  }

  stop() {
    this.state.status = 'stopped';
    logger.log('Automation stopped');
  }
}

// Global automation instance
let automation = new AutomationEngine();

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'START_AUTOMATION') {
        const { fixedPrompt, story } = request.payload;
        await automation.initialize(fixedPrompt, story);
        sendResponse({ success: true });
        
        // Run automation in background
        automation.runAutomation().catch(err => {
          logger.error('Automation failed', err);
        });
      } else if (request.action === 'PAUSE_AUTOMATION') {
        automation.pause();
        sendResponse({ success: true });
      } else if (request.action === 'RESUME_AUTOMATION') {
        automation.resume();
        sendResponse({ success: true });
      } else if (request.action === 'STOP_AUTOMATION') {
        automation.stop();
        sendResponse({ success: true });
      }
    } catch (err) {
      logger.error('Request handling error', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});

logger.log('Service Worker ready');
