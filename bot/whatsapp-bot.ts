/**
 * SheruSites WhatsApp Bot v2.1
 * - Interactive buttons & lists
 * - "Hi" → edit or create new
 * - Auto-detect phone from sender
 * - List all user websites
 */

import { generateSlug } from './site-generator.ts';
import {
  getOrCreateUser, saveUser, getUser,
  getSiteData, saveSiteData, createSiteData, generateUniqueSlug,
  getSession, saveSession, deleteSession, listUserSites,
} from './db.ts';
import { generateContent, generateImages, downloadAndSaveImage } from './ai-content.ts';
import { renderSite } from './template-renderer.ts';
import { smartRoute } from './smart-router.ts';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ButtonMsg {
  type: 'buttons';
  body: string;
  buttons: { id: string; title: string }[];
}

interface ListMsg {
  type: 'list';
  body: string;
  buttonText: string;
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[];
}

type Reply = string | ButtonMsg | ListMsg;

interface BotResponse {
  replies: Reply[];
}

// ─── STATE ───────────────────────────────────────────────────────────────────

let BASE_URL = process.env.TUNNEL_URL || 'http://localhost:4000';

export function setBaseUrl(url: string) {
  BASE_URL = url;
  console.log('[SheruSites] Base URL:', url);
}
export function getBaseUrl(): string { return BASE_URL; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  restaurant: '🍽️ Restaurant / Dhaba',
  store: '🏪 Kirana Store',
  salon: '💇 Salon / Parlour',
  tutor: '📚 Tutor / Coaching',
  clinic: '🏥 Doctor / Clinic',
  gym: '💪 Gym / Fitness',
  photographer: '📸 Photographer',
  service: '🔧 Service Provider',
};

const CATEGORY_NUMBERS: Record<string, string> = {
  '1': 'restaurant', '2': 'store', '3': 'salon', '4': 'tutor',
  '5': 'clinic', '6': 'gym', '7': 'photographer', '8': 'service',
};

