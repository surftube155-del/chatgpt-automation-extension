// queue.js - Manages automation queue
class Queue {
  constructor(chunks) {
    this.chunks = chunks;
    this.currentIndex = 0;
    this.totalCount = chunks.length;
    this.status = 'idle'; // idle, running, paused, completed, error
  }

  getCurrentChunk() {
    return this.chunks[this.currentIndex] || null;
  }

  nextChunk() {
    if (this.hasNext()) {
      this.currentIndex++;
      return this.getCurrentChunk();
    }
    this.status = 'completed';
    return null;
  }

  hasNext() {
    return this.currentIndex < this.totalCount - 1;
  }

  getProgress() {
    return {
      currentIndex: this.currentIndex,
      totalCount: this.totalCount,
      percentage: Math.round((this.currentIndex / this.totalCount) * 100)
    };
  }

  setStatus(newStatus) {
    this.status = newStatus;
  }

  reset() {
    this.currentIndex = 0;
    this.status = 'idle';
  }

  skipToChunk(index) {
    if (index >= 0 && index < this.totalCount) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }
}

export default Queue;
