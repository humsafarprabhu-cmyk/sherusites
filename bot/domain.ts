/**
 * SheruSites Domain Manager
 * Full automated chain: suggest → register → Cloudflare → tunnel → DNS check → WhatsApp progress
 */

import fs from 'fs';
import path from 'path';
import dns from 'dns';

const RESELLER_ID = process.env.RESELLERCLUB_ID || '1316776';
const API_KEY = process.env.RESELLERCLUB_API_KEY || '';
const API_BASE = 'https://httpapi.com/api';

const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '5fe680e01145c390314fc36eb93d5ea2';
const CF_TUNNEL_ID = 'cb96adac-799f-4f7f-b739-2b54d9f767e2';
const CF_TUNNEL_CNAME = `${CF_TUNNEL_ID}.cfargotunnel.com`;
const TUNNEL_CONFIG = '/root/.cloudflared/config.yml';
const TUNNEL_CONFIG_SYSTEMD = '/etc/cloudflared/config.yml';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_ALERT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || '1038264809';

// WhatsApp send function — injected from server.ts
let _sendWhatsApp: ((to: string, text: string) => Promise<void>) | null = null;
let _sendCtaUrl: ((to: string, body: string, url: string, buttonText: string) => Promise<void>) | null = null;
export function setSendWhatsApp(fn: (to: string, text: string) => Promise<void>) { _sendWhatsApp = fn; }
export function setSendCtaUrl(fn: (to: string, body: string, url: string, buttonText: string) => Promise<void>) { _sendCtaUrl = fn; }
async function wa(phone: string, msg: string) { if (_sendWhatsApp) await _sendWhatsApp(phone, msg); }

// ─── TLD COSTS & PRICING ────────────────────────────────────────────────────

const TLD_COSTS: Record<string, number> = {
  '.in': 719, '.co.in': 649, '.com': 899, '.online': 2555, '.org': 999,
};
const DOMAIN_BUDGET = 750; // included in base plan
const BASE_PLAN_PRICE = 1499;

export function calculatePlanPrice(domain: string): number {
  const tld = '.' + domain.split('.').slice(1).join('.');
  const cost = TLD_COSTS[tld] || 750;
  if (cost <= DOMAIN_BUDGET) return BASE_PLAN_PRICE;
  return BASE_PLAN_PRICE + (cost - DOMAIN_BUDGET);
}

export function getDomainCost(domain: string): number {
  const tld = '.' + domain.split('.').slice(1).join('.');
  return TLD_COSTS[tld] || 750;
}

// ─── DOMAIN AVAILABILITY ─────────────────────────────────────────────────────

export async function checkDomainAvailability(domain: string): Promise<{ available: boolean; domain: string }> {
  const name = domain.replace(/\.in$/, '');
  try {
    const url = `${API_BASE}/domains/available.json?auth-userid=${RESELLER_ID}&api-key=${API_KEY}&domain-name=${name}&tlds=in`;
    const res = await fetch(url);
    const data = await res.json();
    const key = `${name}.in`;
    const status = data[key]?.status;
    return { available: status === 'available', domain: key };
  } catch (err: any) {
    console.error('[Domain] Availability check failed:', err.message);
    return { available: false, domain: `${name}.in` };
  }
}

// ─── SMART DOMAIN SUGGESTIONS ────────────────────────────────────────────────

