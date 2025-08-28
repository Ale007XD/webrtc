#!/bin/sh
set -e

echo "🚀 Starting WebRTC Proxy..."

# Replace environment variables in nginx.conf
envsubst '${DOMAIN} ${EMAIL_LETSENCRYPT}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Create directories
mkdir -p /var/www/certbot /etc/letsencrypt/live/${DOMAIN}

# Generate self-signed certificate if Let's Encrypt certificates don't exist
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "🔒 Generating temporary self-signed certificate..."
    openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
        -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
fi

# Start nginx in background
echo "🌐 Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for nginx to start
sleep 5

# Try to obtain Let's Encrypt certificate
if [ "$DOMAIN" != "localhost" ] && [ -n "$EMAIL_LETSENCRYPT" ]; then
    echo "🔐 Obtaining Let's Encrypt certificate..."
    certbot certonly --webroot -w /var/www/certbot \
        --email ${EMAIL_LETSENCRYPT} \
        --agree-tos --no-eff-email \
        --domains ${DOMAIN},api.${DOMAIN} \
        --non-interactive || echo "⚠️ Certificate generation failed, using self-signed"
    
    # Reload nginx with new certificates
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        echo "✅ Reloading nginx with Let's Encrypt certificates..."
        nginx -s reload
    fi
    
    # Setup certificate renewal
    (
        while true; do
            sleep 12h
            certbot renew --quiet && nginx -s reload
        done
    ) &
fi

# Wait for nginx process
wait $NGINX_PID
