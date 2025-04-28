#!/bin/sh
set -e

# Debug information
echo "Starting docker-entrypoint.sh"
echo "BACKEND_URL=$BACKEND_URL"

# For Kubernetes, we need to handle potential different service names and configurations
RUNTIME_BACKEND_URL=${BACKEND_URL:-http://server:5000}

# Since we can't modify files in a read-only filesystem, we'll use a different approach
# Create a temporary directory for our dynamic assets if it doesn't exist
mkdir -p /tmp/dist

# Create our dynamic runtime configuration
cat > /tmp/dist/runtime-config.js << EOF
// Runtime configuration generated at container startup
window.RUNTIME_CONFIG = {
    BACKEND_URL: '${RUNTIME_BACKEND_URL}'
};
EOF

echo "Runtime config generated:"
cat /tmp/dist/runtime-config.js

# Start the Vite preview server with custom config to serve our dynamic runtime config
echo "Starting Vite preview server..."
export PATH="/app/node_modules/.bin:$PATH"

# Create a simpler approach with plain static file serving
cat > /tmp/serve-static.js << EOF
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4173;
const DIST_DIR = '/app/dist';
const CONFIG_PATH = '/tmp/dist/runtime-config.js';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  
  // Special case for config.js - serve our dynamic runtime config
  if (req.url === '/config.js') {
    res.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(CONFIG_PATH).pipe(res);
    return;
  }
  
  // Handle root path
  let filePath = req.url === '/' 
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, req.url);
  
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, try index.html for SPA routing
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(\`Server Error: \${error.code}\`);
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(\`Server running at http://0.0.0.0:\${PORT}/\`);
});
EOF

# Execute our simpler static file server that doesn't require Vite at runtime
cd /app
exec node /tmp/serve-static.js