/**
 * Advanced Stream Optimizer Middleware
 * Implements multiple optimization techniques for SSE streaming
 */
const { logger } = require('@librechat/data-schemas');

class StreamBuffer {
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 4096; // 4KB default buffer
    this.flushInterval = options.flushInterval || 50; // 50ms flush interval
    this.buffer = '';
    this.lastFlush = Date.now();
    this.flushTimer = null;
    this.response = null;
  }

  init(res) {
    this.response = res;
    this.buffer = '';
    this.lastFlush = Date.now();
    
    // Setup optimized headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
      'X-Content-Type-Options': 'nosniff',
      'Transfer-Encoding': 'chunked',
      // HTTP/2 Server Push hint
      'Link': '</api/models>; rel=preload; as=fetch',
    });

    // TCP optimizations
    if (res.socket) {
      // Disable Nagle's algorithm for lower latency
      res.socket.setNoDelay(true);
      
      // Keep connection alive with aggressive settings
      res.socket.setKeepAlive(true, 10000); // 10 second keep-alive
      
      // Increase socket buffer sizes for better throughput
      if (res.socket.bufferSize) {
        res.socket.bufferSize = 65536; // 64KB buffer
      }
      
      // Set socket timeout
      res.socket.setTimeout(300000); // 5 minutes
    }

    // Send initial connection establishment
    res.write(':ok\n\n');
    res.flush && res.flush(); // Force flush if available
  }

  write(data) {
    if (!this.response || !this.response.writable) {
      return false;
    }

    const message = typeof data === 'object' 
      ? `data: ${JSON.stringify(data)}\n\n`
      : `data: ${data}\n\n`;

    this.buffer += message;

    // Check if we should flush
    const now = Date.now();
    const shouldFlush = 
      this.buffer.length >= this.bufferSize || 
      (now - this.lastFlush) >= this.flushInterval;

    if (shouldFlush) {
      this.flush();
    } else {
      // Schedule a flush if not already scheduled
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.flushInterval);
      }
    }

    return true;
  }

  flush() {
    if (!this.response || !this.response.writable || !this.buffer) {
      return;
    }

    try {
      this.response.write(this.buffer);
      
      // Try to use platform-specific flush
      if (this.response.flush) {
        this.response.flush();
      } else if (this.response.flushHeaders) {
        this.response.flushHeaders();
      }
      
      this.buffer = '';
      this.lastFlush = Date.now();
      
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
    } catch (error) {
      logger.error('Stream flush error:', error);
    }
  }

  end() {
    this.flush();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

const streamOptimizer = (options = {}) => {
  return (req, res, next) => {
    // Create a buffer for this response
    const buffer = new StreamBuffer(options);

    // Enhanced SSE initialization
    res.initSSE = function() {
      buffer.init(res);
      
      // Add heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (res.writable) {
          res.write(':heartbeat\n\n');
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Clean up on close
      res.on('close', () => {
        clearInterval(heartbeat);
        buffer.end();
      });
    };

    // Buffered SSE send
    res.sendSSE = function(data) {
      return buffer.write(data);
    };

    // Force flush method
    res.flushSSE = function() {
      buffer.flush();
    };

    // End SSE stream
    res.endSSE = function(finalData) {
      if (finalData) {
        buffer.write(finalData);
      }
      buffer.end();
    };

    // Optimized chunked sending for large responses
    res.sendChunked = function(data, chunkSize = 1024) {
      if (!res.writable) return false;
      
      const text = typeof data === 'object' ? JSON.stringify(data) : data;
      const chunks = [];
      
      // Split into optimal chunks
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      // Send chunks with micro-delays to prevent overwhelming
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          if (res.writable) {
            res.sendSSE({ partial: true, text: chunk, index });
          }
        }, index * 10); // 10ms between chunks
      });
      
      return true;
    };

    next();
  };
};

module.exports = streamOptimizer;