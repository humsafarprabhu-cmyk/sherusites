/**
 * SheruSites Server
 * - Serves generated static websites
 * - WhatsApp Meta webhook
 * - Site preview/management API
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleMessage, setBaseUrl, getAllSessions, getSessionInfo } from './bot/whatsapp-bot.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'sherusites_verify_2026';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || '';
const GRAPH_API = 'https://graph.facebook.com/v21.0';
const SITES_DIR = path.join(__dirname, 'sites');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Set base URL from env
if (process.env.TUNNEL_URL) {
  setBaseUrl(process.env.TUNNEL_URL);
}

// ─── HEALTH ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SheruSites',
    version: '1.0',
    sites: fs.existsSync(SITES_DIR) ? fs.readdirSync(SITES_DIR).length : 0,
    templates: fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length : 0,
  });
});

// ─── SERVE GENERATED SITES ──────────────────────────────────────────────────

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
          <a href="https://wa.me/${PHONE_NUMBER_ID}" style="color:#6366f1;">Message us →</a>
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

// List all templates
app.get('/api/templates', (_req, res) => {
  if (!fs.existsSync(TEMPLATES_DIR)) return res.json([]);
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
  res.json(templates);
});

// List all generated sites
app.get('/api/sites', (_req, res) => {
  if (!fs.existsSync(SITES_DIR)) return res.json([]);
  const sites = fs.readdirSync(SITES_DIR)
    .filter(d => fs.existsSync(path.join(SITES_DIR, d, 'index.html')))
    .map(d => ({
      slug: d,
      url: `/site/${d}`,
    }));
  res.json(sites);
});

// ─── WHATSAPP META WEBHOOK ──────────────────────────────────────────────────

// Verification (GET)
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

// Incoming messages (POST)
app.post('/api/webhook', async (req, res) => {
  res.sendStatus(200); // Always respond fast
  
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
          
          if (message.type === 'text') {
            text = message.text?.body || '';
          } else if (message.type === 'interactive') {
            text = message.interactive?.button_reply?.title || 
                   message.interactive?.list_reply?.title || '';
          } else if (message.type === 'image') {
            text = message.image?.caption || '[photo]';
            // TODO: Download and use photo
          } else {
            text = `[${message.type}]`;
          }
          
          if (!text) continue;
          
          console.log(`[WhatsApp] ${phone}: ${text}`);
          
          const response = await handleMessage(phone, text);
          
          for (const reply of response.replies) {
            await sendTextMessage(phone, reply);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
  }
});

// ─── DIRECT WEBHOOK (for testing without Meta) ─────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message required' });
  }
  const response = await handleMessage(phone, message);
  res.json(response);
});

// ─── SESSION DEBUG ──────────────────────────────────────────────────────────

app.get('/api/sessions', (_req, res) => {
  const sessions = getAllSessions();
  const data: any[] = [];
  sessions.forEach((s, phone) => {
    data.push({ phone, state: s.state, business: s.data.businessName, url: s.siteUrl, paid: s.paid });
  });
  res.json(data);
});

app.get('/api/session/:phone', (req, res) => {
  const session = getSessionInfo(req.params.phone);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// ─── META GRAPH API HELPERS ─────────────────────────────────────────────────

async function sendTextMessage(to: string, text: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[Meta] Would send to ${to}: ${text.substring(0, 100)}...`);
    return;
  }
  
  try {
    const res = await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
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

// ─── START ──────────────────────────────────────────────────────────────────

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🦁 SheruSites Server v1.0 running on http://0.0.0.0:${PORT}`);
  console.log(`   Templates: ${fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length : 0}`);
  console.log(`   Sites: ${fs.existsSync(SITES_DIR) ? fs.readdirSync(SITES_DIR).length : 0}`);
  console.log(`   Meta Webhook: /api/webhook`);
  console.log(`   Direct Chat: /api/chat`);
  console.log(`   Preview: /preview/{template}\n`);
});
