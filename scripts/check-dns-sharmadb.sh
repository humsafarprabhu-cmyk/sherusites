#!/bin/bash
# Check if sharmadbonline.in resolves, send WhatsApp when live
DOMAIN="sharmadbonline.in"
if dig +short "$DOMAIN" | grep -q '^[0-9]'; then
  cd /root/.openclaw/workspace/sherusites
  node -e "
    import 'dotenv/config';
    const T=process.env.META_ACCESS_TOKEN, P=process.env.META_PHONE_NUMBER_ID;
    fetch('https://graph.facebook.com/v21.0/'+P+'/messages',{method:'POST',headers:{'Authorization':'Bearer '+T,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:'918210329601',type:'text',text:{body:'🎉 *sharmadbonline.in is LIVE!* 🌍\n\nAapka custom domain ready hai!\n\n🔗 https://sharmadbonline.in\n\nAb duniya ko dikhao! 🚀'}})}).then(r=>console.log('Sent!',r.status));
  "
  # Remove cron after success
  crontab -l | grep -v "check-dns-sharmadb" | crontab -
  echo "[$(date)] DNS LIVE for $DOMAIN"
else
  echo "[$(date)] $DOMAIN not resolving yet"
fi
