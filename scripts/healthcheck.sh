#!/bin/bash
# SheruSites Health Check — runs every 5 min via cron
# Restarts PM2 if server is down, logs all checks

LOG="/root/.openclaw/workspace/sherusites/logs/health.log"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:4000/health 2>/dev/null)

if [ "$STATUS" = "200" ]; then
  echo "[$(date)] OK" >> "$LOG"
else
  echo "[$(date)] DOWN (HTTP $STATUS) — restarting PM2" >> "$LOG"
  cd /root/.openclaw/workspace/sherusites && pm2 restart sherusites >> "$LOG" 2>&1
  sleep 5
  STATUS2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:4000/health 2>/dev/null)
  if [ "$STATUS2" = "200" ]; then
    echo "[$(date)] RECOVERED" >> "$LOG"
  else
    echo "[$(date)] STILL DOWN after restart!" >> "$LOG"
  fi
fi

# Keep log under 1MB
if [ $(wc -c < "$LOG" 2>/dev/null || echo 0) -gt 1000000 ]; then
  tail -500 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi
