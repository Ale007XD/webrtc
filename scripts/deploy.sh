#!/bin/bash
set -e

echo "🚀 Starting WebRTC E2EE deployment..."

for var in DOMAIN EMAIL_LETSENCRYPT JWT_SIGNING_KEY TURN_REALM TURN_AUTH_SECRET TURN_CRED_TTL ALLOWED_USER_IDS CONTACT_LIST_JSON APP_PUBLIC_URL VPS_HOST; do
  if [ -z "${!var}" ]; then
    echo "⚠️ Переменная $var не задана!"
  fi
done

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
docker compose pull || true
docker compose build
docker compose up -d

echo "✅ Deployment completed successfully"
