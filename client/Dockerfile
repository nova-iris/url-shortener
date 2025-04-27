# Build stage
FROM node:20.12.0-alpine3.19 AS builder

# Set NODE_ENV
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with exact versions
RUN npm ci

# Copy source
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25.4-alpine

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    apk add --no-cache wget && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/* && \
    # Set restrictive permissions
    chmod -R 555 /app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]