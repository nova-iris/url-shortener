# Build stage
FROM node:23-alpine3.20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:23-alpine3.20

# Add non-root user and install wget and sed
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    apk add --no-cache wget sed && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Set working directory and copy built files
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Install only production dependencies and set permissions
RUN npm ci && \
    npm cache clean --force && \
    chmod +x /docker-entrypoint.sh && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4173/ || exit 1

# Expose the port the app runs on
EXPOSE 4173

# Set the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]