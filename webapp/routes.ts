/**
 * WhatsWebsite Web App — Routes
 * Login, Dashboard, Builder, Site Management
 */

import { Router } from 'express';
import { generateOTP, verifyOTP, createToken, verifyToken, authMiddleware, apiAuthMiddleware } from './auth.ts';
import { getDb, getSiteData, saveSiteData, listAllSites } from '../bot/db.ts';
import { renderSite } from '../bot/template-renderer.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ─── WhatsApp OTP Sender (reuse Meta API) ────────────────────────────────────

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || '';

async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const to = phone.startsWith('91') ? phone : `91${phone}`;
    const res = await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'otp_login',
          language: { code: 'en' },
          components: [{
            type: 'body',
            parameters: [{ type: 'text', text: otp }]
          }, {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }]
          }]
        }
      })
    });
    const data = await res.json();
    return !!data.messages?.[0]?.id;
  } catch (e) {
    console.error('[OTP Send Error]', e);
    return false;
  }
}

// ─── Page Routes ─────────────────────────────────────────────────────────────

// Root — if logged in go to dashboard, else show landing
router.get('/', (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) return res.redirect('/dashboard');
  }
  next(); // fall through to static index.html
});

// Login page
router.get('/login', (req, res) => {
  if (req.cookies?.token) {
    if (verifyToken(req.cookies.token)) return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Dashboard
router.get('/dashboard', authMiddleware, (req: any, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Builder
router.get('/create', authMiddleware, (req: any, res) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html'));
});

// Edit site
router.get('/edit/:slug', authMiddleware, (req: any, res) => {
  res.sendFile(path.join(__dirname, 'views', 'edit.html'));
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// ─── API Routes ──────────────────────────────────────────────────────────────

// Send OTP
router.post('/api/auth/send-otp', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  // Normalize: remove +91, spaces, dashes
  phone = phone.replace(/[\s\-\+]/g, '');
  if (phone.startsWith('91') && phone.length === 12) phone = phone; // already has 91
  else if (phone.length === 10) phone = `91${phone}`;
  else return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });

  const { otp, error } = generateOTP(phone);
  if (error) return res.status(429).json({ error });

  const sent = await sendWhatsAppOTP(phone, otp);
  if (!sent) return res.status(500).json({ error: 'Could not send OTP. Try again.' });

  res.json({ ok: true, message: 'OTP sent to your WhatsApp' });
});

// Verify OTP
router.post('/api/auth/verify-otp', (req, res) => {
  let { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  phone = phone.replace(/[\s\-\+]/g, '');
  if (phone.length === 10) phone = `91${phone}`;

  const result = verifyOTP(phone, otp);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const token = createToken(phone);
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ ok: true, token });
});

// Get user's sites
router.get('/api/my-sites', apiAuthMiddleware, (req: any, res) => {
  const db = getDb();
  const sites = db.prepare('SELECT slug, business_name, category, plan, created_at, updated_at, custom_domain FROM sites WHERE owner_phone = ? ORDER BY created_at DESC').all(req.user.phone);
  res.json({ sites });
});

// Get site data for editing
router.get('/api/site/:slug', apiAuthMiddleware, (req: any, res) => {
  const db = getDb();
  const owner = db.prepare('SELECT owner_phone FROM sites WHERE slug = ?').get(req.params.slug) as any;
  if (!owner) return res.status(404).json({ error: 'Site not found' });
  if (owner.owner_phone !== req.user.phone) return res.status(403).json({ error: 'Not your site' });
  const site = getSiteData(req.params.slug);
  res.json({ site });
});

// Create site
router.post('/api/site/create', apiAuthMiddleware, async (req: any, res) => {
  const { businessName, category, phone: bizPhone, address, tagline, about, timings, services, menu } = req.body;

  if (!businessName || !category) return res.status(400).json({ error: 'Business name and category required' });

  // Generate slug
  let slug = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  // Check uniqueness
  const db = getDb();
  const existing = db.prepare('SELECT slug FROM sites WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const ownerPhone = req.user.phone;
  const whatsapp = ownerPhone;

  const siteData: any = {
    slug,
    ownerPhone,
    businessName,
    category,
    tagline: tagline || '',
    phone: bizPhone || ownerPhone.replace(/^91/, ''),
    whatsapp,
    address: address || '',
    timings: timings || '10:00 AM - 9:00 PM',
    about: about || '',
    plan: 'free',
    menu: menu || [],
    services: services || [],
    subjects: [],
    packages: [],
    plans: [],
    photos: [],
    delivery: 0,
    isOpen: true,
    hiddenSections: [],
    sectionOrder: [],
    socialLinks: {},
    faq: [],
  };

  saveSiteData(siteData, ownerPhone);

  // Also add to users table
  db.prepare(`
    INSERT INTO users (phone, name, sites, active_site)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET active_site = ?, sites = json_insert(COALESCE(sites, '[]'), '$[#]', ?)
  `).run(ownerPhone, businessName, JSON.stringify([slug]), slug, slug, slug);

  // Render the HTML
  const html = renderSite(siteData);
  const sitesDir = path.join(__dirname, '..', 'sites');
  if (!fs.existsSync(sitesDir)) fs.mkdirSync(sitesDir, { recursive: true });
  fs.writeFileSync(path.join(sitesDir, `${slug}.html`), html);

  res.json({ ok: true, slug, url: `/site/${slug}` });
});

// Update site
router.post('/api/site/:slug/update', apiAuthMiddleware, async (req: any, res) => {
  const db2 = getDb();
  const owner2 = db2.prepare('SELECT owner_phone FROM sites WHERE slug = ?').get(req.params.slug) as any;
  if (!owner2) return res.status(404).json({ error: 'Site not found' });
  if (owner2.owner_phone !== req.user.phone) return res.status(403).json({ error: 'Not your site' });

  const site = getSiteData(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const updates = req.body;
  const merged = { ...site, ...updates, slug: req.params.slug };
  saveSiteData(merged);

  // Re-render
  const html = renderSite(merged as any);
  const sitesDir = path.join(__dirname, '..', 'sites');
  fs.writeFileSync(path.join(sitesDir, `${req.params.slug}.html`), html);

  res.json({ ok: true });
});

// Photo upload for a site
router.post('/api/site/:slug/upload-photo', apiAuthMiddleware, async (req: any, res) => {
  const db3 = getDb();
  const owner3 = db3.prepare('SELECT owner_phone FROM sites WHERE slug = ?').get(req.params.slug) as any;
  if (!owner3) return res.status(404).json({ error: 'Site not found' });
  if (owner3.owner_phone !== req.user.phone) return res.status(403).json({ error: 'Not your site' });

  // Read raw body (multipart)
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve) => {
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', resolve);
  });
  const body = Buffer.concat(chunks);

  // Simple multipart boundary parse
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return res.status(400).json({ error: 'Invalid upload' });

  const boundary = boundaryMatch[1];
  const parts = body.toString('binary').split(`--${boundary}`);
  let imageData: Buffer | null = null;

  for (const part of parts) {
    if (part.includes('Content-Type: image/')) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd >= 0) {
        imageData = Buffer.from(part.slice(headerEnd + 4).replace(/\r\n$/, ''), 'binary');
      }
    }
  }

  if (!imageData) return res.status(400).json({ error: 'No image found' });

  const sitesDir = path.join(__dirname, '..', 'sites');
  const imgDir = path.join(sitesDir, req.params.slug, 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  const filename = `photo-${Date.now()}.jpg`;
  fs.writeFileSync(path.join(imgDir, filename), imageData);

  const url = `/site/${req.params.slug}/images/${filename}`;
  res.json({ ok: true, url });
});

// Get available categories
router.get('/api/categories', (_req, res) => {
  res.json({
    categories: [
      { id: 'restaurant', name: 'Restaurant / Café', icon: '🍽️', desc: 'Menu, online orders, table booking' },
      { id: 'store', name: 'Retail Store', icon: '🛒', desc: 'Products, pricing, delivery info' },
      { id: 'salon', name: 'Salon / Beauty', icon: '💇', desc: 'Services, pricing, appointment booking' },
      { id: 'tutor', name: 'Coaching / Tutor', icon: '📚', desc: 'Subjects, batches, fees, reviews' },
      { id: 'clinic', name: 'Clinic / Doctor', icon: '🏥', desc: 'Services, timings, appointment' },
      { id: 'gym', name: 'Gym / Fitness', icon: '💪', desc: 'Plans, trainers, facilities' },
      { id: 'photographer', name: 'Photographer', icon: '📸', desc: 'Portfolio, packages, booking' },
      { id: 'service', name: 'Service Business', icon: '🔧', desc: 'Plumber, electrician, repair etc.' },
    ]
  });
});

export default router;