function generateCandidates(businessName: string, city?: string): string[] {
  const clean = businessName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  // Filter out common filler words
  const stopWords = new Set(['and', 'the', 'of', 'for', 'in', 'a', 'an', 'by', 'at', 'to', 'ka', 'ki', 'ke', 'aur', 'or', 'with', 'co', 'ltd', 'pvt', 'inc']);
  const words = clean.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  // Extract first meaningful word from city/address (avoid long concatenated strings)
  const cityWords = (city || '').toLowerCase().split(/[\s,]+/).map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 3 && w.length <= 8);
  const cityClean = cityWords[0] || '';
  const candidates: string[] = [];

  const w1 = words[0] || '';
  const w2 = words[1] || '';
  const base12 = w1 + w2; // e.g. kumarelectronics

  const hyph12 = w1 + '-' + w2; // e.g. kumar-electronics

  // RULE 1: First + Second joined (kumarelectronics)
  if (base12.length >= 5 && base12.length <= 25) candidates.push(base12);

  // RULE 2: First - Second hyphenated (kumar-electronics)
  if (hyph12.length <= 25) candidates.push(hyph12);

  // RULE 3: First + Second + india / First-Second-india
  if ((base12 + 'india').length <= 25) candidates.push(base12 + 'india');
  if ((hyph12 + '-india').length <= 25) candidates.push(hyph12 + '-india');

  // RULE 4: First + Second + city / First-Second-city
  if (cityClean && cityClean !== w1 && cityClean !== w2) {
    if ((base12 + cityClean).length <= 25) candidates.push(base12 + cityClean);
    if ((hyph12 + '-' + cityClean).length <= 25) candidates.push(hyph12 + '-' + cityClean);
  }

  // RULE 5: All words joined / hyphenated (for 3+ word names)
  if (words.length > 2) {
    const full = words.join('');
    const fullHyph = words.join('-');
    if (full.length <= 25 && full !== base12) candidates.push(full);
    if (fullHyph.length <= 25) candidates.push(fullHyph);
    if ((full + 'india').length <= 25) candidates.push(full + 'india');
    if ((fullHyph + '-india').length <= 25) candidates.push(fullHyph + '-india');
  }

  // RULE 6: First word + abbreviated second word (e.g. kumarelec, kumarrestau)
  if (w2.length > 6) {
    const w2short = w2.slice(0, 4);
    const shortBase = w1 + w2short;
    if (shortBase.length >= 5) {
      candidates.push(shortBase);
      if (cityClean) candidates.push(shortBase + cityClean);
      candidates.push(shortBase + 'india');
    }
  }

  // RULE 7: First word + india (last resort)
  if (w1.length >= 4 && (w1 + 'india').length <= 25) candidates.push(w1 + 'india');

  // Deduplicate & remove empty
  return [...new Set(candidates)].filter(c => c.length >= 5).slice(0, 18);
}

export async function findAvailableDomains(businessName: string, count: number = 3, city?: string): Promise<string[]> {
  const candidates = generateCandidates(businessName, city);
  const available: string[] = [];

  // Check in batches of 3 for speed
  for (let i = 0; i < candidates.length && available.length < count; i += 3) {
    const batch = candidates.slice(i, i + 3);
    const results = await Promise.all(batch.map(c => checkDomainAvailability(c)));
    for (const r of results) {
      if (r.available && available.length < count) available.push(r.domain);
    }
    if (i + 3 < candidates.length && available.length < count) {
      await new Promise(r => setTimeout(r, 800)); // Rate limit
    }
  }

  return available;
}

// ─── GET/CREATE CUSTOMER ─────────────────────────────────────────────────────

export async function getOrCreateCustomer(email: string, name: string, phone: string): Promise<string | null> {
  try {
    const searchUrl = `${API_BASE}/customers/search.json?auth-userid=${RESELLER_ID}&api-key=${API_KEY}&username=${encodeURIComponent(email)}&no-of-records=1&page-no=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData && typeof searchData === 'object' && !searchData.status) {
      const firstKey = Object.keys(searchData).find(k => k !== 'recsonpage' && k !== 'recsindb');
      if (firstKey) return searchData[firstKey]['customer.customerid'];
    }

    const passwd = 'Sheru' + Math.random().toString(36).slice(2, 10) + 'A1';
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID, 'api-key': API_KEY,
      'username': email, 'passwd': passwd, 'name': name, 'company': name,
      'address-line-1': 'India', 'city': 'Delhi', 'state': 'Delhi', 'country': 'IN', 'zipcode': '110001',
      'phone-cc': '91', 'phone': phone.replace(/^91/, ''), 'lang-pref': 'en',
    });

    const createRes = await fetch(`${API_BASE}/customers/signup.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
    });
    const createData = await createRes.json();
    if (typeof createData === 'number') return String(createData);
    console.error('[Domain] Customer creation failed:', JSON.stringify(createData));
    return null;
  } catch (err: any) {
    console.error('[Domain] Customer error:', err.message);
    return null;
  }
}

// ─── GET/CREATE CONTACT ──────────────────────────────────────────────────────

