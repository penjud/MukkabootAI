const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable compression
app.use(compression());

// Check if the dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Error: The "dist" directory does not exist.');
  console.error('Please run "npm run build" to create the production build.');
  process.exit(1);
}

// Serve static files from the dist directory
app.use(express.static(distPath));

// Proxy API requests to the appropriate backend services
app.use('/api/*', (req, res) => {
  res.status(404).send('API proxy not implemented in production server. Please use the development server for API proxy functionality.');
});

// For any other request, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`MukkabootAI Vue Dashboard running on port ${PORT}`);
  
  // Signal ready for PM2
  if (process.send) {
    process.send('ready');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});