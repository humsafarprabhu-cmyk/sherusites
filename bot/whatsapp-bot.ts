/**
 * SheruSites WhatsApp Bot — Build websites for small businesses via chat
 * 
 * Flow: Greeting → Category → Business Name → Phone → Address → Services → Generate → Upsell
 */

import { BusinessInfo, detectCategory, generateSlug, generateSite } from './site-generator.ts';

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
      
      // Generate the website
      try {
        const info: BusinessInfo = {
          slug: session.data.slug!,
          businessName: session.data.businessName!,
          category: session.data.category!,
          phone: session.data.phone!,
          whatsapp: session.data.whatsapp!,
          address: session.data.address!,
          timings: session.data.timings,
        };

        const result = generateSite(info);
        session.slug = result.slug;
        session.siteUrl = `${BASE_URL}/site/${result.slug}`;
        session.state = 'complete';

        return { replies: [
          `🎉 *Aapka website READY hai!*\n\n` +
          `🏪 *${info.businessName}*\n` +
          `🔗 ${session.siteUrl}\n\n` +
          `✅ WhatsApp button\n` +
          `✅ Call button\n` +
          `✅ Google Maps\n` +
          `✅ Mobile responsive\n` +
          `✅ Professional design\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🆓 *FREE Plan:* ${info.businessName.toLowerCase().replace(/\s+/g, '-')}.sherusites.in\n` +
          `   (with SheruSites branding)\n\n` +
          `⭐ *PREMIUM ₹999/year:*\n` +
          `   ✨ Custom domain (${info.businessName.toLowerCase().replace(/\s+/g, '')}.in)\n` +
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
          `1️⃣ Business name\n` +
          `2️⃣ Phone number\n` +
          `3️⃣ Address\n` +
          `4️⃣ Timings\n` +
          `5️⃣ Kuch aur batao\n\n` +
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
      // Simple edit handling — regenerate with updated info
      if (msg === '1' || lower.includes('name') || lower.includes('naam')) {
        session.state = 'awaiting_name';
        return { replies: ['Naya business name batao 👇'] };
      }
      if (msg === '2' || lower.includes('phone') || lower.includes('number')) {
        session.state = 'awaiting_phone';
        return { replies: ['Naya phone number bhejo 👇'] };
      }
      if (msg === '3' || lower.includes('address') || lower.includes('pata')) {
        session.state = 'awaiting_address';
        return { replies: ['Naya address bhejo 👇'] };
      }
      if (msg === '4' || lower.includes('timing') || lower.includes('time') || lower.includes('samay')) {
        session.state = 'awaiting_timings';
        return { replies: ['Naye timings batao 👇'] };
      }
      // Free-form edit
      session.state = 'complete';
      return { replies: [
        `Got it! Ye change abhi manually hoga — humari team 30 min mein kar degi. ✅\n` +
        `Aapka request: "${msg}"\n\n` +
        `Website: ${session.siteUrl}`
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
