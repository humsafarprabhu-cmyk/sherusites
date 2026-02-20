/**
 * SheruSites AI Content Generator
 * Generates custom menu/services/content for each business using GPT-4o-mini
 * Cost: ~₹0.5 per site (500 tokens)
 */

import { SiteData, MenuItem, ServiceItem } from './data-store.ts';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

interface AIContent {
  tagline: string;
  about: string;
  menu?: MenuItem[];
  services?: ServiceItem[];
  packages?: ServiceItem[];
  plans?: ServiceItem[];
  subjects?: ServiceItem[];
}

const CATEGORY_PROMPTS: Record<string, string> = {
  restaurant: `Generate for an Indian restaurant/dhaba:
- tagline (short, catchy, Hindi-English mix OK)
- about (2-3 lines about the restaurant)
- menu: 12-15 items across categories (Starters, Main Course, Breads, Rice, Drinks, Desserts)
  Each item: name, price in ₹ (realistic Indian prices), category, description (one line)
  Mark 3-4 as popular:true`,

  store: `Generate for an Indian grocery/kirana store:
- tagline
- about
- services: 10-12 product categories with starting prices
  (Atta & Flour, Dal & Pulses, Rice, Cooking Oil, Spices, Snacks, Beverages, Dairy, Personal Care, Cleaning)
  Each: name, price as "from ₹XX", description`,

  salon: `Generate for an Indian salon/parlour:
- tagline
- about  
- services: 15-18 services split across categories
  Men's: Haircut, Beard Trim, Facial, Hair Color, Head Massage
  Women's: Haircut, Hair Spa, Facial, Waxing, Threading, Bridal Makeup, Mehndi
  Each: name, price in ₹, duration (e.g. "30 min"), description`,

  tutor: `Generate for an Indian coaching/tuition center:
- tagline
- about
- subjects: 6-8 subjects with fees
  (Mathematics, Science, English, Hindi, Social Studies, Computer, Spoken English)
  Each: name, price as "₹XXXX/month", description, duration as batch timing`,

  clinic: `Generate for an Indian doctor's clinic:
- tagline
- about (include qualifications like MBBS, MD)
- services: 8-10 medical services
  (General Consultation, Diabetes Care, Heart Health, Pediatrics, Vaccination, Health Checkup, Blood Tests, etc.)
  Each: name, price as "₹XXX", description, duration as consultation time`,

  gym: `Generate for an Indian gym/fitness center:
- tagline
- about
- plans: 3 membership plans (Monthly, Quarterly, Annual) with prices and features list in description
- services: 6-8 facilities/classes (Weight Training, Cardio, Yoga, Zumba, CrossFit, Personal Training, Steam Room)
  Each: name, price (or "Included"), description, duration as class timing`,

  photographer: `Generate for an Indian photographer/studio:
- tagline
- about
- packages: 4-5 photography packages
  (Basic Portrait ₹2999, Pre-Wedding ₹14999, Wedding Day ₹29999, Birthday/Event ₹7999, Product ₹4999)
  Each: name, price in ₹, description (what's included: hours, photos, edits, prints)`,

  service: `Generate for an Indian electrician/plumber/home service:
- tagline
- about
- services: 10-12 services with prices
  (Wiring, Switch/Socket, Fan Installation, AC Service, AC Install, Geyser Repair, Pipe Fitting, Tap/Faucet, Drain Cleaning, Toilet Repair, Water Tank, Inverter)
  Each: name, price as "from ₹XXX", description`,
};

export async function generateContent(
  category: string,
  businessName: string,
  address: string,
  extraInfo?: string
): Promise<AIContent> {
  // If no API key, return smart defaults
  if (!OPENAI_KEY) {
    console.log('[AI] No API key, using defaults');
    return getDefaultContent(category, businessName);
  }

  const prompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS['restaurant'];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You generate realistic business content for Indian small businesses. Output ONLY valid JSON, no markdown. All prices in ₹ (Indian Rupees). Keep descriptions short (under 15 words). Names should feel authentic Indian. Language: English with occasional Hindi words is OK.`
          },
          {
            role: 'user',
            content: `Business: "${businessName}" in ${address}. Category: ${category}.${extraInfo ? `\nExtra info: ${extraInfo}` : ''}\n\n${prompt}\n\nOutput JSON with keys: tagline, about, ${getContentKey(category)}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error('[AI] API error:', res.status);
      return getDefaultContent(category, businessName);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    console.log(`[AI] Generated content for ${businessName} (${category})`);
    return parsed;
  } catch (err: any) {
    console.error('[AI] Error:', err.message);
    return getDefaultContent(category, businessName);
  }
}

