FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN apk update && apk upgrade && apk add --no-cache curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force && rm -rf /tmp/* /var/cache/apk/*

COPY --from=builder /app/dist ./dist
RUN chown -R nodeuser:nodejs /app

USER nodeuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]