/**
 * SSE (Server-Sent Events) optimizer middleware
 * Improves streaming performance for real-time responses
 */
const sseOptimizer = () => {
  return (req, res, next) => {
    // Add helper function for SSE setup
    res.initSSE = function() {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable Nginx buffering
      });

      // Disable Nagle's algorithm for lower latency
      if (res.socket && res.socket.setNoDelay) {
        res.socket.setNoDelay(true);
      }

      // Keep connection alive
      if (res.socket && res.socket.setKeepAlive) {
        res.socket.setKeepAlive(true, 30000);
      }

      // Send initial comment to establish connection
      res.write(':ok\n\n');
    };

    // Add helper function for sending SSE data
    res.sendSSE = function(data) {
      if (!res.writable) return false;
      
      const message = typeof data === 'object' 
        ? `data: ${JSON.stringify(data)}\n\n`
        : `data: ${data}\n\n`;
      
      return res.write(message);
    };

    next();
  };
};

module.exports = sseOptimizer;