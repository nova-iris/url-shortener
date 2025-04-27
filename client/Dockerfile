# Build stage
FROM node:23-alpine3.20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Create .env file from environment variables
RUN echo "VITE_APP_URI=$VITE_APP_URI" > .env
RUN npm run build

# Production stage
FROM node:23-alpine3.20

# Add non-root user and install wget
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    apk add --no-cache wget && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Set working directory and copy built files
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./

# Install only production dependencies and set permissions
RUN npm ci && \
    npm cache clean --force && \
    chown -R appuser:appgroup /app && \
    chmod -R 555 /app

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4173/ || exit 1

# Expose the port the app runs on
EXPOSE 4173

# Start the application in preview mode with host and port explicitly set
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]