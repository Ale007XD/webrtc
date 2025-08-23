FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production

RUN apk update && apk upgrade && apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo '{"status":"healthy"}' > /usr/share/nginx/html/health

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]