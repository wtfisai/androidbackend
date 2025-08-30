# Multi-stage build for optimized image size
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Install runtime dependencies
# Adding tools that might be needed for system diagnostics
RUN apk add --no-cache \
    bash \
    curl \
    net-tools \
    procps \
    iputils \
    busybox-extras \
    tcpdump \
    strace \
    lsof \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy node modules from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
# We only copy the files necessary for production.
# Development files like linting configs, markdown files, and helper scripts are excluded.
# This is safe because we run `npm ci --only=production`, which does not install devDependencies,
# so no build steps inside the container will need these files.
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs public/ ./public/
COPY --chown=nodejs:nodejs utils/ ./utils/

# Create directories for logs and data, and set ownership
# The /data/local/tmp directory is used by the debug tools to store temporary files.
# We give the nodejs user ownership instead of using chmod 777 for better security.
RUN mkdir -p /app/logs /app/data /data/local/tmp && \
    chown -R nodejs:nodejs /app/logs /app/data /data/local/tmp

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    API_KEY=diagnostic-api-key-2024

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Switch to non-root user
USER nodejs

# Start the application
CMD ["node", "src/server.js"]