function getContentKey(category: string): string {
  const keys: Record<string, string> = {
    restaurant: 'menu',
    store: 'services',
    salon: 'services',
    tutor: 'subjects',
    clinic: 'services',
    gym: 'plans, services',
    photographer: 'packages',
    service: 'services',
  };
  return keys[category] || 'services';
}

// ─── DEFAULT CONTENT (when no AI available) ──────────────────────────────────

function getDefaultContent(category: string, name: string): AIContent {
  const defaults: Record<string, AIContent> = {
    restaurant: {
      tagline: `${name} — Ghar jaisa khana, apno wali mehak`,
      about: `${name} has been serving authentic flavors with love. Fresh ingredients, traditional recipes, and a warm welcome awaits you.`,
      menu: [
        { name: 'Butter Chicken', price: '₹280', category: 'Main Course', description: 'Creamy tomato gravy with tender chicken', popular: true },
        { name: 'Dal Makhani', price: '₹180', category: 'Main Course', description: 'Slow-cooked black lentils in butter cream', popular: true },
        { name: 'Paneer Tikka', price: '₹220', category: 'Starters', description: 'Smoky tandoor-grilled cottage cheese', popular: true },
        { name: 'Veg Thali', price: '₹150', category: 'Thali', description: 'Complete meal with 4 dishes, roti, rice, sweet' },
        { name: 'Non-Veg Thali', price: '₹200', category: 'Thali', description: 'Chicken curry, dal, roti, rice, salad, sweet' },
        { name: 'Tandoori Roti', price: '₹20', category: 'Breads', description: 'Whole wheat clay oven bread' },
        { name: 'Butter Naan', price: '₹40', category: 'Breads', description: 'Soft leavened bread with butter' },
        { name: 'Jeera Rice', price: '₹120', category: 'Rice', description: 'Cumin-tempered basmati rice' },
        { name: 'Chicken Biryani', price: '₹250', category: 'Rice', description: 'Aromatic basmati with spiced chicken', popular: true },
        { name: 'Gulab Jamun', price: '₹60', category: 'Desserts', description: 'Sweet milk dumplings in sugar syrup' },
        { name: 'Lassi', price: '₹60', category: 'Drinks', description: 'Thick sweet yogurt drink' },
        { name: 'Masala Chai', price: '₹30', category: 'Drinks', description: 'Spiced Indian tea with milk' },
      ],
    },
    store: {
      tagline: `${name} — Sab kuch milega, sasta aur accha`,
      about: `${name} is your trusted neighborhood store for all daily essentials. Quality products, fair prices, and home delivery available.`,
      services: [
        { name: 'Atta & Flour', price: 'from ₹45/kg', description: 'Wheat flour, besan, maida, sooji' },
        { name: 'Dal & Pulses', price: 'from ₹80/kg', description: 'Toor, moong, chana, masoor dal' },
        { name: 'Rice', price: 'from ₹50/kg', description: 'Basmati, sona masoori, kolam' },
        { name: 'Cooking Oil', price: 'from ₹140/L', description: 'Mustard, sunflower, groundnut oil' },
        { name: 'Spices & Masala', price: 'from ₹30', description: 'Fresh ground spices, ready masalas' },
        { name: 'Snacks & Namkeen', price: 'from ₹20', description: 'Chips, biscuits, namkeen, mixture' },
        { name: 'Beverages', price: 'from ₹20', description: 'Tea, coffee, cold drinks, juices' },
        { name: 'Dairy Products', price: 'from ₹28', description: 'Milk, curd, paneer, butter, ghee' },
        { name: 'Personal Care', price: 'from ₹25', description: 'Soap, shampoo, toothpaste, cream' },
        { name: 'Cleaning', price: 'from ₹35', description: 'Detergent, phenyl, dishwash, broom' },
      ],
    },
    salon: {
      tagline: `${name} — Where beauty meets confidence`,
      about: `${name} offers premium grooming and beauty services. Expert stylists, quality products, and a relaxing experience every visit.`,
      services: [
        { name: "Men's Haircut", price: '₹200', duration: '30 min', description: 'Precision cut with styling' },
        { name: 'Beard Trim & Shape', price: '₹100', duration: '15 min', description: 'Clean trim and shaping' },
        { name: "Men's Facial", price: '₹400', duration: '45 min', description: 'Deep cleanse and glow facial' },
        { name: 'Hair Color (Men)', price: '₹300', duration: '40 min', description: 'Professional hair coloring' },
        { name: "Women's Haircut", price: '₹400', duration: '45 min', description: 'Cut, layers, and blow dry' },
        { name: 'Hair Spa', price: '₹800', duration: '60 min', description: 'Deep conditioning treatment' },
        { name: 'Classic Facial', price: '₹600', duration: '50 min', description: 'Cleanse, scrub, massage, mask' },
        { name: 'Gold Facial', price: '₹1200', duration: '60 min', description: 'Premium gold-infused glow treatment' },
        { name: 'Full Arms Waxing', price: '₹250', duration: '20 min', description: 'Smooth waxing with soothing gel' },
        { name: 'Threading', price: '₹50', duration: '10 min', description: 'Eyebrow and upper lip threading' },
        { name: 'Bridal Makeup', price: '₹8000', duration: '120 min', description: 'Complete bridal look with draping' },
        { name: 'Party Makeup', price: '₹2500', duration: '60 min', description: 'Glamorous party-ready look' },
        { name: 'Mehndi', price: '₹500', duration: '30 min', description: 'Beautiful traditional mehndi designs' },
        { name: 'Head Massage', price: '₹200', duration: '20 min', description: 'Relaxing oil head massage' },
      ],
    },
    tutor: {
      tagline: `${name} — Padhai smart, result best`,
      about: `${name} provides quality coaching with experienced teachers, proven methods, and personal attention. Helping students achieve their best since years.`,
      subjects: [
        { name: 'Mathematics', price: '₹1500/month', description: 'Algebra, Geometry, Calculus, Statistics', duration: 'Mon/Wed/Fri 4-5:30 PM' },
        { name: 'Science (PCB)', price: '₹1500/month', description: 'Physics, Chemistry, Biology with practicals', duration: 'Tue/Thu/Sat 4-5:30 PM' },
        { name: 'English', price: '₹1200/month', description: 'Grammar, writing, literature, speaking', duration: 'Mon/Wed 5:30-7 PM' },
        { name: 'Hindi', price: '₹1000/month', description: 'Vyakaran, nibandh, sahitya', duration: 'Tue/Thu 5:30-7 PM' },
        { name: 'Social Studies', price: '₹1000/month', description: 'History, Geography, Civics, Economics', duration: 'Sat 2-4 PM' },
        { name: 'Computer Science', price: '₹1200/month', description: 'Programming, web development, IT basics', duration: 'Fri 5:30-7 PM' },
        { name: 'Spoken English', price: '₹800/month', description: 'Fluency, pronunciation, confidence building', duration: 'Sun 10-11:30 AM' },
      ],
    },
    clinic: {
      tagline: `${name} — Aapki sehat, hamari zimmedari`,
      about: `Providing compassionate healthcare with modern facilities. MBBS, MD with 10+ years experience. We believe in thorough diagnosis and affordable treatment.`,
      services: [
        { name: 'General Consultation', price: '₹300', description: 'Complete checkup and diagnosis', duration: '15-20 min' },
        { name: 'Follow-up Visit', price: '₹200', description: 'Review and treatment adjustment', duration: '10 min' },
        { name: 'Diabetes Management', price: '₹500', description: 'Sugar monitoring, diet plan, medication', duration: '20 min' },
        { name: 'Blood Pressure', price: '₹300', description: 'BP monitoring and management', duration: '15 min' },
        { name: 'Fever & Cold', price: '₹300', description: 'Seasonal illness treatment', duration: '10 min' },
        { name: 'Vaccination', price: '₹200+', description: 'All age group vaccinations available', duration: '10 min' },
        { name: 'Health Checkup', price: '₹1500', description: 'Complete body checkup with reports', duration: '30 min' },
        { name: 'ECG', price: '₹500', description: 'Heart rhythm and health monitoring', duration: '15 min' },
        { name: 'Blood Test', price: '₹200+', description: 'CBC, sugar, thyroid, lipid profile', duration: '5 min' },
      ],
    },
    gym: {
      tagline: `${name} — No excuses, only results`,
      about: `${name} is your fitness destination with state-of-the-art equipment, expert trainers, and a motivating community. Transform your body, transform your life.`,
      plans: [
        { name: 'Monthly', price: '₹999/month', description: 'Full gym access, locker, basic guidance' },
        { name: 'Quarterly', price: '₹2499/3 months', description: 'Full access + diet plan + 2 PT sessions' },
        { name: 'Annual', price: '₹7999/year', description: 'Full access + diet plan + monthly PT + steam room' },
      ],
      services: [
        { name: 'Weight Training', price: 'Included', description: 'Complete free weights and machines', duration: '6 AM - 10 PM' },
        { name: 'Cardio Zone', price: 'Included', description: 'Treadmill, cycle, cross-trainer, rowing', duration: '6 AM - 10 PM' },
        { name: 'Yoga', price: '₹500/month extra', description: 'Morning yoga and meditation', duration: '6-7 AM daily' },
        { name: 'Zumba', price: '₹500/month extra', description: 'Fun dance fitness class', duration: '7-8 AM, 6-7 PM' },
        { name: 'Personal Training', price: '₹3000/month', description: 'One-on-one customized training', duration: 'By appointment' },
        { name: 'CrossFit', price: '₹800/month extra', description: 'High intensity functional training', duration: '5-6 PM daily' },
      ],
    },
    photographer: {
      tagline: `${name} — Moments frozen, memories forever`,
      about: `${name} captures life's most precious moments. Professional equipment, creative vision, and years of experience in making your memories timeless.`,
      packages: [
        { name: 'Portrait Session', price: '₹2999', description: '1 hour shoot, 20 edited photos, 5 prints' },
        { name: 'Birthday/Event', price: '₹7999', description: '3 hours coverage, 100+ photos, highlights reel' },
        { name: 'Pre-Wedding', price: '₹14999', description: 'Full day shoot, 2 locations, 50 edited photos, album' },
        { name: 'Wedding Day', price: '₹29999', description: 'Full day + reception, 2 photographers, 500+ photos, cinematic video, album' },
        { name: 'Product Photography', price: '₹4999', description: '20 products, white background, lifestyle shots, e-commerce ready' },
      ],
    },
    service: {
      tagline: `${name} — Ek call, sab theek`,
      about: `${name} provides fast, reliable home services at honest prices. Experienced technicians, quality work, and satisfaction guaranteed.`,
      services: [
        { name: 'Wiring & Rewiring', price: 'from ₹500', description: 'New wiring, old wire replacement' },
        { name: 'Switch & Socket', price: 'from ₹150', description: 'Install, repair, replacement' },
        { name: 'Fan Installation', price: '₹300', description: 'Ceiling fan install with wiring' },
        { name: 'AC Service', price: '₹500', description: 'Gas refill, cleaning, maintenance' },
        { name: 'AC Installation', price: '₹1500', description: 'Split/window AC installation' },
        { name: 'Geyser Repair', price: 'from ₹300', description: 'All brands, electric and gas' },
        { name: 'Pipe Fitting', price: 'from ₹200', description: 'New pipes, joints, connections' },
        { name: 'Tap & Faucet', price: 'from ₹150', description: 'Install, repair, leak fix' },
        { name: 'Drain Cleaning', price: '₹300', description: 'Blocked drain and pipe cleaning' },
        { name: 'Toilet Repair', price: 'from ₹200', description: 'Flush, seat, leak repair' },
        { name: 'Inverter & Battery', price: 'from ₹500', description: 'Install, repair, battery replacement' },
        { name: 'Visit Charge', price: '₹200', description: 'Inspection and diagnosis fee (adjusted in bill)' },
      ],
    },
  };

  return defaults[category] || defaults['restaurant'];
}

export { getDefaultContent };
