#!/bin/sh
set -e

# Debug information
echo "Starting docker-entrypoint.sh"
echo "BACKEND_URL=$BACKEND_URL"

# BACKEND_URL is the internal cluster service URL for proxying API requests
# This should be set to something like http://url-shortener-server:5000
INTERNAL_BACKEND_URL=${BACKEND_URL:-http://localhost:5000}

echo "INFO: Internal backend URL for API proxy: $INTERNAL_BACKEND_URL"

# Since we can't modify files in a read-only filesystem, we'll use a different approach
# Create a temporary directory for our dynamic assets if it doesn't exist
mkdir -p /tmp/dist

# Create runtime configuration for the frontend
# BACKEND_URL is empty because the frontend makes requests to the same origin (/api)
# and the client server proxies those requests to the internal backend
cat > /tmp/dist/runtime-config.js << EOF
// Runtime configuration generated at container startup
// API requests go to /api (same origin) and are proxied to the internal backend
window.RUNTIME_CONFIG = {
    BACKEND_URL: ''
};
EOF

echo "Runtime config generated:"
cat /tmp/dist/runtime-config.js

# Start the static file server with API proxy
echo "Starting static file server with API proxy..."
export PATH="/app/node_modules/.bin:$PATH"

# Create a static file server with API proxy to internal backend
cat > /tmp/serve-static.js << EOF
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4173;
const DIST_DIR = '/app/dist';
const CONFIG_PATH = '/tmp/dist/runtime-config.js';
const BACKEND_URL = '${INTERNAL_BACKEND_URL}';

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

// Proxy request to backend
function proxyToBackend(req, res) {
  const backendUrl = new URL(req.url, BACKEND_URL);
  
  // Collect request body for POST/PUT/PATCH requests
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body);
    
    const options = {
      hostname: backendUrl.hostname,
      port: backendUrl.port || 80,
      path: backendUrl.pathname + backendUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: backendUrl.host,
      },
    };
    
    // Remove headers that shouldn't be forwarded
    delete options.headers['host'];
    options.headers['host'] = backendUrl.host;
    
    console.log(\`Proxying \${req.method} \${req.url} -> \${BACKEND_URL}\${req.url}\`);
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Backend service unavailable', details: err.message }));
    });
    
    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}

const server = http.createServer((req, res) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  
  // Proxy /api requests to the internal backend service
  if (req.url.startsWith('/api')) {
    proxyToBackend(req, res);
    return;
  }
  
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
  console.log(\`API proxy target: \${BACKEND_URL}\`);
});
EOF

# Execute our static file server with API proxy
cd /app
exec node /tmp/serve-static.js