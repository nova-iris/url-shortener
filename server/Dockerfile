# Build stage
FROM node:current-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:current-alpine

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    apk add --no-cache wget

# Set working directory and copy built files
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Install only production dependencies
RUN npm ci --only=production && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]