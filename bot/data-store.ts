/**
 * SheruSites Data Store — JSON file-based storage for sites and users
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const SITES_DIR = path.join(__dirname, '..', 'sites');

// Ensure directories
[DATA_DIR, USERS_DIR, SITES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface MenuItem {
  name: string;
  price: string;
  category?: string;
  description?: string;
  popular?: boolean;
}

export interface ServiceItem {
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

export interface Photo {
  url: string;
  caption?: string;
  section: 'hero' | 'gallery' | 'menu' | 'team';
}

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

  // Dynamic content (AI-generated or user-provided)
  menu?: MenuItem[];           // restaurant, cafe
  services?: ServiceItem[];    // salon, clinic, service, gym
  subjects?: ServiceItem[];    // tutor
  packages?: ServiceItem[];    // photographer
  plans?: ServiceItem[];       // gym
  
  // Media
  photos: Photo[];
  
  // Features
  delivery?: boolean;
  deliveryArea?: string;
  emergencyAvailable?: boolean;
  
  // Offers
  activeOffer?: { text: string; validTill?: string };
  
  // Status
  isOpen: boolean;
  plan: 'free' | 'premium';
  customDomain?: string;
  
  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  phone: string;
  name?: string;
  sites: string[];        // slugs
  activeSite?: string;    // currently editing
  createdAt: string;
}

// ─── USER OPERATIONS ─────────────────────────────────────────────────────────

export function getUser(phone: string): UserData | null {
  const fp = path.join(USERS_DIR, `${phone}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function createUser(phone: string): UserData {
  const user: UserData = {
    phone,
    sites: [],
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  return user;
}

export function saveUser(user: UserData): void {
  const fp = path.join(USERS_DIR, `${user.phone}.json`);
  fs.writeFileSync(fp, JSON.stringify(user, null, 2));
}

export function getOrCreateUser(phone: string): UserData {
  return getUser(phone) || createUser(phone);
}

// ─── SITE OPERATIONS ─────────────────────────────────────────────────────────

export function getSiteData(slug: string): SiteData | null {
  const fp = path.join(SITES_DIR, slug, 'data.json');
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function saveSiteData(data: SiteData): void {
  const dir = path.join(SITES_DIR, data.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, 'data.json');
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
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
}): SiteData {
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
  saveSiteData(data);
  return data;
}

// ─── EDIT OPERATIONS ─────────────────────────────────────────────────────────

export function addMenuItem(slug: string, item: MenuItem): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  if (!data.menu) data.menu = [];
  data.menu.push(item);
  saveSiteData(data);
  return true;
}

export function removeMenuItem(slug: string, itemName: string): boolean {
  const data = getSiteData(slug);
  if (!data || !data.menu) return false;
  const idx = data.menu.findIndex(m => m.name.toLowerCase() === itemName.toLowerCase());
  if (idx === -1) return false;
  data.menu.splice(idx, 1);
  saveSiteData(data);
  return true;
}

export function updatePrice(slug: string, itemName: string, newPrice: string): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  const items = [...(data.menu || []), ...(data.services || []), ...(data.packages || []), ...(data.plans || [])];
  const item = items.find(m => m.name.toLowerCase() === itemName.toLowerCase());
  if (!item) return false;
  item.price = newPrice;
  saveSiteData(data);
  return true;
}

export function addService(slug: string, item: ServiceItem): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  if (!data.services) data.services = [];
  data.services.push(item);
  saveSiteData(data);
  return true;
}

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

export function addPhoto(slug: string, photo: Photo): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  data.photos.push(photo);
  saveSiteData(data);
  return true;
}

export function updateField(slug: string, field: string, value: any): boolean {
  const data = getSiteData(slug);
  if (!data) return false;
  (data as any)[field] = value;
  saveSiteData(data);
  return true;
}

// ─── QUERY ───────────────────────────────────────────────────────────────────

export function listAllSites(): string[] {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs.readdirSync(SITES_DIR)
    .filter(d => fs.existsSync(path.join(SITES_DIR, d, 'data.json')));
}

export function listUserSites(phone: string): SiteData[] {
  const user = getUser(phone);
  if (!user) return [];
  return user.sites.map(slug => getSiteData(slug)).filter(Boolean) as SiteData[];
}
