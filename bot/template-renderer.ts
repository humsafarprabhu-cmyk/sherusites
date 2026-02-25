/**
 * SheruSites Template Renderer
 * Takes a template + SiteData → generates final HTML with real content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
type SiteData = {
  slug: string;
  businessName: string;
  category: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  timings: string;
  plan: string;
  isOpen?: boolean;
  photos?: any[];
  menu?: any[];
  services?: any[];
  activeOffer?: any;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const SITES_DIR = path.join(__dirname, '..', 'sites');

const CATEGORY_TEMPLATE: Record<string, string> = {
  restaurant: 'restaurant-2026.html',
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
  
  // Add promotional footer for free sites
  if (data.plan !== 'premium') {
    const promoFooter = `
    <div style="position:fixed;bottom:0;left:0;right:0;z-index:10000;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 20px;text-align:center;box-shadow:0 -4px 20px rgba(99,102,241,0.3);font-family:system-ui,sans-serif;">
      <div style="font-size:15px;font-weight:600;margin-bottom:4px;">🦁 Apna website banao WhatsApp pe!</div>
      <div style="font-size:13px;opacity:0.9;margin-bottom:8px;">📱 <a href="https://wa.me/918210329601?text=Hi%2C%20mujhe%20bhi%20website%20chahiye!" style="color:white;text-decoration:underline;">+91 82103 29601</a></div>
      <a href="https://wa.me/918210329601?text=Hi%2C%20mujhe%20bhi%20website%20chahiye!" 
         style="background:white;color:#6366f1;padding:8px 18px;border-radius:25px;text-decoration:none;font-weight:600;display:inline-block;font-size:14px;">
        Free Website Banao 🚀
      </a>
    </div>
    <div style="height:80px;"></div>`;
    
    html = html.replace('</div><!-- __PAGE_END__ -->', `${promoFooter}\n</div><!-- __PAGE_END__ -->`);
    if (!html.includes('__PAGE_END__')) html = html.replace('</body>', `${promoFooter}\n</body>`);
  } else {
    // Premium: subtle "Created by" footer (not fixed, just at bottom)
    const premiumFooter = `
    <div style="text-align:center;padding:16px 20px;font-family:system-ui,sans-serif;font-size:12px;color:#9CA3AF;border-top:1px solid #F3F4F6;margin-top:20px;">
      Created by <a href="https://wa.me/918210329601?text=Hi%2C%20mujhe%20bhi%20website%20chahiye!" style="color:#6366f1;text-decoration:none;font-weight:600;">WhatsWebsite</a> 
      · <a href="https://wa.me/918210329601?text=Hi%2C%20mujhe%20bhi%20website%20chahiye!" style="color:#6366f1;text-decoration:none;">Create yours 📱</a>
    </div>`;
    html = html.replace('</div><!-- __PAGE_END__ -->', `${premiumFooter}\n</div><!-- __PAGE_END__ -->`);
    if (!html.includes('__PAGE_END__')) html = html.replace('</body>', `${premiumFooter}\n</body>`);
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
  // Build photos array with hero + gallery for template JS
  const allPhotos: any[] = [];
  if ((data as any).heroImage) {
    allPhotos.push({ url: (data as any).heroImage, caption: data.businessName, type: 'hero' });
  }
  if (data.photos?.length) {
    for (const p of data.photos) {
      allPhotos.push({ ...p, type: p.type || 'gallery' });
    }
  }

  const jsonData = JSON.stringify({
    slug: data.slug,
    businessName: data.businessName,
    tagline: data.tagline || '',
    about: (data as any).about || '',
    whatsapp: data.whatsapp,
    phone: data.phone,
    address: data.address,
    timings: data.timings,
    isOpen: data.isOpen !== false,
    activeOffer: data.activeOffer || null,
    menu: data.menu,
    services: data.services,
    packages: data.packages,
    plans: data.plans,
    subjects: data.subjects,
    photos: allPhotos,
    reviews: (data as any).reviews || [],
    todaySpecial: (data as any).todaySpecial || null,
  });
  
  // Inject __SITE_DATA__ before the template's <!-- __INJECT_DATA__ --> marker
  const dataScript = `
  <script>window.__SITE_DATA__ = ${jsonData};</script>`;
  
  // Inject at marker if present, otherwise before </body>
  if (html.includes('<!-- __INJECT_DATA__ -->')) {
    html = html.replace('<!-- __INJECT_DATA__ -->', dataScript);
  } else {
    html = html.replace('</body>', `${dataScript}\n</body>`);
  }
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

// ─── GALLERY PAGE ────────────────────────────────────────────────────────────

export function renderGalleryPage(data: SiteData): string {
  const photos = data.photos || [];
  const BASE = process.env.TUNNEL_URL || 'https://whatswebsite.com';

  const photoGrid = photos.length > 0
    ? photos.map((p: any, i: number) => `
      <div class="g-item fade-up" style="--i:${i}" onclick="openLightbox(${i})">
        <img src="${p.url}" alt="${p.caption || data.businessName}" loading="lazy">
        <div class="g-overlay"><span>${p.caption || ''}</span></div>
      </div>`).join('')
    : '<div class="g-empty">📸 No photos yet. Send photos on WhatsApp to add them!</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${data.businessName} — Photo Gallery</title>
<meta name="description" content="Photo gallery of ${data.businessName}. ${data.tagline}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📸</text></svg>">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--primary:#1A6B5A;--primary-light:#E6F5F0;--bg:#FFF9F0;--surface:#FFFFFF;--text:#2D2016;--text-muted:#5C4A38;--text-light:#9C8A78;--border:rgba(44,32,22,.08);--shadow:0 4px 16px rgba(44,32,22,.06);--font-body:'Inter',sans-serif;--font-heading:'Playfair Display',serif;--radius:16px;--radius-sm:10px}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}

.fade-up{opacity:0;transform:translateY(30px);transition:opacity .6s ease,transform .6s ease;transition-delay:calc(var(--i,0)*0.05s)}
.fade-up.visible{opacity:1;transform:translateY(0)}

/* Header */
.g-header{padding:2rem 1.5rem 1rem;max-width:1200px;margin:0 auto}
.g-back{display:inline-flex;align-items:center;gap:.5rem;color:var(--text-muted);font-size:.9rem;transition:color .3s;margin-bottom:1.5rem;text-decoration:none}
.g-back:hover{color:var(--primary)}
.g-title{font-family:var(--font-heading);font-size:clamp(2rem,5vw,3rem);margin-bottom:.5rem;color:var(--text)}
.g-subtitle{color:var(--text-muted);font-size:1rem}
.g-count{display:inline-block;background:var(--primary-light);border:1px solid var(--border);padding:.25rem .75rem;border-radius:50px;font-size:.8rem;color:var(--primary);margin-left:.75rem;font-weight:600}

