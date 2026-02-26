/**
 * Smart Router — Pattern match first, AI agent only as fallback
 * 
 * 95% of requests handled FREE (regex/patterns)
 * 5% complex requests → AI agent (~₹0.3 each)
 * 
 * Cost per user: ~₹5-10/month instead of ₹300+/month
 */

import { getSiteData, saveSiteData, getAiCallCount, incrementAiCall } from './db.ts';

type SiteData = any; // Simple type for smart-router
import { renderSite } from './template-renderer.ts';
import { agentHandle } from './site-agent.ts';

const BASE_URL = process.env.TUNNEL_URL || 'http://localhost:4000';

const FREE_AI_LIMIT = 10;
const PREMIUM_AI_LIMIT = 50;

// ─── PATTERN MATCHERS ────────────────────────────────────────────────────────

interface PatternResult {
  matched: boolean;
  reply?: string;
  changed?: boolean;
}

// Add item: "add Paneer Tikka ₹220" or "Paneer Tikka add karo ₹220"
function matchAddItem(msg: string, lower: string, data: SiteData): PatternResult {
  // Pattern: "add X ₹Y" or "X add karo ₹Y" or "X - ₹Y add" or just "X - ₹Y"
  const patterns = [
    /(?:add|jodo|dalo)\s+(.+?)\s*[-–]?\s*(?:₹|rs\.?|inr)\s*(\d+[\d,]*)/i,
    /(.+?)\s+(?:add|jodo|dalo)\s*(?:karo|kar|do)?\s*[-–]?\s*(?:₹|rs\.?|inr)\s*(\d+[\d,]*)/i,
    /(.+?)\s*[-–]\s*(?:₹|rs\.?|inr)\s*(\d+[\d,]*)\s*(?:add|jodo|dalo)/i,
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const name = match[1].trim().replace(/^(ek|naya|new)\s+/i, '');
      const rawPrice = match[2].replace(/,/g, '');
      // Store as number for tutor (subjects use int), else ₹string
      const price = data.category === 'tutor' ? parseInt(rawPrice) : '₹' + rawPrice;
      
      // Add to the correct list based on category
      const cat = data.category;
      if (cat === 'restaurant' || data.menu?.length) {
        if (!data.menu) data.menu = [];
        data.menu.push({ name, price });
      } else if (cat === 'tutor' || data.subjects?.length) {
        if (!data.subjects) data.subjects = [];
        data.subjects.push({ name, price });
      } else {
        if (!data.services) data.services = [];
        data.services.push({ name, price });
      }
      saveSiteData(data);
      renderSite(data);
      return { matched: true, changed: true, reply: `✅ Added: *${name}* — ${price}\n\n🔗 ${BASE_URL}/site/${data.slug}` };
    }
  }
  
  // No-price add: "add X" / "add X in courses/menu/services" / "X add karo"
  const noPricePatterns = [
    /(.+)\s+(?:add|jodo|dalo)\s*(?:karo|kar\s*do|kar|do)?(?:\s+(?:in|me|mein|into)\s+(?:courses?|menu|services?|subjects?|packages?|plans?|list))?$/i,
    /(?:add|jodo|dalo)\s+(.+?)(?:\s+(?:in|me|mein|into)\s+(?:courses?|menu|services?|subjects?|packages?|plans?|list))$/i,
    /(?:add|jodo|dalo)\s+(.+)/i,
  ];
  
  for (const pattern of noPricePatterns) {
    const match = msg.match(pattern);
    if (match) {
      let name = match[1].trim()
        .replace(/^(ek|naya|new)\s+/i, '')
        .replace(/\s+(add|jodo|dalo|karo|kar|do|in|me|mein|into|courses?|menu|services?|subjects?|packages?|plans?|list)\s*$/i, '')
        .replace(/\s+(add|jodo|dalo|karo|kar|do)\s*/gi, ' ')
        .trim();
      if (name.length < 2 || name.length > 60) continue;
      // Skip if it looks like a different command
      if (/^(remove|hata|delete|price|change|update|edit|show|dikhao)/i.test(name)) continue;
      
      const cat = data.category;
      const items = cat === 'restaurant' || data.menu?.length ? (data.menu = data.menu || []) 
        : cat === 'tutor' || data.subjects?.length ? (data.subjects = data.subjects || [])
        : (data.services = data.services || []);
      
      // Check duplicate
      if (items.some((i: any) => i.name.toLowerCase() === name.toLowerCase())) {
        return { matched: true, changed: false, reply: `"${name}" pehle se list mein hai. Price update karna ho toh batao.` };
      }
      
      items.push({ name, price: cat === 'tutor' ? 0 : '₹0' });
      saveSiteData(data);
      renderSite(data);
      return { matched: true, changed: true, reply: `✅ Added: *${name}* (price set nahi hai — "₹XXX" bhejo to update)\n\n🔗 ${BASE_URL}/site/${data.slug}` };
    }
  }

  // Multi-line: each line "Name - ₹Price"
  const lines = msg.split('\n').filter(l => l.trim());
  if (lines.length > 1) {
    let added = 0;
    for (const line of lines) {
      const m = line.match(/^(.+?)\s*[-–]\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i);
      if (m) {
        const name = m[1].trim();
        const price = '₹' + m[2].replace(/,/g, '');
        const c = data.category;
        if (c === 'restaurant' || data.menu?.length) { if (!data.menu) data.menu = []; data.menu.push({ name, price }); }
        else if (c === 'tutor' || data.subjects?.length) { if (!data.subjects) data.subjects = []; data.subjects.push({ name, price }); }
        else { if (!data.services) data.services = []; data.services.push({ name, price }); }
        added++;
      }
    }
    if (added > 0) {
      saveSiteData(data);
      renderSite(data);
      return { matched: true, changed: true, reply: `✅ ${added} items add ho gaye!\n\n🔗 ${BASE_URL}/site/${data.slug}` };
    }
  }
  
  return { matched: false };
}

