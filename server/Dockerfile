# Build stage
FROM node:23-alpine3.20 AS builder

# Accept build arguments
ARG NODE_ENV=production
ARG PORT=5000
ARG MONGO_INITDB_ROOT_USERNAME
ARG MONGO_INITDB_ROOT_PASSWORD
ARG MONGODB_HOST=mongo
ARG BASEURI=http://localhost:5000

# Set environment variables
ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT} \
    MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME} \
    MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD} \
    MONGODB_HOST=${MONGODB_HOST} \
    BASEURI=${BASEURI}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with exact versions
RUN npm ci

# Copy source and config files
COPY . .

# Production stage
FROM node:23-alpine3.20

# Accept build arguments again for the production stage
ARG NODE_ENV=production
ARG PORT=5000
ARG MONGO_INITDB_ROOT_USERNAME
ARG MONGO_INITDB_ROOT_PASSWORD
ARG MONGODB_HOST=mongo
ARG BASEURI=http://localhost:5000

# Set environment variables for the production stage
ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT} \
    MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME} \
    MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD} \
    MONGODB_HOST=${MONGODB_HOST} \
    BASEURI=${BASEURI}

# Add non-root user and install wget and dumb-init
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    apk add --no-cache wget dumb-init && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Set working directory and copy built files
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
# Don't copy .env file - it will be mounted or env vars will be injected

# Install only production dependencies and set permissions
RUN npm ci --only=production && \
    npm cache clean --force && \
    chown -R appuser:appgroup /app && \
    chmod -R 555 /app

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Expose the port the app runs on
EXPOSE ${PORT}

# Use dumb-init as entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["npm", "start"]