#!/bin/bash
cd /root/.openclaw/workspace/sherusites
source .env
RESELLER_ID=$(grep RESELLERCLUB_ID .env | cut -d= -f2)
RESELLER_KEY=$(grep RESELLERCLUB_API_KEY .env | cut -d= -f2)

# Check domain status
STATUS=$(curl -s "https://httpapi.com/api/domains/details-by-name.json?auth-userid=$RESELLER_ID&api-key=$RESELLER_KEY&domain-name=edhabaonline.in&options=OrderDetails" | python3 -c "import sys,json; print(json.load(sys.stdin).get('currentstatus',''))" 2>/dev/null)

echo "$(date): Domain status = $STATUS"

if [ "$STATUS" = "Active" ]; then
    echo "Domain active! Updating nameservers..."
    RESULT=$(curl -s -X POST "https://httpapi.com/api/domains/modify-ns.json" \
        -d "auth-userid=$RESELLER_ID&api-key=$RESELLER_KEY&order-id=124619540&ns=christina.ns.cloudflare.com&ns=dean.ns.cloudflare.com")
    echo "NS update result: $RESULT"
    # Remove cron after success
    crontab -l | grep -v fix-ns | crontab -
    echo "Cron removed."
else
    echo "Still processing, will retry..."
fi