// Remove item: "remove Paneer Tikka" or "Paneer Tikka hatao"
function matchRemoveCategory(msg: string, lower: string, data: SiteData): PatternResult {
  const m = msg.match(/(?:remove|delete|hatao|hata do|nikalo)\s+(.+?)\s+(?:category|section|group)$/i)
    || msg.match(/(.+?)\s+(?:category|section|group)\s+(?:remove|delete|hatao|hata do|nikalo)(?:\s+(?:karo|kar|do))?$/i);
  if (!m) return { matched: false };
  const catName = m[1].trim().toLowerCase();
  const allLists = [data.menu, data.services, data.packages, data.plans, data.subjects].filter(Boolean);
  for (const list of allLists) {
    const before = list!.length;
    const filtered = list!.filter(item => (item.category || '').toLowerCase() !== catName);
    if (filtered.length < before) {
      list!.length = 0;
      filtered.forEach(i => list!.push(i));
      saveSiteData(data);
      renderSite(data);
      const removed = before - filtered.length;
      return { matched: true, changed: true, reply: `✅ *${m[1].trim()}* category hata di! (${removed} items removed)\n\n🔗 ${BASE_URL}/site/${data.slug}` };
    }
  }
  return { matched: true, reply: `❌ "${m[1].trim()}" category nahi mili.` };
}

function matchRemoveItem(msg: string, lower: string, data: SiteData): PatternResult {
  // Skip if message mentions photo/gallery/hero — let AI agent handle
  if (/photo|gallery|gallary|image|hero|pic/i.test(msg)) return { matched: false };
  // Skip if message mentions category — let category handler handle
  if (/category|section|group/i.test(msg)) return { matched: false };
  // Pronoun support: "ise hatao", "ye hatao", "last wala hatao", "usko delete karo"
  if (/^(ise|isko|ye|yeh|wo|woh|usko|usse|last\s*wala|pichla|abhi\s*wala)\s+(hatao|hata do|remove|delete|nikalo|nikaal do)/i.test(msg)
    || /^(hatao|hata do|remove|delete|nikalo)\s+(ise|isko|ye|yeh|wo|woh|usko|last\s*wala|pichla)/i.test(msg)) {
    const allLists = [data.menu, data.services, data.packages, data.plans, data.subjects].filter(Boolean).filter(l => l!.length > 0);
    if (allLists.length > 0) {
      // Find the longest list (most likely the active one) and remove last item
      const list = allLists.reduce((a, b) => (a!.length >= b!.length ? a : b))!;
      const removed = list.pop()!;
      saveSiteData(data);
      renderSite(data);
      return { matched: true, changed: true, reply: `✅ *${removed.name}* hata diya!\n\n🔗 ${BASE_URL}/site/${data.slug}` };
    }
    return { matched: true, reply: `❌ List empty hai, kuch hatane ko nahi hai.` };
  }

  const patterns = [
    // Suffix first: "Litti chokha delete karo", "samosa hatao", "dal ko nikaal do"
    /(.+?)\s+(?:ko\s+)?(?:hatao|hata do|remove karo|remove kar|remove|delete karo|delete kar|delete|nikalo|nikaal do|nikaal)$/i,
    // Prefix: "remove sattu paratha from our products", "delete samosa"
    /(?:remove|hatao|hata do|delete|nikalo)\s+(.+?)(?:\s+(?:from|se|mein se|out of|karo|kar|kardo|our|my|mere|apne|products?|menu|services?|items?)\b.*)?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const name = match[1].trim();
      const allLists = [data.menu, data.services, data.packages, data.plans, data.subjects].filter(Boolean);
      for (const list of allLists) {
        const idx = list!.findIndex(item => item.name.toLowerCase().includes(name.toLowerCase()));
        if (idx >= 0) {
          const removed = list!.splice(idx, 1)[0];
          saveSiteData(data);
          renderSite(data);
          return { matched: true, changed: true, reply: `✅ *${removed.name}* hata diya!\n\n🔗 ${BASE_URL}/site/${data.slug}` };
        }
      }
      return { matched: true, reply: `❌ "${name}" nahi mila. Sahi naam bhejo.` };
    }
  }
  return { matched: false };
}

