/**
 * SheruSites — Website Generator
 * Takes business info → generates a complete static website from templates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const SITES_DIR = path.join(__dirname, '..', 'sites');

// Ensure sites directory exists
if (!fs.existsSync(SITES_DIR)) fs.mkdirSync(SITES_DIR, { recursive: true });

export interface BusinessInfo {
  slug: string;           // URL-safe name: "sharma-ji-ka-dhaba"
  businessName: string;   // "Sharma Ji Ka Dhaba"
  category: string;       // "restaurant" | "store" | "salon" | "tutor" | "clinic" | "gym" | "photographer" | "service"
  tagline?: string;       // "Best North Indian Food in Indore"
  phone: string;          // "9876543210"
  whatsapp: string;       // "919876543210" (with country code)
  address: string;        // "MG Road, Indore"
  mapEmbed?: string;      // Google Maps embed URL
  timings?: string;       // "10 AM - 10 PM"
  services?: string[];    // Menu items or services
  prices?: string[];      // Corresponding prices
  photos?: string[];      // Photo URLs (future)
  about?: string;         // About the business
  ownerName?: string;     // Owner/doctor name
  experience?: string;    // "10 years experience"
}

// Category to template mapping
const CATEGORY_MAP: Record<string, string> = {
  'restaurant': 'restaurant.html',
  'dhaba': 'restaurant.html',
  'cafe': 'restaurant.html',
  'hotel': 'restaurant.html',
  'store': 'store.html',
  'shop': 'store.html',
  'kirana': 'store.html',
  'grocery': 'store.html',
  'dukan': 'store.html',
  'salon': 'salon.html',
  'parlour': 'salon.html',
  'beauty': 'salon.html',
  'barber': 'salon.html',
  'tutor': 'tutor.html',
  'coaching': 'tutor.html',
  'teacher': 'tutor.html',
  'classes': 'tutor.html',
  'clinic': 'clinic.html',
  'doctor': 'clinic.html',
  'hospital': 'clinic.html',
  'dentist': 'clinic.html',
  'gym': 'gym.html',
  'fitness': 'gym.html',
  'yoga': 'gym.html',
  'photographer': 'photographer.html',
  'photography': 'photographer.html',
  'studio': 'photographer.html',
  'service': 'service.html',
  'electrician': 'service.html',
  'plumber': 'service.html',
  'repair': 'service.html',
  'ac': 'service.html',
};

// Detect category from user input (Hinglish support)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'restaurant': ['restaurant', 'dhaba', 'cafe', 'hotel', 'khana', 'food', 'biryani', 'thali', 'tiffin', 'mess', 'canteen', 'bakery', 'sweet shop', 'mithai'],
  'store': ['store', 'shop', 'dukan', 'kirana', 'grocery', 'general store', 'supermarket', 'stationery', 'medical', 'chemist', 'pharmacy'],
  'salon': ['salon', 'parlour', 'parlor', 'beauty', 'barber', 'nai', 'hair', 'spa', 'makeup', 'bridal', 'mehndi'],
  'tutor': ['tutor', 'coaching', 'teacher', 'classes', 'tuition', 'padhai', 'academy', 'institute', 'school', 'math', 'science', 'english'],
  'clinic': ['doctor', 'clinic', 'hospital', 'dentist', 'dr', 'physician', 'specialist', 'pathology', 'lab', 'medical', 'health', 'dawai'],
  'gym': ['gym', 'fitness', 'yoga', 'workout', 'crossfit', 'zumba', 'exercise', 'kasrat'],
  'photographer': ['photographer', 'photography', 'studio', 'photo', 'video', 'videographer', 'wedding shoot', 'pre-wedding'],
  'service': ['electrician', 'plumber', 'repair', 'service', 'ac', 'carpenter', 'painter', 'pest control', 'cleaning', 'mistri', 'karigar'],
};

export function detectCategory(input: string): string {
  const lower = input.toLowerCase();
  let bestMatch = 'restaurant'; // default
  let bestScore = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length; // longer match = better
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }
  return bestMatch;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export function generateSite(info: BusinessInfo): { html: string; slug: string; filePath: string } {
  const templateFile = CATEGORY_MAP[info.category] || 'restaurant.html';
  const templatePath = path.join(TEMPLATES_DIR, templateFile);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateFile}`);
  }
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace all placeholders
  const replacements: Record<string, string> = {
    '{{businessName}}': info.businessName,
    '{{tagline}}': info.tagline || getDefaultTagline(info.category, info.businessName),
    '{{phone}}': info.phone,
    '{{whatsapp}}': info.whatsapp || `91${info.phone}`,
    '{{address}}': info.address,
    '{{mapEmbed}}': info.mapEmbed || '',
    '{{timings}}': info.timings || '10:00 AM - 9:00 PM',
    '{{about}}': info.about || getDefaultAbout(info.category, info.businessName),
    '{{ownerName}}': info.ownerName || '',
    '{{experience}}': info.experience || '',
    '{{year}}': new Date().getFullYear().toString(),
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(escapeRegex(placeholder), 'g'), value);
  }
  
  // Replace services/menu if provided
  if (info.services && info.services.length > 0) {
    // Custom service injection would go here
    // For now, templates use realistic defaults
  }
  
  // Save the site
  const slug = info.slug || generateSlug(info.businessName);
  const siteDir = path.join(SITES_DIR, slug);
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });
  
  const filePath = path.join(siteDir, 'index.html');
  fs.writeFileSync(filePath, html, 'utf-8');
  
  return { html, slug, filePath };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDefaultTagline(category: string, name: string): string {
  const taglines: Record<string, string> = {
    'restaurant': `${name} — Authentic Taste, Happy Memories`,
    'store': `${name} — Everything You Need, Delivered Fresh`,
    'salon': `${name} — Where Beauty Meets Style`,
    'tutor': `${name} — Building Bright Futures`,
    'clinic': `${name} — Your Health, Our Priority`,
    'gym': `${name} — Transform Your Body, Transform Your Life`,
    'photographer': `${name} — Capturing Moments That Last Forever`,
    'service': `${name} — Quick, Reliable, Professional`,
  };
  return taglines[category] || `${name} — Welcome`;
}

function getDefaultAbout(category: string, name: string): string {
  const abouts: Record<string, string> = {
    'restaurant': `${name} has been serving delicious food with love and passion. We believe in quality ingredients, authentic recipes, and warm hospitality. Visit us and taste the difference!`,
    'store': `${name} is your one-stop shop for all daily essentials. We offer fresh products at the best prices with home delivery available. Quality and trust guaranteed.`,
    'salon': `${name} is dedicated to making you look and feel your best. Our experienced stylists use premium products to deliver exceptional results every time.`,
    'tutor': `${name} is committed to providing quality education and helping students achieve their academic goals. With experienced faculty and proven teaching methods.`,
    'clinic': `Providing compassionate and comprehensive healthcare services to our community. We combine modern medicine with a personal touch for the best patient experience.`,
    'gym': `${name} is more than just a gym — it's a community dedicated to fitness and health. State-of-the-art equipment, expert trainers, and a motivating atmosphere.`,
    'photographer': `${name} specializes in capturing life's most precious moments. With years of experience and a passion for storytelling through images.`,
    'service': `${name} provides reliable, professional services at fair prices. Experienced technicians, quality work, and customer satisfaction guaranteed.`,
  };
  return abouts[category] || `Welcome to ${name}. We are dedicated to serving you with excellence.`;
}

// List available templates
export function listTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'));
}

// List generated sites
export function listSites(): { slug: string; path: string }[] {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs.readdirSync(SITES_DIR)
    .filter(d => fs.existsSync(path.join(SITES_DIR, d, 'index.html')))
    .map(d => ({ slug: d, path: path.join(SITES_DIR, d, 'index.html') }));
}
