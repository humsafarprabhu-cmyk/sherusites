/**
 * SheruSites Server — Production-ready
 * SQLite-backed, rate-limited, proper logging
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { handleMessage, setBaseUrl, getBaseUrl, setBotSendCallback } from './bot/whatsapp-bot.ts';
import { createOrder, verifyPayment, markPaid, getPaymentPageHTML } from './bot/payment.ts';
import { listAllSites, getSiteData, saveSiteData, findSiteByDomain, findSiteByPendingDomain } from './bot/db.ts';
import { provisionDomain, sendTelegramAlert, setSendWhatsApp, setSendCtaUrl, getSetupPageHTML } from './bot/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust Cloudflare

const PORT = process.env.PORT || 4000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'sherusites_verify_2026';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || '';
const GRAPH_API = 'https://graph.facebook.com/v21.0';
const SITES_DIR = path.join(__dirname, 'sites');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

// Set base URL
if (process.env.TUNNEL_URL) setBaseUrl(process.env.TUNNEL_URL);

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
}));
app.use(express.json({ limit: '1mb' }));

// Logging middleware
app.use((req, _res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Rate limiters
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const payLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests.' },
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

// ─── CUSTOM DOMAIN ROUTING (must be BEFORE static files) ────────────────────
app.use((req, res, next) => {
  const host = (req.hostname || '')?.toLowerCase()?.replace(/^www\./, '');
  if (!host || host === 'whatswebsite.com' || host === 'localhost' || host.includes('vercel') || host.includes('cloudflared')) {
    return next();
  }
  // Check if this host is a custom domain
  const site = findSiteByDomain(host);
  if (site) {
    // Serve site images: /site/slug/images/file → sites/slug/images/file
    if (req.path.startsWith('/site/' + site.slug + '/images/')) {
      const imgPath = path.resolve(SITES_DIR, site.slug, 'images', path.basename(req.path));
      if (fs.existsSync(imgPath)) return res.sendFile(imgPath);
    }
    // Only serve index.html for root path or /index.html
    if (req.path === '/' || req.path === '/index.html') {
      const sitePath = path.resolve(SITES_DIR, site.slug, 'index.html');
      if (fs.existsSync(sitePath)) return res.sendFile(sitePath);
    }
    // Let other paths (like /site/slug/gallery) fall through to normal routes
  }
  // Check pending domain — show setup page
  const pending = findSiteByPendingDomain(host);
  if (pending) {
    const siteUrl = `https://whatswebsite.com/site/${pending.slug}`;
    return res.send(getSetupPageHTML(host, pending.businessName, siteUrl));
  }
  next();
});

// ─── STATIC FILES ────────────────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR, { maxAge: '30d' }));

// ─── PROGRAMMATIC SEO PAGES ──────────────────────────────────────────────────

// ─── LEVEL 2: Area pages /free-website/:category/:city/:area (1500 pages) ───
// Must be registered BEFORE the city route (more specific path wins)
app.get('/free-website/:category/:city/:area', (req, res) => {
  import('./bot/seo-pages.ts').then(({ generateAreaSeoPage }) => {
    const { category, city, area } = req.params;
    const html = generateAreaSeoPage(category.toLowerCase(), city.toLowerCase(), area.toLowerCase());
    if (!html) {
      return res.status(404).send(`<html><body style="background:#030712;color:#e5e7eb;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h1>Page not found</h1><p><a href="/" style="color:#25D366;">← Back to WhatsWebsite</a></p></div></body></html>`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(html);
  }).catch(err => {
    console.error('[SEO Area] Error generating page:', err.message);
    res.status(500).send('Error generating page');
  });
});

// ─── LEVEL 1: City pages /free-website/:category/:city (300 pages) ──────────
app.get('/free-website/:category/:city', (req, res) => {
  import('./bot/seo-pages.ts').then(({ generateSeoPage }) => {
    const { category, city } = req.params;
    const html = generateSeoPage(category.toLowerCase(), city.toLowerCase());
    if (!html) {
      return res.status(404).send(`<html><body style="background:#030712;color:#e5e7eb;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h1>Page not found</h1><p><a href="/" style="color:#25D366;">← Back to WhatsWebsite</a></p></div></body></html>`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(html);
  }).catch(err => {
    console.error('[SEO] Error generating page:', err.message);
    res.status(500).send('Error generating page');
  });
});

// Category index page — redirect to most popular city or show category list
app.get('/free-website/:category', (req, res) => {
  const { category } = req.params;
  const validCats = ['restaurant', 'salon', 'gym', 'tutor', 'clinic', 'store', 'photographer', 'service', 'wedding', 'event'];
  if (!validCats.includes(category.toLowerCase())) {
    return res.redirect(301, '/');
  }
  // Redirect to the category sitemap or a representative page
  res.redirect(301, `/free-website/${category.toLowerCase()}/mumbai`);
});

// Sitemap for Level 1 SEO city pages (300 URLs)
app.get('/sitemap-seo.xml', (_req, res) => {
  import('./bot/seo-pages.ts').then(({ generateSeoSitemap }) => {
    const xml = generateSeoSitemap();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(xml);
  }).catch(err => {
    console.error('[Sitemap] Error:', err.message);
    res.status(500).send('Error generating sitemap');
  });
});

// Sitemap for Level 2 SEO area pages (1500 URLs)
app.get('/sitemap-seo-areas.xml', (_req, res) => {
  import('./bot/seo-pages.ts').then(({ generateAreasSitemap }) => {
    const xml = generateAreasSitemap();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(xml);
  }).catch(err => {
    console.error('[Sitemap Areas] Error:', err.message);
    res.status(500).send('Error generating areas sitemap');
  });
});

// Master sitemap index (points to all sitemaps)
app.get('/sitemap-index.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://whatswebsite.com/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>https://whatswebsite.com/sitemap-seo.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>https://whatswebsite.com/sitemap-seo-areas.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>`);
});

// ─── HEALTH ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  const sites = listAllSites();
  res.json({
    status: 'ok',
    service: 'SheruSites',
    version: '2.0',
    sites: sites.length,
    templates: fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length : 0,
    db: 'sqlite',
  });
});

// ─── SERVE GENERATED SITES ──────────────────────────────────────────────────

// Serve site images
app.get('/site/:slug/images/:filename', (req, res) => {
  const imgPath = path.join(SITES_DIR, req.params.slug, 'images', req.params.filename);
  if (fs.existsSync(imgPath)) {
    const ext = path.extname(imgPath).toLowerCase();
    const mime: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    res.setHeader('Content-Type', mime[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(imgPath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Gallery page
app.get('/site/:slug/gallery', async (req, res) => {
  try {
    const { getSiteData } = await import('./bot/db.ts');
    const data = getSiteData(req.params.slug);
    if (!data) return res.status(404).send('Site not found');
    const { renderGalleryPage } = await import('./bot/template-renderer.ts');
    const galleryHtml = renderGalleryPage(data);
    res.setHeader('Content-Type', 'text/html');
    res.send(galleryHtml);
  } catch (err: any) {
    console.error('[Gallery] Error:', err.message);
    res.status(500).send('Error loading gallery');
  }
});

app.get('/site/:slug', (req, res) => {
  const sitePath = path.join(SITES_DIR, req.params.slug, 'index.html');
  if (fs.existsSync(sitePath)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(sitePath);
  } else {
    res.status(404).send(`
      <html><body style="background:#0a0a0a;color:white;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1>🦁 SheruSites</h1>
          <p>Website not found. Create yours on WhatsApp!</p>
        </div>
      </body></html>
    `);
  }
});

// ─── TEMPLATE PREVIEW ────────────────────────────────────────────────────────

app.get('/preview/:template', (req, res) => {
  const templatePath = path.join(TEMPLATES_DIR, `${req.params.template}.html`);
  if (fs.existsSync(templatePath)) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(templatePath);
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

app.get('/api/templates', (_req, res) => {
  if (!fs.existsSync(TEMPLATES_DIR)) return res.json([]);
  res.json(fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')));
});

app.get('/api/sites', (_req, res) => {
  const sites = listAllSites();
  res.json(sites.map(slug => ({ slug, url: `/site/${slug}` })));
});

// ─── PAYMENT ROUTES ─────────────────────────────────────────────────────────

app.get('/pay/:slug', payLimiter, async (req, res) => {
  try {
    const slug = req.params.slug;
    const order = await createOrder(slug);
    if (!order) {
      return res.status(404).send('<html><body style="background:#0a0a0a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center"><h1>🦁 Site not found</h1><p>Create your website first on WhatsApp!</p></div></body></html>');
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(getPaymentPageHTML(slug, order.orderId, order.amount));
  } catch (err: any) {
    console.error('[Payment] Order error:', err.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

app.post('/api/payment/verify', payLimiter, (req, res) => {
  try {
    const { slug, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!slug || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const valid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      console.error('[Payment] Invalid signature for', slug);
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const marked = markPaid(slug, razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!marked) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    console.log(`[Payment] ✅ ${slug} upgraded to premium! Payment: ${razorpay_payment_id}`);

    // Trigger provisioning (idempotent)
    triggerProvisionIfNeeded(slug, razorpay_payment_id);

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err: any) {
    console.error('[Payment] Verify error:', err.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Razorpay Payment Link callback (GET redirect after payment)
app.get('/api/payment/link-callback', async (req, res) => {
  const { slug, razorpay_payment_id, razorpay_payment_link_status } = req.query as any;
  console.log(`[PayLink] Callback: slug=${slug}, status=${razorpay_payment_link_status}, payId=${razorpay_payment_id}`);
  
  const site = getSiteData(slug as string);
  const bizName = site?.businessName || slug;
  
  if (razorpay_payment_link_status === 'paid' && slug) {
    // Trigger provisioning (idempotent — safe even if webhook already fired)
    triggerProvisionIfNeeded(slug as string, razorpay_payment_id as string);
    
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Successful!</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF9F0;color:#1C1108;text-align:center;padding:20px;}
.box{max-width:400px;}.check{font-size:64px;margin-bottom:16px;}h2{margin:0 0 8px;}p{color:#5C4A38;line-height:1.5;}</style></head>
<body><div class="box"><div class="check">✅</div><h2>Payment Successful!</h2>
<p>${bizName} is now PREMIUM! 🎉</p>
<p>Domain setup shuru ho gaya. WhatsApp pe updates milenge.</p>
<p style="margin-top:24px;font-size:.85rem;color:#9C8A78;">You can close this page now.</p></div></body></html>`);
  } else {
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Status</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF9F0;text-align:center;padding:20px;}</style></head>
<body><div><h2>⚠️ Payment not confirmed</h2><p>Agar payment ho gaya hai toh kuch der mein update aayega WhatsApp pe.</p></div></body></html>`);
  }
});

// Razorpay server-side webhook
app.post('/api/webhooks/razorpay', webhookLimiter, (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'payment.captured' || event.event === 'payment_link.paid' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity || event.payload?.payment_link?.entity;
      if (payment) {
        const paymentId = payment.id || payment.payments?.[0]?.payment_id;
        const notes = payment.notes || {};
        const slug = notes.slug;

        if (slug) {
          console.log(`[Webhook] Payment captured: ${paymentId} for ${slug}`);
          triggerProvisionIfNeeded(slug, paymentId);
        }
      }
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.json({ status: 'ok' });
  }
});

// Central provisioning trigger — idempotent, safe to call multiple times
const _provisionLocks = new Set<string>();

async function triggerProvisionIfNeeded(slug: string, paymentId?: string) {
  // In-memory lock — prevent duplicate concurrent runs
  if (_provisionLocks.has(slug)) {
    console.log(`[Provision] ${slug} already in progress, skipping`);
    return;
  }
  _provisionLocks.add(slug);

  try {
  const site = getSiteData(slug);
  if (!site) { _provisionLocks.delete(slug); return; }
  
  // Already fully provisioned
  if (site.plan === 'premium' && (site as any).customDomain && !(site as any).pendingDomain) {
    console.log(`[Provision] ${slug} already fully provisioned, skipping`);
    _provisionLocks.delete(slug);
    return;
  }

  // Use the owner's WhatsApp (from users table), not the business phone
  const { getDb } = await import('./bot/db.ts');
  const ownerRow = getDb().prepare("SELECT phone FROM users WHERE sites LIKE ?").get(`%${slug}%`) as any;
  const whatsapp = ownerRow?.phone || site.whatsapp || `91${site.phone}`;
  const pendingDomain = (site as any).pendingDomain;

  // Mark as paid if not already
  if (site.plan !== 'premium') {
    site.plan = 'premium';
    site.paymentId = paymentId || site.paymentId;
    site.paidAt = new Date().toISOString();
    saveSiteData(site);
    console.log(`[Provision] ${slug} marked as premium`);
    
    if (ACCESS_TOKEN && PHONE_NUMBER_ID) {
      sendTextMessage(whatsapp, `🎉 *Payment Successful!*\n\n✅ ${site.businessName} is now PREMIUM!\n💳 Payment ID: ${paymentId}\n\nDomain setup shuru ho gaya! WhatsApp pe updates milenge.`);
    }
  }

  // Provision domain if pending
  if (pendingDomain) {
    console.log(`[Provision] Starting domain provisioning: ${pendingDomain} for ${slug}`);
    try {
      const result = await provisionDomain(slug, site.businessName, whatsapp, pendingDomain);
      if (result.success) {
        console.log(`[Provision] ✅ ${result.domain} provisioned for ${slug}`);
      } else {
        console.error(`[Provision] ❌ Failed: ${result.error}`);
        sendTelegramAlert(`⚠️ Domain provisioning failed for ${site.businessName} (${slug})\nDomain: ${pendingDomain}\nError: ${result.error}\nPayment: ${paymentId}\n\n👉 Manual fix needed`);
      }
    } catch (err: any) {
      console.error(`[Provision] ❌ Crash: ${err.message}`);
      sendTelegramAlert(`🔥 Domain provisioning CRASHED for ${site.businessName} (${slug})\nDomain: ${pendingDomain}\nError: ${err.message}\n\n👉 Manual fix needed`);
    }
  } else {
    sendTelegramAlert(`⚠️ Payment for ${site.businessName} (${slug}) but NO pending domain.\nPayment: ${paymentId}`);
  }
  } finally {
    _provisionLocks.delete(slug);
  }
}

// ─── WHATSAPP META WEBHOOK ──────────────────────────────────────────────────

app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta] Webhook verified ✅');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

const processedMsgIds = new Set<string>();
// Clean up old message IDs every 5 minutes
setInterval(() => { processedMsgIds.clear(); }, 5 * 60 * 1000);

app.post('/api/webhook', webhookLimiter, async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        if (!value.messages) continue;
        for (const message of value.messages) {
          // Dedup by WhatsApp message ID
          const wamid = message.id;
          if (wamid && processedMsgIds.has(wamid)) {
            console.log(`[Webhook] Skipping duplicate wamid: ${wamid}`);
            continue;
          }
          if (wamid) processedMsgIds.add(wamid);
          const phone = message.from;
          let text = '';
          if (message.type === 'text') text = message.text?.body || '';
          else if (message.type === 'interactive') {
            // Use button ID for reliable matching, fallback to title
            text = message.interactive?.button_reply?.id || 
                   message.interactive?.button_reply?.title || 
                   message.interactive?.list_reply?.id ||
                   message.interactive?.list_reply?.title || '';
          }
          else if (message.type === 'location') {
            const loc = message.location;
            const lat = loc?.latitude;
            const lng = loc?.longitude;
            const locName = loc?.name || '';
            const locAddr = loc?.address || '';
            let addrParts = [locName, locAddr].filter(Boolean).join(', ');
            // Reverse geocode if no address from WhatsApp
            if (!addrParts && lat && lng) {
              try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`, {
                  headers: { 'User-Agent': 'WhatsWebsite/1.0' }
                });
                if (geoRes.ok) {
                  const geo = await geoRes.json();
                  addrParts = geo.display_name || '';
                }
              } catch {}
            }
            text = addrParts || `📍 ${lat}, ${lng}`;
            text = `__LOC__${lat}__${lng}__${text}`;
          }
          else if (message.type === 'image') {
            // Download image from WhatsApp and save to site gallery
            const imageId = message.image?.id;
            const caption = message.image?.caption || '';
            if (imageId) {
              try {
                await handleWhatsAppImage(phone, imageId, caption);
              } catch (imgErr: any) {
                console.error('[Image] Error:', imgErr.message);
              }
            }
            text = caption || '__PHOTO_UPLOADED__';
          }
          else text = `[${message.type}]`;
          if (!text) continue;
          console.log(`[WhatsApp] ${phone}: ${text}`);
          const response = await handleMessage(phone, text);
          if (response.replies && response.replies.length > 0) {
            await sendBotResponse(phone, response);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
  }
});

// ─── DIRECT CHAT (testing) ──────────────────────────────────────────────────

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  try {
    const response = await handleMessage(phone, message);
    res.json(response);
  } catch (err: any) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: 'Internal error', replies: ['Something went wrong. Try again.'] });
  }
});

// ─── META GRAPH API ─────────────────────────────────────────────────────────

// ─── WHATSAPP IMAGE HANDLER ──────────────────────────────────────────────────

async function handleWhatsAppImage(phone: string, mediaId: string, caption: string) {
  // Get media URL from WhatsApp
  const mediaRes = await fetch(`${GRAPH_API}/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
  });
  if (!mediaRes.ok) throw new Error(`Media fetch failed: ${mediaRes.status}`);
  const mediaData = await mediaRes.json();
  const mediaUrl = mediaData.url;
  
  // Download actual image
  const imgRes = await fetch(mediaUrl, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
  });
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  
  // Check if user is in photo collection state (pre-site creation)
  const { getSession: getDbSession, saveSession: saveDbSession } = await import('./bot/db.ts');
  const session = getDbSession(phone);
  
  if (session?.state === 'awaiting_hero' || session?.state === 'awaiting_gallery') {
    // Save to temp uploads dir
    const tempDir = path.join(SITES_DIR, '_temp', phone);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filename = `upload-${Date.now()}.jpg`;
    fs.writeFileSync(path.join(tempDir, filename), buffer);
    
    if (!session.data.uploadedPhotos) session.data.uploadedPhotos = [];
    const isHero = session.state === 'awaiting_hero';
    session.data.uploadedPhotos.push({
      url: `/_temp/${phone}/${filename}`,
      caption: caption || session.data.businessName || '',
      type: isHero ? 'hero' : 'gallery',
      tempFile: filename,
    });
    saveDbSession(phone, session);
    console.log(`[Image] Pre-site upload #${session.data.uploadedPhotos.length} for ${phone}`);
    return;
  }

  // Find user's active site
  const { getOrCreateUser, getSiteData, saveSiteData } = await import('./bot/db.ts');
  const { renderSite } = await import('./bot/template-renderer.ts');
  const user = getOrCreateUser(phone);
  const slug = user.active_site;
  if (!slug) {
    console.log('[Image] No active site for', phone);
    return;
  }
  
  // Save image
  const imgDir = path.join(SITES_DIR, slug, 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  const filename = `upload-${Date.now()}.jpg`;
  fs.writeFileSync(path.join(imgDir, filename), buffer);
  
  // Update site data
  const siteData = getSiteData(slug);
  if (siteData) {
    if (!siteData.photos) siteData.photos = [];
    const photoType = session?.data?.pendingPhotoType || 'gallery';
    if (photoType === 'hero') {
      // Replace existing hero photo
      siteData.photos = siteData.photos.filter((p: any) => p.type !== 'hero');
    }
    siteData.photos.push({
      url: `/site/${slug}/images/${filename}`,
      caption: caption || siteData.businessName,
      type: photoType,
    });
    saveSiteData(siteData, phone);
    renderSite(siteData);
    console.log(`[Image] Saved ${filename} as ${photoType} for ${slug} (${siteData.photos.length} total)`);
  }
}

async function sendWhatsAppMessage(to: string, messageObj: any) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[Meta] Would send to ${to}:`, JSON.stringify(messageObj).substring(0, 100));
    return;
  }
  try {
    const payload = { messaging_product: 'whatsapp', to, ...messageObj };
    const res = await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[Meta] Send failed:', JSON.stringify(err));
    } else {
      console.log(`[Meta] Sent to ${to} ✅`);
    }
  } catch (err: any) {
    console.error('[Meta] Send error:', err.message);
  }
}

async function sendTextMessage(to: string, text: string) {
  await sendWhatsAppMessage(to, { type: 'text', text: { body: text } });
}

async function sendInteractiveMessage(to: string, interactive: any) {
  await sendWhatsAppMessage(to, { type: 'interactive', interactive });
}

// Helper: send a BotResponse (text or interactive)
async function sendBotResponse(to: string, response: any) {
  for (const reply of response.replies || []) {
    if (typeof reply === 'string') {
      await sendTextMessage(to, reply);
    } else if (reply.type === 'buttons') {
      if (!reply.buttons?.length) { await sendTextMessage(to, reply.body); continue; }
      await sendInteractiveMessage(to, {
        type: 'button',
        body: { text: reply.body },
        action: {
          buttons: reply.buttons.map((b: any, i: number) => ({
            type: 'reply',
            reply: { id: b.id || `btn_${i}`, title: b.title.substring(0, 20) }
          }))
        }
      });
    } else if (reply.type === 'cta_url') {
      await sendInteractiveMessage(to, {
        type: 'cta_url',
        body: { text: reply.body },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: reply.buttonText || 'Open',
            url: reply.url,
          }
        }
      });
    } else if (reply.type === 'list') {
      await sendInteractiveMessage(to, {
        type: 'list',
        body: { text: reply.body },
        action: {
          button: (reply.buttonText || 'Choose').substring(0, 20),
          sections: reply.sections
        }
      });
    }
  }
}

// ─── ERROR HANDLERS ─────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error(`[FATAL] Uncaught: ${err.message}\n${err.stack}`);
});
process.on('unhandledRejection', (err: any) => {
  console.error(`[FATAL] Unhandled rejection: ${err?.message || err}`);
});

// ─── START ──────────────────────────────────────────────────────────────────

// Wire up WhatsApp sender for domain.ts
setSendWhatsApp(async (to: string, text: string) => {
  await sendTextMessage(to, text);
});
setSendCtaUrl(async (to: string, body: string, url: string, buttonText: string) => {
  await sendInteractiveMessage(to, {
    type: 'cta_url',
    body: { text: body },
    action: { name: 'cta_url', parameters: { display_text: buttonText, url } }
  });
});
setBotSendCallback(async (to: string, text: string) => {
  await sendTextMessage(to, text);
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🦁 SheruSites Server v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`   DB: SQLite (WAL mode)`);
  console.log(`   Templates: ${fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length : 0}`);
  console.log(`   Sites: ${listAllSites().length}`);
  console.log(`   Base URL: ${getBaseUrl()}`);
  console.log(`   Rate limits: chat=30/min, pay=10/min, webhook=100/min\n`);

  // STARTUP RECOVERY: Check for paid sites with pending domains (crashed mid-provisioning)
  setTimeout(async () => {
    try {
      const { db: database } = await import('./bot/db.ts');
      const stuckSites = database.prepare(
        "SELECT slug FROM sites WHERE plan = 'premium' AND pending_domain IS NOT NULL AND (custom_domain IS NULL OR custom_domain = '')"
      ).all() as any[];
      
      if (stuckSites.length > 0) {
        console.log(`[Recovery] Found ${stuckSites.length} paid sites needing domain provisioning`);
        for (const row of stuckSites) {
          console.log(`[Recovery] Retrying provisioning for: ${row.slug}`);
          await triggerProvisionIfNeeded(row.slug);
        }
      }
    } catch (err: any) {
      console.error('[Recovery] Error:', err.message);
    }
  }, 10000); // Wait 10s after boot
});
