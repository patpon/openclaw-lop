#!/bin/bash

# OpenClaw Dashboard Startup Script
# This script starts the OpenClaw monitoring dashboard

DASHBOARD_DIR="/root/.openclaw/workspace"
LOG_FILE="/var/log/openclaw-dashboard.log"

echo "=== OpenClaw Dashboard Startup ==="
echo "Date: $(date)"
echo "Directory: $DASHBOARD_DIR"
echo "Log: $LOG_FILE"
echo ""

cd $DASHBOARD_DIR

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if Express is installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the dashboard server
echo "🚀 Starting OpenClaw Dashboard..."
echo "📊 Dashboard will be available at: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔐 Default login: admin / openclaw2024"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with logging
nohup node server.js > $LOG_FILE 2>&1 &
SERVER_PID=$!

echo "✅ Dashboard server started with PID: $SERVER_PID"
echo "📋 Check logs: tail -f $LOG_FILE"
echo ""

# Wait a moment and check if server is running
sleep 2
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Dashboard is running successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Local: http://localhost:3000"
    echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📝 To stop the server: kill $SERVER_PID"
else
    echo "❌ Failed to start dashboard server"
    echo "📋 Check logs: cat $LOG_FILE"
    exit 1
fi