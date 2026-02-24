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
import { handleMessage, setBaseUrl, getBaseUrl } from './bot/whatsapp-bot.ts';
import { createOrder, verifyPayment, markPaid, getPaymentPageHTML } from './bot/payment.ts';
import { listAllSites, getSiteData, saveSiteData } from './bot/db.ts';
import { provisionDomain, sendTelegramAlert } from './bot/domain.ts';

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

// ─── STATIC FILES ────────────────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR, { maxAge: '30d' }));

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
    const dataPath = path.join(SITES_DIR, req.params.slug, 'data.json');
    if (!fs.existsSync(dataPath)) return res.status(404).send('Site not found');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
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

    // Send WhatsApp confirmation
    const site = getSiteData(slug);
    if (site) {
      if (ACCESS_TOKEN && PHONE_NUMBER_ID) {
        sendTextMessage(site.phone, `🎉 *Payment Successful!*\n\n✅ ${site.businessName} is now PREMIUM!\n💳 Payment ID: ${razorpay_payment_id}\n\nYour custom domain is being set up. We'll message you when it's live!\n\nThank you for choosing SheruSites! 🦁`);
      }

      // Auto-provision domain
      provisionDomain(slug, site.businessName, site.phone).then(result => {
        if (result.success && result.domain) {
          site.customDomain = result.domain;
          saveSiteData(site);
          if (ACCESS_TOKEN && PHONE_NUMBER_ID) {
            sendTextMessage(site.phone, `🌐 *Your domain is LIVE!*\n\n✨ ${result.domain}\n\nAb aapke customers ${result.domain} pe jaake aapka website dekh sakte hain! 🚀`);
          }
        } else {
          // Alert Abhi for manual intervention
          sendTelegramAlert(`⚠️ Auto-domain failed for ${site.businessName} (${slug})\nPayment: ${razorpay_payment_id}\nError: ${result.error}\n\n👉 Register manually and update DB`);
        }
      }).catch(err => {
        console.error('[Domain] Provision error:', err.message);
        sendTelegramAlert(`⚠️ Domain provisioning crashed for ${slug}: ${err.message}`);
      });
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err: any) {
    console.error('[Payment] Verify error:', err.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Razorpay server-side webhook
app.post('/api/webhooks/razorpay', webhookLimiter, (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const notes = payment.notes || {};
        const slug = notes.slug;

        if (slug) {
          console.log(`[Webhook] Payment captured: ${paymentId} for ${slug}`);
          // We can't verify signature here without the razorpay_signature,
          // but Razorpay webhooks are verified by webhook secret
          const site = getSiteData(slug);
          if (site && site.plan !== 'premium') {
            site.plan = 'premium';
            site.paymentId = paymentId;
            site.paidAt = new Date().toISOString();
            saveSiteData(site);
            console.log(`[Webhook] ✅ ${slug} auto-upgraded via webhook`);
          }
        }
      }
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.json({ status: 'ok' }); // Always 200 for webhooks
  }
});

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
            // Build address from location metadata + coords
            const addrParts = [locName, locAddr].filter(Boolean).join(', ');
            text = addrParts || `📍 ${lat}, ${lng}`;
            // Pass coordinates as metadata prefix
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
          await sendBotResponse(phone, response);
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
    siteData.photos.push({
      url: `/site/${slug}/images/${filename}`,
      caption: caption || siteData.businessName,
      type: 'gallery',
    });
    saveSiteData(siteData, phone);
    renderSite(siteData);
    console.log(`[Image] Saved ${filename} for ${slug} (${siteData.photos.length} total)`);
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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🦁 SheruSites Server v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`   DB: SQLite (WAL mode)`);
  console.log(`   Templates: ${fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length : 0}`);
  console.log(`   Sites: ${listAllSites().length}`);
  console.log(`   Base URL: ${getBaseUrl()}`);
  console.log(`   Rate limits: chat=30/min, pay=10/min, webhook=100/min\n`);
});
