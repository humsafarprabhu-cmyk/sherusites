/**
 * SheruSites AI Content Generator
 * Generates custom menu/services/content for each business using GPT-4o-mini
 * Cost: ~₹0.5 per site (500 tokens)
 */

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
};

type MenuItem = { name: string; price: string; category?: string; description?: string; popular?: boolean };
type ServiceItem = { name: string; price: string; duration?: string; description?: string };

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

interface AIContent {
  tagline: string;
  about: string;
  menu?: MenuItem[];
  services?: ServiceItem[];
  packages?: ServiceItem[];
  plans?: ServiceItem[];
  subjects?: ServiceItem[];
  reviews?: { author: string; text: string; rating: number; date: string }[];
  todaySpecial?: { name: string; description: string; price: string; oldPrice?: string };
}

// ─── AI IMAGE GENERATION ─────────────────────────────────────────────────────

const IMAGE_PROMPTS: Record<string, { hero: string; gallery: string[] }> = {
  restaurant: {
    hero: 'A warm, inviting Indian restaurant interior with soft golden lighting, wooden tables, traditional decor, plates of colorful Indian food on table, cozy ambiance, professional food photography style, warm tones, no text',
    gallery: [
      'Delicious butter chicken in a copper bowl with naan bread, garnished with cream and cilantro, Indian restaurant table setting, warm lighting, top-down food photography',
      'A plate of crispy tandoori chicken with lemon wedges and mint chutney, smoky presentation, dark moody food photography',
      'Colorful Indian thali with rice, dal, curry, roti, pickle, papad, raita on a steel plate, overhead shot, vibrant colors',
      'Fresh naan bread being pulled from tandoor clay oven, golden and puffy, dramatic lighting, close-up',
      'Tall glass of mango lassi with saffron garnish, condensation drops, Indian restaurant background, product photography',
      'Indian biryani in a copper handi with raita and salan on the side, steam rising, warm golden lighting',
    ]
  },
  salon: {
    hero: 'Modern Indian beauty salon interior with mirrors, professional lighting, elegant chairs, flowers, clean and luxurious ambiance, warm tones, no text',
    gallery: [
      'Professional hairstylist cutting hair in a modern salon, mirror reflection, warm lighting',
      'Woman getting a facial treatment, relaxing spa environment, clean aesthetic',
      'Close-up of beautiful bridal makeup with jewelry, Indian bride, warm golden tones',
      'Mehndi henna design on hands, intricate patterns, beautiful detail shot',
      'Hair spa treatment with steamer, relaxing atmosphere, professional setting',
      'Salon tools arranged aesthetically - scissors, combs, brushes, products, flat lay',
    ]
  },
  store: {
    hero: 'A well-organized modern Indian grocery store interior with colorful products on shelves, clean aisles, warm lighting, inviting atmosphere, no text',
    gallery: [
      'Colorful Indian spices in bowls and jars, turmeric, chili, cumin, arranged beautifully, overhead shot',
      'Fresh vegetables and fruits display in an Indian store, vibrant colors, neat arrangement',
      'Bags of rice, dal, and flour neatly stacked on shelves, well-organized grocery store',
      'Snacks and namkeen variety in a store display, colorful packets, Indian brands',
      'Dairy products section - milk, curd, paneer, ghee, butter arranged neatly',
      'A shopkeeper handing over a grocery bag to a smiling customer, warm interaction',
    ]
  },
  tutor: {
    hero: 'A bright modern Indian coaching center classroom with a whiteboard, desks, books, students studying, inspirational atmosphere, warm lighting, no text',
    gallery: [
      'Teacher explaining math on whiteboard to attentive students, Indian classroom setting',
      'Student studying with books and notebook, focused, warm desk lamp lighting',
      'Stack of colorful textbooks and notebooks, educational setup, clean aesthetic',
      'Group of Indian students discussing and studying together, collaborative learning',
      'Digital tablet with educational content, modern learning tools, clean setup',
      'Trophy shelf and certificates on wall, achievement display, motivational setting',
    ]
  },
  clinic: {
    hero: 'A clean modern Indian medical clinic interior with white walls, comfortable seating, reception desk, professional healthcare environment, calming blue-white tones, no text',
    gallery: [
      'Doctor consulting with patient across desk, professional medical setting, warm interaction',
      'Clean medical examination room with modern equipment, organized and sterile',
      'Stethoscope and medical instruments on desk, professional healthcare flat lay',
      'Pharmacy counter with neatly organized medicines on shelves',
      'Digital health monitoring equipment, modern diagnostics, clean aesthetic',
      'Waiting area with comfortable seats and health magazines, calming environment',
    ]
  },
  gym: {
    hero: 'A modern Indian gym interior with weights, machines, mirrors, motivational environment, dramatic lighting, energetic atmosphere, no text',
    gallery: [
      'Row of dumbbells on rack in gym, dramatic lighting, fitness aesthetic',
      'Person doing deadlift with proper form, gym environment, powerful shot',
      'Yoga class in session, peaceful studio with natural light, group fitness',
      'Treadmills and cardio machines in a modern gym, clean and spacious',
      'Protein shake and gym equipment flat lay, fitness lifestyle',
      'Group zumba or crossfit class in action, energetic atmosphere',
    ]
  },
  photographer: {
    hero: 'A professional photography studio with camera equipment, softbox lights, backdrop, clean modern setup, creative atmosphere, no text',
    gallery: [
      'Professional camera with lens on tripod, golden hour lighting, bokeh background',
      'Wedding photography setup with couple silhouette, dramatic sunset',
      'Portrait photography with softbox lighting in studio, professional setup',
      'Flat lay of photography equipment - camera body, lenses, memory cards, laptop',
      'Photographer shooting outdoor portrait in golden light, behind the scenes',
      'Photo editing on large monitor, color grading, professional workspace',
    ]
  },
  service: {
    hero: 'A professional Indian home service technician with toolkit, clean uniform, ready to work, modern home background, trustworthy appearance, no text',
    gallery: [
      'Electrician working on wiring with proper tools, professional and safe',
      'Plumber fixing pipes under sink, professional toolkit visible',
      'AC technician servicing split AC unit, professional maintenance',
      'Clean organized toolkit with various tools, flat lay on workbench',
      'Happy homeowner with technician after completed repair, satisfaction',
      'Modern home appliance installation, clean and professional work',
    ]
  },
};