// Price change: "Butter Chicken ka price 300 karo" or "Butter Chicken ₹300"
function matchPriceChange(msg: string, lower: string, data: SiteData): PatternResult {
  const patterns = [
    /(.+?)\s*(?:ka|ki|ke)\s*(?:price|rate|daam|kimat)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)\s*(?:karo|kar|kardo|rakh|rakho)?/i,
    /(.+?)\s*(?:price|rate|daam)\s*(?:change|badal|update)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i,
    /(?:price|rate)\s+(?:of\s+)?(.+?)\s*(?:to|=|:)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i,
    // "X update price to Y" / "X change price to Y" / "X set price Y"
    /(.+?)\s+(?:update|change|set)\s+(?:the\s+)?(?:price|rate)\s+(?:to\s+)?(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i,
    // "update price of X to Y"
    /(?:update|change|set)\s+(?:the\s+)?(?:price|rate)\s+(?:of\s+)?(.+?)\s+(?:to\s+)?(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const name = match[1].trim();
      const rawNum = match[2].replace(/,/g, '');
      const allItems = [...(data.menu || []), ...(data.services || []), ...(data.packages || []), ...(data.plans || []), ...(data.subjects || [])];
      const item = allItems.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
      if (item) {
        const old = item.price;
        // Match the type of existing price (number vs ₹string)
        item.price = (typeof old === 'number' || /^\d+$/.test(String(old))) ? parseInt(rawNum) : '₹' + rawNum;
        saveSiteData(data);
        renderSite(data);
        return { matched: true, changed: true, reply: `✅ *${item.name}*: ${old} → ${item.price}\n\n🔗 ${BASE_URL}/site/${data.slug}` };
      }
      return { matched: true, reply: `❌ "${name}" nahi mila.` };
    }
  }
  return { matched: false };
}

// Bulk price: "sab prices 10% badha do" or "all prices 20% kam karo"
function matchBulkPrice(msg: string, lower: string, data: SiteData): PatternResult {
  const match = lower.match(/(?:sab|sabhi|all|saare|poore)\s*(?:prices?|rates?|daam)\s*(\d+)\s*%\s*(badha|badha do|increase|upar|kam|kam karo|decrease|neeche|ghatao)/i);
  if (match) {
    let percent = parseInt(match[1]);
    if (match[2].match(/kam|decrease|neeche|ghatao/)) percent = -percent;
    
    const allItems = [...(data.menu || []), ...(data.services || []), ...(data.packages || []), ...(data.plans || []), ...(data.subjects || [])];
    let changed = 0;
    for (const item of allItems) {
      const num = parseInt(item.price.replace(/[₹,\s]/g, '').replace(/from\s*/i, ''));
      if (!isNaN(num)) {
        item.price = `₹${Math.round(num * (1 + percent / 100))}`;
        changed++;
      }
    }
    saveSiteData(data);
    renderSite(data);
    return { matched: true, changed: true, reply: `✅ ${changed} items ka price ${percent > 0 ? '+' : ''}${percent}% ho gaya!\n\n🔗 ${BASE_URL}/site/${data.slug}` };
  }
  return { matched: false };
}

// Phone: "change mobile number to X" / "phone update X" / "number badlo X"
function matchPhone(msg: string, lower: string, data: SiteData): PatternResult {
  const m = msg.match(/(?:change|update|badlo|set)\s+(?:mobile|phone|contact|whatsapp)?\s*(?:number|no\.?)?\s*(?:to\s+)?(\+?\d[\d\s\-]{8,14})/i)
    || msg.match(/(?:mobile|phone|contact|whatsapp)\s*(?:number|no\.?)?\s*(?:change|update|badlo|set)\s*(?:to\s+|karo\s+)?(\+?\d[\d\s\-]{8,14})/i)
    || msg.match(/(?:number|no\.?)\s*(\+?\d{10,13})\s*(?:karo|kar|do|set)?$/i);
  if (!m) return { matched: false };
  const raw = m[1].replace(/[\s+\-()]/g, '');
  const clean = raw.replace(/^91(\d{10})$/, '$1');
  if (clean.length < 10) return { matched: true, reply: '❌ Phone number chhota hai. 10-digit number bhejo.' };
  data.phone = clean;
  data.whatsapp = clean.length === 10 ? `91${clean}` : raw;
  saveSiteData(data);
  renderSite(data);
  return { matched: true, changed: true, reply: `✅ Phone updated: ${clean}\n\n🔗 ${BASE_URL}/site/${data.slug}` };
}

