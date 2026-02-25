/**
 * SheruSites Database — SQLite via better-sqlite3
 * Single source of truth for users, sites, sessions, payments
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'sherusites.db');

// Ensure data dir exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    sites TEXT DEFAULT '[]',
    active_site TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sites (
    slug TEXT PRIMARY KEY,
    owner_phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    timings TEXT DEFAULT '10:00 AM - 9:00 PM',
    about TEXT DEFAULT '',
    owner_name TEXT,
    experience TEXT,
    specialization TEXT,
    menu TEXT DEFAULT '[]',
    services TEXT DEFAULT '[]',
    subjects TEXT DEFAULT '[]',
    packages TEXT DEFAULT '[]',
    plans TEXT DEFAULT '[]',
    photos TEXT DEFAULT '[]',
    delivery INTEGER DEFAULT 0,
    delivery_area TEXT,
    emergency_available INTEGER DEFAULT 0,
    active_offer TEXT,
    is_open INTEGER DEFAULT 1,
    plan TEXT DEFAULT 'free',
    custom_domain TEXT,
    payment_id TEXT,
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_phone) REFERENCES users(phone)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    phone TEXT PRIMARY KEY,
    state TEXT DEFAULT 'idle',
    data TEXT DEFAULT '{}',
    site_url TEXT,
    slug TEXT,
    paid INTEGER DEFAULT 0,
    edit_mode TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    phone TEXT,
    order_id TEXT,
    payment_id TEXT,
    signature TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    FOREIGN KEY (slug) REFERENCES sites(slug)
  );

  CREATE TABLE IF NOT EXISTS ai_calls (
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (phone, date)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_phone);
  CREATE INDEX IF NOT EXISTS idx_payments_slug ON payments(slug);
  CREATE INDEX IF NOT EXISTS idx_chat_phone ON chat_history(phone);
`);

// ─── PREPARED STATEMENTS ─────────────────────────────────────────────────────

// Users
const stmts = {
  getUser: db.prepare('SELECT * FROM users WHERE phone = ?'),
  upsertUser: db.prepare(`INSERT INTO users (phone, name, sites, active_site) VALUES (?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET name=excluded.name, sites=excluded.sites, active_site=excluded.active_site`),

  // Sites
  getSite: db.prepare('SELECT * FROM sites WHERE slug = ?'),
  upsertSite: db.prepare(`INSERT OR REPLACE INTO sites (
    slug, owner_phone, business_name, category, tagline, phone, whatsapp, address, timings, about,
    owner_name, experience, specialization, menu, services, subjects, packages, plans, photos,
    delivery, delivery_area, emergency_available, active_offer, is_open, plan, custom_domain,
    payment_id, paid_at, created_at, updated_at, today_special, reviews, pending_domain, pending_plan_price
  ) VALUES (
    @slug, @owner_phone, @business_name, @category, @tagline, @phone, @whatsapp, @address, @timings, @about,
    @owner_name, @experience, @specialization, @menu, @services, @subjects, @packages, @plans, @photos,
    @delivery, @delivery_area, @emergency_available, @active_offer, @is_open, @plan, @custom_domain,
    @payment_id, @paid_at, @created_at, @updated_at, @today_special, @reviews, @pending_domain, @pending_plan_price
  )`),
  getUserSites: db.prepare('SELECT * FROM sites WHERE owner_phone = ?'),
  listAllSites: db.prepare('SELECT slug FROM sites'),
  checkSlug: db.prepare('SELECT 1 FROM sites WHERE slug = ?'),

  // Sessions
  getSession: db.prepare('SELECT * FROM sessions WHERE phone = ?'),
  upsertSession: db.prepare(`INSERT INTO sessions (phone, state, data, site_url, slug, paid, edit_mode, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET state=excluded.state, data=excluded.data, site_url=excluded.site_url,
    slug=excluded.slug, paid=excluded.paid, edit_mode=excluded.edit_mode, updated_at=datetime('now')`),
  deleteSession: db.prepare('DELETE FROM sessions WHERE phone = ?'),

  // Payments
  createPayment: db.prepare(`INSERT INTO payments (slug, phone, order_id, amount, currency, status)
    VALUES (?, ?, ?, ?, 'INR', 'created')`),
  getPayment: db.prepare('SELECT * FROM payments WHERE order_id = ?'),
  verifyPayment: db.prepare(`UPDATE payments SET payment_id=?, signature=?, status='verified', verified_at=datetime('now')
    WHERE order_id=?`),
  getPaymentsBySlug: db.prepare('SELECT * FROM payments WHERE slug = ? ORDER BY created_at DESC'),

  // AI calls
  getAiCalls: db.prepare('SELECT count FROM ai_calls WHERE phone = ? AND date = ?'),
  upsertAiCalls: db.prepare(`INSERT INTO ai_calls (phone, date, count) VALUES (?, ?, 1)
    ON CONFLICT(phone, date) DO UPDATE SET count = count + 1`),

  // Chat history
  addChat: db.prepare('INSERT INTO chat_history (phone, role, content) VALUES (?, ?, ?)'),
  getChat: db.prepare('SELECT role, content FROM chat_history WHERE phone = ? ORDER BY id DESC LIMIT ?'),
};

// ─── USER OPS ────────────────────────────────────────────────────────────────

export function getUser(phone: string) {
  const row: any = stmts.getUser.get(phone);
  if (!row) return null;
  return { ...row, sites: JSON.parse(row.sites || '[]') };
}

export function getOrCreateUser(phone: string) {
  let user = getUser(phone);
  if (!user) {
    stmts.upsertUser.run(phone, null, '[]', null);
    user = getUser(phone)!;
  }
  return user;
}

export function saveUser(phone: string, data: { name?: string; sites: string[]; active_site?: string }) {
  stmts.upsertUser.run(phone, data.name || null, JSON.stringify(data.sites), data.active_site || null);
}

// ─── SITE OPS ────────────────────────────────────────────────────────────────

export interface SiteData {
  slug: string;
  businessName: string;
  category: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  timings: string;
  about: string;
  ownerName?: string;
  experience?: string;
  specialization?: string;
  menu?: any[];
  services?: any[];
  subjects?: any[];
  packages?: any[];
  plans?: any[];
  photos: any[];
  reviews?: any[];
  todaySpecial?: { name: string; description?: string; price: string; oldPrice?: string };
  delivery?: boolean;
  deliveryArea?: string;
  emergencyAvailable?: boolean;
  activeOffer?: { text: string; validTill?: string };
  isOpen: boolean;
  plan: 'free' | 'premium';
  customDomain?: string;
  pendingDomain?: string;
  pendingPlanPrice?: number;
  paymentId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToSite(row: any): SiteData {
  return {
    slug: row.slug,
    businessName: row.business_name,
    category: row.category,
    tagline: row.tagline || '',
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    timings: row.timings || '10:00 AM - 9:00 PM',
    about: row.about || '',
    ownerName: row.owner_name,
    experience: row.experience,
    specialization: row.specialization,
    menu: JSON.parse(row.menu || '[]'),
    services: JSON.parse(row.services || '[]'),
    subjects: JSON.parse(row.subjects || '[]'),
    packages: JSON.parse(row.packages || '[]'),
    plans: JSON.parse(row.plans || '[]'),
    photos: JSON.parse(row.photos || '[]'),
    delivery: !!row.delivery,
    deliveryArea: row.delivery_area,
    emergencyAvailable: !!row.emergency_available,
    activeOffer: row.active_offer ? JSON.parse(row.active_offer) : undefined,
    isOpen: !!row.is_open,
    plan: row.plan || 'free',
    customDomain: row.custom_domain,
    pendingDomain: row.pending_domain,
    pendingPlanPrice: row.pending_plan_price ? Number(row.pending_plan_price) : undefined,
    paymentId: row.payment_id,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function siteToRow(data: SiteData, ownerPhone: string) {
  return {
    slug: data.slug,
    owner_phone: ownerPhone,
    business_name: data.businessName,
    category: data.category,
    tagline: data.tagline || '',
    phone: data.phone,
    whatsapp: data.whatsapp,
    address: data.address,
    timings: data.timings,
    about: data.about || '',
    owner_name: data.ownerName || null,
    experience: data.experience || null,
    specialization: data.specialization || null,
    menu: JSON.stringify(data.menu || []),
    services: JSON.stringify(data.services || []),
    subjects: JSON.stringify(data.subjects || []),
    packages: JSON.stringify(data.packages || []),
    plans: JSON.stringify(data.plans || []),
    photos: JSON.stringify(data.photos || []),
    delivery: data.delivery ? 1 : 0,
    delivery_area: data.deliveryArea || null,
    emergency_available: data.emergencyAvailable ? 1 : 0,
    active_offer: data.activeOffer ? JSON.stringify(data.activeOffer) : null,
    is_open: data.isOpen ? 1 : 0,
    plan: data.plan || 'free',
    custom_domain: data.customDomain || null,
    pending_domain: data.pendingDomain || null,
    pending_plan_price: data.pendingPlanPrice || null,
    today_special: data.todaySpecial ? JSON.stringify(data.todaySpecial) : null,
    reviews: JSON.stringify(data.reviews || []),
    payment_id: data.paymentId || null,
    paid_at: data.paidAt || null,
    created_at: data.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getSiteData(slug: string): SiteData | null {
  const row: any = stmts.getSite.get(slug);
  if (!row) return null;
  return rowToSite(row);
}

export function saveSiteData(data: SiteData, ownerPhone?: string): void {
  const existing: any = stmts.getSite.get(data.slug);
  const phone = ownerPhone || existing?.owner_phone || data.phone;
  stmts.upsertSite.run(siteToRow(data, phone));
}

export function createSiteData(info: {
  slug: string;
  businessName: string;
  category: string;
  phone: string;
  whatsapp: string;
  address: string;
  timings?: string;
  tagline?: string;
  about?: string;
  ownerName?: string;
}, ownerPhone: string): SiteData {
  const now = new Date().toISOString();
  const data: SiteData = {
    slug: info.slug,
    businessName: info.businessName,
    category: info.category,
    tagline: info.tagline || '',
    phone: info.phone,
    whatsapp: info.whatsapp,
    address: info.address,
    timings: info.timings || '10:00 AM - 9:00 PM',
    about: info.about || '',
    ownerName: info.ownerName,
    photos: [],
    isOpen: true,
    plan: 'free',
    createdAt: now,
    updatedAt: now,
  };
  saveSiteData(data, ownerPhone);
  return data;
}

// Unique slug generation
export function generateUniqueSlug(baseSlug: string): string {
  if (!stmts.checkSlug.get(baseSlug)) return baseSlug;
  let i = 2;
  while (stmts.checkSlug.get(`${baseSlug}-${i}`)) i++;
  return `${baseSlug}-${i}`;
}

export function listAllSites(): string[] {
  return (stmts.listAllSites.all() as any[]).map(r => r.slug);
}

export function findSiteByDomain(domain: string): SiteData | null {
  const row: any = db.prepare('SELECT * FROM sites WHERE custom_domain = ?').get(domain);
  if (row) return rowToSite(row);
  return null;
}

export function findSiteByPendingDomain(domain: string): SiteData | null {
  const row: any = db.prepare('SELECT * FROM sites WHERE pending_domain = ?').get(domain);
  if (row) return rowToSite(row);
  return null;
}

export function listUserSites(phone: string): SiteData[] {
  return (stmts.getUserSites.all(phone) as any[]).map(rowToSite);
}

// ─── SESSION OPS ─────────────────────────────────────────────────────────────

export interface SessionRow {
  phone: string;
  state: string;
  data: any;
  site_url: string | null;
  slug: string | null;
  paid: boolean;
  edit_mode: string | null;
}

export function getSession(phone: string): SessionRow | null {
  const row: any = stmts.getSession.get(phone);
  if (!row) return null;
  let data = JSON.parse(row.data || '{}');
  // Handle double-encoded JSON strings
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch {} }
  if (typeof data === 'string') data = {};
  return { ...row, data, paid: !!row.paid };
}

export function saveSession(phone: string, session: {
  state: string;
  data: any;
  site_url?: string;
  slug?: string;
  paid?: boolean;
  edit_mode?: string;
}): void {
  stmts.upsertSession.run(
    phone, session.state, JSON.stringify(session.data),
    session.site_url || null, session.slug || null,
    session.paid ? 1 : 0, session.edit_mode || null
  );
}

export function deleteSession(phone: string): void {
  stmts.deleteSession.run(phone);
}

// ─── PAYMENT OPS ─────────────────────────────────────────────────────────────

export function createPaymentRecord(slug: string, phone: string, orderId: string, amount: number) {
  stmts.createPayment.run(slug, phone, orderId, amount);
}

export function verifyPaymentRecord(orderId: string, paymentId: string, signature: string) {
  stmts.verifyPayment.run(paymentId, signature, orderId);
}

export function getPaymentRecord(orderId: string) {
  return stmts.getPayment.get(orderId);
}

export function getPaymentsBySlug(slug: string) {
  return stmts.getPaymentsBySlug.all(slug);
}

// ─── AI CALL OPS ─────────────────────────────────────────────────────────────

export function getAiCallCount(phone: string): number {
  const today = new Date().toISOString().split('T')[0];
  const row: any = stmts.getAiCalls.get(phone, today);
  return row?.count || 0;
}

export function incrementAiCall(phone: string): void {
  const today = new Date().toISOString().split('T')[0];
  stmts.upsertAiCalls.run(phone, today);
}

// ─── CHAT HISTORY ────────────────────────────────────────────────────────────

export function addChatMessage(phone: string, role: string, content: string): void {
  stmts.addChat.run(phone, role, content);
}

export function getChatHistory(phone: string, limit: number = 10): { role: string; content: string }[] {
  const rows = stmts.getChat.all(phone, limit) as any[];
  return rows.reverse(); // oldest first
}

// ─── EDIT HELPERS (backward compat) ──────────────────────────────────────────

export type { SiteData as SiteDataType };
export type MenuItem = { name: string; price: string; category?: string; description?: string; popular?: boolean };
export type ServiceItem = { name: string; price: string; duration?: string; description?: string };

export function updateTimings(slug: string, timings: string): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  data.timings = timings;
  saveSiteData(data);
  return true;
}

export function setOffer(slug: string, text: string, validTill?: string): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  data.activeOffer = { text, validTill };
  saveSiteData(data);
  return true;
}

export function clearOffer(slug: string): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  data.activeOffer = undefined;
  saveSiteData(data);
  return true;
}

export function setOpenStatus(slug: string, isOpen: boolean): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  data.isOpen = isOpen;
  saveSiteData(data);
  return true;
}

export { db };