function detectCategory(input: string): string | null {
  const lower = input.toLowerCase();
  const keywords: Record<string, string[]> = {
    restaurant: ['restaurant', 'dhaba', 'cafe', 'hotel', 'khana', 'food', 'biryani', 'thali', 'bakery', 'sweet', 'mithai'],
    store: ['store', 'shop', 'dukan', 'kirana', 'grocery', 'general', 'supermarket', 'medical', 'chemist'],
    salon: ['salon', 'parlour', 'parlor', 'beauty', 'barber', 'nai', 'hair', 'spa', 'makeup'],
    tutor: ['tutor', 'coaching', 'teacher', 'classes', 'tuition', 'padhai', 'academy'],
    clinic: ['doctor', 'clinic', 'hospital', 'dentist', 'dr', 'physician'],
    gym: ['gym', 'fitness', 'yoga', 'workout', 'crossfit', 'zumba'],
    photographer: ['photographer', 'photography', 'studio', 'photo', 'video'],
    service: ['electrician', 'plumber', 'repair', 'service', 'ac', 'carpenter', 'painter'],
  };
  let best: string | null = null, bestScore = 0;
  for (const [cat, kws] of Object.entries(keywords)) {
    let score = 0;
    for (const kw of kws) if (lower.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// Extract 10-digit Indian phone from message
function extractPhone(msg: string): string | null {
  const match = msg.replace(/[\s\-\+]/g, '').match(/(?:91)?(\d{10})/);
  return match ? match[1] : null;
}

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

function persistSession(phone: string, s: any) {
  saveSession(phone, {
    state: s.state,
    data: s.data,
    site_url: s.siteUrl,
    slug: s.slug,
    paid: s.paid,
    edit_mode: s.editMode,
  });
}

// ─── CATEGORY LIST MESSAGE ───────────────────────────────────────────────────

function categoryListMsg(): ListMsg {
  return {
    type: 'list',
    body: '🙏 *Namaste! WhatsWebsite mein swagat hai!*\n\nSirf 2 minute mein professional website ready! 🚀\n\nApna business type choose karo 👇',
    buttonText: '🏪 Choose Category',
    sections: [{
      title: 'Business Categories',
      rows: [
        { id: 'cat_restaurant', title: '🍽️ Restaurant/Dhaba', description: 'Restaurant, Cafe, Dhaba, Hotel, Bakery' },
        { id: 'cat_store', title: '🏪 Kirana/Store', description: 'Grocery, General Store, Medical' },
        { id: 'cat_salon', title: '💇 Salon/Parlour', description: 'Beauty Parlour, Barber, Spa' },
        { id: 'cat_tutor', title: '📚 Tutor/Coaching', description: 'Tuition, Coaching, Academy' },
        { id: 'cat_clinic', title: '🏥 Doctor/Clinic', description: 'Doctor, Dentist, Hospital' },
        { id: 'cat_gym', title: '💪 Gym/Fitness', description: 'Gym, Yoga, CrossFit' },
        { id: 'cat_photographer', title: '📸 Photographer', description: 'Photography, Studio, Video' },
        { id: 'cat_service', title: '🔧 Service Provider', description: 'Electrician, Plumber, AC Repair' },
      ]
    }]
  };
}

// ─── EDIT OPTIONS BUTTONS ────────────────────────────────────────────────────

function editOptionsMsg(): ListMsg {
  return {
    type: 'list',
    body: '✏️ *Kya change karna hai?*\n\nNeeche se option choose karo 👇',
    buttonText: '✏️ Edit Options',
    sections: [{
      title: 'Edit Options',
      rows: [
        { id: 'edit_hero', title: '📸 Hero Photo', description: 'Main photo change karo' },
        { id: 'edit_gallery', title: '🖼️ Gallery Photos', description: 'Gallery mein photos add karo' },
        { id: 'edit_add', title: '➕ Add Item/Service', description: 'Naya item ya service add karo' },
        { id: 'edit_remove', title: '🗑️ Remove Item', description: 'Koi item hatao' },
        { id: 'edit_price', title: '💰 Change Price', description: 'Price update karo' },
        { id: 'edit_timing', title: '⏰ Change Timing', description: 'Business hours badlo' },
        { id: 'edit_offer', title: '🎉 Add Offer', description: 'Special offer lagao' },
        { id: 'edit_offer_remove', title: '❌ Remove Offer', description: 'Active offer hatao' },
        { id: 'edit_close', title: '🔒 Temporarily Close', description: 'Band karo (holiday)' },
        { id: 'edit_open', title: '✅ Reopen', description: 'Wapas khol do' },
      ]
    }]
  };
}

// ─── WELCOME BACK (existing user) ───────────────────────────────────────────

function welcomeBackMsg(sites: any[]): Reply {
  if (sites.length === 1) {
    return {
      type: 'buttons',
      body: `👋 *Welcome back!*\n\n🏪 *${sites[0].businessName}*\n🔗 ${BASE_URL}/site/${sites[0].slug}\n\nKya karna hai?`,
      buttons: [
        { id: 'wb_edit', title: '✏️ Edit Website' },
        { id: 'wb_new', title: '🆕 Naya Website' },
        { id: 'wb_upgrade', title: '⭐ Upgrade' },
      ]
    };
  }
  // Multiple sites — show list
  return {
    type: 'list',
    body: `👋 *Welcome back!*\n\nAapke ${sites.length} websites hain.\nNaya website banana hai ya kaunsa edit karna hai?`,
    buttonText: '🏪 Choose Website',
    sections: [
      {
        title: 'New',
        rows: [
          { id: 'wb_new', title: '🆕 Naya Website Banao', description: 'Create a new website' }
        ]
      },
      {
        title: 'Your Websites',
        rows: sites.map(s => ({
          id: `site_${s.slug}`,
          title: s.businessName.substring(0, 24),
          description: `${CATEGORY_DISPLAY[s.category] || s.category} • ${s.plan === 'premium' ? '⭐ Premium' : '🆓 Free'}`
        }))
      }
    ]
  };
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

export async function handleMessage(phone: string, message: string): Promise<BotResponse> {
  const msg = message.trim();
  const lower = msg.toLowerCase();
  const session = loadSession(phone);

  // Global commands  
  if (lower === 'reset' || lower === 'restart' || lower === 'naya' || lower === 'new' || lower === 'wb_new' || lower === 'naya website banao') {
    const s = loadSession(phone);
    s.state = 'awaiting_category';
    s.data = {};
    s.editMode = undefined;
    persistSession(phone, s);
    return { replies: [categoryListMsg()] };
  }

  // Global cat_ handler — works from any state
  if (lower.startsWith('cat_') && !session.slug) {
    const category = lower.replace('cat_', '');
    if (['restaurant','store','salon','tutor','clinic','gym','photographer','service'].includes(category)) {
      session.state = 'awaiting_name';
      session.data = { category };
      persistSession(phone, session);
      return { replies: ['👍 *' + (category.charAt(0).toUpperCase() + category.slice(1)) + '!*\n\nApne business ka naam batao 👇'] };
    }
  }

  if (lower === 'help' || lower === 'madad') {
    return { replies: [{
      type: 'buttons',
      body: `🦁 *WhatsWebsite — Help*\n\n• *hi* — Start / Edit website\n• *edit* — Modify website\n• *upgrade* — Custom domain\n• *share* — Share link\n• *new* — Naya website\n• *support* — Talk to us`,
      buttons: [
        { id: 'wb_edit', title: '✏️ Edit' },
        { id: 'wb_new', title: '🆕 New Website' },
        { id: 'btn_support', title: '🆘 Support' },
      ]
    }]};
  }

  if (lower === 'support' || lower === 'btn_support' || lower === 'complaint' || lower === 'problem' || lower === 'issue') {
    return { replies: [{
      type: 'cta_url',
      body: `🆘 *Need help?*\n\nHumse directly baat karo — hum jaldi reply karenge!\n\n⏰ Response time: 1-2 hours`,
      url: 'https://wa.me/918210329601?text=Hi%2C%20I%20need%20help%20with%20my%20WhatsWebsite',
      buttonText: '💬 Chat with Support',
    }] };
  }

  if (lower === 'status' || lower === 'help_status') {
    if (session.siteUrl) {
      const isPaid = session.paid;
      return { replies: [{
        type: 'buttons',
        body: `🌐 *Your Website*\n\n📍 ${session.data.businessName}\n🔗 ${session.siteUrl}\n${isPaid ? '✅ Premium (Custom Domain)' : '🆓 Free Plan'}`,
        buttons: isPaid 
          ? [{ id: 'wb_edit', title: '✏️ Edit' }, { id: 'btn_share', title: '📤 Share' }]
          : [{ id: 'wb_edit', title: '✏️ Edit' }, { id: 'wb_upgrade', title: '⭐ Upgrade' }, { id: 'btn_share', title: '📤 Share' }]
      }]};
    }
    return { replies: ['Abhi tak koi website nahi hai. "Hi" bhejo banane ke liye! 😊'] };
  }

  // ─── STATE MACHINE ─────────────────────────────────────────────────────────

  switch (session.state) {
    case 'idle': {
      // Check if user has existing sites
      const user = getOrCreateUser(phone);
      const sites = listUserSites(phone);
      
      if (sites.length > 0) {
        // Existing user — show their sites, set to complete for button handling
        const activeSite = user.active_site || sites[sites.length - 1].slug;
        const siteData = getSiteData(activeSite);
        if (siteData) {
          session.state = 'complete';
          session.slug = activeSite;
          session.siteUrl = `${BASE_URL}/site/${activeSite}`;
          session.data = {
            slug: activeSite,
            businessName: siteData.businessName,
            category: siteData.category,
            phone: siteData.phone,
            whatsapp: siteData.whatsapp,
            address: siteData.address,
            timings: siteData.timings,
          };
          session.paid = siteData.plan === 'premium';
          persistSession(phone, session);
        }
        return { replies: [welcomeBackMsg(sites)] };
      }
      
      // New user — show category list
      session.state = 'awaiting_category';
      persistSession(phone, session);
      return { replies: [categoryListMsg()] };
    }

    case 'complete': {
      // Photo uploaded — confirm
      if (msg === '__PHOTO_UPLOADED__' || lower === '__photo_uploaded__') {
        return { replies: [`📸 Photo saved to your website gallery! ✅\n\n🔗 ${session.siteUrl || BASE_URL + '/site/' + session.slug}`] };
      }
      // "Hi" from existing user — show welcome back with options
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site)$/)) {
        const sites = listUserSites(phone);
        if (sites.length > 0) {
          return { replies: [welcomeBackMsg(sites)] };
        }
      }

      // Handle button callbacks
      if (lower === 'wb_edit' || lower === 'edit' || lower === 'change' || lower === 'badlo') {
        session.state = 'editing';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [editOptionsMsg()] };
      }

      if (lower === 'wb_new' || lower === 'naya website banao') {
        session.state = 'awaiting_category';
        session.data = {};
        persistSession(phone, session);
        return { replies: [categoryListMsg()] };
      }

      if (lower === 'wb_upgrade' || lower === 'upgrade' || lower === 'premium' || lower === '999' || lower === 'pay') {
        // Start domain suggestion flow
        const { findAvailableDomains, calculatePlanPrice } = await import('./domain.ts');
        const bizName = session.data.businessName || session.slug || 'business';
        
        try {
          const suggestions = await findAvailableDomains(bizName, 3);
          if (suggestions.length > 0) {
            session.state = 'domain_search';
            session.data.domainSuggestions = suggestions;
            persistSession(phone, session);
            
            const price = calculatePlanPrice(suggestions[0]);
            const buttons = suggestions.slice(0, 3).map((d: string, i: number) => ({
              id: `dom_${i}`, title: d.substring(0, 20),
            }));
            
            return { replies: [{
              type: 'buttons',
              body: `⭐ *Premium Upgrade — ₹${price.toLocaleString()}/year*\n\n✨ Custom .in domain\n✨ No branding\n✨ Priority support\n\n🌐 *Choose your domain:*`,
              buttons,
            }] };
          } else {
            return { replies: [{
              type: 'buttons',
              body: `⭐ *Premium Upgrade*\n\nDomain suggestions mil nahi rahe. Try again later ya humse contact karo!`,
              buttons: [{ id: 'btn_later', title: '🔙 Baad Mein' }]
            }] };
          }
        } catch (err: any) {
          console.error('[Upgrade] Domain suggestion error:', err.message);
          return { replies: ['❌ Error fetching domains. Try again later.'] };
        }
      }

      if (lower === 'btn_later') {
        return { replies: [{
          type: 'buttons',
          body: `👍 Koi baat nahi! Jab bhi chahiye "upgrade" type karo.\n\n🔗 ${session.siteUrl}`,
          buttons: [
            { id: 'wb_edit', title: '✏️ Edit Website' },
            { id: 'btn_share', title: '📤 Share' },
          ]
        }]};
      }

      if (lower === 'share' || lower === 'btn_share') {
        const shareText = `${session.data.businessName} ka website dekho:\n${session.siteUrl}\n\nApna bhi banao — WhatsApp karo: https://wa.me/918210329601`;
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        const isPaid = session.paid;
        const msg = isPaid
          ? `👏 *Kya baat!* Aapka website ready hai!\n\n🔗 ${session.siteUrl}\n\nShare karo apne customers ke saath 👇`
          : `👏 *Kya baat!* Aapne apna website bana liya hai!\n\n🔗 ${session.siteUrl}\n\nAbhi aapka apna domain nahi hai — upgrade karke ise apna bana sakte hain! ⭐`;
        
        if (isPaid) {
          return { replies: [{
            type: 'cta_url',
            body: msg,
            url: shareUrl,
            buttonText: '📤 Share Now',
          }] };
        }
        return { replies: [{
          type: 'cta_url',
          body: msg,
          url: shareUrl,
          buttonText: '📤 Share Now',
        }, {
          type: 'buttons',
          body: `⭐ Custom domain sirf ₹1,499/yr`,
          buttons: [{ id: 'wb_upgrade', title: '⭐ Upgrade Now' }]
        }] };
      }

      // Site selection from list (multi-site user)
      if (lower.startsWith('site_')) {
        const selectedSlug = lower.replace('site_', '');
        const siteData = getSiteData(selectedSlug);
        if (siteData) {
          session.slug = selectedSlug;
          session.siteUrl = `${BASE_URL}/site/${selectedSlug}`;
          session.data = {
            slug: selectedSlug,
            businessName: siteData.businessName,
            category: siteData.category,
            phone: siteData.phone,
            whatsapp: siteData.whatsapp,
            address: siteData.address,
            timings: siteData.timings,
          };
          session.paid = siteData.plan === 'premium';
          persistSession(phone, session);
          
          const user = getOrCreateUser(phone);
          saveUser(phone, { ...user, active_site: selectedSlug });

          return { replies: [{
            type: 'buttons',
            body: `✅ *${siteData.businessName}* selected!\n🔗 ${session.siteUrl}\n\nKya karna hai?`,
            buttons: [
              { id: 'wb_edit', title: '✏️ Edit' },
              { id: 'wb_upgrade', title: '⭐ Upgrade' },
              { id: 'btn_share', title: '📤 Share' },
            ]
          }]};
        }
      }

      // Button IDs that weren't handled — don't send to AI
      if (/^(cat_|wb_|btn_|dom_|edit_|site_|rm_|skip_|done_)/.test(lower)) {
        return { replies: [{
          type: 'buttons',
          body: `🌐 *${session.data.businessName}*\n🔗 ${session.siteUrl}\n\nKya karna hai?`,
          buttons: [
            { id: 'wb_edit', title: '✏️ Edit Website' },
            ...(session.paid ? [] : [{ id: 'wb_upgrade', title: '⭐ Upgrade' }]),
            { id: 'btn_share', title: '📤 Share' },
          ]
        }] };
      }

      // Natural language via smart router
      if (session.slug) {
        try {
          const reply = await smartRoute(phone, msg, session.slug);
          return { replies: [reply] };
        } catch (err: any) {
          console.error('[Router] Error:', err.message);
        }
      }

      return { replies: [{
        type: 'buttons',
        body: `🌐 *${session.data.businessName}*\n🔗 ${session.siteUrl}\n\nKya karna hai?`,
        buttons: [
          { id: 'wb_edit', title: '✏️ Edit' },
          { id: 'wb_upgrade', title: '⭐ Upgrade' },
          { id: 'btn_share', title: '📤 Share' },
        ]
      }]};
    }

    case 'awaiting_category': {
      // Handle list selection (cat_restaurant etc)
      let category: string | null = null;
      if (lower.startsWith('cat_')) {
        category = lower.replace('cat_', '');
      } else if (CATEGORY_NUMBERS[msg]) {
        category = CATEGORY_NUMBERS[msg];
      } else {
        category = detectCategory(lower);
      }
      
      if (!category) {
        return { replies: [categoryListMsg()] };
      }

      session.data.category = category;
      session.state = 'awaiting_name';
      persistSession(phone, session);
      return { replies: [
        `✅ *${CATEGORY_DISPLAY[category]}*\n\nAb aapke business ka *naam* batao? 👇\n(Jaise: "Sharma Ji Ka Dhaba", "Priya Beauty Parlour")`
      ]};
    }

    case 'awaiting_name': {
      const trimmed = msg.trim();
      if (trimmed.length < 3) {
        return { replies: ['❌ Naam bahut chhota hai. Apne business ka poora naam batao (jaise: "Sharma Ji Ka Dhaba")'] };
      }
      if (trimmed.includes('?') || lower.match(/^(kya|kaun|kaise|kyun|kab|kidhar|what|how|why|who|when|where|help|madad|nahi|no|haan|yes|ok|hi|hello|hey)[\s!?.]*$/)) {
        return { replies: ['🤔 Ye business ka naam nahi lag raha.\n\nApne *business/dukaan ka naam* batao jaise:\n• "Sharma Ji Ka Dhaba"\n• "Priya Beauty Parlour"\n• "Royal Gym & Fitness"'] };
      }
      session.data.businessName = trimmed;
      session.data.slug = generateSlug(trimmed);
      session.state = 'awaiting_phone';
      persistSession(phone, session);
      
      // Auto-detect phone from sender's WhatsApp number
      const senderPhone = phone.replace(/^91/, '');
      if (senderPhone.length === 10) {
        return { replies: [{
          type: 'buttons',
          body: `🏪 *${trimmed}* — bahut accha naam!\n\n📱 Aapka phone number *${senderPhone}* use kare website pe?\n(Ye customers ko dikhega)`,
          buttons: [
            { id: `usephone_${senderPhone}`, title: `✅ Haan yahi karo` },
            { id: 'usephone_new', title: '📱 Dusra Number' },
          ]
        }]};
      }
      
      return { replies: [
        `🏪 *${trimmed}* — bahut accha naam!\n\nAb apna *phone number* bhejo? 📱\n(Ye website pe dikhega — customers call kar payenge)`
      ]};
    }

    case 'awaiting_phone': {
      // Restart if user sends greeting
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }
      // Handle button callbacks
      if (lower.startsWith('usephone_') && lower !== 'usephone_new') {
        const num = lower.replace('usephone_', '');
        session.data.phone = num;
        session.data.whatsapp = `91${num}`;
        session.state = 'awaiting_address';
        persistSession(phone, session);
        return { replies: [
          `📱 Phone: *${num}* ✅\n\nAb apna *address* bhejo ya 📍 *location pin* share karo!\n(Type karo ya WhatsApp location bhejo)`
        ]};
      }
      
      if (lower === 'usephone_new') {
        return { replies: ['📱 Apna *phone number* bhejo (10 digit):'] };
      }

      const cleaned = msg.replace(/[\s\-\+]/g, '').replace(/^91/, '').replace(/^0/, '');
      if (cleaned.length < 10 || !/^\d+$/.test(cleaned)) {
        return { replies: ['❌ Ye valid phone number nahi lag raha. 10 digit number bhejo (jaise: 9876543210)'] };
      }
      session.data.phone = cleaned.slice(-10);
      session.data.whatsapp = `91${cleaned.slice(-10)}`;
      session.state = 'awaiting_address';
      persistSession(phone, session);
      return { replies: [
        `📱 Phone: *${cleaned.slice(-10)}* ✅\n\nAb apna *address* bhejo ya 📍 *location pin* share karo!\n(Type karo ya WhatsApp location bhejo)`
      ]};
    }

    case 'awaiting_address': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }
      // Handle location pin from WhatsApp
      if (msg.startsWith('__LOC__')) {
        const parts = msg.split('__');
        const lat = parts[2];
        const lng = parts[3];
        const locAddress = parts.slice(4).join('__') || `${lat}, ${lng}`;
        session.data.address = locAddress;
        session.data.lat = lat;
        session.data.lng = lng;
        session.data.mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      } else {
        session.data.address = msg;
      }
      session.state = 'awaiting_timings';
      persistSession(phone, session);
      const savedAddr = session.data.address;
      const mapNote = session.data.mapUrl ? `\n🗺️ Google Maps link bhi save ho gaya!` : '';
      return { replies: [{
        type: 'list',
        body: `📍 *${savedAddr}* ✅${mapNote}\n\n*Business timings* choose karo ⏰`,
        buttonText: '⏰ Timing Choose',
        sections: [{
          title: 'Common Timings',
          rows: [
            { id: 'timing_default', title: '🕐 10AM - 9PM', description: 'Most shops & businesses' },
            { id: 'timing_morning', title: '🌅 6AM - 12PM', description: 'Dairy, gym, yoga, morning clinic' },
            { id: 'timing_early', title: '🌤️ 8AM - 6PM', description: 'Office, clinic, school' },
            { id: 'timing_afternoon', title: '☀️ 12PM - 8PM', description: 'Salon, tutor, afternoon shift' },
            { id: 'timing_evening', title: '🌙 5PM - 11PM', description: 'Restaurant, dhaba, night cafe' },
            { id: 'timing_late', title: '🌃 11AM - 11PM', description: 'Late opener, pub, lounge' },
            { id: 'timing_split', title: '🔄 Split Hours', description: '9AM-1PM + 5PM-9PM (lunch break)' },
            { id: 'timing_24x7', title: '🔥 24x7 Open', description: 'Always open!' },
            { id: 'timing_custom', title: '✏️ Custom Timing', description: 'Apna timing type karo' },
          ]
        }]
      }]};
    }

    case 'awaiting_timings': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }
      const timingMap: Record<string, string> = {
        'timing_default': '10:00 AM - 9:00 PM',
        'timing_morning': '6:00 AM - 12:00 PM',
        'timing_afternoon': '12:00 PM - 8:00 PM',
        'timing_evening': '5:00 PM - 11:00 PM',
        'timing_early': '8:00 AM - 6:00 PM',
        'timing_late': '11:00 AM - 11:00 PM',
        'timing_24x7': '24 Hours (Open All Day)',
        'timing_split': '9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM',
      };
      if (timingMap[lower]) {
        session.data.timings = timingMap[lower];
      } else if (lower === 'timing_custom') {
        return { replies: ['⏰ Apna timing type karo:\n(Jaise: "9 AM - 8 PM" ya "subah 10 se raat 9")'] };
      } else {
        session.data.timings = msg;
      }

      session.state = 'awaiting_hero';
      persistSession(phone, session);
      return { replies: [{
        type: 'buttons',
        body: '📸 Apna hero photo bhejo — jo sabse pehle dikhega website pe!\n\nYa skip karo 👇',
        buttons: [{ id: 'skip_hero', title: '⏭️ Skip Hero' }]
      }] };
    }

    case 'awaiting_hero': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }
      if (lower === 'skip_hero') {
        // No hero image, move to gallery
      } else if (lower === '__photo_uploaded__' || message.startsWith('__PHOTO_UPLOADED__')) {
        // Photo saved by server.ts handleWhatsAppImage → session.data.uploadedPhotos
        const lastPhoto = session.data.uploadedPhotos?.slice(-1)[0];
        if (lastPhoto) session.data.heroImage = lastPhoto.url;
      } else {
        return { replies: [{
          type: 'buttons',
          body: '📸 Photo bhejo ya skip karo 👇',
          buttons: [{ id: 'skip_hero', title: '⏭️ Skip Hero' }]
        }] };
      }
      session.state = 'awaiting_gallery';
      persistSession(phone, session);
      return { replies: [{
        type: 'buttons',
        body: '🖼️ Gallery photos bhejo (ek ek karke).\n\nJab ho jaye, Done dabao 👇',
        buttons: [{ id: 'skip_gallery', title: '⏭️ Skip' }, { id: 'done_gallery', title: '✅ Done' }]
      }] };
    }

    case 'awaiting_gallery': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }
      if (lower === 'skip_gallery' || lower === 'done_gallery') {
        // Move to generating
      } else if (lower === '__photo_uploaded__' || message.startsWith('__PHOTO_UPLOADED__')) {
        // Photo saved by server.ts handleWhatsAppImage → session.data.uploadedPhotos
        if (!session.data.galleryPhotos) session.data.galleryPhotos = [];
        const lastPhoto = session.data.uploadedPhotos?.slice(-1)[0];
        if (lastPhoto) session.data.galleryPhotos.push(lastPhoto.url);
        // Debounce: set a timestamp, only reply if no more photos in 2s
        session.data._lastGalleryUpload = Date.now();
        persistSession(phone, session);
        const count = session.data.galleryPhotos.length;
        // Wait 2s to see if more photos come
        await new Promise(r => setTimeout(r, 2000));
        // Re-load session — check if another photo came in
        const fresh = loadSession(phone);
        if (fresh.data._lastGalleryUpload > session.data._lastGalleryUpload) {
          // More photos arrived, skip this response
          return { replies: [] };
        }
        const finalCount = fresh.data.galleryPhotos?.length || count;
        return { replies: [{
          type: 'buttons',
          body: `✅ ${finalCount} photo${finalCount > 1 ? 's' : ''} added! Aur bhejo ya Done dabao 👇`,
          buttons: [{ id: 'done_gallery', title: '✅ Done' }]
        }] };
      } else {
        return { replies: [{
          type: 'buttons',
          body: '🖼️ Photo bhejo ya Done dabao 👇',
          buttons: [{ id: 'done_gallery', title: '✅ Done' }]
        }] };
      }

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

        // Move uploaded photos from _temp to site folder
        const fs = await import('fs');
        const path = await import('path');
        const SITES_DIR = path.default.join(process.cwd(), 'sites');
        const imgDir = path.default.join(SITES_DIR, slug, 'images');
        if (!fs.default.existsSync(imgDir)) fs.default.mkdirSync(imgDir, { recursive: true });

        function movePhoto(tempUrl: string): string {
          const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
          const srcPath = path.default.join(SITES_DIR, tempUrl);
          const destPath = path.default.join(imgDir, filename);
          try {
            if (fs.default.existsSync(srcPath)) {
              fs.default.copyFileSync(srcPath, destPath);
              return `/site/${slug}/images/${filename}`;
            }
          } catch {}
          return tempUrl; // fallback
        }

        if (session.data.heroImage) {
          siteData.heroImage = movePhoto(session.data.heroImage);
        }
        if (session.data.galleryPhotos?.length) {
          siteData.photos = session.data.galleryPhotos.map((url: string) => ({
            url: movePhoto(url), caption: session.data.businessName || '', type: 'gallery' as const,
          }));
        }

        if (aiContent.menu) siteData.menu = aiContent.menu;
        if (aiContent.services) siteData.services = aiContent.services;
        if (aiContent.packages) siteData.packages = aiContent.packages;
        if (aiContent.plans) siteData.plans = aiContent.plans;
        if (aiContent.subjects) siteData.subjects = aiContent.subjects;
        if (aiContent.reviews) siteData.reviews = aiContent.reviews;
        if (aiContent.todaySpecial) siteData.todaySpecial = aiContent.todaySpecial;
        saveSiteData(siteData, phone);

        renderSite(siteData);

        // Generate AI images in background (don't block site creation)
        generateAIImages(slug, category, session.data.businessName!, phone).catch(err => {
          console.error('[AI-IMG] Background gen error:', err.message);
        });

        const user = getOrCreateUser(phone);
        const sites = user.sites || [];
        if (!sites.includes(slug)) sites.push(slug);
        saveUser(phone, { ...user, sites, active_site: slug });

        session.slug = slug;
        session.siteUrl = `${BASE_URL}/site/${slug}`;
        session.state = 'complete';
        session.paid = false;
        persistSession(phone, session);

        return { replies: [{
          type: 'buttons',
          body: `🎉 *Aapka website READY hai!*\n\n🏪 *${session.data.businessName}*\n🔗 ${session.siteUrl}\n\n✅ WhatsApp button\n✅ Call button\n✅ Google Maps\n✅ Mobile responsive\n✅ Professional design`,
          buttons: [
            { id: 'wb_edit', title: '✏️ Edit Website' },
            { id: 'wb_upgrade', title: '⭐ Premium ₹1,499/yr' },
            { id: 'btn_share', title: '📤 Share' },
          ]
        }]};
      } catch (err: any) {
        session.state = 'awaiting_timings';
        persistSession(phone, session);
        console.error('[SheruSites] Generation error:', err.message);
        return { replies: [`❌ Oops! Website generate karne mein error aaya. Dobara try karo.\nError: ${err.message}`] };
      }
    }

    case 'domain_search': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site|reset|restart|naya|new)$/)) {
        deleteSession(phone);
        return handleMessage(phone, message);
      }

      // User selected a domain (dom_0, dom_1, dom_2)
      if (lower.startsWith('dom_')) {
        const idx = parseInt(lower.replace('dom_', ''));
        const suggestions = session.data.domainSuggestions || [];
        const selectedDomain = suggestions[idx];
        if (!selectedDomain) {
          return { replies: ['❌ Invalid selection. Try again.'] };
        }

        const { calculatePlanPrice } = await import('./domain.ts');
        const price = calculatePlanPrice(selectedDomain);
        const slug = session.slug || session.data.slug;

        // Save pending domain to site DB
        const siteData = getSiteData(slug);
        if (siteData) {
          (siteData as any).pendingDomain = selectedDomain;
          (siteData as any).pendingPlanPrice = price;
          saveSiteData(siteData, phone);
        }

        session.data.selectedDomain = selectedDomain;
        session.data.selectedPlanPrice = price;
        session.state = 'complete';
        persistSession(phone, session);

        // Create Razorpay Payment Link — opens Razorpay directly
        const { createPaymentLink } = await import('./payment.ts');
        const link = await createPaymentLink(slug);
        
        if (link) {
          return { replies: [{
            type: 'cta_url',
            body: `✅ *${selectedDomain}* selected!\n\n💰 Price: ₹${(link.amount / 100).toLocaleString()}/year\n\n📱 Tap to pay — domain 30 min mein live!`,
            url: link.url,
            buttonText: `💳 Pay ₹${(link.amount / 100).toLocaleString()}`,
          }] };
        } else {
          // Fallback to payment page
          return { replies: [{
            type: 'cta_url',
            body: `✅ *${selectedDomain}* selected!\n\n💰 Price: ₹${price.toLocaleString()}/year`,
            url: `${BASE_URL}/pay/${slug}`,
            buttonText: `💳 Pay ₹${price.toLocaleString()}`,
          }] };
        }
      }

      if (lower === 'btn_later') {
        session.state = 'complete';
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: `👍 Koi baat nahi! Jab bhi chahiye "upgrade" type karo.`,
          buttons: [{ id: 'wb_edit', title: '✏️ Edit Website' }, { id: 'btn_share', title: '📤 Share' }]
        }] };
      }

      // Unknown input in domain_search — show suggestions again
      const suggestions = session.data.domainSuggestions || [];
      if (suggestions.length > 0) {
        const buttons = suggestions.slice(0, 3).map((d: string, i: number) => ({
          id: `dom_${i}`, title: d.substring(0, 20),
        }));
        return { replies: [{
          type: 'buttons',
          body: `🌐 Neeche se domain choose karo 👇`,
          buttons,
        }] };
      }
      session.state = 'complete';
      persistSession(phone, session);
      return { replies: ['Kuch galat ho gaya. "upgrade" type karo dobara try karne ke liye.'] };
    }

    case 'editing': {
      // Photo uploaded while editing
      if (msg === '__PHOTO_UPLOADED__' || lower === '__photo_uploaded__') {
        if (session.editMode === 'edit_hero') {
          // Hero updated by server.ts handleWhatsAppImage
          session.editMode = undefined;
          session.data.pendingPhotoType = undefined;
          session.state = 'complete';
          persistSession(phone, session);
          const sd = getSiteData(session.slug || '');
          if (sd) renderSite(sd);
          return { replies: [{
            type: 'buttons',
            body: `✅ Hero photo updated!\n🔗 ${session.siteUrl}`,
            buttons: [{ id: 'wb_edit', title: '✏️ More Edits' }, { id: 'btn_share', title: '📤 Share' }]
          }] };
        }
        // Gallery photo
        const sData = getSiteData(session.slug || '');
        const count = sData?.photos?.length || 0;
        return { replies: [{
          type: 'buttons',
          body: `✅ Photo ${count} added! Aur bhejo ya Done dabao 👇`,
          buttons: [{ id: 'edit_gallery_done', title: '✅ Done' }]
        }] };
      }
      const slug = session.slug;
      if (!slug) {
        session.state = 'idle';
        persistSession(phone, session);
        return { replies: ['Pehle website banao! "Hi" bhejo start karne ke liye.'] };
      }
      const siteData = getSiteData(slug);
      if (!siteData) {
        session.state = 'idle';
        persistSession(phone, session);
        return { replies: ['Website data nahi mila. "reset" karke dobara banao.'] };
      }

      // Hero & Gallery edit handlers
      if (lower === 'edit_hero') {
        session.editMode = 'edit_hero';
        session.data.pendingPhotoType = 'hero';
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: '📸 Naya hero photo bhejo 👇',
          buttons: [{ id: 'wb_edit', title: '⬅️ Back' }]
        }] };
      }

      if (lower === 'edit_gallery') {
        session.editMode = 'edit_gallery';
        session.data.pendingPhotoType = 'gallery';
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: '🖼️ Gallery photos bhejo (ek ek karke).\nJab ho jaye, Done dabao 👇',
          buttons: [{ id: 'edit_gallery_done', title: '✅ Done' }, { id: 'wb_edit', title: '⬅️ Back' }]
        }] };
      }

      if (lower === 'edit_gallery_done') {
        session.editMode = undefined;
        session.data.pendingPhotoType = undefined;
        session.state = 'complete';
        persistSession(phone, session);
        renderSite(siteData);
        return { replies: [{
          type: 'buttons',
          body: `✅ Gallery updated!\n🔗 ${session.siteUrl}`,
          buttons: [{ id: 'wb_edit', title: '✏️ More Edits' }, { id: 'btn_share', title: '📤 Share' }]
        }] };
      }

      // List button handlers
      if (lower === 'edit_add' || msg === '1') {
        session.editMode = 'add_item';
        persistSession(phone, session);
        return { replies: [`➕ *Naya item add karo*\n\nAise likho:\n• "Haircut - 200"\n• "Facial 500"\n• "Hair Spa - ₹800"\n\nMultiple items ek saath bhi bhej sakte ho (ek line mein ek) 👇`] };
      }

      if (lower === 'edit_remove' || msg === '2') {
        const items = siteData.menu || siteData.services || siteData.packages || siteData.subjects || siteData.plans || [];
        if (items.length === 0) {
          session.state = 'complete';
          persistSession(phone, session);
          return { replies: ['Koi items nahi hain abhi. Pehle add karo!'] };
        }
        session.editMode = 'remove_item';
        persistSession(phone, session);
        
        // Show as list if <= 10 items
        if (items.length <= 10) {
          return { replies: [{
            type: 'list',
            body: '🗑️ *Kaunsa item hatana hai?*',
            buttonText: '📋 Items Dekho',
            sections: [{
              title: 'Current Items',
              rows: items.map((item: any, i: number) => ({
                id: `rm_${i}`,
                title: item.name.substring(0, 24),
                description: item.price
              }))
            }]
          }]};
        }
        
        const list = items.map((item: any, i: number) => `${i + 1}. ${item.name} — ${item.price}`).join('\n');
        return { replies: [`🗑️ *Kaunsa item hatana hai?*\n\n${list}\n\nNumber bhejo ya naam likho 👇`] };
      }

      if (lower === 'edit_price' || msg === '3') {
        session.editMode = 'change_price';
        persistSession(phone, session);
        return { replies: [`💰 *Price change karo*\n\nFormat: *Item Name - ₹New Price*\nJaise: "Butter Chicken - ₹300" 👇`] };
      }

      if (lower === 'edit_timing' || msg === '4') {
        session.editMode = 'change_timing';
        persistSession(phone, session);
        return { replies: ['⏰ Naye timings batao (jaise: "9 AM - 9 PM") 👇'] };
      }

      if (lower === 'edit_offer' || msg === '5') {
        session.editMode = 'add_offer';
        persistSession(phone, session);
        return { replies: [`🎉 *Offer lagao*\n\nOffer ka text batao:\nJaise: "Flat 20% off this weekend!" 👇`] };
      }

      if (lower === 'edit_offer_remove' || msg === '6' || lower.includes('offer hatao')) {
        siteData.activeOffer = undefined;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: `✅ Offer hata diya! Website updated.\n🔗 ${session.siteUrl}`,
          buttons: [
            { id: 'wb_edit', title: '✏️ More Edits' },
            { id: 'btn_share', title: '📤 Share' },
          ]
        }]};
      }

      if (lower === 'edit_close' || msg === '7') {
        siteData.isOpen = false;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: `🔒 Website pe "Temporarily Closed" laga diya.`,
          buttons: [{ id: 'edit_open', title: '✅ Wapas Kholo' }]
        }]};
      }

      if (lower === 'edit_open' || msg === '8') {
        siteData.isOpen = true;
        saveSiteData(siteData);
        renderSite(siteData);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: `✅ Website wapas OPEN! 🎉\n🔗 ${session.siteUrl}`,
          buttons: [
            { id: 'wb_edit', title: '✏️ Edit' },
            { id: 'btn_share', title: '📤 Share' },
          ]
        }]};
      }

      // Handle edit sub-modes
      if (session.editMode === 'add_item') {
        const lines = msg.split('\n').filter(l => l.trim());
        let added = 0;
        for (const line of lines) {
          const match = line.match(/^(.+?)\s*[-–]\s*₹?\s*(\d+[\d,]*)/) ||
                        line.match(/^(.+?)\s+₹\s*(\d+[\d,]*)/) ||
                        line.match(/^(.+?)\s+(\d+[\d,]*)\s*(?:rupees?|rs\.?|rupaiye|₹)?$/i);
          if (match) {
            const itemName = match[1].trim().replace(/\s+(?:ka|ki|ke)\s*(?:price|rate|daam)?\s*$/i, '');
            const price = '₹' + match[2].replace(/,/g, '');
            if (siteData.menu) siteData.menu.push({ name: itemName, price });
            else if (siteData.services) siteData.services.push({ name: itemName, price });
            else if (siteData.packages) siteData.packages.push({ name: itemName, price });
            else {
              // Default to services for new lists
              siteData.services = siteData.services || [];
              siteData.services.push({ name: itemName, price });
            }
            added++;
          }
        }
        if (added > 0) {
          saveSiteData(siteData);
          renderSite(siteData);
          session.state = 'complete';
          session.editMode = undefined;
          persistSession(phone, session);
          return { replies: [{
            type: 'buttons',
            body: `✅ ${added} item${added > 1 ? 's' : ''} add ho gaye! Website updated.\n🔗 ${session.siteUrl}`,
            buttons: [
              { id: 'wb_edit', title: '✏️ More Edits' },
              { id: 'btn_share', title: '📤 Share' },
            ]
          }]};
        }
        return { replies: ['❌ Format samajh nahi aaya.\n\nAise likho:\n• "Haircut - 200"\n• "Facial 500"\n• "Hair Spa - ₹800"\n\nNaam aur price dono hone chahiye 👇'] };
      }

      if (session.editMode === 'remove_item') {
        const items = siteData.menu || siteData.services || siteData.packages || siteData.subjects || siteData.plans || [];
        let removed = false;
        
        // Handle list button (rm_0, rm_1, etc.)
        if (lower.startsWith('rm_')) {
          const idx = parseInt(lower.replace('rm_', ''));
          if (idx >= 0 && idx < items.length) { items.splice(idx, 1); removed = true; }
        } else {
          const idx = parseInt(msg) - 1;
          if (idx >= 0 && idx < items.length) { items.splice(idx, 1); removed = true; }
          else {
            const found = items.findIndex((i: any) => i.name.toLowerCase().includes(lower));
            if (found >= 0) { items.splice(found, 1); removed = true; }
          }
        }
        if (removed) {
          saveSiteData(siteData);
          renderSite(siteData);
          session.state = 'complete';
          session.editMode = undefined;
          persistSession(phone, session);
          return { replies: [{
            type: 'buttons',
            body: `✅ Item hata diya! Website updated.\n🔗 ${session.siteUrl}`,
            buttons: [
              { id: 'wb_edit', title: '✏️ More Edits' },
              { id: 'btn_share', title: '📤 Share' },
            ]
          }]};
        }
        return { replies: ['❌ Item nahi mila. Number ya naam dobara bhejo.'] };
      }

      if (session.editMode === 'change_price') {
        const match = msg.match(/^(.+?)\s*[-–]\s*₹?\s*(\d+[\d,]*)/) ||
                      msg.match(/^(.+?)\s+₹?\s*(\d+[\d,]*)\s*$/i);
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
            return { replies: [`✅ ${item.name} ka price ${newPrice} ho gaya!\n🔗 ${session.siteUrl}`] };
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
        return { replies: [{
          type: 'buttons',
          body: `🎉 Offer live! "${msg}"\n🔗 ${session.siteUrl}`,
          buttons: [
            { id: 'edit_offer_remove', title: '❌ Offer Hatao' },
            { id: 'btn_share', title: '📤 Share' },
          ]
        }]};
      }

      // If it looks like a button ID that wasn't handled, show edit menu
      if (/^(cat_|wb_|btn_|dom_|edit_|site_|rm_|skip_|done_)/.test(lower)) {
        return { replies: [editOptionsMsg()] };
      }

      // Fallback — route to AI agent for natural language edits
      try {
        const { agentHandle } = await import('./site-agent.ts');
        const reply = await agentHandle(phone, msg, slug);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [{
          type: 'buttons',
          body: reply,
          buttons: [{ id: 'wb_edit', title: '✏️ More Edits' }, { id: 'btn_share', title: '📤 Share' }]
        }] };
      } catch (err: any) {
        console.error('[Edit AI] Error:', err.message);
        session.state = 'complete';
        session.editMode = undefined;
        persistSession(phone, session);
        return { replies: [editOptionsMsg()] };
      }
    }

    default: {
      session.state = 'idle';
      persistSession(phone, session);
      return handleMessage(phone, message); // Re-process as idle
    }
  }
}

