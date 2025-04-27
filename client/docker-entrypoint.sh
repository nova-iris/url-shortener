#!/bin/sh
set -e

# Debug information
echo "Starting docker-entrypoint.sh"
echo "BACKEND_URL=$BACKEND_URL"

# For browser-based access, we need to use a URL accessible from the host
# If accessing from browser, use host-accessible URL, not Docker container name
BROWSER_BACKEND_URL=$(echo $BACKEND_URL | sed 's|http://server:5000|http://localhost:5000|g')
echo "Browser will access backend at: $BROWSER_BACKEND_URL"

# Create a runtime configuration in memory
echo "window.RUNTIME_CONFIG = { BACKEND_URL: '${BROWSER_BACKEND_URL}' };" > /tmp/config.js

# Copy the config to the dist directory
if [ -w /app/dist ]; then
  echo "Copying config to dist directory"
  cp /tmp/config.js /app/dist/config.js
  echo "Config file content:"
  cat /app/dist/config.js
else
  echo "WARNING: Dist directory is not writable, config will be served from /tmp"
  # We'll serve the config from /tmp if necessary
  mkdir -p /tmp/static
  cp /tmp/config.js /tmp/static/config.js
  echo "Config file content:"
  cat /tmp/static/config.js
fi

# Start the Vite preview server
echo "Starting Vite preview server..."
exec npm run preview -- --host 0.0.0.0 --port 4173