// Timings: "timing 9 se 9 karo" or "timings update 10 AM - 10 PM"
function matchTimings(msg: string, lower: string, data: SiteData): PatternResult {
  const patterns = [
    /(?:timing|timings|time|samay)\s*(?:change|update|badal|karo|kar)?\s*[:=]?\s*(.+)/i,
    /(.+?)\s*(?:timing|timings|time)\s*(?:rakh|rakho|karo|set)/i,
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const timings = match[1].trim();
      if (timings.length > 3 && timings.length < 50) {
        data.timings = timings;
        saveSiteData(data);
        renderSite(data);
        return { matched: true, changed: true, reply: `✅ Timings: *${timings}*\n\n🔗 ${BASE_URL}/site/${data.slug}` };
      }
    }
  }
  return { matched: false };
}

// Offer: "offer lagao 20% off" or "special: buy 1 get 1"
function matchOffer(msg: string, lower: string, data: SiteData): PatternResult {
  const patterns = [
    /(?:offer|special|discount|deal)\s*(?:lagao|laga do|set|dalo|rakh)\s*[:=]?\s*(.+)/i,
    /(?:lagao|laga do)\s*(?:offer|special|discount)\s*[:=]?\s*(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const text = match[1].trim();
      data.activeOffer = { text };
      saveSiteData(data);
      renderSite(data);
      return { matched: true, changed: true, reply: `🎉 Offer live: *${text}*\n\n🔗 ${BASE_URL}/site/${data.slug}\n\n"offer hatao" to remove.` };
    }
  }
  return { matched: false };
}

// Clear offer
function matchClearOffer(msg: string, lower: string, data: SiteData): PatternResult {
  if (lower.match(/offer\s*(hatao|hata do|remove|clear|band|nikalo)/)) {
    data.activeOffer = undefined;
    saveSiteData(data);
    renderSite(data);
    return { matched: true, changed: true, reply: `✅ Offer hata diya!\n\n🔗 ${BASE_URL}/site/${data.slug}` };
  }
  return { matched: false };
}

// Close/Open: "band karo" or "khol do" or "chhuti hai"
function matchOpenClose(msg: string, lower: string, data: SiteData): PatternResult {
  if (lower.match(/(band|close|chhuti|holiday|off day|shut)/)) {
    data.isOpen = false;
    saveSiteData(data);
    renderSite(data);
    return { matched: true, changed: true, reply: `🔒 Website pe "Temporarily Closed" laga diya.\n"khol do" bhejo wapas kholne ke liye.` };
  }
  if (lower.match(/(khol|open|chalu|start|reopen)/)) {
    data.isOpen = true;
    saveSiteData(data);
    renderSite(data);
    return { matched: true, changed: true, reply: `✅ Website wapas OPEN! 🎉\n\n🔗 ${BASE_URL}/site/${data.slug}` };
  }
  return { matched: false };
}

// ─── MAIN ROUTER ─────────────────────────────────────────────────────────────

export async function smartRoute(phone: string, message: string, siteSlug: string): Promise<string> {
  const data = getSiteData(siteSlug);
  if (!data) return 'Site not found. "reset" karke naya banao.';
  
  const lower = message.toLowerCase().trim();
  
  // Try all pattern matchers (FREE, no AI cost)
  const matchers = [
    matchAddItem,
    matchRemoveCategory,
    matchRemoveItem,
    matchPriceChange,
    matchBulkPrice,
    matchPhone,
    matchTimings,
    matchOffer,
    matchClearOffer,
    matchOpenClose,
  ];
  
  for (const matcher of matchers) {
    const result = matcher(message, lower, data);
    if (result.matched) {
      console.log(`[Router] Pattern matched for ${phone} (FREE)`);
      return result.reply || '✅ Done!';
    }
  }
  
  // No pattern matched → use AI agent (PAID)
  const callCount = getAiCallCount(phone);
  const limit = data.plan === 'premium' ? PREMIUM_AI_LIMIT : FREE_AI_LIMIT;
  
  if (callCount >= limit) {
    return `⚠️ Aaj ke liye AI limit ho gayi (${limit}/day).\n\nSimple commands try karo:\n• "add [item] ₹[price]"\n• "remove [item]"\n• "[item] ka price [price] karo"\n• "offer lagao [text]"\n• "band karo" / "khol do"\n\n⭐ Premium mein ${PREMIUM_AI_LIMIT} AI edits/day milte hain!`;
  }
  
  incrementAiCall(phone);
  console.log(`[Router] AI agent call for ${phone} (${callCount + 1}/${limit})`);
  
  return agentHandle(phone, message, siteSlug);
}
