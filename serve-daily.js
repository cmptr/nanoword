#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'text/plain';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Route handling
  if (req.url === '/' || req.url === '/daily') {
    serveFile(res, path.join(__dirname, 'daily-puzzle.html'));
  } else if (req.url === '/puzzle') {
    // Serve today's puzzle JSON
    const today = new Date().toISOString().split('T')[0];
    const puzzlePath = path.join(__dirname, 'daily-puzzles', `puzzle-${today}.json`);
    serveFile(res, puzzlePath);
  } else if (req.url.startsWith('/daily-puzzles/')) {
    // Serve puzzle files
    const filePath = path.join(__dirname, req.url);
    serveFile(res, filePath);
  } else if (req.url === '/style.css') {
    serveFile(res, path.join(__dirname, 'style.css'));
  } else {
    // Try to serve static files
    const filePath = path.join(__dirname, req.url);
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      serveFile(res, filePath);
    });
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Nanowords Daily Puzzle Server`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🎯 Daily puzzle: http://localhost:${PORT}/daily`);
  console.log(`📋 Puzzle API: http://localhost:${PORT}/puzzle`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
