#!/bin/bash

# DNS Propagation Checker
DOMAIN="ajpatpon.cloud"
TARGET_IP="72.62.250.180"

echo "=== DNS Propagation Check for $DOMAIN ==="
echo "Target IP: $TARGET_IP"
echo ""

echo "1. Checking A record..."
dig +short $DOMAIN A

echo ""
echo "2. Checking from different DNS servers..."
echo "Google DNS:"
dig +short $DOMAIN A @8.8.8.8

echo ""
echo "Cloudflare DNS:"
dig +short $DOMAIN A @1.1.1.1

echo ""
echo "3. Checking HTTP response..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$DOMAIN

echo ""
echo "4. Checking HTTPS response..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -k https://$DOMAIN

echo ""
echo "=== End Check ==="