#!/bin/bash
set -e

echo "🚀 Starting TURN Server..."

# Detect external IP
EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "127.0.0.1")
export EXTERNAL_IP

echo "🌍 External IP detected: $EXTERNAL_IP"

# Generate self-signed certificates for TLS if not exist
if [ ! -f "/etc/coturn/turn_server_cert.pem" ]; then
    echo "🔒 Generating TURN server certificates..."
    openssl req -x509 -newkey rsa:2048 -keyout /etc/coturn/turn_server_pkey.pem \
        -out /etc/coturn/turn_server_cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${TURN_REALM}"
    
    # Set permissions
    chmod 600 /etc/coturn/turn_server_pkey.pem
    chmod 644 /etc/coturn/turn_server_cert.pem
fi

# Replace environment variables in configuration
echo "🔧 Configuring TURN server..."
envsubst '${TURN_REALM} ${TURN_AUTH_SECRET} ${EXTERNAL_IP}' < /etc/coturn/turnserver.conf > /tmp/turnserver.conf
mv /tmp/turnserver.conf /etc/coturn/turnserver.conf

# Ensure log directory exists
mkdir -p /var/log/turn

# Print configuration summary
echo "📋 TURN Server Configuration:"
echo "   Realm: ${TURN_REALM}"
echo "   External IP: ${EXTERNAL_IP}"
echo "   Auth Secret: ${TURN_AUTH_SECRET:0:8}***"
echo "   Credential TTL: ${TURN_CRED_TTL}s"

# Start TURN server
echo "🎯 Starting CoTURN..."
exec turnserver -c /etc/coturn/turnserver.conf
