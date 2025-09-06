/**
 * Resource Hints Middleware
 * Adds performance optimization hints for browsers
 */
const resourceHints = () => {
  return (req, res, next) => {
    // Add resource hints for common API endpoints
    const hints = [
      '</api/models>; rel=preconnect',
      '</api/endpoints>; rel=preconnect',
      '</api/config>; rel=preconnect',
      '</api/user>; rel=dns-prefetch',
      '</api/messages>; rel=dns-prefetch',
    ];

    // For chat pages, add more aggressive hints
    if (req.path.includes('/chat') || req.path === '/') {
      hints.push(
        '</api/ask>; rel=preload; as=fetch; crossorigin',
        '</api/models>; rel=preload; as=fetch; crossorigin'
      );
      
      // Add early hints for WebSocket/SSE connections
      res.setHeader('Early-Hints', 'Link: </api/ask>; rel=preconnect');
    }

    // Set Link header for resource hints
    if (hints.length > 0) {
      res.setHeader('Link', hints.join(', '));
    }

    // Enable HTTP/2 Server Push if available
    if (res.push) {
      // Push critical API data
      const pushStream = res.push('/api/config', {
        request: { accept: 'application/json' },
        response: {
          'content-type': 'application/json',
          'cache-control': 'max-age=300'
        }
      });
      
      pushStream.on('error', () => {
        // Ignore push errors (client may not support)
      });
    }

    next();
  };
};

module.exports = resourceHints;