#!/bin/bash
# Health Check Script for WebRTC E2EE System

set -e

DOMAIN=${DOMAIN:-"localhost"}
echo "🏥 Running health checks for $DOMAIN..."

# Check web service
echo -n "Web service: "
if curl -sf "https://$DOMAIN/health" >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Check signaling API
echo -n "Signaling API: "
if curl -sf "https://api.$DOMAIN/api/health" >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Check Docker containers
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep webrtc- || echo "No webrtc containers found"

echo "✅ Health check completed"