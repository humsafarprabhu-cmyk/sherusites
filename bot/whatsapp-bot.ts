/**
 * SheruSites WhatsApp Bot — Build websites for small businesses via chat
 * 
 * Flow: Greeting → Category → Business Name → Phone → Address → Services → Generate → Upsell
 */

import { BusinessInfo, detectCategory, generateSlug, generateSite } from './site-generator.ts';
import { getOrCreateUser, saveUser, createSiteData, getSiteData, saveSiteData, addMenuItem, removeMenuItem, updatePrice, addService, updateTimings, setOffer, clearOffer, setOpenStatus, listUserSites, SiteData } from './data-store.ts';
import { generateContent } from './ai-content.ts';
import { renderSite } from './template-renderer.ts';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type SessionState = 
  | 'idle'
  | 'awaiting_category'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_address'
  | 'awaiting_services'
  | 'awaiting_timings'
  | 'generating'
  | 'complete'
  | 'editing';

interface Session {
  state: SessionState;
  phone: string;
  data: Partial<BusinessInfo>;
  siteUrl?: string;
  slug?: string;
  createdAt: number;
  paid: boolean;
}

interface BotResponse {
  replies: string[];
  media?: { url: string; type: string; filename?: string }[];
}

// ─── STATE ───────────────────────────────────────────────────────────────────

const sessions = new Map<string, Session>();
let BASE_URL = process.env.TUNNEL_URL || 'http://localhost:4000';

export function setBaseUrl(url: string) { 
  BASE_URL = url; 
  console.log('[SheruSites] Base URL:', url);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getSession(phone: string): Session {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      state: 'idle',
      phone,
      data: {},
      createdAt: Date.now(),
      paid: false,
    });
  }
  return sessions.get(phone)!;
}

function resetSession(phone: string): void {
  sessions.delete(phone);
}

const CATEGORY_DISPLAY: Record<string, string> = {
  'restaurant': '🍽️ Restaurant / Dhaba / Cafe',
  'store': '🏪 Kirana / General Store',
  'salon': '💇 Salon / Parlour',
  'tutor': '📚 Tutor / Coaching',
  'clinic': '🏥 Doctor / Clinic',
  'gym': '💪 Gym / Fitness',
  'photographer': '📸 Photographer / Studio',
  'service': '🔧 Electrician / Plumber / Service',
};

const CATEGORY_NUMBERS: Record<string, string> = {
  '1': 'restaurant',
  '2': 'store',
  '3': 'salon',
  '4': 'tutor',
  '5': 'clinic',
  '6': 'gym',
  '7': 'photographer',
  '8': 'service',
};

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

