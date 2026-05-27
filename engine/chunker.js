// chunker.js - Splits story into intelligent chunks
class Chunker {
  constructor(text, minSize = 250, maxSize = 350) {
    this.text = text;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.sentences = this.extractSentences(text);
  }

  extractSentences(text) {
    // Split by sentence boundaries
    return text
      .match(/[^.!?]+[.!?]+/g)
      ?.map(s => s.trim())
      .filter(s => s.length > 0) || [];
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

  getChunkCount() {
    return this.createChunks().length;
  }
}

export default Chunker;
