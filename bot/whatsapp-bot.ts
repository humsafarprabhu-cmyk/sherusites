/**
 * SheruSites WhatsApp Bot — Build websites for small businesses via chat
 * Now backed by SQLite for persistent sessions
 */

import { generateSlug } from './site-generator.ts';
import {
  getOrCreateUser, saveUser, getUser,
  getSiteData, saveSiteData, createSiteData, generateUniqueSlug,
  getSession, saveSession, deleteSession,
  SiteData,
} from './db.ts';
import { generateContent } from './ai-content.ts';
import { renderSite } from './template-renderer.ts';
import { smartRoute } from './smart-router.ts';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface BotResponse {
  replies: string[];
  media?: { url: string; type: string; filename?: string }[];
}

// ─── STATE ───────────────────────────────────────────────────────────────────

let BASE_URL = process.env.TUNNEL_URL || 'http://localhost:4000';

export function setBaseUrl(url: string) {
  BASE_URL = url;
  console.log('[SheruSites] Base URL:', url);
}

export function getBaseUrl(): string { return BASE_URL; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function detectCategory(input: string): string {
  const lower = input.toLowerCase();
  const keywords: Record<string, string[]> = {
    restaurant: ['restaurant', 'dhaba', 'cafe', 'hotel', 'khana', 'food', 'biryani', 'thali', 'bakery', 'sweet', 'mithai'],
    store: ['store', 'shop', 'dukan', 'kirana', 'grocery', 'general', 'supermarket', 'medical', 'chemist', 'pharmacy'],
    salon: ['salon', 'parlour', 'parlor', 'beauty', 'barber', 'nai', 'hair', 'spa', 'makeup', 'bridal'],
    tutor: ['tutor', 'coaching', 'teacher', 'classes', 'tuition', 'padhai', 'academy', 'institute'],
    clinic: ['doctor', 'clinic', 'hospital', 'dentist', 'dr', 'physician', 'pathology', 'lab'],
    gym: ['gym', 'fitness', 'yoga', 'workout', 'crossfit', 'zumba'],
    photographer: ['photographer', 'photography', 'studio', 'photo', 'video', 'wedding shoot'],
    service: ['electrician', 'plumber', 'repair', 'service', 'ac', 'carpenter', 'painter', 'pest', 'cleaning'],
  };
  let best = 'restaurant', bestScore = 0;
  for (const [cat, kws] of Object.entries(keywords)) {
    let score = 0;
    for (const kw of kws) if (lower.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

const CATEGORY_DISPLAY: Record<string, string> = {
  restaurant: '🍽️ Restaurant / Dhaba / Cafe',
  store: '🏪 Kirana / General Store',
  salon: '💇 Salon / Parlour',
  tutor: '📚 Tutor / Coaching',
  clinic: '🏥 Doctor / Clinic',
  gym: '💪 Gym / Fitness',
  photographer: '📸 Photographer / Studio',
  service: '🔧 Electrician / Plumber / Service',
};

const CATEGORY_NUMBERS: Record<string, string> = {
  '1': 'restaurant', '2': 'store', '3': 'salon', '4': 'tutor',
  '5': 'clinic', '6': 'gym', '7': 'photographer', '8': 'service',
};

// ─── SESSION HELPERS ─────────────────────────────────────────────────────────

function loadSession(phone: string): { state: string; data: any; siteUrl?: string; slug?: string; paid: boolean; editMode?: string } {
  const row = getSession(phone);
  if (row) {
    return {
      state: row.state,
      data: row.data,
      siteUrl: row.site_url || undefined,
      slug: row.slug || undefined,
      paid: row.paid,
      editMode: row.edit_mode || undefined,
    };
  }

  // Check if user has existing sites — restore
  const user = getOrCreateUser(phone);
  if (user.sites.length > 0) {
    const activeSite = user.active_site || user.sites[user.sites.length - 1];
    const siteData = getSiteData(activeSite);
    if (siteData) {
      const s = {
        state: 'complete',
        data: {
          slug: activeSite,
          businessName: siteData.businessName,
          category: siteData.category,
          phone: siteData.phone,
          whatsapp: siteData.whatsapp,
          address: siteData.address,
          timings: siteData.timings,
        },
        siteUrl: `${BASE_URL}/site/${activeSite}`,
        slug: activeSite,
        paid: siteData.plan === 'premium',
      };
      persistSession(phone, s);
      return s;
    }
  }

  return { state: 'idle', data: {}, paid: false };
}

function persistSession(phone: string, s: { state: string; data: any; siteUrl?: string; slug?: string; paid: boolean; editMode?: string }) {
  saveSession(phone, {
    state: s.state,
    data: s.data,
    site_url: s.siteUrl,
    slug: s.slug,
    paid: s.paid,
    edit_mode: s.editMode,
  });
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

export async function handleMessage(phone: string, message: string): Promise<BotResponse> {
  const msg = message.trim();
  const lower = msg.toLowerCase();
  const session = loadSession(phone);

  // Global commands
  if (lower === 'reset' || lower === 'restart' || lower === 'naya' || lower === 'new') {
    deleteSession(phone);
    return { replies: ['🔄 Fresh start! Send "Hi" to begin.'] };
  }

  if (lower === 'help' || lower === 'madad') {
    return { replies: [
      `🦁 *SheruSites — Help*\n\n` +
      `Commands:\n• *hi/hello* — Start new website\n• *reset/naya* — Start over\n• *status* — Check your website\n• *edit* — Modify your website\n• *help/madad* — This message\n\nQuestions? WhatsApp us anytime! 🙏`
    ]};
  }

  if (lower === 'status') {
    if (session.siteUrl) {
      return { replies: [
        `🌐 *Your Website*\n\n📍 ${session.data.businessName}\n🔗 ${session.siteUrl}\n${session.paid ? '✅ Premium (Custom Domain)' : '🆓 Free Plan (SheruSites branding)'}\n\n${!session.paid ? '⭐ Upgrade to ₹999/year for custom domain!\nType "upgrade" to get premium' : ''}`
      ]};
    }
    return { replies: ['No website yet! Send "Hi" to create one. 😊'] };
  }

  // State machine
  switch (session.state) {
    case 'idle': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site)$/)) {
        session.state = 'awaiting_category';
        persistSession(phone, session);
        return { replies: [
          `🙏 *Namaste! SheruSites mein swagat hai!*\n\nSirf 2 minute mein aapka professional website ready! 🚀\n\nAapka business type batao:\n\n1️⃣ 🍽️ Restaurant / Dhaba / Cafe\n2️⃣ 🏪 Kirana / General Store\n3️⃣ 💇 Salon / Parlour\n4️⃣ 📚 Tutor / Coaching\n5️⃣ 🏥 Doctor / Clinic\n6️⃣ 💪 Gym / Fitness\n7️⃣ 📸 Photographer / Studio\n8️⃣ 🔧 Electrician / Plumber\n\nNumber bhejo ya apne business ke baare mein batao! 👇`
        ]};
      }
      session.state = 'awaiting_name';
      session.data.category = detectCategory(lower);
      persistSession(phone, session);
      return { replies: [
        `👋 Welcome to SheruSites!\n\nI detected: *${CATEGORY_DISPLAY[session.data.category]}*\n(Galat hai? "reset" bhejo aur dobara try karo)\n\nAapke business ka *naam* batao? 👇`
      ]};
    }

    case 'awaiting_category': {
      session.data.category = CATEGORY_NUMBERS[msg] || detectCategory(lower);
      session.state = 'awaiting_name';
      persistSession(phone, session);
      return { replies: [
        `✅ *${CATEGORY_DISPLAY[session.data.category]}*\n\nAb aapke business ka *naam* batao? 👇\n(Jaise: "Sharma Ji Ka Dhaba", "Gupta General Store")`
      ]};
    }

    case 'awaiting_name': {
      session.data.businessName = msg;
      session.data.slug = generateSlug(msg);
      session.state = 'awaiting_phone';
      persistSession(phone, session);
      return { replies: [
        `🏪 *${msg}* — bahut accha naam!\n\nAb apna *phone number* bhejo? 📱\n(Ye website pe dikhega — customers call kar payenge)`
      ]};
    }

    case 'awaiting_phone': {
      const cleaned = msg.replace(/[\s\-\+]/g, '').replace(/^91/, '').replace(/^0/, '');
      if (cleaned.length < 10 || !/^\d+$/.test(cleaned)) {
        return { replies: ['❌ Ye valid phone number nahi lag raha. 10 digit number bhejo (jaise: 9876543210)'] };
      }
      session.data.phone = cleaned;
      session.data.whatsapp = `91${cleaned}`;
      session.state = 'awaiting_address';
      persistSession(phone, session);
      return { replies: [
        `📱 Phone: *${cleaned}* ✅\n\nAb apna *address* bhejo? 📍\n(Jaise: "MG Road, near SBI Bank, Indore")`
      ]};
    }

    case 'awaiting_address': {
      session.data.address = msg;
      session.state = 'awaiting_timings';
      persistSession(phone, session);
      return { replies: [
        `📍 Address saved! ✅\n\n*Business timings* batao? ⏰\n(Jaise: "10 AM - 10 PM" ya "skip" to use default)`
      ]};
    }

    case 'awaiting_timings': {
      if (lower !== 'skip') session.data.timings = msg;
      session.state = 'generating';
      persistSession(phone, session);

      try {
        const baseSlug = session.data.slug!;
        const slug = generateUniqueSlug(baseSlug);
        session.data.slug = slug;
        const category = session.data.category!;

        const aiContent = await generateContent(category, session.data.businessName!, session.data.address!);

        const siteData = createSiteData({
          slug,
          businessName: session.data.businessName!,
          category,
          phone: session.data.phone!,
          whatsapp: session.data.whatsapp || `91${session.data.phone}`,
          address: session.data.address!,
          timings: session.data.timings,
          tagline: aiContent.tagline,
          about: aiContent.about,
        }, phone);

        if (aiContent.menu) siteData.menu = aiContent.menu;
        if (aiContent.services) siteData.services = aiContent.services;
        if (aiContent.packages) siteData.packages = aiContent.packages;
        if (aiContent.plans) siteData.plans = aiContent.plans;
        if (aiContent.subjects) siteData.subjects = aiContent.subjects;
        saveSiteData(siteData, phone);

        renderSite(siteData);

        const user = getOrCreateUser(phone);
        const sites = user.sites || [];
        if (!sites.includes(slug)) sites.push(slug);
        saveUser(phone, { ...user, sites, active_site: slug });

        session.slug = slug;
        session.siteUrl = `${BASE_URL}/site/${slug}`;
        session.state = 'complete';
        session.paid = false;
        persistSession(phone, session);

        const cleanName = session.data.businessName!.toLowerCase().replace(/\s+/g, '-');
        return { replies: [
          `🎉 *Aapka website READY hai!*\n\n🏪 *${session.data.businessName}*\n🔗 ${session.siteUrl}\n\n✅ WhatsApp button\n✅ Call button\n✅ Google Maps\n✅ Mobile responsive\n✅ Professional design\n\n━━━━━━━━━━━━━━━━━━\n🆓 *FREE Plan:* ${cleanName}.sherusites.in\n   (with SheruSites branding)\n\n⭐ *PREMIUM ₹999/year:*\n   ✨ Custom domain (${session.data.businessName!.toLowerCase().replace(/\s+/g, '')}.in)\n   ✨ No branding\n   ✨ Priority support\n   ✨ Google Business setup\n━━━━━━━━━━━━━━━━━━\n\n"upgrade" type karo premium lene ke liye! 🚀\n"edit" type karo changes ke liye ✏️`
        ]};
      } catch (err: any) {
        session.state = 'awaiting_timings';
        persistSession(phone, session);
        console.error('[SheruSites] Generation error:', err.message);
        return { replies: [`❌ Oops! Website generate karne mein error aaya. Dobara try karo.\nError: ${err.message}`] };
      }
    }

    case 'complete': {
      if (lower === 'upgrade' || lower === 'premium' || lower === '999' || lower === 'pay') {
        return { replies: [
          `⭐ *Premium Upgrade — ₹999/year*\n\nAapko milega:\n✨ Custom .in domain\n✨ No SheruSites branding\n✨ Priority support\n✨ Google Business listing\n\n💳 *Pay securely:*\n🔗 ${BASE_URL}/pay/${session.slug}\n\nPayment ke baad 30 minute mein custom domain live! 🚀`
        ]};
      }

      if (lower === 'edit' || lower === 'change' || lower === 'badlo') {
        session.state = 'editing';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [
          `✏️ *Kya change karna hai?*\n\n1️⃣ Menu/Service add karo\n2️⃣ Menu/Service hatao\n3️⃣ Price change karo\n4️⃣ Timing change karo\n5️⃣ Offer lagao\n6️⃣ Offer hatao\n7️⃣ Band karo (temporarily closed)\n8️⃣ Khol do (reopen)\n9️⃣ Kuch aur batao\n\nNumber bhejo ya seedha batao kya change karna hai 👇`
        ]};
      }

      if (lower === 'share') {
        return { replies: [
          `📤 *Share your website:*\n\n🔗 ${session.siteUrl}\n\n📋 Copy karke share karo:\n"${session.data.businessName} ka website dekho: ${session.siteUrl}"\n\n🖨️ QR Code print karke dukan mein lagao — customers scan karenge!`
        ]};
      }

      // Agent mode for natural language
      if (session.slug) {
        try {
          const reply = await smartRoute(phone, msg, session.slug);
          return { replies: [reply] };
        } catch (err: any) {
          console.error('[Router] Error:', err.message);
        }
      }

      return { replies: [
        `🌐 *${session.data.businessName}*\n🔗 ${session.siteUrl}\n\nSeedha batao kya karna hai! Jaise:\n• "Paneer Tikka add karo ₹220"\n• "Sab prices 10% badha do"\n• "Kal chhuti hai"\n• "Weekend offer lagao 20% off"\n\nYa type karo: *edit* | *upgrade* | *share* | *new*`
      ]};
    }

    case 'editing': {
      const slug = session.slug;
      if (!slug) {
        session.state = 'complete';
        persistSession(phone, session);
        return { replies: ['Pehle website banao! "Hi" bhejo start karne ke liye.'] };
      }
      const siteData = getSiteData(slug);
      if (!siteData) {
        session.state = 'complete';
        persistSession(phone, session);
        return { replies: ['Website data nahi mila. "reset" karke dobara banao.'] };
      }

      // Number-based menu options
      if (msg === '1' || (lower.includes('add') && !session.editMode)) {
        session.editMode = 'add_item';
        persistSession(phone, session);
        return { replies: [`➕ *Naya item add karo*\n\nFormat: *Naam - ₹Price*\nJaise: "Paneer Tikka - ₹220"\n\nMultiple items ek saath bhi bhej sakte ho (ek line mein ek) 👇`] };
      }

      if (msg === '2' || (lower.includes('hatao') && !session.editMode) || (lower.includes('remove') && !session.editMode)) {
        const items = siteData.menu || siteData.services || siteData.packages || [];
        if (items.length === 0) {
          session.state = 'complete';
          persistSession(phone, session);
          return { replies: ['Koi items nahi hain abhi. Pehle add karo!'] };
        }
        session.editMode = 'remove_item';
        persistSession(phone, session);
        const list = items.map((item: any, i: number) => `${i + 1}. ${item.name} — ${item.price}`).join('\n');
        return { replies: [`🗑️ *Kaunsa item hatana hai?*\n\n${list}\n\nNumber bhejo ya naam likho 👇`] };
      }

      if (msg === '3' || (lower.includes('price') && !session.editMode)) {
        session.editMode = 'change_price';
        persistSession(phone, session);
        return { replies: [`💰 *Price change karo*\n\nFormat: *Item Name - ₹New Price*\nJaise: "Butter Chicken - ₹300" 👇`] };
      }

      if (msg === '4' || (lower.includes('timing') && !session.editMode)) {
        session.editMode = 'change_timing';
        persistSession(phone, session);
        return { replies: ['⏰ Naye timings batao (jaise: "9 AM - 9 PM") 👇'] };
      }

      if (msg === '5' || (lower.includes('offer') && !lower.includes('hatao') && !session.editMode)) {
        session.editMode = 'add_offer';
        persistSession(phone, session);
        return { replies: [`🎉 *Offer lagao*\n\nOffer ka text batao:\nJaise: "Flat 20% off on all items this weekend!" 👇`] };
      }

      if (msg === '6' || lower.includes('offer hatao')) {
        siteData.activeOffer = undefined;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: ['✅ Offer hata diya! Website updated.\n🔗 ' + session.siteUrl] };
      }

      if (msg === '7' || lower.includes('band') || lower.includes('close')) {
        siteData.isOpen = false;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: ['🔒 Website pe "Temporarily Closed" laga diya.\n"khol do" ya "8" bhejo wapas kholne ke liye.'] };
      }

      if (msg === '8' || lower.includes('khol') || lower.includes('open')) {
        siteData.isOpen = true;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: ['✅ Website wapas OPEN! 🎉\n🔗 ' + session.siteUrl] };
      }

      // Handle edit sub-modes
      if (session.editMode === 'add_item') {
        const lines = msg.split('\n').filter(l => l.trim());
        let added = 0;
        for (const line of lines) {
          const match = line.match(/^(.+?)\s*[-–]\s*₹?\s*(\d+[\d,]*)/);
          if (match) {
            const itemName = match[1].trim();
            const price = '₹' + match[2].replace(/,/g, '');
            if (siteData.menu) siteData.menu.push({ name: itemName, price });
            else if (siteData.services) siteData.services.push({ name: itemName, price });
            else if (siteData.packages) siteData.packages.push({ name: itemName, price });
            added++;
          }
        }
        if (added > 0) {
          saveSiteData(siteData);
          renderSite(siteData);
          session.state = 'complete';
          session.editMode = undefined;
          persistSession(phone, session);
          return { replies: [`✅ ${added} item${added > 1 ? 's' : ''} add ho gaye! Website updated.\n🔗 ${session.siteUrl}\n\n"edit" for more changes.`] };
        }
        return { replies: ['❌ Format samajh nahi aaya. Try: "Paneer Tikka - ₹220"'] };
      }

      if (session.editMode === 'remove_item') {
        const items = siteData.menu || siteData.services || siteData.packages || [];
        const idx = parseInt(msg) - 1;
        let removed = false;
        if (idx >= 0 && idx < items.length) { items.splice(idx, 1); removed = true; }
        else {
          const found = items.findIndex((i: any) => i.name.toLowerCase().includes(lower));
          if (found >= 0) { items.splice(found, 1); removed = true; }
        }
        if (removed) {
          saveSiteData(siteData);
          renderSite(siteData);
          session.state = 'complete';
          session.editMode = undefined;
          persistSession(phone, session);
          return { replies: [`✅ Item hata diya! Website updated.\n🔗 ${session.siteUrl}`] };
        }
        return { replies: ['❌ Item nahi mila. Number ya naam dobara bhejo.'] };
      }

      if (session.editMode === 'change_price') {
        const match = msg.match(/^(.+?)\s*[-–]\s*₹?\s*(\d+[\d,]*)/);
        if (match) {
          const itemName = match[1].trim();
          const newPrice = '₹' + match[2].replace(/,/g, '');
          const allItems = [...(siteData.menu || []), ...(siteData.services || []), ...(siteData.packages || [])];
          const item = allItems.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
          if (item) {
            item.price = newPrice;
            saveSiteData(siteData);
            renderSite(siteData);
            session.state = 'complete';
            session.editMode = undefined;
            persistSession(phone, session);
            return { replies: [`✅ ${item.name} ka price ${newPrice} ho gaya! Website updated.\n🔗 ${session.siteUrl}`] };
          }
          return { replies: [`❌ "${itemName}" nahi mila. Sahi naam bhejo.`] };
        }
        return { replies: ['❌ Format: "Item Name - ₹New Price"'] };
      }

      if (session.editMode === 'change_timing') {
        siteData.timings = msg;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [`✅ Timings updated: ${msg}\n🔗 ${session.siteUrl}`] };
      }

      if (session.editMode === 'add_offer') {
        siteData.activeOffer = { text: msg };
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [`🎉 Offer live! "${msg}"\n🔗 ${session.siteUrl}\n\n"offer hatao" to remove later.`] };
      }

      // Fallback
      session.state = 'complete';
      session.editMode = undefined;
      persistSession(phone, session);
      return { replies: [`Got it! "edit" bhejo aur option choose karo.\n\n🔗 ${session.siteUrl}`] };
    }

    default: {
      session.state = 'idle';
      persistSession(phone, session);
      return { replies: ['Kuch samajh nahi aaya 😅 "Hi" bhejo start karne ke liye!'] };
    }
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

export function getSessionInfo(phone: string) { return getSession(phone); }
export function getAllSessions() {
  // For backward compat — return a Map-like interface
  // In production, query DB directly
  return new Map();
}
