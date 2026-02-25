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

import { getSiteData, saveSiteData, getOrCreateUser, listUserSites, addChatMessage, getChatHistory } from './db.ts';

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

function executeActions(slug: string, actions: AgentAction[]): string[] {
  const results: string[] = [];
  let siteData = getSiteData(slug);
  if (!siteData) return ['Site data not found'];

  for (const { action, params } of actions) {
    try {
      switch (action) {
        case 'add_menu_item': {
          if (!siteData.menu) siteData.menu = [];
          siteData.menu.push({
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
          if (!siteData.menu) break;
          const idx = siteData.menu.findIndex(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = siteData.menu.splice(idx, 1)[0];
            results.push(`✅ Removed: ${removed.name}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila menu mein`);
          }
          break;
        }
        case 'reorder_category': {
          if (!siteData.menu) break;
          const targetCat = params.category.toLowerCase();
          const pos = parseInt(params.position) || 1;
          // Get unique categories in current order
          const catOrder: string[] = [];
          siteData.menu.forEach(m => { const c = m.category || 'Menu'; if (!catOrder.includes(c)) catOrder.push(c); });
          const catIdx = catOrder.findIndex(c => c.toLowerCase() === targetCat);
          if (catIdx < 0) { results.push(`❌ "${params.category}" category nahi mili`); break; }
          const [moved] = catOrder.splice(catIdx, 1);
          catOrder.splice(Math.max(0, pos - 1), 0, moved);
          // Reorder menu items by new category order
          const reordered: any[] = [];
          catOrder.forEach(c => { siteData.menu!.filter(m => (m.category || 'Menu') === c).forEach(m => reordered.push(m)); });
          siteData.menu = reordered;
          results.push(`✅ "${moved}" ab #${pos} pe hai`);
          break;
        }
        case 'remove_category': {
          if (!siteData.menu) break;
          const cat = params.category.toLowerCase();
          const before = siteData.menu.length;
          siteData.menu = siteData.menu.filter(m => (m.category || '').toLowerCase() !== cat);
          const removed = before - siteData.menu.length;
          if (removed > 0) {
            results.push(`✅ "${params.category}" category hata di (${removed} items removed)`);
          } else {
            results.push(`❌ "${params.category}" category nahi mili`);
          }
          break;
        }
        case 'update_price': {
          const allItems = [...(siteData.menu || []), ...(siteData.services || []), ...(siteData.packages || []), ...(siteData.plans || [])];
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
          const items = [...(siteData.menu || []), ...(siteData.services || [])];
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
          if (!siteData.services) siteData.services = [];
          siteData.services.push({
            name: params.name,
            price: params.price,
            duration: params.duration || '',
            description: params.description || '',
          });
          results.push(`✅ Service added: ${params.name} — ${params.price}`);
          break;
        }
        case 'remove_service': {
          if (!siteData.services) break;
          const idx = siteData.services.findIndex(s => s.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = siteData.services.splice(idx, 1)[0];
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
          siteData.phone = params.phone;
          siteData.whatsapp = `91${params.phone}`;
          results.push(`✅ Phone: ${params.phone}`);
          break;
        }
        case 'mark_popular': {
          if (siteData.menu) {
            const item = siteData.menu.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
            if (item) {
              item.popular = true;
              results.push(`⭐ ${item.name} marked as popular`);
            }
          }
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
          if (!siteData.menu) break;
          const oldCat = params.old_name?.toLowerCase();
          let renamed = 0;
          siteData.menu.forEach(m => {
            if ((m.category || '').toLowerCase() === oldCat) { m.category = params.new_name; renamed++; }
          });
          results.push(renamed > 0 ? `✅ "${params.old_name}" → "${params.new_name}" (${renamed} items)` : `❌ "${params.old_name}" nahi mili`);
          break;
        }
        case 'update_item_description': {
          const allItems = [...(siteData.menu || []), ...(siteData.services || [])];
          const item = allItems.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (item) { item.description = params.description; results.push(`✅ ${item.name} description updated`); }
          else results.push(`❌ "${params.name}" nahi mila`);
          break;
        }
        case 'unmark_popular': {
          if (siteData.menu) {
            const item = siteData.menu.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
            if (item) { item.popular = false; results.push(`✅ ${item.name} popular tag hataya`); }
            else results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'set_veg': {
          if (siteData.menu) {
            const item = siteData.menu.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
            if (item) { item.veg = true; results.push(`✅ ${item.name} → 🟢 Veg`); }
            else results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'set_nonveg': {
          if (siteData.menu) {
            const item = siteData.menu.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
            if (item) { item.veg = false; results.push(`✅ ${item.name} → 🔴 Non-Veg`); }
            else results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'remove_hero': {
          (siteData as any).heroImage = undefined;
          results.push(`✅ Hero photo hata di`);
          break;
        }
        case 'request_photo': {
          results.push(`📸 Photo bhejo WhatsApp pe — automatically add ho jayegi!`);
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

  if (!OPENAI_KEY) {
    // Fallback: return a helpful message without AI
    addToHistory(phone, 'assistant', 'AI agent available nahi hai abhi. "edit" command use karo menu-based editing ke liye.');
    return 'AI agent available nahi hai abhi. "edit" command use karo menu-based editing ke liye.';
  }

  try {
    const systemPrompt = `You are a friendly WhatsApp business website manager for an Indian small business. You speak Hinglish (Hindi + English mix). You are helpful, efficient, and casual.

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
- request_photo: {} — ask user to send photo on WhatsApp

BUSINESS INFO:
- update_business_name: {name}
- update_tagline: {text}
- update_about: {text}
- update_address: {address}
- update_phone: {phone}
- update_timings: {timings}
- update_owner_name: {name}
- update_experience: {text}
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

OTHER:
- no_action: {} (just chatting, no website change)

## Response Format:
Always return valid JSON:
{
  "reply": "Your Hinglish message to the user",
  "actions": [{"action": "action_name", "params": {...}}]
}

## Rules:
- If user asks about something unrelated to their website, just chat friendly (use no_action)
- If user gives vague input, ask clarifying questions (use no_action)
- For price changes, always confirm the new price in your reply
- Be proactive — suggest improvements ("Aapke menu mein dessert nahi hai, add karna chahoge?")
- Keep replies short and WhatsApp-friendly (no long paragraphs)
- If user sends multiple items, handle them all in one go
- Prices should always be in ₹ format`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...getHistory(phone).slice(-8), // Last 8 messages for context
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error('[Agent] API error:', res.status);
      return 'AI agent se baat nahi ho pa rahi. Thodi der baad try karo. 😅';
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    
    // Parse response
    let parsed: { reply: string; actions: AgentAction[] };
    try {
      const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, treat the whole response as a reply
      addToHistory(phone, 'assistant', raw);
      return raw;
    }

    // Execute actions
    const actionResults = executeActions(siteSlug, parsed.actions || []);
    
    // Build final reply
    let finalReply = parsed.reply || '';
    if (actionResults.length > 0 && actionResults.some(r => !r.startsWith('Unknown'))) {
      finalReply += '\n\n' + actionResults.join('\n');
      // Add site URL if something changed
      if (parsed.actions?.some(a => a.action !== 'no_action')) {
        finalReply += `\n\n🔗 ${process.env.TUNNEL_URL || 'http://localhost:4000'}/site/${siteSlug}`;
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

  return ctx;
}


