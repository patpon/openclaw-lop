#!/bin/bash

# Backup script for openclaw-lop to GitHub
# Runs daily at 5:00 AM

BACKUP_DIR="/root/.openclaw/workspace"
GITHUB_REPO="https://github.com/patpon/openclaw-lop.git"
LOG_FILE="/root/.openclaw/backup.log"

echo "=== Backup started at $(date) ===" >> $LOG_FILE

cd $BACKUP_DIR

# Add all changes
git add . >> $LOG_FILE 2>&1

# Commit changes
git commit -m "Daily backup - $(date '+%Y-%m-%d %H:%M:%S')" >> $LOG_FILE 2>&1

# Push to GitHub
git push origin main >> $LOG_FILE 2>&1

echo "Backup completed at $(date)" >> $LOG_FILE
echo "---" >> $LOG_FILE