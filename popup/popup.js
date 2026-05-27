// popup.js - Main UI controller
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const stopBtn = document.getElementById('stopBtn');
  const fixedPromptTextarea = document.getElementById('fixedPrompt');
  const storyTextarea = document.getElementById('story');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');

  // Load saved data
  chrome.storage.local.get(['fixedPrompt', 'story', 'status', 'progress'], (result) => {
    if (result.fixedPrompt) fixedPromptTextarea.value = result.fixedPrompt;
    if (result.story) storyTextarea.value = result.story;
    updateStatus(result.status || 'idle');
    if (result.progress) {
      progressDiv.textContent = `Progress: ${result.progress.currentChunk}/${result.progress.totalChunks}`;
    }
  });

  startBtn.addEventListener('click', () => {
    const fixedPrompt = fixedPromptTextarea.value.trim();
    const story = storyTextarea.value.trim();

    if (!fixedPrompt || !story) {
      alert('Please fill in both Fixed Prompt and Story fields');
      return;
    }

    chrome.storage.local.set({
      fixedPrompt,
      story,
      status: 'running',
      currentChunk: 0
    });

    chrome.runtime.sendMessage({
      action: 'START_AUTOMATION',
      payload: { fixedPrompt, story }
    }, (response) => {
      if (response?.success) {
        updateStatus('running');
      } else {
        updateStatus('error');
        statusDiv.textContent += ` - ${response?.error || 'Unknown error'}`;
      }
    });
  });

  pauseBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'PAUSE_AUTOMATION' }, () => {
      updateStatus('paused');
    });
  });

  resumeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'RESUME_AUTOMATION' }, () => {
      updateStatus('running');
    });
  });

  stopBtn.addEventListener('click', () => {
    if (confirm('Stop automation? Progress will be saved.')) {
      chrome.runtime.sendMessage({ action: 'STOP_AUTOMATION' }, () => {
        updateStatus('stopped');
      });
    }
  });

  function updateStatus(status) {
    const statusMap = {
      idle: '⚪ Idle',
      running: '🟢 Running',
      paused: '🟡 Paused',
      stopped: '🔴 Stopped',
      completed: '✅ Completed',
      error: '❌ Error'
    };
    statusDiv.textContent = statusMap[status] || status;
  }

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_PROGRESS') {
      progressDiv.textContent = `Progress: ${request.current}/${request.total}`;
    }
  });
});
