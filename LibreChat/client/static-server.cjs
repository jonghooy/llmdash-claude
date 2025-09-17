const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3095;
const DIST_PATH = path.join(__dirname, 'dist');

// Serve static files with /chat prefix
app.use('/chat', express.static(DIST_PATH));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/chat');
});

// Catch all handler - serve index.html for client-side routing
app.get('/chat/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LibreChat Frontend running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_PATH}`);
});