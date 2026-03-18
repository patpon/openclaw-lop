#!/bin/bash

# Daily backup script for OpenClaw workspace to GitHub
# This script backs up the workspace to GitHub repository

# Configuration
REPO_URL="https://github.com/patpon/openclaw-lop.git"
WORKSPACE_DIR="/root/.openclaw/workspace"
LOG_FILE="/root/.openclaw/backup.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
    echo "[$TIMESTAMP] $1"
}

# Start backup
log_message "=== Backup started at $(date '+%Y-%m-%d %H:%M:%S UTC') ==="

# Change to workspace directory
cd "$WORKSPACE_DIR" || {
    log_message "ERROR: Cannot change to workspace directory"
    exit 1
}

# Initialize git if not exists
if [ ! -d ".git" ]; then
    log_message "Initializing git repository..."
    git init
    git remote add origin "$REPO_URL"
    log_message "Git repository initialized"
fi

# Set git configuration
git config user.name "OpenClaw Backup"
git config user.email "backup@openclaw.local"

# Add all files (respecting .gitignore)
log_message "Adding files to git..."
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD; then
    log_message "No changes to commit"
else
    # Commit changes
    log_message "Committing changes..."
    git commit -m "Daily backup - $(date '+%Y-%m-%d %H:%M:%S')" --author="OpenClaw Backup <backup@openclaw.local>"
    
    # Push to GitHub with authentication
    log_message "Pushing to GitHub..."
    
    # Try to push (this will fail if credentials are not set up, but that's expected)
    if git push origin main 2>/dev/null; then
        log_message "✅ Backup successful - pushed to GitHub"
    else
        log_message "⚠️  Backup completed locally but failed to push to GitHub"
        log_message "   This is normal if GitHub credentials are not configured"
        log_message "   Files are safely committed locally"
    fi
fi

log_message "Backup completed at $(date '+%Y-%m-%d %H:%M:%S UTC')"
log_message "---"