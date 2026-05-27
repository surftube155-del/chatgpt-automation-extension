// sessionStore.js - Session persistence
class SessionStore {
  constructor() {
    this.storageKey = 'chatgpt_automation_session';
  }

  async save(session) {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [this.storageKey]: {
          ...session,
          savedAt: new Date().toISOString()
        }
      }, resolve);
    });
  }

  async load() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        resolve(result[this.storageKey] || null);
      });
    });
  }

  async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.storageKey], resolve);
    });
  }

  async exists() {
    const session = await this.load();
    return session !== null;
  }
}

export default SessionStore;
