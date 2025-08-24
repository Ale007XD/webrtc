#!/bin/bash
set -e

echo "🚀 Starting WebRTC E2EE deployment..."

# Проверим что всё пришло
if [[ -z "$DOMAIN" || -z "$EMAIL_LETSENCRYPT" || -z "$JWT_SIGNING_KEY" || -z "$TURN_REALM" || -z "$TURN_AUTH_SECRET" ]]; then
  echo "❌ Один из ENV-параметров не задан!"
  exit 1
fi

# Сохраняем .env для docker-compose
cat > .env <<EOF
DOMAIN=${DOMAIN}
EMAIL_LETSENCRYPT=${EMAIL_LETSENCRYPT}
JWT_SIGNING_KEY=${JWT_SIGNING_KEY}
TURN_REALM=${TURN_REALM}
TURN_AUTH_SECRET=${TURN_AUTH_SECRET}
TURN_CRED_TTL=${TURN_CRED_TTL}
ALLOWED_USER_IDS=${ALLOWED_USER_IDS}
CONTACT_LIST_JSON=${CONTACT_LIST_JSON}
APP_PUBLIC_URL=${APP_PUBLIC_URL}
VPS_HOST=${VPS_HOST}
EOF

echo "Содержимое .env:"
cat .env

docker compose down || true
docker compose pull
docker compose up -d

echo "✅ Deployment completed successfully"
