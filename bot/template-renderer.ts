/**
 * SheruSites Template Renderer
 * Takes a template + SiteData → generates final HTML with real content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SiteData } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const SITES_DIR = path.join(__dirname, '..', 'sites');

const CATEGORY_TEMPLATE: Record<string, string> = {
  restaurant: 'restaurant.html',
  store: 'store.html',
  salon: 'salon.html',
  tutor: 'tutor.html',
  clinic: 'clinic.html',
  gym: 'gym.html',
  photographer: 'photographer.html',
  service: 'service.html',
};

export function renderSite(data: SiteData): string {
  const templateFile = CATEGORY_TEMPLATE[data.category] || 'restaurant.html';
  const templatePath = path.join(TEMPLATES_DIR, templateFile);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateFile}`);
  }
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Basic placeholder replacement
  const replacements: Record<string, string> = {
    '{{businessName}}': data.businessName,
    '{{tagline}}': data.tagline || '',
    '{{phone}}': data.phone,
    '{{whatsapp}}': data.whatsapp,
    '{{address}}': data.address,
    '{{mapUrl}}': data.mapUrl || `https://www.google.com/maps/search/${encodeURIComponent(data.address)}`,
    '{{mapQuery}}': data.lat && data.lng ? `${data.lat},${data.lng}` : encodeURIComponent(data.address),
    '{{lat}}': data.lat || '',
    '{{lng}}': data.lng || '',
    '{{timings}}': data.timings,
    '{{siteUrl}}': `https://whatswebsite.com/site/${data.slug}`,
    '{{categoryBadge}}': getCategoryBadge(data.category),
    '{{about}}': data.about,
    '{{ownerName}}': data.ownerName || '',
    '{{experience}}': data.experience || '',
    '{{specialization}}': data.specialization || '',
    '{{year}}': new Date().getFullYear().toString(),
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(escapeRegex(placeholder), 'g'), value);
  }
  
  // Inject dynamic content based on category
  html = injectDynamicContent(html, data);
  
  // Inject offer banner if active
  if (data.activeOffer) {
    const offerHtml = `
    <div id="offer-banner" style="position:fixed;top:0;left:0;right:0;z-index:10000;background:linear-gradient(135deg,#f59e0b,#ef4444);padding:10px 16px;text-align:center;font-family:Inter,sans-serif;animation:slideDown 0.5s ease;">
      <span style="color:white;font-size:14px;font-weight:600;">🎉 ${data.activeOffer.text}</span>
      ${data.activeOffer.validTill ? `<span style="color:rgba(255,255,255,0.8);font-size:12px;margin-left:8px;">Valid till ${data.activeOffer.validTill}</span>` : ''}
      <button onclick="this.parentElement.remove()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:white;font-size:18px;cursor:pointer;">×</button>
    </div>
    <style>@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>`;
    html = html.replace('<body>', `<body>\n${offerHtml}`);
  }
  
  // Inject "Temporarily Closed" overlay if not open
  if (!data.isOpen) {
    const closedHtml = `
    <div style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;">
      <div style="text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:16px;">🔒</div>
        <h2 style="color:white;font-size:24px;margin-bottom:8px;">Temporarily Closed</h2>
        <p style="color:#a3a3a3;">We'll be back soon! Contact us on WhatsApp for updates.</p>
        <a href="https://wa.me/${data.whatsapp}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-weight:600;">WhatsApp Us</a>
      </div>
    </div>`;
    html = html.replace('</body>', `${closedHtml}\n</body>`);
  }
  
  // Save
  const siteDir = path.join(SITES_DIR, data.slug);
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });
  fs.writeFileSync(path.join(siteDir, 'index.html'), html, 'utf-8');
  
  return html;
}

function injectDynamicContent(html: string, data: SiteData): string {
  // Build menu/services HTML based on category
  const contentKey = getContentKey(data.category);
  const items = (data as any)[contentKey] as any[] | undefined;
  
  // Always inject site data for client-side rendering
  
  // Generate items HTML
  // The templates have default items; we try to replace them
  // For now, we inject a data attribute that JS can read
  const jsonData = JSON.stringify({
    businessName: data.businessName,
    whatsapp: data.whatsapp,
    phone: data.phone,
    menu: data.menu,
    services: data.services,
    packages: data.packages,
    plans: data.plans,
    subjects: data.subjects,
    photos: data.photos,
    reviews: (data as any).reviews || [],
    todaySpecial: (data as any).todaySpecial || null,
  });
  
  // Inject data into the page so dynamic rendering can pick it up
  const dataScript = `
  <script>
    window.__SITE_DATA__ = ${jsonData};
    // Dynamic content injector — replaces template defaults with real data
    document.addEventListener('DOMContentLoaded', function() {
      var d = window.__SITE_DATA__;
      // Update menu items if present
      if (d.menu && d.menu.length) injectItems(d.menu, 'menu');
      if (d.services && d.services.length) injectItems(d.services, 'services');
      if (d.packages && d.packages.length) injectItems(d.packages, 'packages');
      if (d.plans && d.plans.length) injectItems(d.plans, 'plans');
      if (d.subjects && d.subjects.length) injectItems(d.subjects, 'subjects');
    });
    function injectItems(items, type) {
      var containers = document.querySelectorAll('[data-content="' + type + '"]');
      if (!containers.length) return;
      containers.forEach(function(c) {
        var html = items.map(function(item) {
          return '<div style="display:flex;justify-content:space-between;align-items:start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
            '<div><strong style="color:#f5f5f5;">' + item.name + '</strong>' +
            (item.description ? '<br><small style="color:#a3a3a3;">' + item.description + '</small>' : '') +
            (item.duration ? '<br><small style="color:#a3a3a3;">⏱ ' + item.duration + '</small>' : '') +
            (item.popular ? ' <span style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:4px;">Popular</span>' : '') +
            '</div>' +
            '<span style="color:#f59e0b;font-weight:600;white-space:nowrap;margin-left:12px;">' + item.price + '</span>' +
          '</div>';
        }).join('');
        c.innerHTML = html;
      });
    }
  </script>`;
  
  html = html.replace('</body>', `${dataScript}\n</body>`);
  return html;
}

function getContentKey(category: string): string {
  const keys: Record<string, string> = {
    restaurant: 'menu',
    store: 'services',
    salon: 'services',
    tutor: 'subjects',
    clinic: 'services',
    gym: 'plans',
    photographer: 'packages',
    service: 'services',
  };
  return keys[category] || 'services';
}

function getCategoryBadge(category: string): string {
  const badges: Record<string, string> = {
    restaurant: '🍛 Restaurant',
    store: '🏪 Store',
    salon: '💇 Salon & Beauty',
    tutor: '📚 Education',
    clinic: '🏥 Healthcare',
    gym: '💪 Fitness',
    photographer: '📸 Photography',
    service: '🔧 Services',
  };
  return badges[category] || '🏪 Business';
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { SITES_DIR, TEMPLATES_DIR };
