#!/bin/bash
# Smoke Test Script for WebRTC E2EE System

set -e

DOMAIN=${DOMAIN:-"localhost"}
echo "🧪 Running smoke tests for $DOMAIN..."

# Test 1: Web application loads
echo -n "Test 1 - Web app loads: "
if curl -sf "https://$DOMAIN/" | grep -q "WebRTC E2EE"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test 2: API responds
echo -n "Test 2 - API responds: "
if curl -sf "https://api.$DOMAIN/api/health" | grep -q "healthy"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test 3: TURN server accessible
echo -n "Test 3 - TURN server: "
if nc -z -w5 "$DOMAIN" 3478 2>/dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo "🎯 Smoke tests completed"