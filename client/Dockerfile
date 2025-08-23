# Dockerfile for Web Client - Enhanced
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first
COPY package*.json ./

# Debug: Show versions and content
RUN node --version && npm --version
RUN echo "=== package.json ===" && cat package.json

# Install dependencies
RUN if [ -f package-lock.json ]; then \
        npm ci; \
    else \
        npm install; \
    fi && npm cache clean --force

# Copy source code
COPY . .

# Debug: Show structure
RUN echo "=== Source structure ===" && ls -la src/ || echo "No src directory"

# Build the application
RUN npm run build

# Debug: Show build output
RUN echo "=== Build output ===" && ls -la dist/

# Production stage with nginx
FROM nginx:alpine AS production

# Install utilities
RUN apk update && apk upgrade && apk add --no-cache curl

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create health endpoint
RUN echo '{"status":"healthy","timestamp":"'$(date -Iseconds)'"}' > /usr/share/nginx/html/health

# Create directories
RUN mkdir -p /var/cache/nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run/nginx && \
    chmod -R 755 /var/cache/nginx /var/run/nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
