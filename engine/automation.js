// automation.js - Core automation engine
class Automation {
  constructor(fixedPrompt, chunks, overlapEngine) {
    this.fixedPrompt = fixedPrompt;
    this.chunks = chunks;
    this.overlapEngine = overlapEngine;
    this.processedChunks = [];
  }

  buildFinalPrompt(chunkIndex) {
    const currentChunk = this.chunks[chunkIndex];
    if (!currentChunk) return null;

    const memoryPrefix = this.overlapEngine.addMemoryPrefix(
      this.processedChunks
    );

    const finalPrompt = `${this.fixedPrompt}\n\n${memoryPrefix}${currentChunk}`;

    return finalPrompt;
  }

  recordProcessedChunk(chunk) {
    this.processedChunks.push(chunk);
  }

  getProcessedCount() {
    return this.processedChunks.length;
  }

  getTotalCount() {
    return this.chunks.length;
  }

  getProgress() {
    return {
      processed: this.getProcessedCount(),
      total: this.getTotalCount(),
      percentage: Math.round((this.getProcessedCount() / this.getTotalCount()) * 100)
    };
  }
}

export default Automation;
