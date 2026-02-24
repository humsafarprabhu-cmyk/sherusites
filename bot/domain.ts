/**
 * SheruSites Domain Manager
 * Auto-register .in domains via ResellerClub API
 * Fallback: Telegram alert for manual registration
 */

const RESELLER_ID = process.env.RESELLERCLUB_ID || '1316776';
const API_KEY = process.env.RESELLERCLUB_API_KEY || '';
const API_BASE = process.env.RESELLERCLUB_SANDBOX === 'true' 
  ? 'https://test.httpapi.com/api' 
  : 'https://httpapi.com/api';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_ALERT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || '1038264809';
const CF_TUNNEL_ID = 'cb96adac-799f-4f7f-b739-2b54d9f767e2';

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

// ─── GET/CREATE CUSTOMER ─────────────────────────────────────────────────────

export async function getOrCreateCustomer(email: string, name: string, phone: string): Promise<string | null> {
  try {
    // Search existing
    const searchUrl = `${API_BASE}/customers/search.json?auth-userid=${RESELLER_ID}&api-key=${API_KEY}&username=${encodeURIComponent(email)}&no-of-records=1&page-no=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData && typeof searchData === 'object' && !searchData.status) {
      const firstKey = Object.keys(searchData).find(k => k !== 'recsonpage' && k !== 'recsindb');
      if (firstKey) return searchData[firstKey]['customer.customerid'];
    }

    // Create new
    const [firstName, ...lastParts] = name.split(' ');
    const lastName = lastParts.join(' ') || firstName;
    
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID,
      'api-key': API_KEY,
      'username': email,
      'passwd': 'Sheru@' + Date.now(), // Random password
      'name': name,
      'company': name,
      'address-line-1': 'India',
      'city': 'Delhi',
      'state': 'Delhi',
      'country': 'IN',
      'zipcode': '110001',
      'phone-cc': '91',
      'phone': phone.replace(/^91/, ''),
      'lang-pref': 'en',
    });

    const createRes = await fetch(`${API_BASE}/customers/signup.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
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
    const [firstName, ...lastParts] = name.split(' ');
    const lastName = lastParts.join(' ') || firstName;
    
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID,
      'api-key': API_KEY,
      'name': name,
      'company': name,
      'email': email,
      'address-line-1': 'India',
      'city': 'Delhi',
      'state': 'Delhi',
      'country': 'IN',
      'zipcode': '110001',
      'phone-cc': '91',
      'phone': phone.replace(/^91/, ''),
      'customer-id': customerId,
      'type': 'Contact',
    });

    const res = await fetch(`${API_BASE}/contacts/add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
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

// ─── REGISTER DOMAIN ─────────────────────────────────────────────────────────

export async function registerDomain(
  domainName: string, 
  customerId: string, 
  contactId: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const name = domainName.replace(/\.in$/, '');
    
    const params = new URLSearchParams({
      'auth-userid': RESELLER_ID,
      'api-key': API_KEY,
      'domain-name': `${name}.in`,
      'years': '1',
      'ns': 'ns1.cloudflare.com',
      'ns': 'ns2.cloudflare.com',
      'customer-id': customerId,
      'reg-contact-id': contactId,
      'admin-contact-id': contactId,
      'tech-contact-id': contactId,
      'billing-contact-id': contactId,
      'invoice-option': 'NoInvoice',
      'protect-privacy': 'false',
    });

    const res = await fetch(`${API_BASE}/domains/register.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    
    if (data.entityid) {
      return { success: true, orderId: String(data.entityid) };
    }
    return { success: false, error: JSON.stringify(data) };
  } catch (err: any) {
    console.error('[Domain] Registration error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── FULL AUTO FLOW ──────────────────────────────────────────────────────────

export async function provisionDomain(
  slug: string,
  businessName: string,
  phone: string,
  desiredDomain?: string
): Promise<{ success: boolean; domain?: string; error?: string }> {
  const domainName = desiredDomain || businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.in';
  const cleanName = domainName.replace(/\.in$/, '');
  
  console.log(`[Domain] Starting provisioning: ${domainName} for ${businessName}`);

  // 1. Check availability
  const avail = await checkDomainAvailability(cleanName);
  if (!avail.available) {
    // Try with slug
    const altAvail = await checkDomainAvailability(slug);
    if (!altAvail.available) {
      await sendTelegramAlert(`❌ Domain not available: ${domainName} or ${slug}.in for ${businessName}`);
      return { success: false, error: `Domain ${domainName} not available` };
    }
  }

  const finalDomain = avail.available ? avail.domain : `${slug}.in`;

  // 2. Create customer (use phone as email for simplicity)
  const email = `${phone}@whatswebsite.com`;
  const customerId = await getOrCreateCustomer(email, businessName, phone);
  if (!customerId) {
    await sendTelegramAlert(`❌ Customer creation failed for ${businessName} (${phone})`);
    return { success: false, error: 'Customer creation failed' };
  }

  // 3. Create contact
  const contactId = await getOrCreateContact(customerId, businessName, email, phone);
  if (!contactId) {
    await sendTelegramAlert(`❌ Contact creation failed for ${businessName}`);
    return { success: false, error: 'Contact creation failed' };
  }

  // 4. Register domain
  const reg = await registerDomain(finalDomain, customerId, contactId);
  if (!reg.success) {
    await sendTelegramAlert(`❌ Domain registration failed: ${finalDomain}\n${reg.error}`);
    return { success: false, error: reg.error };
  }

  // 5. Alert success
  await sendTelegramAlert(
    `🎉 Domain registered!\n\n` +
    `🌐 ${finalDomain}\n` +
    `🏪 ${businessName}\n` +
    `📱 ${phone}\n` +
    `🆔 Order: ${reg.orderId}\n\n` +
    `⚡ Next: Add CNAME in Cloudflare → ${CF_TUNNEL_ID}.cfargotunnel.com`
  );

  console.log(`[Domain] ✅ Registered: ${finalDomain} (Order: ${reg.orderId})`);
  return { success: true, domain: finalDomain };
}

// ─── TELEGRAM ALERTS ─────────────────────────────────────────────────────────

export async function sendTelegramAlert(message: string): Promise<void> {
  // Use OpenClaw's message tool via the server, or direct Telegram API
  try {
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
      });
    }
    console.log(`[Alert] ${message.substring(0, 80)}...`);
  } catch (err: any) {
    console.error('[Alert] Failed:', err.message);
  }
}
