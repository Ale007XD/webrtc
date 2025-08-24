#!/bin/bash
set -e

echo "🚀 Starting WebRTC E2EE deployment..."

# Create environment file
cat > .env << EOF
DOMAIN=${{ secrets.DOMAIN }}
EMAIL_LETSENCRYPT=${{ secrets.EMAIL_LETSENCRYPT }}
JWT_SIGNING_KEY=${{ secrets.JWT_SIGNING_KEY }}
TURN_REALM=${{ secrets.TURN_REALM }}
TURN_AUTH_SECRET=${{ secrets.TURN_AUTH_SECRET }}
EOF

# Deploy with Docker Compose
docker-compose down || true
docker-compose pull
docker-compose up -d

echo "✅ Deployment completed successfully"
