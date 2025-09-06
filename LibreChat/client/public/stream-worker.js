/**
 * Web Worker for stream processing
 * Handles text streaming in background thread for better performance
 */

class StreamBuffer {
  constructor() {
    this.buffer = [];
    this.processing = false;
    this.batchSize = 10;
    this.processInterval = 16; // ~60fps
  }

  add(chunk) {
    this.buffer.push(chunk);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    
    while (this.buffer.length > 0) {
      const batch = this.buffer.splice(0, this.batchSize);
      const combined = batch.join('');
      
      // Send processed chunk back to main thread
      self.postMessage({
        type: 'chunk',
        data: combined,
        remaining: this.buffer.length
      });
      
      // Small delay to prevent overwhelming main thread
      if (this.buffer.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.processInterval));
      }
    }
    
    this.processing = false;
  }

  flush() {
    if (this.buffer.length > 0) {
      const all = this.buffer.splice(0);
      self.postMessage({
        type: 'chunk',
        data: all.join(''),
        remaining: 0
      });
    }
  }

  clear() {
    this.buffer = [];
    this.processing = false;
  }
}

const streamBuffer = new StreamBuffer();

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'add':
      streamBuffer.add(data);
      break;
      
    case 'flush':
      streamBuffer.flush();
      break;
      
    case 'clear':
      streamBuffer.clear();
      break;
      
    case 'config':
      if (data.batchSize) streamBuffer.batchSize = data.batchSize;
      if (data.processInterval) streamBuffer.processInterval = data.processInterval;
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

// Send ready signal
self.postMessage({ type: 'ready' });