/* Grid */
.g-grid{max-width:1200px;margin:2rem auto;padding:0 1.5rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
@media(min-width:900px){.g-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1200px){.g-grid{grid-template-columns:repeat(4,1fr)}}
.g-item{position:relative;border-radius:var(--radius-sm);overflow:hidden;cursor:pointer;aspect-ratio:1;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow)}
.g-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.g-item:hover img{transform:scale(1.08)}
.g-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%);opacity:0;transition:opacity .3s;display:flex;align-items:flex-end;padding:1rem}
.g-item:hover .g-overlay{opacity:1}
.g-overlay span{color:#fff;font-size:.85rem;font-weight:500}
.g-empty{grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-muted);font-size:1.1rem;background:var(--surface);border:2px dashed var(--border);border-radius:var(--radius)}

/* Lightbox */
.lightbox{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.95);align-items:center;justify-content:center;flex-direction:column}
.lightbox.active{display:flex}
.lightbox img{max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px}
.lightbox-caption{color:var(--text-muted);margin-top:1rem;font-size:.9rem}
.lightbox-close{position:absolute;top:1.5rem;right:1.5rem;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .3s}
.lightbox-close:hover{background:rgba(255,255,255,0.2)}
.lightbox-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:1.25rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .3s}
.lightbox-nav:hover{background:rgba(255,255,255,0.2)}
.lightbox-prev{left:1.5rem}
.lightbox-next{right:1.5rem}
.lightbox-counter{position:absolute;bottom:1.5rem;left:50%;transform:translateX(-50%);color:var(--text-muted);font-size:.8rem}

/* CTA */
.g-cta{max-width:1200px;margin:2rem auto 3rem;padding:0 1.5rem;text-align:center}
.g-cta-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:2.5rem;box-shadow:var(--shadow)}
.g-cta-card p{color:var(--text-muted);margin-bottom:1rem;font-size:1rem}
.g-cta-card a{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 2rem;border-radius:50px;background:#25D366;color:#fff;font-weight:600;transition:transform .3s,box-shadow .3s;box-shadow:0 4px 20px rgba(37,211,102,0.3)}
.g-cta-card a:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(37,211,102,0.4)}

/* Footer */
.g-footer{text-align:center;padding:2rem;border-top:1px solid var(--border);color:var(--text-light);font-size:.75rem}
.g-footer a{color:var(--primary);font-weight:600;text-decoration:none}
</style>
</head>
<body>

<div class="g-header">
  <a href="${BASE}/site/${data.slug}" class="g-back">← Back to ${data.businessName}</a>
  <h1 class="g-title"><span>${data.businessName}</span> Gallery</h1>
  <p class="g-subtitle">${data.tagline}<span class="g-count">${photos.length} photos</span></p>
</div>

<div class="g-grid">${photoGrid}</div>



<div class="g-footer">⚡ Website by <a href="https://whatswebsite.com">WhatsWebsite</a></div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox">
  <button class="lightbox-close" onclick="closeLightbox()">✕</button>
  <button class="lightbox-nav lightbox-prev" onclick="navLightbox(-1)">‹</button>
  <img id="lb-img" src="" alt="">
  <div class="lightbox-caption" id="lb-caption"></div>
  <button class="lightbox-nav lightbox-next" onclick="navLightbox(1)">›</button>
  <div class="lightbox-counter" id="lb-counter"></div>
</div>

<script>
var photos = ${JSON.stringify(photos)};
var currentIdx = 0;

// Scroll animations
var obs = new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}});
},{threshold:0.1});
document.querySelectorAll('.fade-up').forEach(function(el){obs.observe(el)});

function openLightbox(i){
  currentIdx = i;
  showLightboxImage();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow='';
}
function navLightbox(dir){
  currentIdx = (currentIdx + dir + photos.length) % photos.length;
  showLightboxImage();
}
function showLightboxImage(){
  var p = photos[currentIdx];
  document.getElementById('lb-img').src = p.url;
  document.getElementById('lb-caption').textContent = p.caption || '';
  document.getElementById('lb-counter').textContent = (currentIdx+1) + ' / ' + photos.length;
}
// Keyboard nav
document.addEventListener('keydown',function(e){
  if(!document.getElementById('lightbox').classList.contains('active'))return;
  if(e.key==='Escape')closeLightbox();
  if(e.key==='ArrowLeft')navLightbox(-1);
  if(e.key==='ArrowRight')navLightbox(1);
});
// Click outside to close
document.getElementById('lightbox').addEventListener('click',function(e){
  if(e.target===this)closeLightbox();
});
</script>
</body>
</html>`;
}
