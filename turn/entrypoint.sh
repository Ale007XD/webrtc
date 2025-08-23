#!/bin/bash
# TURN Server Entrypoint Script

set -e

# Generate self-signed certificates if not present
if [ ! -f /etc/ssl/certs/turn_server_cert.pem ]; then
    echo "Generating self-signed certificates for TURN..."
    openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/private/turn_server_pkey.pem \
        -out /etc/ssl/certs/turn_server_cert.pem -days 365 -nodes \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=WebRTC-E2EE/CN=${TURN_REALM:-localhost}"
    chmod 600 /etc/ssl/private/turn_server_pkey.pem
fi

# Substitute environment variables in config
envsubst < /etc/turnserver.conf > /tmp/turnserver.conf
mv /tmp/turnserver.conf /etc/turnserver.conf

# Start TURN server
exec turnserver "$@"