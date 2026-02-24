#!/bin/bash
# SheruSites — Daily SQLite backup
# Keeps last 7 days of backups

BACKUP_DIR="/root/.openclaw/workspace/sherusites/backups"
DB_PATH="/root/.openclaw/workspace/sherusites/data/sherusites.db"
DATE=$(date +%Y-%m-%d_%H%M)

mkdir -p "$BACKUP_DIR"

# Use SQLite's .backup for safe copy (works even during writes with WAL)
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/sherusites_$DATE.db'"

# Compress
gzip "$BACKUP_DIR/sherusites_$DATE.db"

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "sherusites_*.db.gz" -mtime +7 -delete

echo "[Backup] $(date) — sherusites_$DATE.db.gz ($(du -sh "$BACKUP_DIR/sherusites_$DATE.db.gz" | cut -f1))"
