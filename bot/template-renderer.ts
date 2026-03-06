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
  store: 'store-2026.html',
  salon: 'salon-2026.html',
  tutor: 'tutor-2026.html',
  clinic: 'clinic-2026.html',
  gym: 'gym-2026.html',
  photographer: 'photographer-2026.html',
  service: 'service-2026.html',
  portfolio: 'portfolio-2026.html',
  wedding: 'wedding-2026.html',
  event: 'event-2026.html',
};

export function renderSite(data: SiteData): string {
  console.log(`[Render] ${data.slug} (${data.category}) — subjects:${(data as any).subjects?.length||0} services:${(data as any).services?.length||0}`);
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
  
  // WhatsApp number — single source of truth
  const WA_NUMBER = '919187578351';
  const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hi%2C%20mujhe%20bhi%20website%20chahiye!`;

  // Add promotional footer for free sites
  if (data.plan !== 'premium') {
    const promoFooter = `
    <div style="position:fixed;bottom:0;left:0;right:0;z-index:10000;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:white;padding:10px 20px;text-align:center;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
      <span style="font-size:13px;opacity:.8;">Free website chahiye?</span>
      <a href="${WA_LINK}" style="background:#25D366;color:white;padding:6px 16px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:4px;">
        WhatsApp karo →
      </a>
    </div>
    <div style="height:46px;"></div>`;
    
    if (html.includes('</div><!-- __PAGE_END__ -->')) {
      html = html.replace('</div><!-- __PAGE_END__ -->', `${promoFooter}\n</div><!-- __PAGE_END__ -->`);
    } else if (html.includes('<!-- __PAGE_END__ -->')) {
      html = html.replace('<!-- __PAGE_END__ -->', `${promoFooter}\n<!-- __PAGE_END__ -->`);
    } else {
      html = html.replace('</body>', `${promoFooter}\n</body>`);
    }
  } else {
    // Premium: "Made with WhatsWebsite" below copyright inside footer + spacer for sticky CTA
    const creditLine = `<div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:6px;font-family:system-ui,sans-serif;font-size:11px;color:rgba(255,255,255,.3);"><span>⚡</span> Built with <a href="${WA_LINK}" style="background:linear-gradient(135deg,rgba(99,102,241,.4),rgba(168,85,247,.4));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:600;text-decoration:none;letter-spacing:.02em;">WhatsWebsite.com</a></div>`;
    html = html.replace(/(id="ftrCopy">[^<]*<\/span>[^<]*<\/div>)/i, `$1\n    ${creditLine}`);
    // Add spacer so sticky CTA doesn't cover footer
    if (html.includes('<!-- __PAGE_END__ -->')) {
      html = html.replace('<!-- __PAGE_END__ -->', `<div style="height:56px"></div>\n<!-- __PAGE_END__ -->`);
    } else {
      html = html.replace('</body>', `<div style="height:56px"></div>\n</body>`);
    }
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
    category: data.category,
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
    ownerName: (data as any).ownerName || '',
    experience: (data as any).experience || '',
    sectionContent: (data as any).sectionContent || {},
    trustBadges: (data as any).trustBadges || null,
    themeColor: (data as any).themeColor || null,
    hiddenSections: (data as any).hiddenSections || [],
    sectionOrder: (data as any).sectionOrder || [],
    socialLinks: (data as any).socialLinks || {},
    upiId: (data as any).upiId || null,
    upiName: (data as any).upiName || null,
    faq: (data as any).faq || [],
    // wedding-specific top-level shortcuts
    brideName: (data as any).sectionContent?.brideName || (data as any).brideName || null,
    groomName: (data as any).sectionContent?.groomName || (data as any).groomName || null,
    weddingDate: (data as any).sectionContent?.weddingDate || (data as any).weddingDate || null,
    bridePhoto: (data as any).sectionContent?.bridePhoto || null,
    groomPhoto: (data as any).sectionContent?.groomPhoto || null,
    brideDescription: (data as any).sectionContent?.brideDescription || null,
    groomDescription: (data as any).sectionContent?.groomDescription || null,
  });
  
  // Replace static placeholders
  html = html.replace(/__BUSINESS_NAME__/g, data.businessName || '');
  html = html.replace(/__TAGLINE__/g, (data as any).tagline || '');
  html = html.replace(/__ADDRESS__/g, data.address || '');
  html = html.replace(/__TIMINGS__/g, data.timings || '');

  // Inject __SITE_DATA__ before the template's <!-- __INJECT_DATA__ --> marker
  const dataScript = `
  <script>window.__SITE_DATA__ = ${jsonData};</script>`;
  
  // Dynamic features script (theme, hidden sections, social, UPI, FAQ)
  const featuresScript = `
  <script>
  (function(){
    const D = window.__SITE_DATA__ || {};
    
    // Theme color override
    if (D.themeColor) {
      const r = document.documentElement;
      r.style.setProperty('--blue', D.themeColor);
      r.style.setProperty('--primary', D.themeColor);
      // Generate lighter variant
      const hex = D.themeColor.replace('#','');
      const rr = parseInt(hex.substr(0,2),16), gg = parseInt(hex.substr(2,2),16), bb = parseInt(hex.substr(4,2),16);
      r.style.setProperty('--blue-light', 'rgba('+rr+','+gg+','+bb+',0.1)');
      // Update meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', D.themeColor);
    }
    
    // Hidden sections
    if (D.hiddenSections && D.hiddenSections.length) {
      const sectionMap = {products:'products',gallery:'gallerySection',reviews:'reviewSection',location:'locSection',about:'aboutSection',trust:'trustSection',stats:'statsSection',faq:'faqSection',offers:'offer-banner'};
      D.hiddenSections.forEach(function(s){
        const id = sectionMap[s] || s;
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
        // Also hide from nav
        document.querySelectorAll('a[href="#'+id+'"]').forEach(function(a){ a.style.display='none'; });
      });
    }
    
    // Social links
    if (D.socialLinks && Object.keys(D.socialLinks).length) {
      const icons = {instagram:'📷',facebook:'📘',youtube:'▶️',twitter:'🐦',linkedin:'💼',telegram:'✈️'};
      let socialHtml = '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0;">';
      for (const [p, url] of Object.entries(D.socialLinks)) {
        socialHtml += '<a href="'+url+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);color:inherit;text-decoration:none;font-size:14px;font-weight:500;transition:transform .2s;border:1px solid rgba(255,255,255,0.15);" onmouseover="this.style.transform=\\'scale(1.05)\\'" onmouseout="this.style.transform=\\'scale(1)\\'">'+(icons[p]||'🔗')+' '+p.charAt(0).toUpperCase()+p.slice(1)+'</a>';
      }
      socialHtml += '</div>';
      const ftr = document.querySelector('.ftr-copy') || document.querySelector('footer');
      if (ftr) ftr.insertAdjacentHTML('beforebegin', socialHtml);
    }
    
    // UPI Payment section
    if (D.upiId) {
      const upiHtml = '<section class="section" style="text-align:center;"><div class="sec-hdr fade-up"><h2 class="sec-t">💳 Pay Online</h2><p class="sec-desc">Scan QR or tap to pay via UPI</p></div><div style="margin:20px auto;max-width:250px;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa='+encodeURIComponent(D.upiId)+'%26pn='+encodeURIComponent(D.upiName||D.businessName)+'" alt="UPI QR" style="width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"/><p style="margin-top:12px;font-size:14px;opacity:0.7;">'+D.upiId+'</p><a href="upi://pay?pa='+encodeURIComponent(D.upiId)+'&pn='+encodeURIComponent(D.upiName||D.businessName)+'" style="display:inline-block;margin-top:12px;padding:10px 24px;background:var(--blue,#2563eb);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Pay Now</a></div></section>';
      const loc = document.getElementById('locSection');
      if (loc) loc.insertAdjacentHTML('beforebegin', upiHtml);
      else document.querySelector('footer')?.insertAdjacentHTML('beforebegin', upiHtml);
    }
    
    // FAQ section
    if (D.faq && D.faq.length) {
      let faqHtml = '<section class="section" id="faqSection"><div class="sec-hdr fade-up"><h2 class="sec-t">❓ FAQ</h2><p class="sec-desc">Frequently Asked Questions</p></div><div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:8px;">';
      D.faq.forEach(function(f,i){
        faqHtml += '<div class="fade-up" style="transition-delay:'+i*50+'ms;border:1px solid rgba(0,0,0,0.08);border-radius:12px;overflow:hidden;"><button onclick="var a=this.nextElementSibling;var open=a.style.maxHeight!==\\'0px\\';a.style.maxHeight=open?\\'0px\\':\\'500px\\';this.querySelector(\\'span:last-child\\').textContent=open?\\'+\\':\\'−\\'" style="width:100%;padding:16px 20px;background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600;text-align:left;"><span>'+f.question+'</span><span style="font-size:20px;color:var(--blue,#2563eb);">+</span></button><div style="max-height:0px;overflow:hidden;transition:max-height .3s ease;padding:0 20px;"><p style="padding:0 0 16px;font-size:14px;opacity:0.75;line-height:1.6;">'+f.answer+'</p></div></div>';
      });
      faqHtml += '</div></section>';
      const loc = document.getElementById('locSection');
      if (loc) loc.insertAdjacentHTML('beforebegin', faqHtml);
      else document.querySelector('footer')?.insertAdjacentHTML('beforebegin', faqHtml);
    }
  })();
  </script>`;

  // Inject at marker if present, otherwise before </body>
  if (html.includes('<!-- __INJECT_DATA__ -->')) {
    html = html.replace('<!-- __INJECT_DATA__ -->', dataScript + featuresScript);
  } else {
    html = html.replace('</body>', `${dataScript}\n${featuresScript}\n</body>`);
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
    portfolio: 'projects',
    wedding: 'services',
    event: 'services',
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
    portfolio: '💼 Portfolio',
    wedding: '💒 Wedding',
    event: '🎉 Event',
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



${data.plan !== 'premium' ? '<div class="g-footer">⚡ Website by <a href="https://whatswebsite.com">WhatsWebsite</a></div>' : ''}

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