// ─── AI IMAGE GENERATION (BACKGROUND) ────────────────────────────────────────

async function generateAIImages(slug: string, category: string, businessName: string, phone: string) {
  console.log(`[AI-IMG] Starting image generation for ${slug}...`);
  
  // Generate hero image
  const heroUrls = await generateImages(category, businessName, 'hero', 1);
  const photos: any[] = [];
  
  if (heroUrls.length > 0) {
    const localUrl = await downloadAndSaveImage(heroUrls[0], slug, 'hero.jpg');
    if (localUrl) {
      photos.push({ url: localUrl, caption: businessName, type: 'hero' });
    }
  }
  
  // Generate gallery images (up to 4 to save costs)
  const galleryUrls = await generateImages(category, businessName, 'gallery', 4);
  for (let i = 0; i < galleryUrls.length; i++) {
    const localUrl = await downloadAndSaveImage(galleryUrls[i], slug, `gallery-${i + 1}.jpg`);
    if (localUrl) {
      photos.push({ url: localUrl, caption: `${businessName} gallery`, type: 'gallery' });
    }
  }
  
  if (photos.length > 0) {
    // Update site data with photos
    const siteData = getSiteData(slug);
    if (siteData) {
      siteData.photos = [...(siteData.photos || []), ...photos];
      saveSiteData(siteData, phone);
      renderSite(siteData);
      console.log(`[AI-IMG] ${photos.length} images saved for ${slug}`);
    }
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

export function getSessionInfo(phone: string) { return getSession(phone); }
export function getAllSessions() { return new Map(); }
