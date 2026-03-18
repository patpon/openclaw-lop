#!/bin/bash

# SSL Certificate Setup Script
DOMAIN="ajpatpon.cloud"
EMAIL="admin@ajpatpon.cloud"  # เปลี่ยนเป็น email ของพี่ลภ

echo "=== SSL Certificate Setup for $DOMAIN ==="
echo "Email: $EMAIL"
echo ""

# Stop Nginx temporarily for certbot
echo "🔄 Stopping Nginx..."
systemctl stop nginx

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Check if certificate was obtained successfully
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Enable HTTPS server block
    echo "🔄 Enabling HTTPS configuration..."
    sed -i 's/^# server/server/g' /etc/nginx/sites-available/openclaw-dashboard
    
    # Test Nginx configuration
    echo "🔧 Testing Nginx configuration..."
    /usr/sbin/nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid!"
        
        # Start Nginx
        echo "🔄 Starting Nginx..."
        systemctl start nginx
        
        # Setup auto-renewal
        echo "🔄 Setting up auto-renewal..."
        systemctl enable certbot.timer
        systemctl start certbot.timer
        
        echo "✅ SSL setup completed successfully!"
        echo "🌐 Your dashboard is now available at: https://$DOMAIN"
    else
        echo "❌ Nginx configuration test failed!"
        echo "🔄 Starting Nginx with HTTP only..."
        systemctl start nginx
    fi
else
    echo "❌ Failed to obtain SSL certificate!"
    echo "🔄 Starting Nginx with HTTP only..."
    systemctl start nginx
fi

echo ""
echo "=== End SSL Setup ==="