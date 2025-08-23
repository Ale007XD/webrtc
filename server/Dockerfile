# Dockerfile for Signaling Server - Enhanced with debugging
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first
COPY package*.json ./

# Debug: Show Node.js and npm versions
RUN node --version && npm --version

# Debug: Show package.json content
RUN echo "=== package.json ===" && cat package.json

# Debug: Check if package-lock.json exists
RUN if [ -f package-lock.json ]; then echo "package-lock.json exists"; else echo "package-lock.json missing, using npm install"; fi

# Install dependencies (fallback to npm install if npm ci fails)
RUN if [ -f package-lock.json ]; then \
        npm ci; \
    else \
        npm install; \
    fi && npm cache clean --force

# Copy source code
COPY . .

# Debug: Show directory structure
RUN echo "=== Directory structure ===" && ls -la

# Build TypeScript to JavaScript
RUN npm run build

# Debug: Show build output
RUN echo "=== Build output ===" && ls -la dist/

# Production stage
FROM node:18-alpine AS production

# Install security updates and curl for healthcheck
RUN apk update && apk upgrade && apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production; \
    else \
        npm install --only=production; \
    fi && npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