export async function getOrCreateContact(customerId: string, name: string, email: string, phone: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID, 'api-key': API_KEY,
      'name': name, 'company': name, 'email': email,
      'address-line-1': 'India', 'city': 'Delhi', 'state': 'Delhi', 'country': 'IN', 'zipcode': '110001',
      'phone-cc': '91', 'phone': phone.replace(/^91/, ''),
      'customer-id': customerId, 'type': 'Contact',
    });

    const res = await fetch(`${API_BASE}/contacts/add.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
    });
    const data = await res.json();
    if (typeof data === 'number') return String(data);
    console.error('[Domain] Contact creation failed:', JSON.stringify(data));
    return null;
  } catch (err: any) {
    console.error('[Domain] Contact error:', err.message);
    return null;
  }
}

// ─── CLOUDFLARE API ──────────────────────────────────────────────────────────

async function cfFetch(path: string, method: string = 'GET', body?: any): Promise<any> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function cfAddZone(domain: string): Promise<{ zoneId: string; nameservers: string[] } | null> {
  try {
    const data = await cfFetch('/zones', 'POST', { name: domain, account: { id: CF_ACCOUNT_ID }, type: 'full' });
    if (data.success && data.result) {
      return { zoneId: data.result.id, nameservers: data.result.name_servers || [] };
    }
    // Zone might already exist
    if (data.errors?.[0]?.code === 1061) {
      const list = await cfFetch(`/zones?name=${domain}`);
      if (list.result?.[0]) {
        return { zoneId: list.result[0].id, nameservers: list.result[0].name_servers || [] };
      }
    }
    console.error('[CF] Zone creation failed:', JSON.stringify(data.errors));
    return null;
  } catch (err: any) {
    console.error('[CF] Zone error:', err.message);
    return null;
  }
}

export async function cfAddDnsRecord(zoneId: string, domain: string): Promise<boolean> {
  try {
    const data = await cfFetch(`/zones/${zoneId}/dns_records`, 'POST', {
      type: 'CNAME', name: domain, content: CF_TUNNEL_CNAME, proxied: true, ttl: 1,
    });
    if (data.success) return true;
    // Record might already exist
    if (data.errors?.[0]?.code === 81057 || data.errors?.[0]?.code === 81053) return true;
    console.error('[CF] DNS record failed:', JSON.stringify(data.errors));
    return false;
  } catch (err: any) {
    console.error('[CF] DNS error:', err.message);
    return false;
  }
}

// ─── UPDATE RESELLERCLUB NAMESERVERS ─────────────────────────────────────────

async function updateResellerClubNameservers(domain: string, nameservers: string[]): Promise<boolean> {
  try {
    // Get order ID
    const orderRes = await fetch(`${API_BASE}/domains/orderid.json?auth-userid=${RESELLER_ID}&api-key=${API_KEY}&domain-name=${domain}`);
    const orderId = await orderRes.json();
    if (typeof orderId !== 'number') {
      console.error('[Domain] Could not get order ID for NS update');
      return false;
    }

    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID, 'api-key': API_KEY, 'order-id': String(orderId),
    });
    nameservers.forEach(ns => params.append('ns', ns));

    const res = await fetch(`${API_BASE}/domains/modify-ns.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
    });
    const data = await res.json();
    console.log('[Domain] NS update result:', JSON.stringify(data));
    return true;
  } catch (err: any) {
    console.error('[Domain] NS update error:', err.message);
    return false;
  }
}

// ─── TUNNEL INGRESS UPDATE ───────────────────────────────────────────────────

export function updateTunnelIngress(domain: string): boolean {
  try {
    if (!fs.existsSync(TUNNEL_CONFIG)) {
      console.error('[Tunnel] Config not found:', TUNNEL_CONFIG);
      return false;
    }

    let config = fs.readFileSync(TUNNEL_CONFIG, 'utf-8');

    // Check if already added
    if (config.includes(domain)) {
      console.log('[Tunnel] Domain already in config:', domain);
      return true;
    }

    // Add before the catch-all 404 rule
    const catchAllPattern = /(\n\s*- service: http_status:404)/;
    const newRule = `\n  - hostname: ${domain}\n    service: http://localhost:4000\n  - hostname: www.${domain}\n    service: http://localhost:4000`;

    if (catchAllPattern.test(config)) {
      config = config.replace(catchAllPattern, `${newRule}$1`);
    } else {
      config += `${newRule}\n`;
    }

    fs.writeFileSync(TUNNEL_CONFIG, config, 'utf-8');
    fs.copyFileSync(TUNNEL_CONFIG, TUNNEL_CONFIG_SYSTEMD);
    console.log('[Tunnel] Added ingress rule for:', domain, '(both configs updated)');
    return true;
  } catch (err: any) {
    console.error('[Tunnel] Config update error:', err.message);
    return false;
  }
}

async function restartCloudflared(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process');
    execSync('systemctl restart cloudflared', { timeout: 15000 });
    console.log('[Tunnel] cloudflared restarted');
    return true;
  } catch (err: any) {
    console.error('[Tunnel] Restart failed:', err.message);
    return false;
  }
}

