/**
 * SheruSites Agent — AI-powered website management agent per user
 * 
 * Each user gets their own agent that:
 * - Understands natural language (Hinglish)
 * - Knows their business context
 * - Handles complex edits
 * - Can modify menu, prices, timings, offers, photos
 * - Remembers conversation history
 * 
 * Cost: ~₹0.3-0.5 per interaction (GPT-4o-mini)
 */

import { getSiteData, saveSiteData, getOrCreateUser, listUserSites, addChatMessage, getChatHistory, getSession, saveSession } from './db.ts';


type SiteData = {
  slug: string;
  businessName: string; 
  category: string;
  phone: string;
  whatsapp: string;
  address: string;
  timings: string;
  plan: string;
  isOpen?: boolean;
  menu?: any[];
  services?: any[];
  photos?: any[];
  activeOffer?: any;
};
import { renderSite } from './template-renderer.ts';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

function getHistory(phone: string): { role: string; content: string }[] {
  return getChatHistory(phone, 10);
}

function addToHistory(phone: string, role: string, content: string) {
  addChatMessage(phone, role, content);
}

// ─── AGENT TOOLS ─────────────────────────────────────────────────────────────

interface AgentAction {
  action: string;
  params: Record<string, any>;
}

function executeActions(slug: string, actions: AgentAction[], phone?: string): string[] {
  const results: string[] = [];
  let siteData = getSiteData(slug);
  if (!siteData) return ['Site data not found'];
  
  // Helper: get the active items list (menu for restaurants, services for others)
  const getItems = () => {
    if (siteData!.menu?.length) return siteData!.menu!;
    if (siteData!.subjects?.length) return siteData!.subjects!;
    if (siteData!.services?.length) return siteData!.services!;
    if (siteData!.packages?.length) return siteData!.packages!;
    if (siteData!.plans?.length) return siteData!.plans!;
    // Default based on category
    if (siteData!.category === 'restaurant') return siteData!.menu = siteData!.menu || [];
    if (siteData!.category === 'tutor') return siteData!.subjects = siteData!.subjects || [];
    return siteData!.services = siteData!.services || [];
  };
  const setItems = (items: any[]) => {
    if (siteData!.menu?.length || siteData!.category === 'restaurant') { siteData!.menu = items; return; }
    if (siteData!.subjects?.length || siteData!.category === 'tutor') { siteData!.subjects = items; return; }
    if (siteData!.packages?.length) { siteData!.packages = items; return; }
    if (siteData!.plans?.length) { siteData!.plans = items; return; }
    siteData!.services = items;
  };

  for (const { action, params } of actions) {
    try {
      switch (action) {
        case 'add_menu_item': {
          const addList = getItems();
          addList.push({
            name: params.name,
            price: params.price,
            category: params.category || '',
            description: params.description || '',
            popular: params.popular || false,
          });
          results.push(`✅ Added: ${params.name} — ${params.price}`);
          break;
        }
        case 'remove_menu_item': {
          const list = getItems();
          if (!list.length) break;
          const idx = list.findIndex(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = list.splice(idx, 1)[0];
            results.push(`✅ Removed: ${removed.name}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila menu mein`);
          }
          break;
        }
        case 'reorder_category': {
          const rcList = getItems();
          if (!rcList.length) break;
          const targetCat = params.category.toLowerCase();
          const pos = parseInt(params.position) || 1;
          const catOrder: string[] = [];
          rcList.forEach(m => { const c = m.category || 'Menu'; if (!catOrder.includes(c)) catOrder.push(c); });
          const catIdx = catOrder.findIndex(c => c.toLowerCase() === targetCat);
          if (catIdx < 0) { results.push(`❌ "${params.category}" category nahi mili`); break; }
          const [moved] = catOrder.splice(catIdx, 1);
          catOrder.splice(Math.max(0, pos - 1), 0, moved);
          const reordered: any[] = [];
          catOrder.forEach(c => { rcList.filter(m => (m.category || 'Menu') === c).forEach(m => reordered.push(m)); });
          setItems(reordered);
          results.push(`✅ "${moved}" ab #${pos} pe hai`);
          break;
        }
        case 'remove_category': {
          const rmcList = getItems();
          if (!rmcList.length) break;
          const cat = params.category.toLowerCase();
          const before = rmcList.length;
          const filtered = rmcList.filter(m => (m.category || '').toLowerCase() !== cat);
          setItems(filtered);
          const removed = before - filtered.length;
          if (removed > 0) {
            results.push(`✅ "${params.category}" category hata di (${removed} items removed)`);
          } else {
            results.push(`❌ "${params.category}" category nahi mili`);
          }
          break;
        }
        case 'update_price': {
          const allItems = [...(siteData.menu || []), ...(siteData.services || []), ...(siteData.packages || []), ...(siteData.plans || []), ...(siteData.subjects || [])];
          const item = allItems.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (item) {
            const oldPrice = item.price;
            item.price = params.price;
            results.push(`✅ ${item.name}: ${oldPrice} → ${params.price}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'bulk_price_change': {
          const items = [...(siteData.menu || []), ...(siteData.services || []), ...(siteData.subjects || []), ...(siteData.packages || []), ...(siteData.plans || [])];
          const percent = params.percent || 0;
          let changed = 0;
          for (const item of items) {
            const numPrice = parseInt(item.price.replace(/[₹,\s]/g, ''));
            if (!isNaN(numPrice)) {
              const newPrice = Math.round(numPrice * (1 + percent / 100));
              item.price = `₹${newPrice}`;
              changed++;
            }
          }
          results.push(`✅ ${changed} items ka price ${percent > 0 ? '+' : ''}${percent}% change kiya`);
          break;
        }
        case 'add_service': {
          const svcList = getItems();
          svcList.push({
            name: params.name,
            price: params.price,
            duration: params.duration || '',
            description: params.description || '',
          });
          results.push(`✅ Service added: ${params.name} — ${params.price}`);
          break;
        }
        case 'remove_service': {
          const rmList = getItems();
          if (!rmList.length) break;
          const idx = rmList.findIndex(s => s.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = rmList.splice(idx, 1)[0];
            results.push(`✅ Removed: ${removed.name}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'update_timings': {
          siteData.timings = params.timings;
          results.push(`✅ Timings: ${params.timings}`);
          break;
        }
        case 'set_offer': {
          siteData.activeOffer = { text: params.text, validTill: params.validTill };
          results.push(`🎉 Offer live: "${params.text}"`);
          break;
        }
        case 'clear_offer': {
          siteData.activeOffer = undefined;
          results.push(`✅ Offer hata diya`);
          break;
        }
        case 'set_closed': {
          siteData.isOpen = false;
          results.push(`🔒 Website: Temporarily Closed`);
          break;
        }
        case 'set_open': {
          siteData.isOpen = true;
          results.push(`✅ Website: OPEN`);
          break;
        }
        case 'update_about': {
          siteData.about = params.text;
          results.push(`✅ About section updated`);
          break;
        }
        case 'update_tagline': {
          siteData.tagline = params.text;
          results.push(`✅ Tagline: "${params.text}"`);
          break;
        }
        case 'update_address': {
          siteData.address = params.address;
          results.push(`✅ Address updated`);
          break;
        }
        case 'update_phone': {
          // Clean phone: strip +, spaces, leading 91 if present
          const rawPhone = String(params.phone).replace(/[\s+\-()]/g, '');
          const cleanPhone = rawPhone.replace(/^91(\d{10})$/, '$1');
          siteData.phone = cleanPhone;
          siteData.whatsapp = cleanPhone.length === 10 ? `91${cleanPhone}` : rawPhone;
          results.push(`✅ Phone: ${cleanPhone}`);
          break;
        }
        case 'mark_popular': {
          const mpItems = getItems();
          const mpItem = mpItems.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (mpItem) { mpItem.popular = true; results.push(`⭐ ${mpItem.name} marked as popular`); }
          break;
        }
        case 'add_review': {
          if (!siteData.reviews) siteData.reviews = [];
          siteData.reviews.push({
            author: params.author || 'Customer',
            text: params.text,
            rating: params.rating || 5,
            date: params.date || 'Just now',
          });
          results.push(`⭐ Review added from ${params.author || 'Customer'}`);
          break;
        }
        case 'remove_review': {
          if (!siteData.reviews) break;
          const idx = siteData.reviews.findIndex((r: any) => r.author.toLowerCase().includes((params.author || '').toLowerCase()));
          if (idx >= 0) {
            siteData.reviews.splice(idx, 1);
            results.push(`✅ Review removed`);
          } else {
            results.push(`❌ Review nahi mila`);
          }
          break;
        }
        case 'set_today_special': {
          siteData.todaySpecial = {
            name: params.name,
            description: params.description || '',
            price: params.price,
            oldPrice: params.oldPrice,
          };
          results.push(`🔥 Today's Special: ${params.name} — ${params.price}`);
          break;
        }
        case 'clear_today_special': {
          siteData.todaySpecial = undefined;
          results.push(`✅ Today's special hata diya`);
          break;
        }
        case 'update_business_name': {
          siteData.businessName = params.name;
          results.push(`✅ Business name: "${params.name}"`);
          break;
        }
        case 'set_map_location': {
          (siteData as any).lat = params.lat;
          (siteData as any).lng = params.lng;
          (siteData as any).mapUrl = `https://www.google.com/maps?q=${params.lat},${params.lng}`;
          results.push(`📍 Map location updated`);
          break;
        }
        case 'update_map_address': {
          siteData.address = params.address;
          results.push(`📍 Address & map updated: ${params.address}`);
          break;
        }
        case 'set_delivery': {
          siteData.delivery = params.enabled !== false;
          siteData.deliveryArea = params.area || '';
          results.push(`🚗 Delivery: ${siteData.delivery ? 'ON' : 'OFF'}${siteData.deliveryArea ? ` (${siteData.deliveryArea})` : ''}`);
          break;
        }
        case 'rename_category': {
          const rcItems = getItems();
          const oldCat = params.old_name?.toLowerCase();
          let renamed = 0;
          rcItems.forEach(m => {
            if ((m.category || '').toLowerCase() === oldCat) { m.category = params.new_name; renamed++; }
          });
          results.push(renamed > 0 ? `✅ "${params.old_name}" → "${params.new_name}" (${renamed} items)` : `❌ "${params.old_name}" nahi mili`);
          break;
        }
        case 'update_item_description': {
          const allItems = getItems();
          const item = allItems.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (item) { item.description = params.description; results.push(`✅ ${item.name} description updated`); }
          else results.push(`❌ "${params.name}" nahi mila`);
          break;
        }
        case 'unmark_popular': {
          const upItem = getItems().find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (upItem) { upItem.popular = false; results.push(`✅ ${upItem.name} popular tag hataya`); }
          else results.push(`❌ "${params.name}" nahi mila`);
          break;
        }
        case 'set_veg': {
          const svItem = getItems().find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (svItem) { svItem.veg = true; results.push(`✅ ${svItem.name} → 🟢 Veg`); }
          else results.push(`❌ "${params.name}" nahi mila`);
          break;
        }
        case 'set_nonveg': {
          const snItem = getItems().find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (snItem) { snItem.veg = false; results.push(`✅ ${snItem.name} → 🔴 Non-Veg`); }
          else results.push(`❌ "${params.name}" nahi mila`);
          break;
        }
        case 'remove_hero': {
          (siteData as any).heroImage = undefined;
          results.push(`✅ Hero photo hata di`);
          break;
        }
        case 'request_photo': {
          // Set pendingPhotoType in session
          if (phone) {
            const sess = getSession(phone);
            if (sess) {
              sess.data.pendingPhotoType = params.type === 'hero' ? 'hero' : 'gallery';
              saveSession(phone, sess);
            }
          }
          results.push(params.type === 'hero' 
            ? `📸 Hero photo bhejo — website ka main photo update ho jayega!`
            : `📸 Photo bhejo WhatsApp pe — gallery mein add ho jayegi!`);
          break;
        }
        case 'update_experience': {
          (siteData as any).experience = params.text;
          results.push(`✅ Experience updated: ${params.text}`);
          break;
        }
        case 'update_specialization': {
          (siteData as any).specialization = params.text;
          results.push(`✅ Specialization updated: ${params.text}`);
          break;
        }
        case 'update_owner_name': {
          (siteData as any).ownerName = params.name;
          results.push(`✅ Owner name: ${params.name}`);
          break;
        }
        case 'update_stats': {
          // params.stats = [{value:"10+", label:"Years"}, ...]
          if (params.stats?.length) {
            (siteData as any).stats = params.stats;
            results.push(`✅ Stats updated: ${params.stats.map((s:any) => `${s.value} ${s.label}`).join(', ')}`);
          }
          break;
        }
        case 'delete_photo': {
          if (!siteData.photos || siteData.photos.length === 0) {
            results.push('❌ Koi photo nahi hai abhi');
            break;
          }
          const photoIdx = (params.index || 1) - 1;
          if (photoIdx < 0 || photoIdx >= siteData.photos.length) {
            results.push(`❌ Photo #${params.index} nahi hai. Total: ${siteData.photos.length} photos`);
          } else {
            const removed = siteData.photos.splice(photoIdx, 1)[0];
            // Delete file too
            try {
              const photoPath = require('path').join(process.cwd(), removed.url.replace(/^\//, ''));
              if (require('fs').existsSync(photoPath)) require('fs').unlinkSync(photoPath);
            } catch {}
            results.push(`✅ Photo #${params.index} delete ho gayi (${siteData.photos.length} remaining)`);
          }
          break;
        }
        case 'delete_all_photos': {
          const count = siteData.photos?.length || 0;
          // Delete files
          if (siteData.photos) {
            for (const p of siteData.photos) {
              try {
                const photoPath = require('path').join(process.cwd(), p.url.replace(/^\//, ''));
                if (require('fs').existsSync(photoPath)) require('fs').unlinkSync(photoPath);
              } catch {}
            }
          }
          siteData.photos = [];
          results.push(`✅ Sab ${count} photos delete ho gayi`);
          break;
        }
        case 'change_theme_color': {
          const colorMap: Record<string, string> = {
            red: '#e63946', blue: '#2563eb', green: '#16a34a', purple: '#7c3aed',
            orange: '#ea580c', pink: '#ec4899', teal: '#0d9488', yellow: '#ca8a04',
            black: '#1a1a1a', maroon: '#800000', navy: '#1e3a5f', gold: '#b8860b',
          };
          const c = (params.color || '').toLowerCase();
          const hex = colorMap[c] || (c.startsWith('#') ? c : colorMap.blue);
          (siteData as any).themeColor = hex;
          results.push(`✅ Theme color → ${c} (${hex})`);
          break;
        }
        case 'toggle_section': {
          if (!siteData.hiddenSections) (siteData as any).hiddenSections = [];
          const sec = (params.section || '').toLowerCase();
          if (params.visible === false || params.visible === 'false') {
            if (!siteData.hiddenSections.includes(sec)) siteData.hiddenSections.push(sec);
            results.push(`✅ "${sec}" section hidden`);
          } else {
            (siteData as any).hiddenSections = siteData.hiddenSections.filter((s: string) => s !== sec);
            results.push(`✅ "${sec}" section visible`);
          }
          break;
        }
        case 'reorder_sections': {
          (siteData as any).sectionOrder = params.order || [];
          results.push(`✅ Sections reordered`);
          break;
        }
        case 'add_social_link': {
          if (!siteData.socialLinks) (siteData as any).socialLinks = {};
          const platform = (params.platform || '').toLowerCase();
          (siteData as any).socialLinks[platform] = params.url;
          results.push(`✅ ${platform} link added`);
          break;
        }
        case 'remove_social_link': {
          if (siteData.socialLinks) {
            delete (siteData as any).socialLinks[(params.platform || '').toLowerCase()];
            results.push(`✅ ${params.platform} link removed`);
          }
          break;
        }
        case 'add_upi': {
          (siteData as any).upiId = params.upiId;
          (siteData as any).upiName = params.name || siteData.businessName;
          results.push(`✅ UPI payment added: ${params.upiId}`);
          break;
        }
        case 'remove_upi': {
          delete (siteData as any).upiId;
          delete (siteData as any).upiName;
          results.push(`✅ UPI removed`);
          break;
        }
        case 'add_faq': {
          if (!siteData.faq) (siteData as any).faq = [];
          (siteData as any).faq.push({ question: params.question, answer: params.answer });
          results.push(`✅ FAQ added: ${params.question}`);
          break;
        }
        case 'remove_faq': {
          if (siteData.faq) {
            const q = (params.question || '').toLowerCase();
            (siteData as any).faq = siteData.faq.filter((f: any) => !f.question.toLowerCase().includes(q));
            results.push(`✅ FAQ removed`);
          }
          break;
        }
        case 'clear_all_faq': {
          (siteData as any).faq = [];
          results.push(`✅ All FAQs cleared`);
          break;
        }
        case 'no_action': {
          // Agent decided no website change needed — just conversation
          break;
        }
        default:
          results.push(`Unknown action: ${action}`);
      }
    } catch (err: any) {
      results.push(`Error: ${err.message}`);
    }
  }

  // Save and re-render
  if (actions.some(a => a.action !== 'no_action')) {
    console.log(`[Agent] Saving ${siteData.slug}: actions=${JSON.stringify(actions.map(a=>a.action))}, subjects=${siteData.subjects?.length||0}`);
    saveSiteData(siteData);
    renderSite(siteData);
  }

  return results;
}

// ─── AGENT CORE ──────────────────────────────────────────────────────────────

export async function agentHandle(phone: string, message: string, siteSlug: string): Promise<string> {
  const siteData = getSiteData(siteSlug);
  if (!siteData) return 'Site not found. "reset" karke naya banao.';

  // Build context about the business
  const context = buildSiteContext(siteData);
  
  addToHistory(phone, 'user', message);

  try {
    const systemPrompt = `You are a WhatsApp business website manager for an Indian small business.

## Language & Tone:
- MIRROR the user's language: if they write Hindi, reply Hindi. If English, reply English. If Hinglish, reply Hinglish.
- MIRROR the user's tone: formal user = formal reply. Casual/friendly = casual reply. Professional = professional.
- ULTRA concise — max 1-2 lines. Just confirm the action, nothing extra.
- NEVER ask for confirmation. Just DO IT immediately. User said it, that's the confirmation.
- No emojis overload. 1-2 max per reply.

## Business Context:
${context}

## Your Capabilities:
You can perform these actions on the website. Return them as JSON array in "actions" field.

Available actions:

MENU / ITEMS:
- add_menu_item: {name, price, category?, description?, popular?, veg?}
- remove_menu_item: {name}
- update_price: {name, price}
- update_item_description: {name, description}
- bulk_price_change: {percent} (+10 = 10% increase, -5 = 5% decrease)
- mark_popular: {name}
- unmark_popular: {name}
- set_veg: {name}
- set_nonveg: {name}

CATEGORIES:
- remove_category: {category} — remove entire category with all items
- reorder_category: {category, position} — move category to position (1=first)
- rename_category: {old_name, new_name}

SERVICES (salon, clinic, etc):
- add_service: {name, price, duration?, description?}
- remove_service: {name}

PHOTOS:
- delete_photo: {index} (1-based)
- delete_all_photos: {}
- remove_hero: {} — remove hero image
- request_photo: {type: "hero"|"gallery"} — ask user to send photo (specify hero or gallery)

BUSINESS INFO:
- update_business_name: {name}
- update_tagline: {text}
- update_about: {text}
- update_address: {address}
- update_phone: {phone}
- update_timings: {timings}
- update_owner_name: {name}
- update_experience: {text}
- update_stats: {stats: [{value: "10+", label: "Years Exp"}, ...]} — update stats strip (tutor template)
- update_specialization: {text}
- set_map_location: {lat, lng}
- update_map_address: {address}

OFFERS & SPECIALS:
- set_offer: {text, validTill?}
- clear_offer: {}
- set_today_special: {name, description?, price, oldPrice?}
- clear_today_special: {}

REVIEWS:
- add_review: {author, text, rating (1-5), date?}
- remove_review: {author}

STATUS:
- set_closed: {}
- set_open: {}
- set_delivery: {enabled, area?}

THEME & DESIGN:
- change_theme_color: {color} — primary color (red, blue, green, purple, orange, pink, teal, yellow, black)
- toggle_section: {section, visible} — show/hide a section. sections: products, gallery, reviews, location, offers, about, trust, stats, faq
- reorder_sections: {order} — array of section names in desired order

SOCIAL & LINKS:
- add_social_link: {platform, url} — platform: instagram, facebook, youtube, twitter, linkedin, telegram
- remove_social_link: {platform}
- add_upi: {upiId, name?} — add UPI payment QR on website
- remove_upi: {}

FAQ:
- add_faq: {question, answer}
- remove_faq: {question}
- clear_all_faq: {}

OTHER:
- no_action: {} (just chatting, no website change)

## Response Format:
CRITICAL: You MUST return ONLY valid JSON. No text before or after. Format:
{"reply": "Short reply in user's language/tone", "actions": [{"action": "action_name", "params": {...}}]}

If no action needed: {"reply": "your message", "actions": [{"action": "no_action", "params": {}}]}

## Rules:
- If user asks about something unrelated to their website, just chat friendly (use no_action)
- If user gives vague input (like "change karna hai", "edit", "update"), DON'T ask open-ended "kya change?". Instead ANALYZE their site data and give PERSONALIZED recommendations of what's missing or can be improved:
  1. Check what's MISSING: no photos? no services/menu? generic tagline? no address? no offer?
  2. Suggest the TOP 3-4 most impactful improvements specific to their business
  Example for a photographer with no gallery: "Aapki Dx PRIME STUDIO website dekhi 👀 Ye improvements suggest karunga:\n\n📸 *Portfolio photos add karo* — abhi 0 photos hain, clients ko dikhana zaroori hai! Photo bhejo\n💰 *Packages add karo* — 'add Wedding Package ₹25000'\n✏️ *Tagline update* — 'edit tagline [catchy tagline]'\n📍 *Address update* — exact location daalo Google Maps pe dikhe\n\nKya karna hai?"
  Example for restaurant with menu but no offer: "Aapke menu mein 15 items hain 👍 Ye aur better ho sakta hai:\n\n🎯 *Today's Special lagao* — daily special se customers attract hote hain\n📸 *Food photos bhejo* — menu items ki photo se 3x zyada orders aate hain\n🏷️ *Offer lagao* — 'offer 10% off on first order'\n\nKya karna hai?"
  Always be specific to THEIR data. Never give generic lists.
- NEVER say generic greetings like "Hello! How can I assist you today?" — always be specific
- If user says "upgrade"/"premium"/"domain" — reply "upgrade type karo ya ⭐ Upgrade button dabao" (use no_action)
- If you don't understand, say "Samajh nahi aaya. Kya change karna hai batao?" — don't give generic English responses
- For price changes, always confirm the new price in your reply
- Be proactive — suggest improvements ("Aapke menu mein dessert nahi hai, add karna chahoge?")
- Keep replies short and WhatsApp-friendly (no long paragraphs)
- If user sends multiple items, handle them all in one go
- Prices should always be in ₹ format`;

    const history = getHistory(phone).slice(-8);
    const historyStr = history.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\nConversation history:\n${historyStr}\n\nUser message: ${message}`;
    
    // Use OpenClaw agent (Claude) instead of OpenAI
    const { execSync } = await import('child_process');
    const escaped = fullPrompt.replace(/'/g, "'\\''");
    
    let raw = '';
    try {
      raw = execSync(
        `openclaw agent --session-id whatsbot-${phone} --message '${escaped}' --timeout 25`,
        { timeout: 30000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      console.log(`[Agent] OpenClaw response for ${phone}: ${raw.slice(0, 200)}`);
    } catch (clawErr: any) {
      console.error('[Agent] OpenClaw error:', clawErr.message?.slice(0, 200));
      // Fallback to OpenAI if available
      if (OPENAI_KEY) {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history,
        ];
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 500, temperature: 0.3, response_format: { type: 'json_object' } }),
        });
        if (!res.ok) return 'AI agent se baat nahi ho pa rahi. Thodi der baad try karo. 😅';
        const d = await res.json();
        raw = d.choices?.[0]?.message?.content || '';
      } else {
        return 'AI agent se baat nahi ho pa rahi. Thodi der baad try karo. 😅';
      }
    }
    
    // Parse response
    let parsed: { reply: string; actions: AgentAction[] };
    try {
      // Extract JSON from anywhere in the response (AI sometimes adds text before/after)
      const jsonMatch = raw.match(/\{[\s\S]*"reply"[\s\S]*"actions"[\s\S]*\}/);
      const jsonStr = (jsonMatch ? jsonMatch[0] : raw).replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error(`[Agent] JSON parse failed. Raw: ${raw.slice(0, 300)}`);
      // DON'T forward AI's text — it might claim success without doing anything
      // Check if the raw text contains action-like words (add/remove/update/change)
      const looksLikeAction = /add|remove|hata|update|change|price|delete/i.test(message);
      if (looksLikeAction) {
        return '❌ Action execute nahi ho paya. Simple command try karo:\n• "add [item] ₹[price]"\n• "remove [item]"\n• "[item] ka price [amount] karo"';
      }
      // For chat/questions, forward AI's reply
      const cleanReply = raw.replace(/\{[\s\S]*\}/g, '').replace(/```[\s\S]*```/g, '').trim();
      addToHistory(phone, 'assistant', cleanReply || raw);
      return cleanReply || raw;
    }

    // Execute actions
    const actionResults = executeActions(siteSlug, parsed.actions || [], phone);
    
    // Build final reply
    let finalReply = parsed.reply || '';
    if (actionResults.length > 0 && actionResults.some(r => !r.startsWith('Unknown'))) {
      finalReply += '\n\n' + actionResults.join('\n');
      // Add site URL if something changed
      if (parsed.actions?.some(a => a.action !== 'no_action')) {
        const siteForUrl = getSiteData(siteSlug);
        const publicUrl = siteForUrl?.customDomain ? `https://${siteForUrl.customDomain}` : `${process.env.TUNNEL_URL || 'https://whatswebsite.com'}/site/${siteSlug}`;
        finalReply += `\n\n🔗 ${publicUrl}`;
      }
    }
    
    addToHistory(phone, 'assistant', finalReply);
    
    console.log(`[Agent] ${phone} → ${parsed.actions?.map(a => a.action).join(', ') || 'chat'}`);
    
    return finalReply;
  } catch (err: any) {
    console.error('[Agent] Error:', err.message);
    return 'Kuch gadbad ho gayi. Dobara try karo. 😅';
  }
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildSiteContext(data: SiteData): string {
  let ctx = `Business: ${data.businessName}
Category: ${data.category}
Phone: ${data.phone}
Address: ${data.address}
Timings: ${data.timings}
Status: ${data.isOpen ? 'Open' : 'Temporarily Closed'}
Plan: ${data.plan}
`;

  if (data.activeOffer) {
    ctx += `Active Offer: ${data.activeOffer.text}\n`;
  }

  if (data.todaySpecial) {
    ctx += `Today's Special: ${data.todaySpecial.name} — ${data.todaySpecial.price}\n`;
  }

  if (data.reviews && data.reviews.length > 0) {
    ctx += `\nReviews (${data.reviews.length}):\n`;
    data.reviews.forEach((r: any) => {
      ctx += `  - ${r.author} (${r.rating}★): "${r.text}"\n`;
    });
  }

  ctx += `Hero Image: ${(data as any).heroImage ? 'Yes' : 'None'}\n`;
  if (data.photos && data.photos.length > 0) {
    ctx += `\nPhotos (${data.photos.length}):\n`;
    data.photos.forEach((p: any, i: number) => {
      ctx += `  #${i + 1}: ${p.type || 'gallery'} — ${p.caption || 'no caption'}\n`;
    });
    ctx += `Gallery page: /site/${data.slug}/gallery\n`;
  } else {
    ctx += `\nPhotos: 0 (no images yet)\n`;
  }
  ctx += `Delivery: ${data.delivery ? 'Yes' + (data.deliveryArea ? ` (${data.deliveryArea})` : '') : 'Not set'}\n`;

  if (data.menu && data.menu.length > 0) {
    ctx += `\nMenu (${data.menu.length} items):\n`;
    const categories = [...new Set(data.menu.map(m => m.category || 'Other'))];
    for (const cat of categories) {
      ctx += `  ${cat}:\n`;
      data.menu.filter(m => (m.category || 'Other') === cat).forEach(m => {
        ctx += `    - ${m.name}: ${m.price}${m.popular ? ' ⭐Popular' : ''}\n`;
      });
    }
  }

  if (data.services && data.services.length > 0) {
    ctx += `\nServices (${data.services.length}):\n`;
    data.services.forEach(s => {
      ctx += `  - ${s.name}: ${s.price}${s.duration ? ` (${s.duration})` : ''}\n`;
    });
  }

  if (data.packages && data.packages.length > 0) {
    ctx += `\nPackages (${data.packages.length}):\n`;
    data.packages.forEach(p => {
      ctx += `  - ${p.name}: ${p.price}\n`;
    });
  }

  if (data.plans && data.plans.length > 0) {
    ctx += `\nPlans (${data.plans.length}):\n`;
    data.plans.forEach(p => {
      ctx += `  - ${p.name}: ${p.price}\n`;
    });
  }

  if (data.subjects && data.subjects.length > 0) {
    ctx += `\nSubjects (${data.subjects.length}):\n`;
    data.subjects.forEach(s => {
      ctx += `  - ${s.name}: ${s.price}${s.duration ? ` (${s.duration})` : ''}\n`;
    });
  }

  // New features context
  if ((data as any).themeColor) ctx += `Theme Color: ${(data as any).themeColor}\n`;
  if ((data as any).hiddenSections?.length) ctx += `Hidden Sections: ${(data as any).hiddenSections.join(', ')}\n`;
  if ((data as any).socialLinks && Object.keys((data as any).socialLinks).length) {
    ctx += `Social Links: ${Object.entries((data as any).socialLinks).map(([k,v]) => `${k}: ${v}`).join(', ')}\n`;
  }
  if ((data as any).upiId) ctx += `UPI: ${(data as any).upiId}\n`;
  if ((data as any).faq?.length) {
    ctx += `\nFAQ (${(data as any).faq.length}):\n`;
    (data as any).faq.forEach((f: any) => { ctx += `  Q: ${f.question}\n  A: ${f.answer}\n`; });
  }

  return ctx;
}