export async function generateImages(
  category: string,
  businessName: string,
  type: 'hero' | 'gallery',
  count: number = 1
): Promise<string[]> {
  if (!OPENAI_KEY) {
    console.log('[AI-IMG] No API key');
    return [];
  }

  const prompts = IMAGE_PROMPTS[category] || IMAGE_PROMPTS['restaurant'];
  const promptList = type === 'hero' ? [prompts.hero] : prompts.gallery.slice(0, count);
  const urls: string[] = [];

  for (const prompt of promptList) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${prompt}. For business: ${businessName}. Photorealistic, high quality, 4K.`,
          n: 1,
          size: type === 'hero' ? '1792x1024' : '1024x1024',
          quality: 'standard',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[AI-IMG] Error:', res.status, JSON.stringify(err));
        continue;
      }

      const data = await res.json();
      const url = data.data?.[0]?.url;
      if (url) urls.push(url);
      
      // Small delay to avoid rate limits
      if (promptList.length > 1) await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error('[AI-IMG] Error:', err.message);
    }
  }

  console.log(`[AI-IMG] Generated ${urls.length}/${promptList.length} images for ${businessName} (${type})`);
  return urls;
}

// Download image and save locally
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __ai_dirname = path.dirname(fileURLToPath(import.meta.url));
const SITES_DIR = path.join(__ai_dirname, '..', 'sites');

export async function downloadAndSaveImage(url: string, slug: string, filename: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    
    const buffer = Buffer.from(await res.arrayBuffer());
    const imgDir = path.join(SITES_DIR, slug, 'images');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
    
    const filePath = path.join(imgDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Return relative URL for the site
    return `/site/${slug}/images/${filename}`;
  } catch (err: any) {
    console.error('[AI-IMG] Download error:', err.message);
    return '';
  }
}

// Fetch photos from Unsplash by search query (free, no API key needed)
export async function fetchUnsplashPhotos(query: string, count: number = 1, size: 'w=1400' | 'w=600' = 'w=600'): Promise<string[]> {
  try {
    const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, count).map((p: any) => p.urls?.regular || p.urls?.small || '').filter(Boolean);
  } catch {
    return [];
  }
}

// Smart photo assignment: use AI-generated queries to find relevant Unsplash photos
export async function getSmartPhotos(
  heroQuery: string | undefined,
  galleryQueries: string[] | undefined,
  slug: string
): Promise<{hero: string | null, gallery: string[]}> {
  const result = { hero: null as string | null, gallery: [] as string[] };

  // Hero
  if (heroQuery) {
    const urls = await fetchUnsplashPhotos(heroQuery, 1, 'w=1400');
    if (urls[0]) {
      const saved = await downloadAndSaveImage(urls[0], slug, 'hero-unsplash.jpg');
      if (saved) result.hero = saved;
    }
  }

  // Gallery — parallel downloads
  if (galleryQueries?.length) {
    const promises = galleryQueries.slice(0, 6).map(async (q, i) => {
      const urls = await fetchUnsplashPhotos(q, 1, 'w=600');
      if (urls[0]) return downloadAndSaveImage(urls[0], slug, `gallery-${i+1}.jpg`);
      return '';
    });
    result.gallery = (await Promise.all(promises)).filter(Boolean);
  }

  return result;
}

const CATEGORY_PROMPTS: Record<string, string> = {
  restaurant: `Generate for an Indian restaurant/dhaba:
- tagline (short, catchy, Hindi-English mix OK. DO NOT include the business name — just the slogan)
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 sec max

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You generate realistic business content for Indian small businesses. Output ONLY valid JSON, no markdown. All prices in ₹ (Indian Rupees). Keep descriptions short (under 15 words). Names should feel authentic Indian. Language: English with occasional Hindi words is OK.

IMPORTANT: Analyze the business name and location to INTELLIGENTLY infer what they serve/sell:
- "Sharma Dhaba" in Patna → North Indian dhaba food (dal, roti, sabzi, thali)
- "Kumar Electronics" in Delhi → electronics, mobiles, laptops
- "Priya Beauty Parlour" → women's beauty services (facial, waxing, bridal makeup)
- "Fish Corner" → seafood specialties
- "Gupta Kirana Store" → grocery/kirana items
- A restaurant in Kerala → South Indian food; in Punjab → Punjabi food
- Name has "Pizza/Burger/Chinese" → that specific cuisine

Generate menu/services that MATCH what this specific business would actually offer based on name + location. Never generate generic placeholder content.`
          },
          {
            role: 'user',
            content: `Business: "${businessName}" in ${address}. Category: ${category}.${extraInfo ? `\nExtra info: ${extraInfo}` : ''}\n\n${prompt}\n\nAlso generate:\n- reviews: 3 realistic Google-style reviews [{author (Indian name), text (1-2 sentences), rating (4-5), date ("2 weeks ago" etc)}]\n- todaySpecial: one special item {name, description, price as "₹XX", oldPrice as "₹XX" (higher)}\n- heroPhotoQuery: one Unsplash search query (2-4 words) for a perfect hero background photo for THIS specific business (e.g. "north indian thali food" or "luxury hair salon interior" or "electronics store display")\n- galleryPhotoQueries: array of 6 Unsplash search queries for gallery photos matching what this business actually does\n\nOutput JSON with keys: tagline, about, ${getContentKey(category)}, reviews, todaySpecial, heroPhotoQuery, galleryPhotoQueries`
          }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });
    clearTimeout(timeout);

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
    const reason = err.name === 'AbortError' ? 'timeout (8s)' : err.message;
    console.error(`[AI] Error: ${reason} — using randomized defaults`);
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

// Randomization helpers for unique fallback content
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randPrice(min: number, max: number, step: number = 10): string {
  const val = Math.round((min + Math.random() * (max - min)) / step) * step;
  return `₹${val}`;
}

const INDIAN_NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Devi', 'Vikram Singh', 'Neha Gupta',
  'Ravi Patel', 'Pooja Yadav', 'Suresh Joshi', 'Anita Kumari', 'Deepak Tiwari', 'Meena Agarwal',
  'Rohit Mishra', 'Kavita Pandey', 'Sanjay Dubey', 'Geeta Chauhan', 'Manoj Srivastava', 'Rekha Bose',
  'Rahul Saxena', 'Nisha Reddy', 'Arun Nair', 'Divya Iyer', 'Kiran Desai', 'Mohan Pillai',
];

const REVIEW_TEMPLATES = {
  restaurant: [
    `Best food in the area! __NAME__ ka khana hamesha top class hota hai.`,
    `WhatsApp pe order kiya, garam aur fresh aaya. Bahut tasty!`,
    `Family ke saath aaye the, sabko bahut pasand aaya. Must visit!`,
    `Thali bohot acchi hai is price mein. Value for money!`,
    `Yahan ka special dish try karna mat bhoolna, ekdum mast hai.`,
    `Office team ke saath aate hain har Friday. Consistent quality!`,
    `Delivery fast aati hai aur packaging bhi acchi hai.`,
    `Pure vegetarian options bhi bahut ache hain yahan.`,
    `Ambiance simple hai par khana 5-star quality ka hai.`,
    `Jab se discover kiya hai tab se regular customer ban gaye.`,
  ],
  salon: [
    `Amazing haircut! __NAME__ ke staff bahut skilled hain.`,
    `Bridal makeup karwaya, sabne compliment diya. Best salon!`,
    `Hair spa ke baad baal ekdum silky smooth ho gaye.`,
    `Very hygienic and professional. Highly recommend!`,
    `Threading aur facial dono karwaya, bahut accha experience tha.`,
    `Rates bhi reasonable hain quality ke hisaab se.`,
  ],
  store: [
    `__NAME__ se groceries lena bahut convenient hai. Sab milta hai!`,
    `Fresh products milte hain aur rates bhi sahi hain.`,
    `Home delivery bhi karte hain, bohot helpful hai.`,
    `Neighbourhood ka best store hai. Trusted quality!`,
    `WhatsApp pe list bhej do, ready karke rakh dete hain.`,
  ],
  tutor: [
    `Mere bacche ke marks bahut improve hue __NAME__ join karne ke baad.`,
    `Teachers bahut dedicated hain. Personal attention dete hain.`,
    `Doubt sessions bohot helpful hain. Highly recommended!`,
    `Board exam preparation best hai yahan. Results speak!`,
    `Affordable fees mein quality education milti hai.`,
  ],
  clinic: [
    `__NAME__ mein doctor bahut acche hain. Time pe dekhte hain.`,
    `Proper diagnosis karte hain, unnecessary medicines nahi dete.`,
    `Clean clinic with modern facilities. Very professional.`,
    `Family doctor ban gaye hain humare. Trusted completely.`,
    `Emergency mein bhi available rehte hain. Best doctor!`,
  ],
  gym: [
    `__NAME__ join karne ke baad 10kg weight loss hua! Amazing trainers.`,
    `Equipment top-notch hai aur hygiene bhi maintain karte hain.`,
    `Zumba classes bohot fun hain. Best gym in the area!`,
    `Personal trainer ne complete transformation karwaya.`,
    `Timing flexible hai aur staff motivating hai.`,
  ],
  photographer: [
    `__NAME__ ne wedding photos itni achi li! Lifetime memory ban gayi.`,
    `Pre-wedding shoot was so creative. Loved every frame!`,
    `Professional hai aur delivery bhi time pe karte hain.`,
    `Baby photoshoot karwaya, adorable pictures aayi!`,
    `Editing quality bahut achi hai. Worth every rupee.`,
  ],
  service: [
    `__NAME__ ka kaam bahut accha hai. Time pe aate hain.`,
    `AC service karwaya, ab ekdum thanda chal raha hai!`,
    `Fair pricing and honest work. Highly recommend!`,
    `Emergency mein bhi jaldi aaye. Very reliable.`,
    `Wiring ka purana kaam tha, naya jaisa bana diya!`,
  ],
};

function generateRandomReviews(category: string, businessName: string): any[] {
  const templates = REVIEW_TEMPLATES[category as keyof typeof REVIEW_TEMPLATES] || REVIEW_TEMPLATES.restaurant;
  const reviewTexts = pickN(templates, 3);
  const names = pickN(INDIAN_NAMES, 3);
  const dates = ['1 week ago', '2 weeks ago', '3 weeks ago', '1 month ago', '2 months ago'];
  
  return reviewTexts.map((text, i) => ({
    author: names[i],
    text: text.replace(/__NAME__/g, businessName),
    rating: Math.random() > 0.3 ? 5 : 4,
    date: pick(dates),
  }));
}

function generateRandomMenu(): any[] {
  const starters = [
    { name: 'Paneer Tikka', desc: 'Smoky tandoor-grilled cottage cheese', veg: true, min: 150, max: 250 },
    { name: 'Chicken Tikka', desc: 'Spiced chicken grilled in tandoor', veg: false, min: 180, max: 280 },
    { name: 'Aloo Tikki', desc: 'Crispy potato patties with chutney', veg: true, min: 60, max: 120 },
    { name: 'Fish Amritsari', desc: 'Batter-fried fish Punjab style', veg: false, min: 200, max: 300 },
    { name: 'Dahi Kebab', desc: 'Creamy hung curd kebabs', veg: true, min: 120, max: 180 },
    { name: 'Seekh Kebab', desc: 'Minced mutton skewers', veg: false, min: 200, max: 300 },
    { name: 'Hara Bhara Kebab', desc: 'Spinach and pea patties', veg: true, min: 100, max: 160 },
    { name: 'Mushroom Tikka', desc: 'Tandoor-grilled spiced mushrooms', veg: true, min: 140, max: 220 },
    { name: 'Chicken 65', desc: 'Spicy deep-fried chicken', veg: false, min: 180, max: 260 },
    { name: 'Veg Spring Roll', desc: 'Crispy rolls with mixed veggies', veg: true, min: 80, max: 140 },
  ];
  const mains = [
    { name: 'Butter Chicken', desc: 'Creamy tomato gravy with tender chicken', veg: false, min: 220, max: 320 },
    { name: 'Dal Makhani', desc: 'Slow-cooked black lentils in cream', veg: true, min: 140, max: 220 },
    { name: 'Paneer Butter Masala', desc: 'Rich creamy paneer curry', veg: true, min: 180, max: 260 },
    { name: 'Mutton Rogan Josh', desc: 'Kashmiri spiced mutton curry', veg: false, min: 280, max: 380 },
    { name: 'Chole Bhature', desc: 'Spiced chickpeas with fried bread', veg: true, min: 100, max: 180 },
    { name: 'Egg Curry', desc: 'Eggs in rich onion-tomato gravy', veg: false, min: 120, max: 180 },
    { name: 'Palak Paneer', desc: 'Cottage cheese in spinach gravy', veg: true, min: 160, max: 240 },
    { name: 'Kadai Chicken', desc: 'Chicken with bell peppers & spices', veg: false, min: 220, max: 300 },
    { name: 'Shahi Paneer', desc: 'Paneer in rich cashew cream gravy', veg: true, min: 180, max: 260 },
    { name: 'Malai Kofta', desc: 'Stuffed paneer balls in cream sauce', veg: true, min: 180, max: 260 },
  ];
  const breads = [
    { name: 'Butter Naan', desc: 'Tandoor-baked with butter', veg: true, min: 30, max: 60 },
    { name: 'Garlic Naan', desc: 'Fresh garlic loaded naan', veg: true, min: 40, max: 70 },
    { name: 'Tandoori Roti', desc: 'Whole wheat from clay oven', veg: true, min: 15, max: 35 },
    { name: 'Laccha Paratha', desc: 'Layered flaky paratha', veg: true, min: 35, max: 60 },
    { name: 'Stuffed Kulcha', desc: 'Paneer or aloo stuffed bread', veg: true, min: 50, max: 80 },
  ];
  const rice = [
    { name: 'Jeera Rice', desc: 'Cumin-tempered basmati', veg: true, min: 80, max: 150 },
    { name: 'Chicken Biryani', desc: 'Aromatic dum biryani', veg: false, min: 180, max: 300 },
    { name: 'Veg Biryani', desc: 'Mixed vegetable dum biryani', veg: true, min: 140, max: 220 },
    { name: 'Egg Fried Rice', desc: 'Indo-Chinese style fried rice', veg: false, min: 120, max: 180 },
  ];
  const drinks = [
    { name: 'Sweet Lassi', desc: 'Fresh churned yogurt drink', veg: true, min: 40, max: 80 },
    { name: 'Mango Lassi', desc: 'Mango yogurt shake', veg: true, min: 60, max: 100 },
    { name: 'Masala Chaas', desc: 'Spiced buttermilk', veg: true, min: 30, max: 60 },
    { name: 'Fresh Lime Soda', desc: 'Sweet or salt nimbu paani', veg: true, min: 40, max: 70 },
    { name: 'Masala Chai', desc: 'Spiced Indian tea with milk', veg: true, min: 20, max: 40 },
  ];
  const desserts = [
    { name: 'Gulab Jamun', desc: 'Sweet milk dumplings in syrup', veg: true, min: 40, max: 80 },
    { name: 'Rasmalai', desc: 'Soft paneer in sweet milk', veg: true, min: 50, max: 100 },
    { name: 'Kheer', desc: 'Creamy rice pudding', veg: true, min: 40, max: 80 },
    { name: 'Jalebi', desc: 'Crispy sweet spirals with rabdi', veg: true, min: 30, max: 60 },
  ];

  const menu: any[] = [];
  const addItems = (pool: any[], cat: string, count: number, popularCount: number) => {
    const selected = pickN(pool, count);
    selected.forEach((item, i) => {
      menu.push({
        name: item.name,
        price: randPrice(item.min, item.max, 10),
        category: cat,
        description: item.desc,
        popular: i < popularCount,
        veg: item.veg,
      });
    });
  };

  addItems(starters, 'Starters', 3 + Math.floor(Math.random() * 2), 1);
  addItems(mains, 'Main Course', 4 + Math.floor(Math.random() * 2), 2);
  addItems(breads, 'Breads', 3 + Math.floor(Math.random() * 2), 0);
  addItems(rice, 'Rice', 2 + Math.floor(Math.random() * 2), 1);
  addItems(drinks, 'Drinks', 2 + Math.floor(Math.random() * 2), 0);
  addItems(desserts, 'Desserts', 1 + Math.floor(Math.random() * 2), 0);

  return menu;
}

function getDefaultContent(category: string, name: string): AIContent {
  const defaults: Record<string, AIContent> = {
    restaurant: {
      tagline: pick([
        `${name} — Ghar jaisa khana, apno wali mehak`,
        `${name} — Asli swad, asli pyaar`,
        `${name} — Jahan khana ek parampara hai`,
        `${name} — Dil se parosein, pyaar se khilayein`,
        `${name} — Khushbu se bula le, swad se ruk jaaye`,
      ]),
      about: pick([
        `${name} has been serving authentic flavors with love. Fresh ingredients, traditional recipes, and a warm welcome awaits you.`,
        `Welcome to ${name} — where every dish tells a story. We use the finest ingredients and time-tested recipes to bring you an unforgettable dining experience.`,
        `${name} is more than a restaurant — it's a family tradition. Our kitchen serves happiness on every plate with recipes passed down through generations.`,
      ]),
      reviews: generateRandomReviews('restaurant', name),
      todaySpecial: pick([
        { name: 'Special Thali', description: 'Complete meal — curry, dal, rice, 2 roti, raita, salad & sweet', price: randPrice(149, 249), oldPrice: randPrice(249, 349) },
        { name: 'Butter Chicken Combo', description: 'Butter chicken, jeera rice, 2 butter naan, raita & gulab jamun', price: randPrice(199, 299), oldPrice: randPrice(299, 399) },
        { name: 'Family Feast', description: '2 curries, dal, rice, 4 roti, papad, salad & 2 desserts', price: randPrice(399, 549), oldPrice: randPrice(549, 699) },
        { name: 'Biryani Special', description: 'Dum biryani with raita, salan & kebab', price: randPrice(179, 249), oldPrice: randPrice(249, 349) },
      ]),
      menu: generateRandomMenu(),
    },
    store: {
      tagline: `Sab kuch milega, sasta aur accha`,
      about: `${name} is your trusted neighborhood store for all daily essentials. Quality products, fair prices, and home delivery available.`,
      reviews: generateRandomReviews('store', name),
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
      tagline: `Where beauty meets confidence`,
      about: `${name} offers premium grooming and beauty services. Expert stylists, quality products, and a relaxing experience every visit.`,
      reviews: generateRandomReviews('salon', name),
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
      tagline: `Padhai smart, result best`,
      about: `${name} provides quality coaching with experienced teachers, proven methods, and personal attention. Helping students achieve their best since years.`,
      reviews: generateRandomReviews('tutor', name),
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
      tagline: `Aapki sehat, hamari zimmedari`,
      about: `Providing compassionate healthcare with modern facilities. MBBS, MD with 10+ years experience. We believe in thorough diagnosis and affordable treatment.`,
      reviews: generateRandomReviews('clinic', name),
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
      tagline: `No excuses, only results`,
      about: `${name} is your fitness destination with state-of-the-art equipment, expert trainers, and a motivating community. Transform your body, transform your life.`,
      reviews: generateRandomReviews('gym', name),
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
      tagline: `Moments frozen, memories forever`,
      about: `${name} captures life's most precious moments. Professional equipment, creative vision, and years of experience in making your memories timeless.`,
      reviews: generateRandomReviews('photographer', name),
      packages: [
        { name: 'Portrait Session', price: '₹2999', description: '1 hour shoot, 20 edited photos, 5 prints' },
        { name: 'Birthday/Event', price: '₹7999', description: '3 hours coverage, 100+ photos, highlights reel' },
        { name: 'Pre-Wedding', price: '₹14999', description: 'Full day shoot, 2 locations, 50 edited photos, album' },
        { name: 'Wedding Day', price: '₹29999', description: 'Full day + reception, 2 photographers, 500+ photos, cinematic video, album' },
        { name: 'Product Photography', price: '₹4999', description: '20 products, white background, lifestyle shots, e-commerce ready' },
      ],
    },
    service: {
      tagline: `Ek call, sab theek`,
      about: `${name} provides fast, reliable home services at honest prices. Experienced technicians, quality work, and satisfaction guaranteed.`,
      reviews: generateRandomReviews('service', name),
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