// ─── REGISTER DOMAIN ─────────────────────────────────────────────────────────

export async function registerDomain(
  domainName: string, customerId: string, contactId: string, nameservers: string[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const name = domainName.replace(/\.in$/, '');
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID, 'api-key': API_KEY,
      'domain-name': `${name}.in`, 'years': '1',
      'customer-id': customerId,
      'reg-contact-id': contactId, 'admin-contact-id': contactId,
      'tech-contact-id': contactId, 'billing-contact-id': contactId,
      'invoice-option': 'NoInvoice', 'protect-privacy': 'false',
    });
    // Add nameservers (must use append for duplicate keys)
    nameservers.forEach(ns => params.append('ns', ns));

    const res = await fetch(`${API_BASE}/domains/register.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
    });
    const data = await res.json();
    if (data.entityid) return { success: true, orderId: String(data.entityid) };
    return { success: false, error: JSON.stringify(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── DNS HEALTH CHECK ────────────────────────────────────────────────────────

async function checkDnsResolves(domain: string): Promise<boolean> {
  try {
    const addresses = await dns.promises.resolve4(domain);
    if (addresses.length > 0) return true;
  } catch {}
  try {
    const res = await fetch(`https://${domain}`, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return res.ok || res.status === 301 || res.status === 302;
  } catch {}
  return false;
}

async function waitForDns(domain: string, phone: string): Promise<boolean> {
  const intervals = [2, 5, 10, 20, 40, 60]; // minutes
  for (const mins of intervals) {
    await new Promise(r => setTimeout(r, mins * 60 * 1000));
    const ok = await checkDnsResolves(domain);
    if (ok) {
      const { getSiteData: getSD } = await import('./db.ts');
      const sd = getSD(slug);
      const bizName = sd?.businessName || domain;
      const shareText = `🏪 ${bizName} ka website dekho!\n\nhttps://${domain}\n\n✅ WhatsApp pe order karo\n✅ Call karo\n✅ Location dekho\n\nApna bhi website banao FREE mein — WhatsApp karo: https://wa.me/919187578351`;
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      
      // Send live message + share CTA
      if (_sendCtaUrl) {
        await _sendCtaUrl(phone, `🎉 *${domain} is LIVE!*\n\n👏 *Kya baat! Aapka premium website ready hai!*\n\n🔗 https://${domain}\n\nAb share karo apne customers ke saath! 👇`, shareUrl, '📤 Share Karo');
      } else {
        await wa(phone, `🎉 *${domain} is LIVE!*\n\n👏 *Kya baat! Aapka premium website ready hai!*\n\n🔗 https://${domain}\n\nShare karo: ${shareUrl}`);
      }
      await sendTelegramAlert(`✅ DNS live: ${domain} (after ${mins} min)`);
      return true;
    }
    if (mins <= 10) {
      await wa(phone, `⏳ DNS propagation jari hai... ~${mins} min ho gaye. Thoda aur wait karo.`);
    }
  }
  await wa(phone, `⚠️ DNS propagation slow hai for ${domain}. 1-2 ghante mein check karo. Problem hogi toh hum fix karenge!`);
  await sendTelegramAlert(`⚠️ DNS still not resolving after 60 min: ${domain} (${phone})`);
  return false;
}

// ─── SETUP/REDIRECT PAGE ────────────────────────────────────────────────────

