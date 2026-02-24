#!/bin/bash
RESULT=$(curl -s -o /dev/null -w "%{http_code}" "https://httpapi.com/api/domains/available.json?auth-userid=1316776&api-key=WIX0Js5EyhfE4ipvXgiksHW3h6uYlfg5&domain-name=test123&tlds=in" --max-time 10)
if [ "$RESULT" = "200" ]; then
  echo "[$(date)] ResellerClub API ACCESSIBLE!" >> /root/.openclaw/workspace/sherusites/logs/reseller.log
  # Remove this cron
  crontab -l | grep -v "check-reseller" | crontab -
else
  echo "[$(date)] Still blocked (HTTP $RESULT)" >> /root/.openclaw/workspace/sherusites/logs/reseller.log
fi