export async function handleMessage(phone: string, message: string): Promise<BotResponse> {
  const msg = message.trim();
  const lower = msg.toLowerCase();
  const session = getSession(phone);

  // Global commands
  if (lower === 'reset' || lower === 'restart' || lower === 'naya' || lower === 'new') {
    resetSession(phone);
    return { replies: ['🔄 Fresh start! Send "Hi" to begin.'] };
  }

  if (lower === 'help' || lower === 'madad') {
    return { replies: [
      `🦁 *SheruSites — Help*\n\n` +
      `Commands:\n` +
      `• *hi/hello* — Start new website\n` +
      `• *reset/naya* — Start over\n` +
      `• *status* — Check your website\n` +
      `• *edit* — Modify your website\n` +
      `• *help/madad* — This message\n\n` +
      `Questions? WhatsApp us anytime! 🙏`
    ]};
  }

  if (lower === 'status') {
    if (session.siteUrl) {
      return { replies: [
        `🌐 *Your Website*\n\n` +
        `📍 ${session.data.businessName}\n` +
        `🔗 ${session.siteUrl}\n` +
        `${session.paid ? '✅ Premium (Custom Domain)' : '🆓 Free Plan (SheruSites branding)'}\n\n` +
        `${!session.paid ? '⭐ Upgrade to ₹999/year for custom domain!\nType "upgrade" to get your own .in domain' : ''}`
      ]};
    }
    return { replies: ['No website yet! Send "Hi" to create one. 😊'] };
  }

  // State machine
  switch (session.state) {
    case 'idle': {
      if (lower.match(/^(hi|hello|helo|namaste|namaskar|hii+|hey|start|shuru|website|site)$/)) {
        session.state = 'awaiting_category';
        return { replies: [
          `🙏 *Namaste! SheruSites mein swagat hai!*\n\n` +
          `Sirf 2 minute mein aapka professional website ready! 🚀\n\n` +
          `Aapka business type batao:\n\n` +
          `1️⃣ 🍽️ Restaurant / Dhaba / Cafe\n` +
          `2️⃣ 🏪 Kirana / General Store\n` +
          `3️⃣ 💇 Salon / Parlour\n` +
          `4️⃣ 📚 Tutor / Coaching\n` +
          `5️⃣ 🏥 Doctor / Clinic\n` +
          `6️⃣ 💪 Gym / Fitness\n` +
          `7️⃣ 📸 Photographer / Studio\n` +
          `8️⃣ 🔧 Electrician / Plumber\n\n` +
          `Number bhejo ya apne business ke baare mein batao! 👇`
        ]};
      }
      // If they type something else, try to detect intent
      session.state = 'awaiting_category';
      const detected = detectCategory(lower);
      session.data.category = detected;
      session.state = 'awaiting_name';
      return { replies: [
        `👋 Welcome to SheruSites!\n\n` +
        `I detected: *${CATEGORY_DISPLAY[detected]}*\n` +
        `(Galat hai? "reset" bhejo aur dobara try karo)\n\n` +
        `Aapke business ka *naam* batao? 👇`
      ]};
    }

    case 'awaiting_category': {
      // Check if it's a number
      if (CATEGORY_NUMBERS[msg]) {
        session.data.category = CATEGORY_NUMBERS[msg];
      } else {
        session.data.category = detectCategory(lower);
      }
      session.state = 'awaiting_name';
      return { replies: [
        `✅ *${CATEGORY_DISPLAY[session.data.category!]}*\n\n` +
        `Ab aapke business ka *naam* batao? 👇\n` +
        `(Jaise: "Sharma Ji Ka Dhaba", "Gupta General Store")`
      ]};
    }

    case 'awaiting_name': {
      session.data.businessName = msg;
      session.data.slug = generateSlug(msg);
      session.state = 'awaiting_phone';
      return { replies: [
        `🏪 *${msg}* — bahut accha naam!\n\n` +
        `Ab apna *phone number* bhejo? 📱\n` +
        `(Ye website pe dikhega — customers call kar payenge)`
      ]};
    }

    case 'awaiting_phone': {
      // Extract phone number (remove spaces, +91, etc.)
      const cleaned = msg.replace(/[\s\-\+]/g, '').replace(/^91/, '').replace(/^0/, '');
      if (cleaned.length < 10 || !/^\d+$/.test(cleaned)) {
        return { replies: ['❌ Ye valid phone number nahi lag raha. 10 digit number bhejo (jaise: 9876543210)'] };
      }
      session.data.phone = cleaned;
      session.data.whatsapp = `91${cleaned}`;
      session.state = 'awaiting_address';
      return { replies: [
        `📱 Phone: *${cleaned}* ✅\n\n` +
        `Ab apna *address* bhejo? 📍\n` +
        `(Jaise: "MG Road, near SBI Bank, Indore")`
      ]};
    }

    case 'awaiting_address': {
      session.data.address = msg;
      session.state = 'awaiting_timings';
      return { replies: [
        `📍 Address saved! ✅\n\n` +
        `*Business timings* batao? ⏰\n` +
        `(Jaise: "10 AM - 10 PM" ya "skip" to use default)`
      ]};
    }

    case 'awaiting_timings': {
      if (lower !== 'skip') {
        session.data.timings = msg;
      }
      session.state = 'generating';
      
      // Generate the website with AI content + data store
      try {
        const slug = session.data.slug!;
        const category = session.data.category!;
        
        // 1. Generate AI content
        const aiContent = await generateContent(
          category,
          session.data.businessName!,
          session.data.address!
        );
        
        // 2. Create site data
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
        });
        
        // 3. Add dynamic content
        if (aiContent.menu) siteData.menu = aiContent.menu;
        if (aiContent.services) siteData.services = aiContent.services;
        if (aiContent.packages) siteData.packages = aiContent.packages;
        if (aiContent.plans) siteData.plans = aiContent.plans;
        if (aiContent.subjects) siteData.subjects = aiContent.subjects;
        saveSiteData(siteData);
        
        // 4. Render HTML from template + data
        renderSite(siteData);
        
        // 5. Register with user
        const user = getOrCreateUser(phone);
        if (!user.sites.includes(slug)) {
          user.sites.push(slug);
        }
        user.activeSite = slug;
        saveUser(user);
        
        session.slug = slug;
        session.siteUrl = `${BASE_URL}/site/${slug}`;
        session.state = 'complete';

        return { replies: [
          `🎉 *Aapka website READY hai!*\n\n` +
          `🏪 *${session.data.businessName}*\n` +
          `🔗 ${session.siteUrl}\n\n` +
          `✅ WhatsApp button\n` +
          `✅ Call button\n` +
          `✅ Google Maps\n` +
          `✅ Mobile responsive\n` +
          `✅ Professional design\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🆓 *FREE Plan:* ${session.data.businessName.toLowerCase().replace(/\s+/g, '-')}.sherusites.in\n` +
          `   (with SheruSites branding)\n\n` +
          `⭐ *PREMIUM ₹999/year:*\n` +
          `   ✨ Custom domain (${session.data.businessName.toLowerCase().replace(/\s+/g, '')}.in)\n` +
          `   ✨ No branding\n` +
          `   ✨ Priority support\n` +
          `   ✨ Google Business setup\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `"upgrade" type karo premium lene ke liye! 🚀\n` +
          `"edit" type karo changes ke liye ✏️`
        ]};
      } catch (err: any) {
        session.state = 'awaiting_timings';
        console.error('[SheruSites] Generation error:', err.message);
        return { replies: [`❌ Oops! Website generate karne mein error aaya. Dobara try karo.\nError: ${err.message}`] };
      }
    }

    case 'complete': {
      if (lower === 'upgrade' || lower === 'premium' || lower === '999' || lower === 'pay') {
        // Generate Razorpay/UPI payment link
        const upiLink = `upi://pay?pa=your-upi@bank&pn=SheruSites&am=999&tn=Website-${session.slug}&cu=INR`;
        return { replies: [
          `⭐ *Premium Upgrade — ₹999/year*\n\n` +
          `Aapko milega:\n` +
          `✨ Custom .in domain\n` +
          `✨ No SheruSites branding\n` +
          `✨ Priority support\n` +
          `✨ Google Business listing\n\n` +
          `💳 *Payment Options:*\n\n` +
          `📱 UPI: Pay ₹999 to *sherusites@upi*\n` +
          `   (Screenshot bhejo confirm karne ke liye)\n\n` +
          `🔗 Or click: ${BASE_URL}/pay/${session.slug}\n\n` +
          `Payment ke baad 30 minute mein custom domain live! 🚀`
        ]};
      }

      if (lower === 'edit' || lower === 'change' || lower === 'badlo') {
        session.state = 'editing';
        return { replies: [
          `✏️ *Kya change karna hai?*\n\n` +
          `1️⃣ Menu/Service add karo\n` +
          `2️⃣ Menu/Service hatao\n` +
          `3️⃣ Price change karo\n` +
          `4️⃣ Timing change karo\n` +
          `5️⃣ Offer lagao\n` +
          `6️⃣ Offer hatao\n` +
          `7️⃣ Band karo (temporarily closed)\n` +
          `8️⃣ Khol do (reopen)\n` +
          `9️⃣ Kuch aur batao\n\n` +
          `Number bhejo ya seedha batao kya change karna hai 👇`
        ]};
      }

      if (lower === 'share') {
        return { replies: [
          `📤 *Share your website:*\n\n` +
          `🔗 ${session.siteUrl}\n\n` +
          `📋 Copy karke share karo:\n` +
          `"${session.data.businessName} ka website dekho: ${session.siteUrl}"\n\n` +
          `🖨️ QR Code print karke dukan mein lagao — customers scan karenge!`
        ]};
      }

      // Default response in complete state
      return { replies: [
        `🌐 *${session.data.businessName}*\n` +
        `🔗 ${session.siteUrl}\n\n` +
        `Commands:\n` +
        `• *edit* — Change something\n` +
        `• *upgrade* — Get custom domain (₹999/yr)\n` +
        `• *share* — Share website\n` +
        `• *new/naya* — Create another website\n` +
        `• *help* — All commands`
      ]};
    }

    case 'editing': {
      const slug = session.slug;
      if (!slug) {
        session.state = 'complete';
        return { replies: ['Pehle website banao! "Hi" bhejo start karne ke liye.'] };
      }
      const siteData = getSiteData(slug);
      if (!siteData) {
        session.state = 'complete';
        return { replies: ['Website data nahi mila. "reset" karke dobara banao.'] };
      }

      // 1. Add menu/service item
      if (msg === '1' || lower.includes('add') || lower.includes('naya item') || lower.includes('item add')) {
        (session as any).editMode = 'add_item';
        return { replies: [
          `➕ *Naya item add karo*\n\n` +
          `Format: *Naam - ₹Price*\n` +
          `Jaise: "Paneer Tikka - ₹220"\n\n` +
          `Multiple items ek saath bhi bhej sakte ho (ek line mein ek) 👇`
        ]};
      }

      // 2. Remove item
      if (msg === '2' || lower.includes('hatao') || lower.includes('remove') || lower.includes('delete')) {
        const items = siteData.menu || siteData.services || siteData.packages || [];
        if (items.length === 0) {
          session.state = 'complete';
          return { replies: ['Koi items nahi hain abhi. Pehle add karo!'] };
        }
        (session as any).editMode = 'remove_item';
        const list = items.map((item: any, i: number) => `${i + 1}. ${item.name} — ${item.price}`).join('\n');
        return { replies: [
          `🗑️ *Kaunsa item hatana hai?*\n\n${list}\n\nNumber bhejo ya naam likho 👇`
        ]};
      }

      // 3. Price change
      if (msg === '3' || lower.includes('price') || lower.includes('rate') || lower.includes('daam')) {
        (session as any).editMode = 'change_price';
        return { replies: [
          `💰 *Price change karo*\n\n` +
          `Format: *Item Name - ₹New Price*\n` +
          `Jaise: "Butter Chicken - ₹300" 👇`
        ]};
      }

      // 4. Timings
      if (msg === '4' || lower.includes('timing') || lower.includes('time') || lower.includes('samay')) {
        (session as any).editMode = 'change_timing';
        return { replies: ['⏰ Naye timings batao (jaise: "9 AM - 9 PM") 👇'] };
      }

      // 5. Add offer
      if (msg === '5' || lower.includes('offer') || lower.includes('special') || lower.includes('discount')) {
        (session as any).editMode = 'add_offer';
        return { replies: [
          `🎉 *Offer lagao*\n\n` +
          `Offer ka text batao:\n` +
          `Jaise: "Flat 20% off on all items this weekend!" 👇`
        ]};
      }

      // 6. Clear offer
      if (msg === '6' || lower.includes('offer hatao') || lower.includes('no offer')) {
        clearOffer(slug);
        renderSite(siteData);
        session.state = 'complete';
        return { replies: ['✅ Offer hata diya! Website updated.\n🔗 ' + session.siteUrl] };
      }

      // 7. Close
      if (msg === '7' || lower.includes('band') || lower.includes('close') || lower.includes('chhuti')) {
        setOpenStatus(slug, false);
        const updated = getSiteData(slug)!;
        renderSite(updated);
        session.state = 'complete';
        return { replies: ['🔒 Website pe "Temporarily Closed" laga diya.\n"khol do" ya "8" bhejo wapas kholne ke liye.'] };
      }

      // 8. Reopen
      if (msg === '8' || lower.includes('khol') || lower.includes('open') || lower.includes('chalu')) {
        setOpenStatus(slug, true);
        const updated = getSiteData(slug)!;
        renderSite(updated);
        session.state = 'complete';
        return { replies: ['✅ Website wapas OPEN! 🎉\n🔗 ' + session.siteUrl] };
      }

      // Handle edit sub-modes
      const editMode = (session as any).editMode;

      if (editMode === 'add_item') {
        // Parse "Name - ₹Price" lines
        const lines = msg.split('\n').filter(l => l.trim());
        let added = 0;
        for (const line of lines) {
          const match = line.match(/^(.+?)\s*[-–]\s*₹?\s*(\d+[\d,]*)/);
          if (match) {
            const itemName = match[1].trim();
            const price = '₹' + match[2].replace(/,/g, '');
            if (siteData.menu) {
              siteData.menu.push({ name: itemName, price });
            } else if (siteData.services) {
              siteData.services.push({ name: itemName, price });
            } else if (siteData.packages) {
              siteData.packages.push({ name: itemName, price });
            }
            added++;
          }
        }
        if (added > 0) {
          saveSiteData(siteData);
          renderSite(siteData);
          (session as any).editMode = null;
          session.state = 'complete';
          return { replies: [`✅ ${added} item${added > 1 ? 's' : ''} add ho gaye! Website updated.\n🔗 ${session.siteUrl}\n\n"edit" for more changes.`] };
        }
        return { replies: ['❌ Format samajh nahi aaya. Try: "Paneer Tikka - ₹220"'] };
      }

      if (editMode === 'remove_item') {
        const items = siteData.menu || siteData.services || siteData.packages || [];
        const idx = parseInt(msg) - 1;
        let removed = false;
        if (idx >= 0 && idx < items.length) {
          items.splice(idx, 1);
          removed = true;
        } else {
          const found = items.findIndex((i: any) => i.name.toLowerCase().includes(lower));
          if (found >= 0) {
            items.splice(found, 1);
            removed = true;
          }
        }
        if (removed) {
          saveSiteData(siteData);
          renderSite(siteData);
          (session as any).editMode = null;
          session.state = 'complete';
          return { replies: [`✅ Item hata diya! Website updated.\n🔗 ${session.siteUrl}`] };
        }
        return { replies: ['❌ Item nahi mila. Number ya naam dobara bhejo.'] };
      }

      if (editMode === 'change_price') {
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
            (session as any).editMode = null;
            session.state = 'complete';
            return { replies: [`✅ ${item.name} ka price ${newPrice} ho gaya! Website updated.\n🔗 ${session.siteUrl}`] };
          }
          return { replies: [`❌ "${itemName}" nahi mila. Sahi naam bhejo.`] };
        }
        return { replies: ['❌ Format: "Item Name - ₹New Price"'] };
      }

      if (editMode === 'change_timing') {
        updateTimings(slug, msg);
        const updated = getSiteData(slug)!;
        renderSite(updated);
        (session as any).editMode = null;
        session.state = 'complete';
        return { replies: [`✅ Timings updated: ${msg}\n🔗 ${session.siteUrl}`] };
      }

      if (editMode === 'add_offer') {
        setOffer(slug, msg);
        const updated = getSiteData(slug)!;
        renderSite(updated);
        (session as any).editMode = null;
        session.state = 'complete';
        return { replies: [`🎉 Offer live! "${msg}"\n🔗 ${session.siteUrl}\n\n"offer hatao" to remove later.`] };
      }

      // 9. Free-form / anything else
      session.state = 'complete';
      return { replies: [
        `Got it! "edit" bhejo aur option choose karo.\n\n` +
        `🔗 ${session.siteUrl}`
      ]};
    }

    default: {
      session.state = 'idle';
      return { replies: ['Kuch samajh nahi aaya 😅 "Hi" bhejo start karne ke liye!'] };
    }
  }
}

// ─── SESSION MANAGEMENT ──────────────────────────────────────────────────────

export function getSessionInfo(phone: string): Session | undefined {
  return sessions.get(phone);
}

export function getAllSessions(): Map<string, Session> {
  return sessions;
}

export { sessions, BASE_URL };