export function getSetupPageHTML(domain: string, businessName: string, siteUrl: string): string {
  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${businessName} — Setting Up...</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF9F0;color:#1C1108;}
.box{text-align:center;padding:40px;max-width:400px;}
.spin{width:48px;height:48px;border:4px solid #E8E0D8;border-top:4px solid #1A6B5A;border-radius:50%;animation:s 1s linear infinite;margin:0 auto 20px;}
@keyframes s{to{transform:rotate(360deg)}}
h2{margin:0 0 8px;font-size:1.3rem;}
p{color:#5C4A38;font-size:.9rem;line-height:1.5;}
a{color:#1A6B5A;font-weight:600;}
</style>
<meta http-equiv="refresh" content="30">
</head><body><div class="box">
<div class="spin"></div>
<h2>🌐 ${domain}</h2>
<p>Setting up your custom domain...<br>DNS propagation takes 5-30 minutes.</p>
<p>Your site is already live at:<br><a href="${siteUrl}">${siteUrl}</a></p>
<p style="font-size:.8rem;color:#9C8A78;margin-top:24px;">This page auto-refreshes every 30 seconds.</p>
</div></body></html>`;
}

// ─── FULL AUTO PROVISIONING ──────────────────────────────────────────────────

export async function provisionDomain(
  slug: string, businessName: string, phone: string, desiredDomain: string
): Promise<{ success: boolean; domain?: string; error?: string }> {
  const domain = desiredDomain;
  console.log(`[Domain] Starting full provisioning: ${domain} for ${businessName}`);

  // Step 1: Cloudflare zone (do FIRST to get correct nameservers)
  await wa(phone, `🌐 Setting up ${domain}...\n\n⏳ Step 1/5: Creating DNS zone...`);
  const zone = await cfAddZone(domain);
  if (!zone) {
    await sendTelegramAlert(`❌ CF zone creation failed: ${domain}`);
    return { success: false, error: 'Cloudflare zone creation failed' };
  }
  console.log(`[Domain] CF zone: ${zone.zoneId}, NS: ${zone.nameservers.join(', ')}`);

  // Step 2: Add CNAME record
  await wa(phone, `✅ DNS zone ready!\n⏳ Step 2/5: Adding DNS records...`);
  const cname = await cfAddDnsRecord(zone.zoneId, domain);
  if (!cname) {
    await sendTelegramAlert(`❌ CF CNAME failed: ${domain}`);
    return { success: false, error: 'DNS record creation failed' };
  }

  // Step 3: Register domain with CF nameservers
  await wa(phone, `✅ DNS records done!\n⏳ Step 3/5: Registering ${domain}...`);
  
  const email = `${phone}@whatswebsite.com`;
  const customerId = await getOrCreateCustomer(email, businessName, phone);
  if (!customerId) {
    await sendTelegramAlert(`❌ Customer creation failed: ${businessName} (${phone})`);
    return { success: false, error: 'Customer creation failed' };
  }

  const contactId = await getOrCreateContact(customerId, businessName, email, phone);
  if (!contactId) {
    await sendTelegramAlert(`❌ Contact creation failed: ${businessName}`);
    return { success: false, error: 'Contact creation failed' };
  }

  // Skip re-verify — ResellerClub caches 'regthroughothers' after multiple checks.
  // We already verified during suggestion phase. Just attempt registration — it will fail if truly taken.

  const reg = await registerDomain(domain, customerId, contactId, zone.nameservers);
  if (!reg.success) {
    // Check if domain already registered (from a previous crashed attempt)
    const errStr = reg.error || '';
    if (errStr.includes('already exists in our database')) {
      console.log(`[Domain] ${domain} already registered (previous attempt). Continuing...`);
    } else {
      await sendTelegramAlert(`❌ Registration failed: ${domain}\n${reg.error}`);
      return { success: false, error: reg.error };
    }
  }

  // Step 4: Update tunnel ingress
  await wa(phone, `✅ ${domain} registered! 🎉\n⏳ Step 4/5: Connecting to your website...`);
  const tunnelOk = updateTunnelIngress(domain);
  if (tunnelOk) await restartCloudflared();

  // Step 5: Update DB
  const { getSiteData, saveSiteData } = await import('./db.ts');
  const siteData = getSiteData(slug);
  if (siteData) {
    (siteData as any).customDomain = domain;
    (siteData as any).pendingDomain = undefined; // Clear pending — provisioning complete
    siteData.plan = 'premium';
    saveSiteData(siteData); // Don't override owner_phone — keep original creator's WhatsApp
  }

  await wa(phone, `✅ Almost done!\n⏳ Step 5/5: Waiting for DNS propagation (5-30 min)...\n\n🔗 Your site is already live at:\nhttps://whatswebsite.com/site/${slug}`);
  
  await sendTelegramAlert(
    `🎉 Domain provisioned!\n\n🌐 ${domain}\n🏪 ${businessName}\n📱 ${phone}\n🆔 Order: ${reg.orderId}\n☁️ CF Zone: ${zone.zoneId}\n🔧 Tunnel: updated\n\n⏳ Waiting for DNS...`
  );

  // Background DNS check
  waitForDns(domain, phone).catch(err => {
    console.error('[Domain] DNS check error:', err.message);
  });

  return { success: true, domain };
}

// ─── TELEGRAM ALERTS ─────────────────────────────────────────────────────────

export async function sendTelegramAlert(message: string): Promise<void> {
  try {
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      });
    }
    console.log(`[Alert] ${message.substring(0, 100)}...`);
  } catch (err: any) {
    console.error('[Alert] Failed:', err.message);
  }
}
