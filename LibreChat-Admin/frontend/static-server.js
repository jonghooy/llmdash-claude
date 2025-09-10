const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3091;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Remove /admin prefix if present
  if (req.url.startsWith('/admin')) {
    const urlWithoutAdmin = req.url.slice(6) || '/';
    filePath = path.join(DIST_DIR, urlWithoutAdmin === '/' ? 'index.html' : urlWithoutAdmin);
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, serve index.html for client-side routing
      filePath = path.join(DIST_DIR, 'index.html');
    }

    // Read and serve the file
    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }

      // Get file extension and set content type
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });
});

server.listen(PORT, () => {
  console.log(`Admin frontend server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
});