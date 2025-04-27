# Build stage
FROM node:20.12.0-alpine3.19 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Create .env file from environment variables
RUN echo "VITE_APP_URI=$VITE_APP_URI" > .env
RUN npm run build

# Production stage
FROM node:20.12.0-alpine3.19

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

# Install only production dependencies and set permissions
RUN npm ci --only=production && \
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

# Start the application in preview mode with host exposed
CMD ["npm", "run", "preview", "--", "--host"]