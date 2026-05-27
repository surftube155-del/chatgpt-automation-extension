// overlap.js - Adds context overlap between chunks
class Overlap {
  constructor(sentenceCount = 3) {
    this.sentenceCount = sentenceCount;
  }

  extractLastNSentences(text, n) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(-n).join(' ').trim();
  }

  addOverlapContext(previousChunk, currentChunk) {
    if (!previousChunk) return currentChunk;

    const overlapContext = this.extractLastNSentences(previousChunk, this.sentenceCount);
    
    if (!overlapContext) return currentChunk;

    // Prepend overlap as context
    return `[Context: ${overlapContext}]\n\n${currentChunk}`;
  }

  addMemoryPrefix(previousChunks = []) {
    if (previousChunks.length === 0) return '';

    const lastChunk = previousChunks[previousChunks.length - 1];
    const memory = this.extractLastNSentences(lastChunk, 2);

    return memory ? `Remember: ${memory}\n` : '';
  }
}

export default Overlap;
