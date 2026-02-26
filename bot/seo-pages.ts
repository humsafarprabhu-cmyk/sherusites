/**
 * Programmatic SEO Pages — WhatsWebsite
 * Level 1: /free-website/:category/:city  (300 pages)
 * Level 2: /free-website/:category/:city/:area (1500 pages)
 *
 * Quality-first approach per Google 2026 Helpful Content guidelines.
 * Each page has genuine local context, unique area profiles, and
 * category-specific FAQs. Not just name-swapped templates.
 */

// ─── CORE DATA ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'restaurant', 'salon', 'gym', 'tutor', 'clinic',
  'store', 'photographer', 'service', 'wedding', 'event'
] as const;

export const CITIES = [
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow',
  'patna', 'ranchi', 'bhopal', 'indore', 'nagpur',
  'varanasi', 'agra', 'chandigarh', 'gurgaon', 'noida',
  'kochi', 'coimbatore', 'vizag', 'surat', 'vadodara',
  'rajkot', 'jodhpur', 'guwahati', 'dehradun', 'bhubaneswar'
] as const;

export type Category = typeof CATEGORIES[number];
export type City = typeof CITIES[number];

// Metro cities → English content; Tier 2/3 → Hindi/Hinglish
const METRO_CITIES = new Set([
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai',
  'kolkata', 'pune', 'ahmedabad'
]);

// Pages with genuinely near-zero search intent — served with noindex
const NOINDEX_COMBOS = new Set([
  'event-rajkot', 'event-jodhpur', 'event-guwahati', 'event-dehradun', 'event-bhubaneswar',
]);

export const CITY_DISPLAY: Record<string, string> = {
  mumbai: 'Mumbai', delhi: 'Delhi', bangalore: 'Bangalore', hyderabad: 'Hyderabad',
  chennai: 'Chennai', kolkata: 'Kolkata', pune: 'Pune', ahmedabad: 'Ahmedabad',
  jaipur: 'Jaipur', lucknow: 'Lucknow', patna: 'Patna', ranchi: 'Ranchi',
  bhopal: 'Bhopal', indore: 'Indore', nagpur: 'Nagpur', varanasi: 'Varanasi',
  agra: 'Agra', chandigarh: 'Chandigarh', gurgaon: 'Gurgaon', noida: 'Noida',
  kochi: 'Kochi', coimbatore: 'Coimbatore', vizag: 'Vizag', surat: 'Surat',
  vadodara: 'Vadodara', rajkot: 'Rajkot', jodhpur: 'Jodhpur', guwahati: 'Guwahati',
  dehradun: 'Dehradun', bhubaneswar: 'Bhubaneswar',
};

export const CATEGORY_DISPLAY: Record<string, string> = {
  restaurant: 'Restaurant', salon: 'Salon', gym: 'Gym', tutor: 'Tutor',
  clinic: 'Clinic', store: 'Store', photographer: 'Photographer',
  service: 'Service Business', wedding: 'Wedding', event: 'Event',
};

const CITY_FLAVOR: Record<string, string> = {
  mumbai: 'the city that never sleeps',
  delhi: 'the heart of India',
  bangalore: "India's Silicon Valley",
  hyderabad: 'the City of Pearls',
  chennai: 'the Gateway of South India',
  kolkata: 'the City of Joy',
  pune: 'the Oxford of the East',
  ahmedabad: 'the Manchester of India',
  jaipur: 'the Pink City',
  lucknow: 'the City of Nawabs',
  patna: 'the ancient city of Pataliputra',
  ranchi: 'the City of Waterfalls',
  bhopal: 'the City of Lakes',
  indore: "India's cleanest city",
  nagpur: 'the Orange City',
  varanasi: 'the spiritual capital of India',
  agra: 'the city of the Taj Mahal',
  chandigarh: 'the City Beautiful',
  gurgaon: 'the Millennium City',
  noida: 'the satellite city of Delhi-NCR',
  kochi: 'the Queen of the Arabian Sea',
  coimbatore: 'the Manchester of South India',
  vizag: 'the City of Destiny',
  surat: 'the Diamond City',
  vadodara: 'the Cultural Capital of Gujarat',
  rajkot: 'the heart of Saurashtra',
  jodhpur: 'the Blue City',
  guwahati: 'the gateway to Northeast India',
  dehradun: 'the Doon Valley',
  bhubaneswar: 'the Temple City',
};

// Approx businesses per city for social proof
const CITY_COUNTS: Record<string, number> = {
  mumbai: 320, delhi: 280, bangalore: 260, hyderabad: 210, chennai: 190,
  kolkata: 175, pune: 165, ahmedabad: 155, jaipur: 120, lucknow: 110,
  patna: 85, ranchi: 70, bhopal: 95, indore: 105, nagpur: 90,
  varanasi: 75, agra: 65, chandigarh: 100, gurgaon: 130, noida: 125,
  kochi: 95, coimbatore: 80, vizag: 85, surat: 115, vadodara: 95,
  rajkot: 65, jodhpur: 60, guwahati: 70, dehradun: 75, bhubaneswar: 70,
};

// ─── CATEGORY CONTENT ─────────────────────────────────────────────────────────

interface CategoryContent {
  emoji: string;
  tagline: string;
  descEn: (city: string, flavor: string) => string;
  descEn2: (city: string) => string; // second paragraph for length
  descHi: (city: string, flavor: string) => string;
  descHi2: (city: string) => string;
  features: string[];
  pain_en: string;
  pain_hi: string;
  benefit_en: string;
  benefit_hi: string;
  schema_type: string;
}

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  restaurant: {
    emoji: '🍽️',
    tagline: 'Digital Menu + Online Orders Ready',
    descEn: (city, flavor) =>
      `Running a restaurant in ${city}, ${flavor}, is one of India's most competitive businesses. Between managing kitchen staff, sourcing fresh ingredients daily, keeping customers happy, and dealing with Zomato's 25-30% commission — the last thing you want is to lose customers because someone couldn't find your menu online.`,
    descEn2: (city) =>
      `WhatsWebsite fixes your digital presence in 2 minutes flat. Just send a WhatsApp message, answer 5 questions about your restaurant, and you get a professional website with your full digital menu, photo gallery, opening hours, and a direct WhatsApp order button — no commission to anyone. ${city} has lakhs of hungry customers searching "restaurants near me" every day. The ones who find you are the ones who can find you online.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — restaurant chalana India ke sabse competitive businesses mein se ek hai. Kitchen staff, fresh ingredients, customers ki satisfaction, aur Zomato ki 25-30% commission — yeh sab sambhalte hue website ke liye time kahan se lao? Agar koi aapka menu online nahi dekh sakta, woh competitor ke paas chala jaata hai.`,
    descHi2: (city) =>
      `WhatsWebsite se sirf 2 minute mein aapke restaurant ki professional website ready ho jaati hai — digital menu, photo gallery, timings, aur seedha WhatsApp order button ke saath. ${city} mein roz lakhs log "restaurant near me" search karte hain. Jo online hain unhe orders milte hain, baakon ko nahi.`,
    features: [
      '📋 Digital Menu with categories, photos & prices',
      '📸 Beautiful food photo gallery (upload via WhatsApp)',
      '📍 Google Maps location embed with directions',
      '📞 Direct WhatsApp Order button (zero commission)',
      '⭐ Customer reviews & testimonials section',
      '🕐 Opening hours with holiday notice support',
      '🚚 Delivery area & minimum order info',
      '📱 Mobile-first — 80% of food orders are from phones',
    ],
    pain_en: 'Customers search online before dining out or ordering. If your restaurant has no website, you\'re losing orders to competitors every single day — including from people who walk right past your door but couldn\'t find your menu online to decide.',
    pain_hi: 'Customers order karne se pehle menu online dekhna chahte hain. Agar aapke restaurant ki website nahi hai, toh roz orders competitors ke paas ja rahe hain — chahe aapka restaurant kitna bhi achha ho.',
    benefit_en: 'Get found on Google when someone searches "restaurant near me" or "best biryani in',
    benefit_hi: 'Jab koi search kare "restaurant near me" ya "best khana',
    schema_type: 'Restaurant',
  },

  salon: {
    emoji: '💇',
    tagline: 'Appointment Booking + Full Service Menu Online',
    descEn: (city, flavor) =>
      `Beauty professionals in ${city}, ${flavor}, already take appointments on WhatsApp — but a proper website does something WhatsApp alone can't: it gets found by strangers who don't already know you. Every week, thousands of people in ${city} move to a new area, look for a new salon, and Google "best salon near me." If you're not online, you don't exist for them.`,
    descEn2: (city) =>
      `WhatsWebsite gives your salon, parlour, or beauty studio a professional website in 2 minutes — complete with your full services list, pricing, before/after photo portfolio, and a one-tap appointment booking button. No developer needed. No monthly platform fee. Just a professional online presence that works for you 24/7 while you focus on your clients.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — beauty professionals WhatsApp pe appointments lete hain — lekin WhatsApp kuch nahi kar sakta jo website karta hai: strangers aapko dhundh nahi sakte jo aapko pehle se jaante nahi. Har hafte ${city} mein hazaron log naye area mein shift karte hain aur "best salon near me" Google karte hain. Agar aap online nahi, toh aap unke liye exist nahi karte.`,
    descHi2: (city) =>
      `WhatsWebsite se sirf 2 minute mein aapke salon ki professional website taiyaar — services list, pricing, before/after photos, aur appointment booking button ke saath. Koi developer nahi chahiye, koi monthly fee nahi. Bas ek professional online presence jo 24/7 kaam kare.`,
    features: [
      '📅 Appointment request form (direct to WhatsApp)',
      '💅 Full services & pricing list',
      '🖼️ Before/after transformation photo portfolio',
      '⭐ Client testimonials & reviews',
      '📍 Exact location with Google Maps pin',
      '📞 One-tap WhatsApp booking button',
      '🎁 Special offers & seasonal promotions section',
      '📱 Portfolio that looks stunning on mobile',
    ],
    pain_en: 'New clients Google salons before booking their first appointment. Without a website, you only grow through word-of-mouth — which has a hard ceiling. Every new resident in your area who doesn\'t know someone who knows you will book somewhere else.',
    pain_hi: 'Naye clients Google pe salon dhundte hain. Website ke bina sirf word-of-mouth pe depend rehna padta hai — jiska ceiling bahut low hai. Aapke area ka har naya resident aapke baare mein kisi se poochhe bina kisi aur ke paas jayega.',
    benefit_en: 'Show up when someone searches "best salon in',
    benefit_hi: 'Jab koi search kare "best salon',
    schema_type: 'BeautySalon',
  },

  gym: {
    emoji: '💪',
    tagline: 'Membership Plans + Batch Schedule Online',
    descEn: (city, flavor) =>
      `The fitness industry in ${city}, ${flavor}, has boomed since 2020 — but it's also become fiercely competitive. New gyms, boutique studios, and home trainers are all fighting for the same members. The gyms winning new memberships are the ones with a strong online presence. When someone Googles "gym near me," a professional website with photos, pricing, and trainer profiles is what converts the search into a walk-in.`,
    descEn2: (city) =>
      `WhatsWebsite creates your gym's professional website in 2 minutes — membership plans clearly laid out, batch timings, trainer profiles, equipment photos, and a direct inquiry button. Most new gym members in ${city} shortlist 3-4 gyms online before visiting any of them. Make sure your gym is on that shortlist.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — fitness industry boom kar rahi hai, lekin competition bhi bahut badh gaya hai. Naye gyms, boutique studios, sab fight kar rahe hain same members ke liye. Jo gyms online strong hain — professional website ke saath photos, pricing, trainers — unhe hi naye members mil rahe hain.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapke gym ki website ready — membership plans, batch timings, trainer profiles, equipment photos, aur inquiry button ke saath. ${city} mein zyaadatar log 3-4 gyms online dekh ke tabhi visit karte hain. Aapka gym us shortlist mein hona chahiye.`,
    features: [
      '💰 Membership plans & monthly/annual fees',
      '⏰ Batch timings — morning, evening, weekend',
      '🏋️ Equipment & facilities photo gallery',
      '👨‍🏫 Trainer profiles with specialisations',
      '📸 Full gym photo tour',
      '📞 Direct WhatsApp inquiry button',
      '🎯 Free trial / introductory offer section',
      '📱 Mobile-optimised — members check timings on phones',
    ],
    pain_en: 'People research gyms online before committing — they check photos of equipment, read reviews, compare prices, and look at trainer qualifications. A gym with no website loses to an equally good gym that has one, every single time.',
    pain_hi: 'Log gym join karne se pehle online research karte hain — equipment photos dekhte hain, reviews padhte hain, prices compare karte hain. Website ke bina aap equally good gym se baar-baar harenge jo online hai.',
    benefit_en: 'Rank on Google for "gym near me" or "fitness centre in',
    benefit_hi: '"gym near me" ya "best gym',
    schema_type: 'ExerciseGym',
  },

  tutor: {
    emoji: '📚',
    tagline: 'Online Presence for Coaching & Home Tuition',
    descEn: (city, flavor) =>
      `Education is serious business in ${city}, ${flavor} — and parents take coaching decisions seriously. Before enrolling their child in a coaching centre or hiring a home tutor, most parents in 2026 search online, read reviews, check faculty qualifications, and look at past results. A WhatsWebsite coaching page gives you exactly what parents are looking for, in exactly the format they trust.`,
    descEn2: (city) =>
      `Whether you run a multi-teacher coaching institute or do home tuition for 10 students, a professional website levels the playing field. Your subjects, batch timings, fee structure, student achievements, and faculty profiles — all visible, searchable, and shareable in one link. Parents in ${city} who find you online are already interested; your website converts that interest into an inquiry.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — education ek serious business hai. Parents coaching institute ya home tutor choose karne se pehle online search karte hain, reviews padhte hain, qualifications check karte hain, results dekhte hain. WhatsWebsite coaching page parents ko exactly woh information deta hai jo woh dhundh rahe hain.`,
    descHi2: (city) =>
      `Chahe aapka multi-teacher institute ho ya 10 students ka home tuition — professional website field level kar deti hai. Aapke subjects, batch timings, fees, student achievements, faculty — sab ek link mein searchable. ${city} mein jo parents aapko online dhundh ke aate hain, woh already interested hain; website unhe inquiry mein convert karti hai.`,
    features: [
      '📖 Subjects & courses with detailed curriculum',
      '📅 Batch timings & available seats',
      '💰 Fee structure (with instalment info)',
      '🏆 Student results, ranks & achievements',
      '👨‍🏫 Teacher / faculty profiles & qualifications',
      '📞 Free demo class inquiry button',
      '📸 Classroom, study material photos',
      '📱 Easy to share on WhatsApp with parents',
    ],
    pain_en: 'Parents compare coaching institutes and tutors extensively before enrolling. Being invisible online means you\'re not in the comparison at all — which is the same as losing, even if your teaching is superior.',
    pain_hi: 'Parents kai coaching centres compare karte hain pehle. Online invisible rehna matlab comparison se hi bahar hona — chahe aapki teaching kitni bhi achhi kyun na ho.',
    benefit_en: 'Get discovered when parents search "best coaching in',
    benefit_hi: 'Jab parents search karein "best tutor',
    schema_type: 'EducationalOrganization',
  },

  clinic: {
    emoji: '🏥',
    tagline: 'Patient-Ready Website for Doctors & Clinics',
    descEn: (city, flavor) =>
      `Healthcare discovery has gone digital in ${city}, ${flavor}. Patients increasingly search for doctors online — especially when they move to a new area, need a specialist, or want to verify a referred doctor's credentials. A clinic with a professional online presence gets found first, builds trust before the first appointment, and sees significantly more new patient inquiries than one without.`,
    descEn2: (city) =>
      `WhatsWebsite creates a medically appropriate, professional website for your clinic or individual practice in 2 minutes. Your specialisation, OPD timings, qualifications, clinic photos, and appointment booking via WhatsApp — all in one clean, trustworthy page. The Medical Council of India permits doctors to have informational websites. Many of your competitors already have one.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — patients doctor choose karne se pehle Google karte hain — especially jab naye area mein move kiya ho, specialist chahiye, ya refer kiye gaye doctor ko verify karna ho. Professional online presence wale clinic ko pehle dhundha jaata hai, aur zyaada patients milte hain.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapke clinic ki professional website ready — specialisation, OPD timings, qualifications, clinic photos, aur appointment booking via WhatsApp. MCI informational websites allow karta hai. Aapke bahut se competitors ki pehle se website hai.`,
    features: [
      '🩺 Doctor profile & full qualifications (MBBS, MD, etc.)',
      '⏰ OPD days, timings & closed days clearly marked',
      '🏥 Specialisations, procedures & conditions treated',
      '📍 Clinic location with directions & parking info',
      '📞 Appointment via WhatsApp (no call-waiting)',
      '💊 Facilities, equipment & associated hospitals',
      '⭐ Patient testimonials (initials only for privacy)',
      '📱 Mobile-first — patients search on phones',
    ],
    pain_en: 'Patients Google "doctor near me" before visiting. Without a website, you\'re invisible at the most critical moment — when someone needs a doctor and you\'re the right one for them but they can\'t find you.',
    pain_hi: '"Doctor near me" Google karna patients ka pehla kaam hai. Website ke bina aap invisible hain uss crucial moment mein jab patient ko exactly aap jaisa doctor chahiye.',
    benefit_en: 'Be found when patients search for specialists in',
    benefit_hi: 'Jab patient search kare "doctor',
    schema_type: 'MedicalBusiness',
  },

  store: {
    emoji: '🛒',
    tagline: 'Your Shop — Online & Open 24/7',
    descEn: (city, flavor) =>
      `Retail is being disrupted faster than ever in ${city}, ${flavor}. Amazon and Flipkart have trained shoppers to research online before buying anything — even from local stores. The smart local retailers are winning by being discoverable online while offering what e-commerce can't: same-day pickup, personal service, the ability to see and touch the product, and the trust of a familiar face.`,
    descEn2: (city) =>
      `WhatsWebsite gives your shop or store a professional online presence in 2 minutes — a product catalogue with photos, a WhatsApp order button, your location, and opening hours. When a customer in ${city} searches your type of store online, you show up. They see your products, they message you on WhatsApp, you make a sale — without paying any platform commission.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — retail tezi se badal raha hai. Amazon aur Flipkart ne shoppers ko online research karne ki aadat daal di hai — local stores se kharidne se pehle bhi. Smart local retailers online discoverable rahke jeet rahe hain.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapki dukaan online — product catalogue, WhatsApp order button, location, aur timings ke saath. Jab koi ${city} mein aapke type ki dukaan search kare, aap dikhte ho. Products dekho, WhatsApp pe order karo — koi commission nahi.`,
    features: [
      '🛍️ Product catalogue with photos & descriptions',
      '💰 Price list (easy to update any time)',
      '📞 WhatsApp Order button (direct to you)',
      '📍 Store location & directions on Google Maps',
      '🕐 Opening hours with holiday notes',
      '🚚 Delivery area, charges & estimated time',
      '⭐ Customer reviews section',
      '📱 Share product links on WhatsApp to customers',
    ],
    pain_en: 'Stores with a website get 3x more online inquiries than stores without one. Every day without a website, you\'re sending potential customers to the competitor who shows up when they search online.',
    pain_hi: 'Website wali dukaan ko 3x zyaada online inquiries milti hain. Website ke bina aap roz potential customers competitor ke paas bhej rahe ho.',
    benefit_en: 'Show up when people search "shop near me" or products in',
    benefit_hi: '"shop near me" ya "online order',
    schema_type: 'Store',
  },

  photographer: {
    emoji: '📷',
    tagline: 'Portfolio Website That Books You More Shoots',
    descEn: (city, flavor) =>
      `Photography in ${city}, ${flavor}, is a relationship business — clients hire people whose work they love, and trust before meeting. An Instagram page is great for followers, but a dedicated portfolio website does something Instagram can't: it ranks on Google, tells your complete story, shows your packages, and gives clients a professional way to inquire that isn't a DM or a cold WhatsApp.`,
    descEn2: (city) =>
      `WhatsWebsite creates your photography portfolio website in 2 minutes — a curated gallery of your best work, your specialisations (weddings, portraits, corporate, events), packages with pricing, and an inquiry form. Clients in ${city} who find you on Google are high-intent — they're actively looking to book, not just scroll.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — photography ek relationship business hai. Clients unhe hire karte hain jinka kaam unhe pasand aata hai aur jis par unhe trust ho. Instagram followers ke liye achha hai, lekin dedicated portfolio website kuch aisa karta hai jo Instagram nahi karta: Google pe rank karta hai, aapki puri story batata hai, aur professional inquiry ka option deta hai.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapka photography portfolio website ready — curated gallery, specialisations, packages with pricing, aur inquiry form. ${city} mein jo log aapko Google pe dhundhte hain woh high-intent hote hain — woh actively book karna chahte hain, sirf scroll nahi.`,
    features: [
      '📸 Curated portfolio gallery (wedding, portrait, event, etc.)',
      '💰 Packages & pricing (filters serious inquiries)',
      '🎬 Category pages: Wedding / Event / Portrait / Corporate',
      '📅 Availability calendar link or inquiry form',
      '⭐ Client testimonials with project type',
      '📞 Direct WhatsApp inquiry button',
      '🎥 Video reel / showreel section',
      '📱 Portfolio looks stunning on mobile screens',
    ],
    pain_en: 'Clients Google photographers before booking. A photographer with no website is a photographer whose work doesn\'t get seen — no matter how talented they are. Your portfolio website is your most powerful booking tool.',
    pain_hi: 'Clients hire karne se pehle Google karte hain. Website ke bina aapka kaam nahi dikhai deta — chahe aap kitne bhi talented kyun na ho.',
    benefit_en: 'Rank for "photographer in',
    benefit_hi: '"photographer',
    schema_type: 'ProfessionalService',
  },

  service: {
    emoji: '🔧',
    tagline: 'Get More Calls for Your Service Business',
    descEn: (city, flavor) =>
      `When something breaks in ${city}, ${flavor} — a leaking pipe, a dead AC in the middle of summer, a sparking switchboard — the first thing people do is reach for their phone and Google for help. Plumbers, electricians, AC technicians, carpenters: the service professionals who show up in those searches are the ones getting the calls. The rest don't exist.`,
    descEn2: (city) =>
      `WhatsWebsite creates a professional website for your service business in 2 minutes — your services list, area coverage, rates, customer reviews, and a direct WhatsApp contact button. When someone in ${city} has an emergency and searches for your type of service, your website is what makes you the obvious, trustworthy choice over an unknown number from a pamphlet.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — jab kuch toot jaata hai — pipe leak, AC kharab, switchboard spark kare — log turant phone uthate hain aur Google karte hain. Jo plumber, electrician, AC mechanic, carpenter un searches mein dikhai dete hain, unhe calls milte hain. Baakon ke liye koi call nahi.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapke service business ki website ready — services, area coverage, rates, customer reviews, aur WhatsApp contact button ke saath. Jab ${city} mein kisi ko emergency ho aur woh aapka type ka service search kare, aapki website use aap par trust dilati hai.`,
    features: [
      '🔧 Services list with detailed descriptions',
      '🗺️ Service area coverage (which areas/pincodes you cover)',
      '💰 Starting rates / rate card (sets expectations)',
      '📞 Emergency WhatsApp contact button',
      '⭐ Verified customer reviews',
      '📸 Work portfolio / before-after photos',
      '🕐 Availability hours & emergency call option',
      '📱 Works on all phones — even feature phones via WhatsApp',
    ],
    pain_en: 'When someone\'s AC breaks at 2pm on a hot day, they call the first plausible result Google gives them. Without a website, that call goes to your competitor — every single time.',
    pain_hi: 'Jab kisi ka AC kharab ho 2 baje garmi mein, woh Google ka pehla plausible result call karta hai. Website ke bina woh call aapke competitor ke paas jaata hai — har baar.',
    benefit_en: 'Be the first service provider found when someone searches in',
    benefit_hi: 'Sabse pehle dikho jab koi service search kare',
    schema_type: 'LocalBusiness',
  },

  wedding: {
    emoji: '💍',
    tagline: 'Wedding Website for Couples & Wedding Planners',
    descEn: (city, flavor) =>
      `Weddings in ${city}, ${flavor} are grand affairs involving hundreds of guests, multiple venues, and weeks of coordination. A wedding website replaces the ten different WhatsApp messages you send to different groups — venue address, map, accommodation options, event schedule, RSVP — all in one link that every guest can access any time. Modern couples in ${city} increasingly share a wedding website before their invitations.`,
    descEn2: (city) =>
      `For wedding planners in ${city}: a portfolio website showcasing your past events is your most effective sales tool. Couples looking for planners do research — they want to see your work, your style, and your testimonials before calling you. WhatsWebsite builds both types in 2 minutes. Whether you're planning your own wedding or marketing your planning business, a website makes the difference.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — shaadi ek bada jashn hota hai — hundreds of guests, multiple venues, aur weeks of coordination. Wedding website un sab WhatsApp messages ko replace karta hai jo aap alag-alag groups ko bhejte ho — venue, map, schedule, RSVP — sab ek link mein. Aajkal couples share karte hain.`,
    descHi2: (city) =>
      `Wedding planners ke liye: portfolio website aapka sabse effective sales tool hai. Couples hire karne se pehle research karte hain — aapka kaam, style, testimonials dekhte hain. WhatsWebsite dono type mein 2 minute mein banata hai.`,
    features: [
      '💑 Couple story & engagement photos',
      '📅 Wedding date countdown timer',
      '📍 Venue details with Google Maps for each event',
      '✉️ RSVP form (guest confirmation)',
      '📸 Beautiful photo gallery',
      '💐 Full wedding events schedule (mehndi/sangeet/pheras)',
      '🏨 Accommodation & travel recommendations',
      '📱 Easy to share with all guests on WhatsApp',
    ],
    pain_en: 'A wedding website is the modern invitation, information hub, and coordination tool rolled into one. Without it, you\'re managing a wedding through hundreds of WhatsApp messages — chaotic for you, confusing for guests.',
    pain_hi: 'Wedding website modern invitation + information hub + coordination tool sab ek mein hai. Iske bina aap hundreds of WhatsApp messages se wedding manage karte ho — aapke liye chaos, guests ke liye confusion.',
    benefit_en: 'Beautiful wedding pages for couples and planners in',
    benefit_hi: 'Aapki shaadi ke liye sundar website',
    schema_type: 'EventVenue',
  },

  event: {
    emoji: '🎉',
    tagline: 'Event Page with Registration & All Details in One Link',
    descEn: (city, flavor) =>
      `Organising an event in ${city}, ${flavor} — a conference, product launch, cultural show, alumni meet, or community gathering — requires getting the right people to show up. A WhatsApp poster gets lost in 200 other messages. A dedicated event website gets shared, gets remembered, and most importantly: gets registrations. Your event website is the professional face of your event.`,
    descEn2: (city) =>
      `WhatsWebsite creates your event landing page in 2 minutes — full event details, speaker/performer profiles, registration form with payment, schedule by day/session, sponsor logos, and a shareable link that works beautifully when shared on WhatsApp, Instagram, or LinkedIn. Events in ${city} that have a website see significantly higher registration rates than those with only social media promotion.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — event organize karna — conference, product launch, cultural show, alumni meet — sahi logon ko laana hota hai. WhatsApp poster 200 aur messages mein kho jaata hai. Dedicated event website share hoti hai, yaad rehti hai, aur registrations leti hai.`,
    descHi2: (city) =>
      `WhatsWebsite se 2 minute mein aapka event page ready — full details, speakers/performers, registration form with payment, schedule, sponsors, aur shareable link jo WhatsApp, Instagram, LinkedIn sab pe achha dikhta hai.`,
    features: [
      '🎯 Event details, description & what to expect',
      '📅 Date, time & full session schedule',
      '📍 Venue with directions & parking info',
      '🎤 Speaker / performer profiles with bios',
      '🎟️ Registration with UPI / card payment',
      '📸 Past event photo gallery (for recurring events)',
      '📣 Sponsor showcase section',
      '📱 Registration link works on all phones',
    ],
    pain_en: 'A shareable event link converts 3x better than a WhatsApp image poster. Capture registrations in advance, share updates, and look credible — all things a poster can\'t do.',
    pain_hi: 'Event website WhatsApp poster se 3x better convert karta hai. Advance registrations, updates, aur credibility — sab kuch ek poster nahi kar sakta.',
    benefit_en: 'Create professional event pages for events in',
    benefit_hi: 'Apna event famous karo',
    schema_type: 'Event',
  },
};

// ─── CATEGORY FAQs ────────────────────────────────────────────────────────────
// 5 unique, helpful FAQs per category. These are the highest quality signal.

interface FaqItem { q: string; a: string; }

const CATEGORY_FAQS: Record<string, FaqItem[]> = {
  restaurant: [
    {
      q: 'How will a website help my restaurant get more direct orders?',
      a: 'When someone searches "restaurant near me" or "food delivery" on Google, businesses with websites appear first — and with a direct WhatsApp Order button, customers can order instantly without going through Zomato or Swiggy (and you keep 100% of the revenue). Most WhatsWebsite restaurants see new online inquiries within 2-4 weeks of launch.',
    },
    {
      q: 'Do I need to update the menu manually on the website?',
      a: 'No. Just WhatsApp us your updated menu — new items, price changes, seasonal additions — and we update it within a few hours. No logins, no dashboards, no technical skills needed. Most owners message us once every few weeks with changes.',
    },
    {
      q: 'How is WhatsWebsite different from Zomato or Swiggy?',
      a: 'Zomato and Swiggy charge 20-30% commission on every single order. WhatsWebsite is YOUR property — all orders come directly to your WhatsApp, zero commission to anyone. Many smart restaurants use Zomato for initial discovery and WhatsWebsite for direct repeat orders from regulars.',
    },
    {
      q: 'Will my restaurant show up on Google after getting a website?',
      a: 'Yes. Your WhatsWebsite is built with proper SEO — page titles, meta descriptions, structured data, and sitemap submission — so Google indexes it quickly. For maximum local visibility, we also guide you on setting up a free Google Business Profile (Maps listing), which works in conjunction with your website.',
    },
    {
      q: 'My restaurant is already popular. Why do I need a website?',
      a: 'Word-of-mouth brings people who know someone who knows you. A website brings strangers who search online — a completely different and much larger audience. New residents, people visiting the area, office workers looking for lunch options: they only discover you digitally. Popularity has a ceiling; online presence doesn\'t.',
    },
  ],

  salon: [
    {
      q: 'Can customers book appointments directly through the website?',
      a: 'Yes. Your website includes an Appointment Request form that sends the booking details (name, service, preferred time) directly to your WhatsApp. You confirm by replying. No third-party booking app, no monthly subscription — just WhatsApp, which you already use.',
    },
    {
      q: 'Should I still use Instagram alongside a website?',
      a: 'Absolutely — they work together perfectly. Instagram builds your follower base and showcases daily work; your website converts those followers and new Google visitors into bookings. Add your WhatsWebsite link in your Instagram bio so anyone who loves your work can book immediately.',
    },
    {
      q: 'How much does a salon website actually cost?',
      a: 'WhatsWebsite is free to start — your website lives at yourname.whatswebsite.com at zero cost. A custom domain like yoursalonname.in costs ₹999/year (less than ₹3/day). Most salons recover this cost with a single extra booking from an online inquiry.',
    },
    {
      q: 'I work from home. Should I still have a website?',
      a: 'Especially if you work from home. A professional website gives your home studio credibility — parents feel comfortable, clients feel confident, and your rates can be higher because you look established. Your address stays private; we show the general area instead.',
    },
    {
      q: 'Can I show before/after transformation photos on the website?',
      a: 'Yes, and you should — it\'s the single biggest factor in salon bookings. Your website has a dedicated portfolio section. Upload your best transformations via WhatsApp, we put them on your website. Clients book with their eyes first.',
    },
  ],

  gym: [
    {
      q: 'How will a gym website actually bring me new members?',
      a: 'People research gyms online before visiting any of them — they check photos of equipment, compare pricing, look at trainer profiles, and read reviews. A professional website with great photos puts your gym on their shortlist. Without one, you\'re not even in the running for anyone who searches online.',
    },
    {
      q: 'Can I show batch timings and class schedules on the website?',
      a: 'Yes. Your website has a Schedule section showing morning/evening batches, class types (yoga, Zumba, CrossFit, strength training), and trainer names. We update it whenever your schedule changes — just WhatsApp us the new timings.',
    },
    {
      q: 'Can members pay gym fees online through the website?',
      a: 'Your website includes a WhatsApp contact button for fee inquiries. For online fee collection, we can add a UPI payment link or a Razorpay button — members pay monthly fees digitally without visiting the gym. Ideal for recurring members.',
    },
    {
      q: 'How is a gym website different from just having a Google Maps listing?',
      a: 'Google Maps tells people you exist. Your website tells them WHY to choose you — your equipment quality, certified trainers, specific batch options, and member testimonials. The combination of Maps + WhatsWebsite gives you maximum local search dominance.',
    },
    {
      q: 'I have a small gym with basic equipment. Can I still have a good website?',
      a: 'Absolutely. Many members specifically prefer smaller gyms — less crowded, more personal attention, better community feel. Your website can communicate exactly that advantage. Not all customers want a commercial gym chain. Your website is where you tell your story.',
    },
  ],

  tutor: [
    {
      q: 'Will a coaching website actually bring me more students?',
      a: 'Yes — parents actively Google coaching centres before enrolling their children, especially for competitive exam prep. Institutes with websites report 2-3x more inquiries from new families vs pure word-of-mouth. The parents who find you online are often the most serious about their child\'s education.',
    },
    {
      q: 'Should I put fees on the website?',
      a: 'We recommend showing a fee range (e.g., ₹2,000–5,000/month) rather than exact figures. It sets expectations, filters out price-sensitive inquiries, and attracts serious parents. Those who inquire after seeing the range are already pre-qualified — you spend less time in negotiations.',
    },
    {
      q: 'I teach from home. Should I still have a website?',
      a: 'Especially if you teach from home. A professional website with your qualifications, subjects, and student testimonials signals seriousness. Parents feel more comfortable sending their children when you look established online. Your home address can stay private — we show the general area.',
    },
    {
      q: 'Can I show student results and achievements on the website?',
      a: 'Yes, and nothing converts parents faster. Your website has a dedicated Results section for exam scores, percentiles, college admissions, and student success stories (with the student\'s permission). Real proof of results is the most powerful trust signal for coaching institutes.',
    },
    {
      q: 'Can I list multiple subjects, levels, and batch timings?',
      a: 'Yes. Your website includes a full course catalogue: subjects (Maths, Science, English, IIT-JEE, NEET, CA Foundation, etc.), levels (Class 6-12, graduation), batch timings, and fee structure. Parents see everything at a glance and WhatsApp you directly for a demo class.',
    },
  ],

  clinic: [
    {
      q: 'Is it appropriate for a doctor to have a website?',
      a: 'Yes — it\'s increasingly essential and fully permitted by the Medical Council of India (informational websites). Patients in 2026 routinely Google doctors before their first visit, especially when they\'ve moved to a new area or need a specialist. A website with your qualifications and specialisation builds immediate trust.',
    },
    {
      q: 'What information should my clinic website include?',
      a: 'The essentials: your name, qualifications (MBBS, MD, DM, etc.), specialisation, OPD days and timings, clinic address with Google Maps pin, and an appointment request button. Optional but valuable: consultation fees, facilities list, and your own professional photo. Photos of your clinic significantly increase patient confidence.',
    },
    {
      q: 'Will patients be able to book appointments through the website?',
      a: 'Yes. Your website includes an Appointment Request button that sends the request (name, contact, preferred slot) directly to your WhatsApp or clinic receptionist\'s number. No app needed. You confirm by WhatsApp reply. Simple, and patients already use WhatsApp.',
    },
    {
      q: 'What about patient privacy and medical information?',
      a: 'Your website contains only your publicly shareable information — qualifications, clinic details, specialisation, and timings. No patient data is stored or displayed. Patient testimonials, if used, reference initials and general condition (e.g., "knee pain treatment") — no private health information.',
    },
    {
      q: 'How does a website help my clinic more than a Practo or JustDial listing?',
      a: 'Practo and JustDial show you alongside 10-20 competing doctors and may show paid results above you. Your own website is just about YOU — no competitors on the same page, no distraction. Patients searching specifically for your specialisation find a focused, trustworthy profile that\'s 100% yours.',
    },
  ],

  store: [
    {
      q: 'Can my store show its full product catalogue online?',
      a: 'Yes. Your WhatsWebsite includes a Product Catalogue section with photos, descriptions, and prices. Customers browse 24/7 and WhatsApp you to order or check availability. Think of it as your always-open digital shop window — visible even when your physical shutters are down.',
    },
    {
      q: 'How do I compete with Amazon and Flipkart with just a website?',
      a: 'Amazon competes on price and logistics. You compete on locality, trust, and immediacy. Someone who wants something today — same day, no delivery wait — buys from a local store. A website positions you as "the expert local option" vs Amazon\'s impersonal marketplace. Many customers prefer supporting local businesses; they just need to find you first.',
    },
    {
      q: 'My shop is small. Do I really need a website?',
      a: 'If your shop has a phone number, you need a website. Whenever someone finds your number (on a visiting card, a referral, a local pamphlet), the first thing they do is Google your shop name to verify legitimacy. If nothing comes up, they hesitate — or worse, they call someone else. A website = instant credibility.',
    },
    {
      q: 'Can customers order from my store through the website?',
      a: 'Yes. The WhatsApp Order button lets customers message you directly. You coordinate delivery or pickup via chat. For prepaid orders, we can add a UPI payment button so customers pay in advance — then you confirm and dispatch. No separate app, no platform fee.',
    },
    {
      q: 'How often can I update products and prices?',
      a: 'Anytime — just WhatsApp us the changes and we update within 24 hours (usually same day). For frequent updates, we can set up a simple product list format so you send changes in a standard format and we batch-update weekly.',
    },
  ],

  photographer: [
    {
      q: 'How do I get more photography bookings through a website?',
      a: 'Your portfolio website does two things: (1) ranks on Google for searches like "photographer in [city]" so new clients find you, and (2) converts visitors into inquiries with your curated best work. A strong portfolio website is your best salesperson — it works 24/7, never takes a day off, and never forgets to follow up.',
    },
    {
      q: 'Should my photography website show pricing?',
      a: 'Yes, for one specific reason: it saves your time. Showing your starting price (e.g., "Wedding packages from ₹25,000") filters out clients who can\'t afford your rate. The inquiries you do get are pre-qualified — less negotiation, higher conversion. Most experienced photographers say it improved inquiry quality dramatically.',
    },
    {
      q: 'How is a portfolio website different from just an Instagram page?',
      a: 'Instagram is a social platform controlled by an algorithm — your posts appear when the algorithm decides. Your website is always there, always showing exactly what you choose, and ranks on Google (Instagram posts don\'t). When a client searches "wedding photographer in [city]," your website appears; your Instagram usually doesn\'t.',
    },
    {
      q: 'I mainly photograph weddings. When should I start marketing?',
      a: 'Wedding bookings happen 6-18 months in advance for metro cities, 3-6 months for smaller cities. Your website running year-round captures couples planning ahead. A couple planning their December 2026 wedding might be searching for photographers in early 2026 — if your website is live, you\'re already in the running.',
    },
    {
      q: 'Can I have separate pages for wedding, portrait, and corporate photography?',
      a: 'Yes. Your website has category sections — Wedding, Portrait, Event, Corporate, Product — each with its own gallery and description. This also helps SEO: someone searching "corporate photographer in [city]" finds your corporate section, not your wedding gallery. More targeted = more relevant inquiries.',
    },
  ],

  service: [
    {
      q: 'Why would someone search online for a plumber instead of asking a neighbour?',
      a: 'New residents, people in apartment complexes where neighbours are strangers, those whose usual contacts aren\'t available — they all Google. "AC repair near me" and "plumber near me" are among India\'s most searched local queries. If you\'re not in those results, you\'re not getting those calls.',
    },
    {
      q: 'How do I handle competitors appearing alongside my listing?',
      a: 'On JustDial and Sulekha, competitors appear right next to you. Your own website is just about YOU — no competitor listings, no distraction. When someone lands on your page, they see only your work, your reviews, your credentials. Total control over your first impression.',
    },
    {
      q: 'Should I show my service rates on the website?',
      a: 'We recommend showing starting rates (e.g., "AC servicing from ₹500") rather than fixed prices, since actual charges depend on the problem. This sets expectations upfront, reduces bargaining, and positions you as transparent — which builds trust before you\'ve even spoken to the customer.',
    },
    {
      q: 'I get most work through referrals. Why do I need a website?',
      a: 'When someone refers you, the first thing the new customer does is Google your name or business to verify you\'re legitimate. If nothing comes up, they hesitate — or worse, they find a competitor who sounds similar. A website converts referrals into confirmed clients instead of losing them to doubt.',
    },
    {
      q: 'Can I show before/after photos of my work on the website?',
      a: 'Yes — and it\'s one of the most powerful trust signals for service businesses. Before/after photos of electrical rewiring, plumbing work, AC repairs, or carpentry projects show customers what you\'re capable of. Real work photos convert dramatically better than text descriptions alone.',
    },
  ],

  wedding: [
    {
      q: 'Who is a wedding website actually for — the couple or the guests?',
      a: 'Both. For the couple: it\'s a single shareable link instead of ten separate WhatsApp messages to different groups. For guests: venue address with Google Maps, full event schedule (mehndi/sangeet/pheras), accommodation options nearby, and RSVP — all in one place, accessible any time. No more "what time does the baraat start?" calls.',
    },
    {
      q: 'How early should we create our wedding website?',
      a: 'Ideally 3-6 months before the wedding. Early creation gives guests time to save the date, plan travel, and RSVP. For destination weddings or large events with outstation guests, 6-9 months in advance is better. With WhatsWebsite, your site is live in 2 minutes — you can create it any time.',
    },
    {
      q: 'Can we update the wedding website if plans change?',
      a: 'Yes, easily. WhatsApp us the changes and we update within a few hours. Venue changed, timing shifted, new event added — no problem. We also add an Updates section where guests can check for last-minute changes without you having to message everyone separately.',
    },
    {
      q: 'Is a wedding website only for large or expensive weddings?',
      a: 'Not at all. Even a 50-person family wedding benefits enormously — coordinating venue details, schedule, and RSVP through a single link is much easier than managing it through WhatsApp groups. And it makes the wedding look and feel more organized and special, regardless of budget.',
    },
    {
      q: 'Can wedding planners use WhatsWebsite for their portfolio?',
      a: 'Yes — wedding planners get a completely different version: a portfolio website showcasing past weddings with photos, the services you offer (decoration, catering coordination, venue management), package pricing, and client testimonials. It\'s a lead generation tool, not a wedding invite. Many planners in metro cities have used it to book corporate and destination weddings.',
    },
  ],

  event: [
    {
      q: 'What kinds of events benefit most from a dedicated website?',
      a: 'Any event with more than 30 attendees benefits — conferences, product launches, cultural festivals, alumni meets, community gatherings, trade fairs, religious events, and sports tournaments. The larger and more complex the event, the more value a website adds for registration, communication, and credibility.',
    },
    {
      q: 'Can I collect ticket payments or registrations through the event website?',
      a: 'Yes. Your event website includes a Registration section with a payment link (Razorpay or Instamojo) for paid events. Attendees register and pay online; you see real-time registration counts. For free events, the form collects name, email, and contact for headcount management.',
    },
    {
      q: 'How do I drive people to the event website?',
      a: 'Share the link in WhatsApp groups, Instagram stories, LinkedIn (for professional events), and email newsletters. For offline promotion, add a QR code on posters that links directly to the event page. A website link is far more shareable and trackable than a PDF or image.',
    },
    {
      q: 'Can the event website be reused for future editions?',
      a: 'Yes. For recurring events (annual conferences, yearly festivals, monthly meetups), we update the same website for each edition. This builds SEO value over time — your event page ranks higher each year as it accumulates search history and links. Past event photos and testimonials from previous editions also build credibility.',
    },
    {
      q: 'Can I have a schedule page for multi-day or multi-session events?',
      a: 'Yes. Multi-day events get a full Schedule page showing each day\'s sessions, speakers, timing, and venue (if multiple). Attendees plan which sessions to attend. We structure it with tabs or an accordion so the schedule is easy to navigate on a mobile phone.',
    },
  ],
};

// ─── AREA DATA ────────────────────────────────────────────────────────────────
// 15 cities × 10 areas = 150 genuine local profiles.
// Each description is written to actually help someone understand the area.

interface AreaData {
  display: string;
  tagline: string;
  description: string;
  demographics: string;
  knownFor: string[];
  businessCount: number;
}

export const CITY_AREAS: Record<string, Record<string, AreaData>> = {
  mumbai: {
    bandra: {
      display: 'Bandra',
      tagline: "Mumbai's creative and cultural heartland",
      description: `Bandra is where Mumbai's Bollywood stars, startup founders, and expat professionals all coexist within walking distance of each other. Carter Road and Linking Road are among the city's most photographed commercial strips — lined with cafes, boutiques, and restaurants that cater to an affluent, trend-conscious clientele. The demographic here is overwhelmingly young (25-40), high-income, and digitally native. These are people who Google a restaurant before visiting, book salon appointments online, and research everything before spending. A business in Bandra without a website is invisible to its most important audience.`,
      demographics: 'Affluent millennials, Bollywood industry, expats, creative professionals',
      knownFor: ['Linking Road shopping', 'Carter Road cafes & nightlife', 'Bollywood celebrity presence', "Mumbai's expat hub"],
      businessCount: 45,
    },
    andheri: {
      display: 'Andheri',
      tagline: "Mumbai's largest suburb and commercial engine",
      description: `Andheri is Mumbai's most populous suburb and one of the city's most economically diverse zones. Andheri West houses Bollywood's film studios, advertising agencies, and a thriving hospitality scene. Andheri East is Mumbai's corporate and manufacturing corridor — tech parks, pharmaceutical companies, and the International Airport. The sheer volume of residents and daily commuters makes Andheri one of the highest-potential markets in India for any service or retail business. Online discovery is critical here: the suburb is too large to rely on walk-in traffic alone.`,
      demographics: 'Film industry workers, IT professionals, corporate employees, mixed income',
      knownFor: ['Film City & studios', 'International Airport proximity', 'Versova beach', 'Lokhandwala market'],
      businessCount: 52,
    },
    juhu: {
      display: 'Juhu',
      tagline: "Mumbai's beachside luxury enclave",
      description: `Juhu is synonymous with Mumbai's elite. Celebrity residences, luxury hotels like JW Marriott and Novotel, and Juhu Beach as the social gathering point create a unique premium market. The residents here — senior film industry executives, NRIs, and Mumbai's old-money families — have high disposable income and high expectations. They expect businesses they patronise to have a professional online presence. A restaurant, salon, or fitness studio in Juhu targeting this demographic without a website is signalling the wrong thing entirely.`,
      demographics: 'High-net-worth individuals, Bollywood elite, NRIs, luxury hotel guests',
      knownFor: ['Juhu Beach', 'Celebrity residences', 'Luxury hotels', 'Fine dining scene'],
      businessCount: 28,
    },
    powai: {
      display: 'Powai',
      tagline: "Mumbai's tech startup and IIT corridor",
      description: `Powai is the Mumbai suburb that tech professionals call home. IIT Bombay anchors the area intellectually, while Hiranandani township houses some of the city's best-planned infrastructure alongside dozens of tech companies. The resident profile — engineers, product managers, startup founders, MBA graduates — is thoroughly digital-first. They use apps, pay online, and discover everything through search. Any business in Powai that doesn't have a digital presence is leaving significant revenue on the table from this high-income, high-volume market.`,
      demographics: 'IIT alumni, tech startup founders, product managers, high-income young professionals',
      knownFor: ['IIT Bombay campus', 'Hiranandani township', 'Powai Lake', 'Tech startup ecosystem'],
      businessCount: 38,
    },
    worli: {
      display: 'Worli',
      tagline: 'Luxury living meets corporate Mumbai',
      description: `Worli is where South Mumbai's old wealth and the new corporate elite converge. The Bandra-Worli Sea Link, luxury residential towers overlooking the Arabian Sea, and proximity to Lower Parel's business district make this one of Mumbai's most premium addresses. Corporate headquarters, five-star hotels, and boutique businesses serve a clientele that expects premium everything — including the digital presence of businesses they engage with. This is a neighbourhood where being discoverable online directly correlates with being taken seriously.`,
      demographics: 'Corporate executives, old Mumbai families, financial sector professionals',
      knownFor: ['Bandra-Worli Sea Link', 'Luxury high-rises', 'Corporate headquarters', 'Five-star hotels'],
      businessCount: 31,
    },
    malad: {
      display: 'Malad',
      tagline: "Western Mumbai's retail and residential hub",
      description: `Malad is one of Mumbai's most commercially active western suburbs, anchored by Infiniti Mall, one of the city's biggest shopping destinations. The area's resident profile is predominantly middle-class families and working professionals who are increasingly shopping and discovering services online. Malad East has several call centres and tech companies; Malad West is purely residential with dense housing colonies. The scale of the residential population alone — several lakh residents — makes it a massive market where digital presence is the difference between reaching them and not.`,
      demographics: 'Middle-class families, working professionals, call centre employees',
      knownFor: ['Infiniti Mall', 'Mindspace business park', 'Marve beach', 'Orlem'],
      businessCount: 34,
    },
    goregaon: {
      display: 'Goregaon',
      tagline: 'Media city meets growing residential suburb',
      description: `Goregaon is defined by Film City — India's largest film studio complex — and a rapidly growing residential landscape. The film and media industry workers mix with IT professionals (NESCO IT Park) and an established residential community. Goregaon is undergoing rapid change as new residential towers attract young couples and families seeking affordable housing compared to Bandra and Juhu. This newer demographic is mobile-native and relies heavily on Google and apps to discover local businesses.`,
      demographics: 'Media professionals, IT workers, young families, established middle class',
      knownFor: ['Film City Mumbai', 'NESCO IT Park', 'Aarey Colony forests', 'Oberoi Mall'],
      businessCount: 32,
    },
    thane: {
      display: 'Thane',
      tagline: "Mumbai's fastest-growing satellite city",
      description: `Thane has grown from a Mumbai suburb into a full-fledged city of over 22 lakh residents with its own commercial ecosystem. The Thane-Belapur industrial belt drives significant employment, while Hiranandani Estate and multiple township projects have created an upper-middle-class residential market. Thane residents increasingly shop, eat, and discover services locally rather than travelling to Mumbai — making it a high-potential market for well-positioned local businesses with online visibility.`,
      demographics: 'Upper-middle-class families, industrial workers, township residents',
      knownFor: ['Upvan Lake', 'Viviana Mall', 'Hiranandani Estate', 'Multiple lakes and gardens'],
      businessCount: 42,
    },
    'navi-mumbai': {
      display: 'Navi Mumbai',
      tagline: "India's best-planned city — and it shows",
      description: `Navi Mumbai is one of India's most systematically planned urban areas, developed as a counter-magnet to the overcrowded island city. Areas like Vashi, Kharghar, Belapur, and Airoli house a large proportion of government employees, IT professionals, and educated families who moved here for the planned infrastructure and relative affordability. This demographic is highly tech-savvy and searches for local services online as a first step — before asking anyone. Well-optimised local businesses capture enormous value in Navi Mumbai's organised residential sectors.`,
      demographics: 'Government employees, IT professionals, educated middle-class families',
      knownFor: ['DY Patil Stadium', 'Vashi sector markets', 'Palm Beach Road', 'CIDCO planned sectors'],
      businessCount: 40,
    },
    borivali: {
      display: 'Borivali',
      tagline: "Mumbai's northernmost commercial suburb",
      description: `Borivali is one of Mumbai's most important commercial hubs in the western suburbs — its Borivali West shopping area generates massive retail footfall, and the Sanjay Gandhi National Park border gives it a distinct character among Mumbai's suburbs. The Gujarati business community is particularly strong here, with many family-owned establishments. As younger generations take over, they increasingly look for digital tools to expand their businesses — websites, online menus, and online orders are becoming the norm even for traditionally offline businesses in Borivali.`,
      demographics: 'Gujarati business families, middle-class residential population, western line commuters',
      knownFor: ['Sanjay Gandhi National Park', 'Borivali West market', 'Gujarati business community', 'Western railway terminus'],
      businessCount: 36,
    },
  },

  delhi: {
    'connaught-place': {
      display: 'Connaught Place',
      tagline: "Delhi's iconic central business district",
      description: `Connaught Place — CP — is Delhi's most famous address and the nerve centre of the capital's commercial life. The circular Lutyens-designed market has millions of footfalls monthly, housing everything from colonial-era restaurants to modern co-working spaces. CP's businesses serve a wildly diverse clientele: government officials from nearby ministries, tourists, corporate workers, and Delhi's trendy young crowd who visit for the restaurants and nightlife. Being findable online in CP is non-negotiable — competition is fierce, and the customer who can't find your website will go to the competitor three doors down who has one.`,
      demographics: 'Government employees, tourists, corporate workers, young urban professionals',
      knownFor: ['British-era architecture', 'Top restaurants & bars', 'Government ministry proximity', 'Delhi Metro connectivity'],
      businessCount: 48,
    },
    'lajpat-nagar': {
      display: 'Lajpat Nagar',
      tagline: "Delhi's most famous market destination",
      description: `Lajpat Nagar Central Market is Delhi's go-to destination for sarees, ethnic wear, home furnishings, and everything in between. The market sees massive weekend footfall from across Delhi-NCR — families driving in from Noida, Gurgaon, and Faridabad specifically to shop here. The area's businesses serve Delhi's vast middle class, a demographic that increasingly researches products online before visiting the market. Lajpat Nagar businesses with websites that show their product range and prices capture customers before they've even left their homes.`,
      demographics: 'Middle-class Delhi families, saree and ethnic wear shoppers, NCR visitors',
      knownFor: ['Central Market', 'Ethnic wear & sarees', 'Home furnishings', 'Street food'],
      businessCount: 38,
    },
    'karol-bagh': {
      display: 'Karol Bagh',
      tagline: "Delhi's largest wholesale and retail hub",
      description: `Karol Bagh is one of Delhi's oldest and busiest commercial zones — a labyrinth of markets selling electronics, clothes, jewellery, furniture, and industrial goods. It serves as both a retail destination for consumers and a wholesale hub for traders. The area's transformation is ongoing: traditional family businesses are increasingly going digital, and the new generation of traders in Karol Bagh is active on WhatsApp and looking to expand online. A website for a Karol Bagh business captures buyers who research before visiting the notoriously crowded markets.`,
      demographics: 'Wholesale traders, middle-class shoppers, electronics buyers, traditional business families',
      knownFor: ['Electronics & gadget markets', 'Traditional jewellery', 'Wholesale clothing', 'Mixed-use commercial density'],
      businessCount: 42,
    },
    'rajouri-garden': {
      display: 'Rajouri Garden',
      tagline: "West Delhi's upscale commercial hub",
      description: `Rajouri Garden has evolved into West Delhi's premium address — the J Block Market is lined with brand showrooms, upscale restaurants, and lifestyle stores catering to the area's predominantly Punjabi middle-to-upper-class residents. The consumer profile here is aspirational, brand-conscious, and digitally active. Rajouri Garden's proximity to the Delhi Metro's Blue Line makes it accessible from across the city, drawing diners and shoppers from Central Delhi, Noida, and beyond. Businesses here benefit enormously from online visibility to capture this wide catchment area.`,
      demographics: 'Punjabi families, affluent West Delhi professionals, brand-conscious shoppers',
      knownFor: ['J Block market', 'Restaurant & café scene', 'Metro connectivity', 'Brand showrooms'],
      businessCount: 35,
    },
    saket: {
      display: 'Saket',
      tagline: "South Delhi's premium mall district",
      description: `Saket is South Delhi's retail and entertainment capital, home to Select Citywalk and DLF Place — two of Delhi's most premium malls. The surrounding residential areas house South Delhi's affluent families and young professionals who work in the nearby corporate offices. Saket's consumer profile is highly educated, high-income, and expects businesses to have a digital presence. Restaurants, salons, clinics, and gyms in Saket that lack websites are immediately perceived as less established than their competitors who do.`,
      demographics: 'South Delhi affluent families, young professionals, mall shoppers, expats',
      knownFor: ['Select Citywalk mall', 'DLF Place', 'Qutub Minar proximity', 'PVR cinema complex'],
      businessCount: 40,
    },
    dwarka: {
      display: 'Dwarka',
      tagline: "Delhi's largest planned residential sub-city",
      description: `Dwarka is a planned satellite township housing over 15 lakh residents — the equivalent of a mid-sized Indian city within Delhi. Government employees, teachers, engineers, and young families form its core demographic. Dwarka is deliberately designed as a self-sufficient community with its own commercial areas, schools, and healthcare. The vast residential population creates enormous demand for every local service — but also means businesses need to be discoverable beyond word-of-mouth in such a large, spread-out community. Online presence is how you reach people in Sector 12 when your business is in Sector 6.`,
      demographics: 'Government employees, young families, teachers, middle-income professionals',
      knownFor: ['Planned sector layout', 'Metro connectivity', 'Large residential population', 'Self-sufficient township'],
      businessCount: 38,
    },
    rohini: {
      display: 'Rohini',
      tagline: "One of Asia's largest planned residential areas",
      description: `Rohini is often cited as one of Asia's largest planned residential townships, spanning dozens of sectors and housing millions of residents in North Delhi. Its scale is staggering — Rohini alone has more residents than many state capitals. The community is predominantly middle-class, with a strong concentration of government employees, teachers, and working-class families. This enormous, stable residential market creates consistent demand for every service category, but its sheer size means that only businesses with online visibility can capture customers across the full area.`,
      demographics: 'Government employees, middle-class families, teachers, working professionals',
      knownFor: ['Massive residential scale', 'Rohini court proximity', 'Local markets in each sector', 'North Delhi connectivity'],
      businessCount: 36,
    },
    pitampura: {
      display: 'Pitampura',
      tagline: "North Delhi's commercial and educational hub",
      description: `Pitampura's main commercial strip — Netaji Subhash Place — has evolved into one of North Delhi's most important business districts, mixing retail, office space, and dining. The residential area around it is dense and middle-class, with a strong presence of students (several coaching institutes operate here) and professionals. Pitampura benefits from excellent Metro connectivity on the Red Line and increasingly sees footfall from across North Delhi. Local businesses need digital visibility to capture this mixed consumer base effectively.`,
      demographics: 'Students, middle-class professionals, coaching institute attendees, North Delhi workers',
      knownFor: ['Netaji Subhash Place market', 'Coaching institutes cluster', 'Red Line Metro', 'PVR multiplex'],
      businessCount: 30,
    },
    'greater-kailash': {
      display: 'Greater Kailash',
      tagline: "South Delhi's premium residential and dining address",
      description: `Greater Kailash — GK1 and GK2 — is among South Delhi's most coveted addresses, combining old-money residential charm with an increasingly trendy dining and retail scene. The M Block Market in GK1 is famous for its restaurants, while GK2 has boutiques and specialty stores. The resident demographic is highly affluent — business families, senior professionals, and Delhi's social elite. These consumers research every business they visit and expect professional digital representation. A well-made website for a GK establishment is a baseline expectation, not a competitive advantage.`,
      demographics: 'Old-money South Delhi families, senior professionals, business owners, Delhi elite',
      knownFor: ['M Block Market restaurants', 'Luxury residential colony', 'Boutique shopping', 'South Delhi social scene'],
      businessCount: 32,
    },
    'nehru-place': {
      display: 'Nehru Place',
      tagline: "Asia's largest electronics market and Delhi's IT hub",
      description: `Nehru Place is globally known as Asia's largest electronics market — a sprawling commercial district where you can find any tech product, component, or software at competitive prices. But beyond electronics, Nehru Place's surrounding office buildings house thousands of IT professionals and corporate workers who are active lunchtime and evening consumers. The area's footfall is massive and diverse: electronics buyers from across India, IT employees from nearby offices, and the dense residential areas of South Delhi. Businesses in and around Nehru Place that go digital can tap into all three audiences simultaneously.`,
      demographics: 'IT professionals, electronics traders, South Delhi residents, tech-savvy shoppers',
      knownFor: ['Electronics & computers market', 'Software piracy history (now reformed)', 'IT companies', 'Massive daily footfall'],
      businessCount: 34,
    },
  },

  bangalore: {
    whitefield: {
      display: 'Whitefield',
      tagline: "Bangalore's original IT corridor",
      description: `Whitefield is where Bangalore's IT boom started — EPIP Zone, ITPL, and International Tech Park Bangalore (ITPB) together house hundreds of tech companies employing lakhs of professionals. What was once a quiet suburb 20 km from the city centre is now a self-contained tech ecosystem with its own malls, restaurants, hospitals, and residential townships. The demographic is overwhelmingly young (22-38), tech-educated, and digitally native. They order food on Swiggy, book doctors on Practo, and discover local businesses on Google. Any business in Whitefield without online presence is invisible to its primary market.`,
      demographics: 'IT professionals, tech company employees, young expats, dual-income families',
      knownFor: ['ITPL tech park', 'Phoenix Marketcity mall', 'International Tech Park', 'Large apartment townships'],
      businessCount: 58,
    },
    koramangala: {
      display: 'Koramangala',
      tagline: "Bangalore's startup republic — India's most entrepreneurial neighbourhood",
      description: `Koramangala is arguably India's most densely entrepreneurial neighbourhood. Over 600 cafes, 100+ co-working spaces, and hundreds of funded startups coexist in a 10-square-kilometre area that has produced more Indian unicorns than most cities. The resident and working population is young (23-32), educated, and perpetually online. They discover everything via search and apps — food, fitness, healthcare, home services. Here's the irony of Koramangala: it's full of people building apps and websites for others, but many of the physical businesses serving them (salons, clinics, restaurants) still have no website. That gap is your opportunity.`,
      demographics: 'Startup founders, software engineers, product managers, young professionals',
      knownFor: ["India's startup density", '600+ cafes on 80 Feet Road', 'Funded startup headquarters', 'Co-working spaces'],
      businessCount: 62,
    },
    indiranagar: {
      display: 'Indiranagar',
      tagline: "Bangalore's hippest neighbourhood — 100 Feet Road",
      description: `Indiranagar's 100 Feet Road is Bangalore's most celebrated dining and nightlife destination — hundreds of restaurants, craft beer bars, boutiques, and speciality stores line a single road that gets packed every evening and weekend. The consumer profile here is premium: software professionals, entrepreneurs, expats, and Bangalore's creative class who are happy to spend well when they find quality. These consumers research extensively online before visiting anywhere. A restaurant or salon in Indiranagar with no website is perceived as less serious than competitors who invest in their digital presence.`,
      demographics: 'High-income tech professionals, expats, creative entrepreneurs, Bangalore\'s social set',
      knownFor: ['100 Feet Road dining & bars', 'CMH Road boutiques', 'Craft beer scene', "Bangalore's most photographed restaurant strip"],
      businessCount: 55,
    },
    'hsr-layout': {
      display: 'HSR Layout',
      tagline: "Bangalore's planned IT suburb with lakhs of young professionals",
      description: `HSR Layout is one of Bangalore's largest planned residential areas — 27 sectors housing hundreds of thousands of young IT professionals and their families. The area became famous as a residential hub for employees of companies in Koramangala and Electronic City, and has grown into a thriving community with its own restaurants, gyms, clinics, and schools. The demographic is solidly upper-middle-class, digitally active, and uses apps and search for almost every purchase decision. Local businesses in HSR Layout have an enormous captive market — but only if those residents can find them online.`,
      demographics: 'Young IT couples, software engineers, startup employees, growing families',
      knownFor: ['27-sector planned layout', 'Large young professional population', 'Vibrant restaurant scene', 'Proximity to Koramangala & Electronic City'],
      businessCount: 48,
    },
    jayanagar: {
      display: 'Jayanagar',
      tagline: "Old Bangalore's heart — established, affluent, and underserved online",
      description: `Jayanagar is one of Bangalore's oldest planned residential areas and retains a distinctive character: wide tree-lined roads, established Kannadiga families, and a shopping district (4th Block) that has served the area for decades. The demographic is more established than the IT-heavy suburbs — older families, professionals, and business owners who have built their lives here. While they may be less digitally native than the Koramangala crowd, they actively Google for services and increasingly expect the businesses they patronise to have an online presence. Jayanagar's relative lack of digitally-forward local businesses creates a clear opportunity.`,
      demographics: 'Established Kannadiga families, senior professionals, business owners, mix of age groups',
      knownFor: ['4th Block shopping complex', 'Old Bangalore residential character', 'Tilaknagar market', 'Well-planned infrastructure'],
      businessCount: 40,
    },
    'electronic-city': {
      display: 'Electronic City',
      tagline: "Infosys, Wipro, TCS — one of Asia's largest IT parks",
      description: `Electronic City is the bedrock of Bangalore's IT reputation — home to the original campuses of Infosys and Wipro, and now hosting hundreds of tech companies across two phases. The area has over 1.5 lakh daily workers, a massive hostel and PG resident population, and a growing permanent residential community. Businesses serving Electronic City deal with a volume market — large numbers of young, single professionals with spending power and strong online habits. The key is discoverability: with so many options for food, fitness, and services, the businesses that show up on Google get the lion's share of walk-ins.`,
      demographics: 'IT company employees, young hostel residents, PG tenants, tech professionals',
      knownFor: ['Infosys & Wipro campuses', 'BIAL highway connectivity', 'Large IT workforce', 'Phase 1 & Phase 2 commercial zones'],
      businessCount: 44,
    },
    marathahalli: {
      display: 'Marathahalli',
      tagline: "Bangalore's IT crossroads — connecting tech corridors",
      description: `Marathahalli sits at the intersection of Bangalore's major IT corridors — between Whitefield, Sarjapur Road, and Outer Ring Road — making it one of the city's busiest transit and residential hubs. The area has a dense residential population of IT professionals and a commercial zone packed with every type of local service. Competition among restaurants, gyms, and salons is fierce, which means digital presence is the deciding factor for customers choosing between similar options. The business that shows up on Google when someone searches from their Marathahalli apartment wins.`,
      demographics: 'IT professionals, young couples, Outer Ring Road commuters',
      knownFor: ['Outer Ring Road junction', 'Dell & SAP campuses nearby', 'Dense residential population', 'High retail competition'],
      businessCount: 46,
    },
    'jp-nagar': {
      display: 'JP Nagar',
      tagline: "South Bangalore's fastest-growing residential address",
      description: `JP Nagar (Jayanagar Paschim Nagar) has transformed over the past decade from a quiet extension of Jayanagar into one of South Bangalore's most active residential and commercial zones. New apartment complexes have brought a younger demographic to the area, while the established phases retain Bangalore's traditional middle-class character. The mix of traditional families and young IT couples creates a broad consumer base for every service category. JP Nagar businesses that establish online visibility early capture both the older walk-in customers and the younger Google-first generation.`,
      demographics: 'Young IT couples, established Bangalore families, apartment complex residents',
      knownFor: ['Rapidly growing residential area', 'Multiple phases of development', 'Arekere Lake proximity', 'South Bangalore connectivity'],
      businessCount: 38,
    },
    rajajinagar: {
      display: 'Rajajinagar',
      tagline: "West Bangalore's established commercial and residential hub",
      description: `Rajajinagar is West Bangalore's commercial anchor — a densely populated area with a long-established business community and a large Kannada-speaking middle-class residential population. The Dr. Rajkumar Road and Chord Road commercial strips are among West Bangalore's busiest. While this part of Bangalore was historically less digitally oriented than the tech suburbs, the trend is rapidly changing — businesses here are seeing more customers who research online before visiting, and establishing online presence is becoming competitive.`,
      demographics: 'Kannada-speaking middle-class families, traditional business owners, West Bangalore residents',
      knownFor: ['Dr. Rajkumar Road commercial strip', 'Raj Mahal Vilas', 'Traditional Bangalore culture', 'Chord Road business hub'],
      businessCount: 35,
    },
    hebbal: {
      display: 'Hebbal',
      tagline: "Bangalore's northern gateway — tech and luxury growing together",
      description: `Hebbal has transformed dramatically as Bangalore expanded northward toward the airport. Once a quiet junction, it now has luxury residential towers (Manyata Tech Park adjacent), premium hotels, and a rapidly growing commercial strip. Manyata Tech Park alone houses 80,000+ employees — a massive captive market just minutes from Hebbal. The demographic is skewed toward IT professionals, business travellers, and upper-middle-class families drawn by the new residential projects. Digital discovery is particularly important here because the area's consumer base is constantly growing with new residents who haven't built local connections yet.`,
      demographics: 'IT professionals, business travellers, upper-middle-class families, Manyata Tech Park employees',
      knownFor: ['Manyata Tech Park', 'Hebbal Lake', 'Airport proximity', 'Luxury residential projects'],
      businessCount: 36,
    },
  },

  hyderabad: {
    'banjara-hills': {
      display: 'Banjara Hills',
      tagline: "Hyderabad's Beverly Hills — old wealth, new ambition",
      description: `Banjara Hills is Hyderabad's most prestigious address — the city's equivalent of Mumbai's Juhu or Delhi's Golf Links. Road No. 1, 2, and 12 are lined with luxury restaurants, premium boutiques, and specialty services catering to Hyderabad's wealthiest demographic. Old Telangana money and new pharmaceutical and IT wealth coexist here, creating a uniquely affluent market. These consumers have the highest expectations for service quality and equally high expectations that a business they patronise has a professional online presence. An establishment in Banjara Hills without a website is an anomaly.`,
      demographics: 'HNIs, pharmaceutical industry executives, Telangana business families, senior IT leaders',
      knownFor: ['Luxury dining on Road 1 & 12', 'High-end retail', 'Pharmaceutical industry presence', "Hyderabad's premium real estate"],
      businessCount: 42,
    },
    'jubilee-hills': {
      display: 'Jubilee Hills',
      tagline: 'Film industry, business families, and Hyderabad elite',
      description: `Jubilee Hills houses Hyderabad's Telugu film industry professionals, successful business owners, and the city's social elite. The area is known for its bungalows, gated communities, and premium lifestyle — it's where Tollywood stars live and where the city's high-end restaurants thrive. The consumer demographic here is high-income and trend-conscious, closely following the food and lifestyle scene. Word travels fast in social circles, and businesses that are professionally presented — including online — benefit from this highly networked community.`,
      demographics: 'Telugu film industry, business families, HNIs, Hyderabad social elite',
      knownFor: ['Tollywood film industry presence', 'Premium restaurants & hotels', 'Gated bungalow communities', 'Road 45 commercial strip'],
      businessCount: 38,
    },
    madhapur: {
      display: 'Madhapur',
      tagline: "HITEC City's residential extension — IT professional territory",
      description: `Madhapur is the residential neighbourhood for thousands of Hyderabad's IT professionals who work in adjacent HITEC City. The area has transformed from a small village to a densely populated suburb with hundreds of apartment complexes, restaurants, gyms, and services all competing for the same base of well-paid tech workers. The competition is fierce: search for any service in Madhapur on Google and you'll find dozens of options. The businesses that win are those with the best online presence — professional website, good photos, clear information.`,
      demographics: 'IT professionals, young tech couples, software engineers, HITEC City employees',
      knownFor: ['HITEC City proximity', 'Dense apartment residential area', 'Growing restaurant scene', 'Young IT professional community'],
      businessCount: 44,
    },
    gachibowli: {
      display: 'Gachibowli',
      tagline: 'Microsoft, Amazon, Google India — Hyderabad\'s MNC epicentre',
      description: `Gachibowli is where global tech giants chose to establish their India operations — Microsoft's India R&D campus, Amazon's regional hub, Google India office, and dozens of other MNCs make this one of India's most economically powerful local job markets. The professionals working here are typically among India's highest-earning salaried employees, with sophisticated consumer expectations. A salon, restaurant, or fitness studio in Gachibowli that lacks a professional website is immediately at a disadvantage competing for these well-heeled clients.`,
      demographics: 'MNC professionals, highest-earning IT employees, expats, senior tech executives',
      knownFor: ['Microsoft, Amazon, Google campuses', 'DLF Cyber City proximity', 'University of Hyderabad', 'Premium residential gated communities'],
      businessCount: 46,
    },
    kukatpally: {
      display: 'Kukatpally',
      tagline: "West Hyderabad's most populous area — KPHB Colony",
      description: `Kukatpally Housing Board Colony (KPHB) is one of Hyderabad's largest and most densely populated residential areas, housing hundreds of thousands of middle-class families. The area's massive residential scale creates consistent, high-volume demand for every local service category — restaurants, tutors, clinics, salons, gyms. Kukatpally residents are increasingly digital in their discovery habits, particularly the younger generation. Local businesses that establish online presence capture demand from this enormous market that would otherwise be distributed across the neighbourhood's physical footfall only.`,
      demographics: 'Middle-class families, government employees, working professionals, multi-generational households',
      knownFor: ['KPHB Colony residential density', 'Kukatpally bus hub', 'Metro connectivity', 'Affordable residential market'],
      businessCount: 40,
    },
    ameerpet: {
      display: 'Ameerpet',
      tagline: "Hyderabad's coaching and IT training hub",
      description: `Ameerpet is famous throughout India as the destination for IT training — hundreds of institutes offering courses in Java, Python, data science, cloud computing, and more. The area draws young professionals from across Andhra Pradesh and Telangana who come to upskill. This creates an unusual demographic: high volumes of young, aspirational, digitally active individuals with a specific mindset of investing in their careers. Local businesses — restaurants, PGs, coaching institutes for other subjects — that serve this community benefit enormously from online visibility, as this demographic researches everything online.`,
      demographics: 'IT students, career-change professionals, young Andhra and Telangana aspirants',
      knownFor: ['IT training institutes hub', 'Young professional students', 'Affordable dining options', 'Metro junction'],
      businessCount: 35,
    },
    secunderabad: {
      display: 'Secunderabad',
      tagline: "The twin city — military heritage and commercial heart",
      description: `Secunderabad is Hyderabad's twin city — historically a British cantonment that grew into a major commercial and residential area. The Secunderabad Cantonment and the large military residential population give it a distinct, orderly character. The commercial areas around Secunderabad railway station see massive daily footfall, and the residential areas house a stable middle-class population of defence personnel, government employees, and established business families. This reliable, established market provides consistent demand for quality local businesses.`,
      demographics: 'Defence personnel, government employees, established business families, railway hub visitors',
      knownFor: ['Secunderabad railway station', 'Military cantonment', 'Parade grounds', 'Commercial PM Palem area'],
      businessCount: 36,
    },
    'hitech-city': {
      display: 'HITEC City',
      tagline: "Hyderabad's tech revolution epicentre",
      description: `HITEC City (Hyderabad Information Technology Engineering Consultancy) is the name given to the original Cyberabad development that triggered Hyderabad's IT transformation. Cyber Towers, Cyber Pearl, and dozens of tech parks house some of the world's largest tech companies' India operations. The area sees over 2 lakh daily office commuters, creating one of India's most powerful local consumer markets in terms of income density. Any business serving the HITEC City catchment area has access to an extraordinarily well-paid, digitally active consumer base.`,
      demographics: 'Senior IT professionals, MNC employees, tech executives, high-income young professionals',
      knownFor: ['Cyber Towers', 'HITEC City Metro station', 'Shilparamam craft village', "India's IT outsourcing symbol"],
      businessCount: 48,
    },
    kondapur: {
      display: 'Kondapur',
      tagline: "Hyderabad's rapidly growing IT-adjacent residential hub",
      description: `Kondapur has grown explosively as Hyderabad's IT corridor expanded beyond HITEC City. Thousands of apartment complexes have risen in under a decade to accommodate the influx of IT professionals who want to live close to their HITEC City or Gachibowli offices. The demographic is young, upwardly mobile, and digital-first — they use Swiggy and Zomato daily, discover gyms on Instagram, and Google local services before visiting. The rapidly growing, non-traditional residential nature of Kondapur means new residents constantly need to discover new local businesses.`,
      demographics: 'Young IT professionals, recent migrants to Hyderabad, double-income tech couples',
      knownFor: ['Rapid apartment complex growth', 'IT professional residential hub', 'Growing commercial strip', 'Proximity to HITEC City'],
      businessCount: 38,
    },
    begumpet: {
      display: 'Begumpet',
      tagline: "Hyderabad's diplomatic and business enclave",
      description: `Begumpet is home to Hyderabad's diplomatic missions, luxury business hotels, and some of the city's most prestigious commercial addresses. Adjacent to the old Begumpet Airport (now used for defense), it has a quiet, established character compared to the busy IT suburbs. The consulates, international schools, and luxury hotels create a high-value consumer base of diplomats, expatriates, and senior Indian executives. Businesses in Begumpet targeting this premium demographic must have a professional online presence — it's a basic expectation from this audience.`,
      demographics: 'Diplomats, expats, senior executives, luxury hotel guests, established business families',
      knownFor: ['Foreign consulates', 'Begumpet old airport area', 'Luxury hotels', 'International schools'],
      businessCount: 28,
    },
  },

  chennai: {
    't-nagar': {
      display: 'T Nagar',
      tagline: "Chennai's shopping capital — one of India's busiest commercial districts",
      description: `T Nagar (Thyagaraya Nagar) is one of Asia's busiest commercial districts — Ranganathan Street alone is described as one of the world's highest-footfall shopping streets. The area is Chennai's go-to destination for silk sarees, jewellery, textiles, and every type of shopping. Businesses here serve both Chennai residents and visitors from across Tamil Nadu. The sheer competition in T Nagar means that digital presence is critical for standing out — customers increasingly research products and stores online before navigating the dense, crowded market streets.`,
      demographics: 'Tamil Nadu shoppers, Chennai middle and upper-middle class, silk and jewellery buyers',
      knownFor: ['Ranganathan Street', 'Silk sarees & jewellery', 'Kumaran Stores', 'Highest retail density in Chennai'],
      businessCount: 44,
    },
    'anna-nagar': {
      display: 'Anna Nagar',
      tagline: "Chennai's model planned residential township",
      description: `Anna Nagar is Chennai's best-planned residential area — wide avenues, tower park, and a large, affluent, educated residential community that spans generations. The demographic ranges from established Tamil professional families to young software engineers who've chosen this well-serviced suburb for its quality of life. Anna Nagar's commercial towers and Shanthi Colony market area service this stable, high-income community. Businesses here benefit from loyal repeat clientele — and online presence helps capture new residents who move to the area every year.`,
      demographics: 'Affluent Tamil professional families, IT employees, multi-generational households',
      knownFor: ['Tower Park', 'Well-planned wide roads', 'Stable affluent residential community', 'Quality schools'],
      businessCount: 40,
    },
    adyar: {
      display: 'Adyar',
      tagline: "IIT Madras and South Chennai's premium residential zone",
      description: `Adyar is defined by IIT Madras — one of India's premier engineering institutions whose campus takes up a significant portion of the neighbourhood. Beyond the IIT, Adyar is an upscale residential area with established Tamil families, academics, and professionals. The Adyar Bakery is a Chennai institution, and the area has a distinctive intellectual, measured character. The presence of IIT faculty, researchers, and students alongside affluent residents creates a uniquely educated consumer base with strong online research habits.`,
      demographics: 'IIT faculty and students, affluent South Chennai families, academics, researchers',
      knownFor: ['IIT Madras campus', 'Adyar River', 'Theosophical Society campus', 'Established residential character'],
      businessCount: 35,
    },
    velachery: {
      display: 'Velachery',
      tagline: "South Chennai's growing IT and residential corridor",
      description: `Velachery connects Chennai's old city to the new OMR IT corridor, making it a transition zone that's grown rapidly with IT professionals seeking affordable yet connected housing. Tidel Park's proximity drives IT employee residential demand, and Velachery has responded with apartment complexes and commercial development. The Phoenix Market City mall has made Velachery a retail destination for all of South Chennai. This dynamic growth means a constantly refreshing population that needs to discover local businesses — exactly where online presence pays off.`,
      demographics: 'IT professionals, young families, South Chennai residents, TIDEL Park employees',
      knownFor: ['Phoenix Market City mall', 'TIDEL Park proximity', 'Velachery lake', 'Growing apartment ecosystem'],
      businessCount: 38,
    },
    porur: {
      display: 'Porur',
      tagline: "West Chennai's emerging IT and residential hub",
      description: `Porur sits at the junction of the Mount-Poonamallee Highway and connects Chennai's western suburbs to the city centre. Multiple IT companies have established offices here, and the area has seen rapid residential growth with apartment complexes attracting IT professionals relocating from other parts of the city. Sri Ramachandra Medical College and Hospital makes it an important healthcare hub too. Porur's position as a connector between corridors means its consumer base is diverse and growing quickly — ideal for businesses establishing early online visibility.`,
      demographics: 'IT professionals, medical students and staff, young families, West Chennai residents',
      knownFor: ['Sri Ramachandra Medical College', 'IT corridor junction', 'Growing apartment residential area', 'Mount-Poonamallee Highway'],
      businessCount: 32,
    },
    tambaram: {
      display: 'Tambaram',
      tagline: "South Chennai's established suburban capital",
      description: `Tambaram is one of Chennai's oldest and most established suburbs — a self-sufficient town with its own commercial ecosystem, railway station, and large residential population. Air Force Station Tambaram and the broad residential spread of East and West Tambaram create a stable middle-class market. The area's population is enormous and has been growing with new residential developments. Traditional businesses here are increasingly facing competition from digitally-forward competitors, creating urgency to establish online presence.`,
      demographics: 'Air Force personnel and families, middle-class Tamil families, South Chennai commuters',
      knownFor: ['Air Force Station', 'Tambaram railway junction', 'Established residential suburbs', 'Chennai southern gateway'],
      businessCount: 36,
    },
    mylapore: {
      display: 'Mylapore',
      tagline: "Chennai's cultural soul — temples, music, and Tamil heritage",
      description: `Mylapore is Chennai's cultural and spiritual heart — the Kapaleeshwarar Temple, the Kutcheri music season, and a distinctly traditional Chennai character make it unlike any other neighbourhood. But Mylapore is also evolving: new cafes, heritage restaurants, and boutique stores are drawing younger Chennaiites back to explore its heritage. The neighbourhood sees significant tourist footfall, and its traditional businesses are discovering that tourists find them via Google before arriving. A Mylapore business with a well-made website captures both the heritage-seeking tourist and the Chennai resident looking for authentic experiences.`,
      demographics: 'Traditional Chennai families, cultural tourists, heritage seekers, young Chennaiites',
      knownFor: ['Kapaleeshwarar Temple', 'Carnatic music kutcheri season', 'Traditional Tamil brahmin culture', 'Heritage streets'],
      businessCount: 30,
    },
    nungambakkam: {
      display: 'Nungambakkam',
      tagline: "Chennai's diplomatic and upscale commercial address",
      description: `Nungambakkam is home to foreign consulates, luxury hotels, and some of Chennai's most premium commercial establishments. Khader Nawaz Khan Road is lined with fine dining restaurants and boutique stores; Haddows Road and Nungambakkam High Road have luxury brand presence. The consumer base here is affluent, internationally oriented, and has the highest digital expectations of any Chennai neighbourhood. Consulates, embassies, and the international community create a high-value market where professional online presence is a prerequisite, not an option.`,
      demographics: 'Diplomats, expats, affluent Chennai families, luxury hotel guests, corporate executives',
      knownFor: ['Foreign consulates', 'Khader Nawaz Khan Road dining', 'Luxury hotels', 'US Consulate'],
      businessCount: 32,
    },
    egmore: {
      display: 'Egmore',
      tagline: "Chennai's transit and hospitality hub",
      description: `Egmore is Chennai's gateway for millions of visitors — Chennai Central and Egmore railway stations together are among India's busiest, and the surrounding area is packed with hotels, restaurants, and services catering to travellers. The Egmore Museum and government offices add a permanent population of professionals and tourists. Businesses in Egmore serve an unusually diverse clientele: local residents, business travellers, leisure tourists, and government employees. Online visibility is particularly valuable here because travellers search for hotels, restaurants, and services before arriving.`,
      demographics: 'Railway travellers, tourists, government employees, local residents',
      knownFor: ['Chennai Egmore railway station', 'Government Museum', 'Budget hotels strip', 'Government offices cluster'],
      businessCount: 28,
    },
    guindy: {
      display: 'Guindy',
      tagline: "Chennai's industrial and IT zone — TIDEL Park's home",
      description: `Guindy is the intersection of Chennai's industrial heritage and its digital future. The Guindy Industrial Estate, one of India's oldest, operates alongside Tidel Park — one of South India's largest IT parks. Anna University, one of India's most reputed engineering universities, adds a large student and academic population. The combination creates a uniquely diverse workforce with consistently high demand for food, services, and education. Businesses targeting the Tidel Park IT population — high-income, digitally native — need to be exceptionally visible online.`,
      demographics: 'IT professionals, industrial workers, engineering students, Anna University faculty',
      knownFor: ['Tidel Park IT hub', 'Anna University', 'Guindy Industrial Estate', 'Arignar Anna Zoological Park'],
      businessCount: 34,
    },
  },

  kolkata: {
    'salt-lake': {
      display: 'Salt Lake',
      tagline: "Kolkata's IT hub — Sector V tech cluster",
      description: `Salt Lake's Sector V is West Bengal's answer to Bangalore's Electronic City — a concentrated IT cluster housing TCS, Cognizant, Wipro, and dozens of other tech companies. The area sees over 1.5 lakh daily IT workers, creating one of East India's most economically powerful local consumer markets. The surrounding residential sectors house both tech professionals and Kolkata's established middle class. Digital discovery is the norm for Sector V's workforce — they order food, book appointments, and find services via apps and Google rather than street-level discovery.`,
      demographics: 'IT professionals, tech company employees, young Kolkata professionals',
      knownFor: ['IT Sector V', 'TCS & Cognizant campuses', 'Nicco Park', 'Science City proximity'],
      businessCount: 48,
    },
    'new-town': {
      display: 'New Town',
      tagline: "Kolkata's smart city vision — Rajarhat township",
      description: `New Town (Rajarhat) is Kolkata's most ambitious urban development project — a modern, planned township adjacent to the Kolkata airport designed to accommodate the city's growth. The area has attracted IT companies, luxury residential projects, and major retail developments including City Centre New Town. The population is younger and more upwardly mobile than traditional Kolkata neighbourhoods, with strong digital habits. New Town is still developing its local business ecosystem, giving early-mover businesses a significant advantage in establishing online presence.`,
      demographics: 'Young IT professionals, aspirational Kolkata families, airport proximity professionals',
      knownFor: ['Planned smart city development', 'Kolkata airport proximity', 'City Centre 2 mall', 'IT office clusters'],
      businessCount: 38,
    },
    'park-street': {
      display: 'Park Street',
      tagline: "Kolkata's cosmopolitan heart — the city's food and culture street",
      description: `Park Street is Kolkata's most cosmopolitan address — a tree-lined avenue famous for decades-old restaurants (Peter Cat, Flury's, Mocambo), bookshops, and a vibrant nightlife scene. No other street in Kolkata has as rich a culinary and cultural heritage. The area sees massive footfall from across the city — office workers at lunch, young couples in the evening, and tourists at all hours. Businesses on and around Park Street benefit from existing footfall, but online visibility ensures they capture the growing number of visitors who plan their Park Street experience in advance via Google.`,
      demographics: "Young Kolkata professionals, food tourists, city's cosmopolitan set, office workers",
      knownFor: ['Peter Cat, Flury\'s, Mocambo', 'New Year celebrations', 'Cosmopolitan restaurant culture', 'Kolkata Book Fair proximity'],
      businessCount: 42,
    },
    gariahat: {
      display: 'Gariahat',
      tagline: "South Kolkata's premium shopping destination",
      description: `Gariahat is South Kolkata's commercial heart — the Gariahat Market is famous for sarees, Bengali textiles, household items, and street food that attracts shoppers from across the city. The surrounding residential areas of Ballygunge and Jodhpur Park are among Kolkata's most prestigious addresses, housing the city's professional and business elite. Gariahat serves both as a daily market for residents and a weekend shopping destination for all of South Kolkata. Businesses here have loyal local customers but need online presence to capture the wider city audience.`,
      demographics: 'South Kolkata affluent families, Bengali middle class, weekend shoppers',
      knownFor: ['Gariahat Market', 'Bengali sarees and textiles', 'South Kolkata social centre', 'Street food culture'],
      businessCount: 36,
    },
    behala: {
      display: 'Behala',
      tagline: "South Kolkata's large residential suburb",
      description: `Behala is a large, densely populated residential area in South Kolkata with a strongly middle-class character. Multiple commercial zones (Behala Chowrasta, Parnasree, Barisha) serve the local population's daily needs. The area's residents — predominantly Bengali middle-class families, government employees, and working professionals — are increasingly going digital in their buying habits. Behala's large population and relatively lower digital competition from local businesses make it an excellent opportunity for businesses that establish online presence early.`,
      demographics: 'Bengali middle-class families, government employees, working professionals',
      knownFor: ['Behala Chowrasta market', 'Multiple residential sub-areas', 'South Kolkata connector', 'Traditional Bengali neighbourhood'],
      businessCount: 32,
    },
    howrah: {
      display: 'Howrah',
      tagline: "Kolkata's twin city — industrial heart with millions of residents",
      description: `Howrah is Kolkata's twin city across the Hooghly River, best known for Howrah Bridge and the massive Howrah Station — India's busiest railway terminal. But Howrah is much more: an industrial city of millions with a thriving local commercial ecosystem. The city's industrial heritage (jute mills, engineering workshops) has given way to a mixed economy with a large working class and growing middle class. Howrah businesses serving this enormous, underserved market have enormous potential — and digital presence is still a relatively uncrowded competitive advantage here.`,
      demographics: 'Industrial workers, railway connectivity population, working and middle-class families',
      knownFor: ['Howrah Bridge', 'Howrah Station (India\'s busiest)', 'Industrial heritage', 'Botanical Garden'],
      businessCount: 30,
    },
    ballygunge: {
      display: 'Ballygunge',
      tagline: "South Kolkata's old-money premium neighbourhood",
      description: `Ballygunge is Kolkata's old money neighbourhood — bungalows, clubs (Ballygunge Cultural Association), and families that have called this home for generations. The area's residential character is stately and established, with some of the city's wealthiest and most influential families living here. The commercial areas of Ballygunge Circular Road and Gariahat serve this affluent demographic. Premium businesses — fine dining, specialty services, quality retail — find their most discerning customers in Ballygunge. This audience expects quality in every interaction, including online.`,
      demographics: 'Old Kolkata elite, affluent Bengali families, senior professionals, established business owners',
      knownFor: ['Ballygunge Cultural Association', 'Old bungalow estates', 'Kolkata\'s traditional elite', 'Proximity to Gariahat'],
      businessCount: 28,
    },
    'dum-dum': {
      display: 'Dum Dum',
      tagline: "North Kolkata's airport-adjacent commercial hub",
      description: `Dum Dum (named after the historic Dum Dum Cantonment and famous for the Dum Dum bullet) is North Kolkata's gateway to the airport and a major residential and commercial area. The Netaji Subhas Chandra Bose International Airport's proximity makes it a hub for hotel accommodation and transit services. The area's residential population is large and middle-class, served by the Kolkata Metro's expansion. As the Metro brings Dum Dum closer to Kolkata's core, local businesses are seeing growing demand that online visibility helps capture.`,
      demographics: 'Middle-class North Kolkata families, airport proximity travellers, Metro commuters',
      knownFor: ['Dum Dum airport proximity', 'Kolkata Metro terminal', 'Dum Dum Cantonment heritage', 'North Kolkata residential area'],
      businessCount: 28,
    },
    'lake-town': {
      display: 'Lake Town',
      tagline: "North Kolkata's planned residential area",
      description: `Lake Town is a well-planned residential area in North Kolkata, designed with a grid layout and central park infrastructure that gives it a more organized character than many surrounding areas. The residential population is solidly middle-class — teachers, government employees, and professionals who value the area's relative calm and good connectivity. Lake Town's local commercial area serves daily needs, and businesses here have a stable, loyal customer base. Online presence helps capture additional customers from neighbouring areas like Dum Dum, Barasat, and Salt Lake.`,
      demographics: 'Middle-class North Kolkata families, teachers, government employees, professionals',
      knownFor: ['Planned residential layout', 'Central park area', 'North Kolkata residential stability', 'Good Metro connectivity'],
      businessCount: 26,
    },
    barasat: {
      display: 'Barasat',
      tagline: "North 24 Parganas headquarters — Kolkata's northern expansion",
      description: `Barasat is the district headquarters of North 24 Parganas and one of the fastest-growing areas in the greater Kolkata metropolitan region. As Kolkata's urban sprawl extends northward, Barasat has transformed from a suburban town into a significant commercial and residential hub. The area serves not just local residents but a large hinterland from across North 24 Parganas district. Businesses in Barasat have an exciting first-mover opportunity — the area's growing population is increasingly digital, but local business digital adoption is still limited.`,
      demographics: 'North 24 Parganas district population, growing middle class, peri-urban residents',
      knownFor: ['North 24 Parganas district HQ', 'Rapid urbanization', 'Kolkata Metro expansion', 'Large hinterland population'],
      businessCount: 24,
    },
  },

  pune: {
    kothrud: {
      display: 'Kothrud',
      tagline: "Pune's most densely populated residential suburb",
      description: `Kothrud holds the distinction of being one of the most densely populated residential areas in Asia — a remarkable statistic that translates directly into enormous local consumer demand. The area is predominantly middle-class Marathi families — teachers, government employees, IT professionals, and business owners who have built stable lives here. Deccan Gymkhana and the surrounding areas have excellent infrastructure. This huge, stable residential population provides consistent demand for every type of local business. The density means that even micro-local online visibility (ranking for "salon in Kothrud") captures significant revenue.`,
      demographics: 'Marathi middle-class families, government employees, IT professionals, multi-generational households',
      knownFor: ['Record residential density', 'Traditional Pune character', 'Deccan area proximity', 'Stable family community'],
      businessCount: 45,
    },
    hinjewadi: {
      display: 'Hinjewadi',
      tagline: "Pune's IT hub — Infosys, Wipro, Cognizant and 300+ companies",
      description: `Hinjewadi IT Park is Pune's answer to Bangalore's Electronic City — three phases of tech park development housing India's largest IT companies and hundreds of mid-size firms. The park employs lakhs of tech professionals, and the surrounding residential development has grown to accommodate them. Despite the scale, local businesses in Hinjewadi still struggle with discovery because the area is relatively new and word-of-mouth networks haven't fully formed. Google and apps fill that gap — making online presence extraordinarily valuable for businesses targeting the IT park workforce.`,
      demographics: 'IT professionals, tech company employees, young Pune tech workforce',
      knownFor: ['Infosys, Wipro campuses', 'Three-phase tech park development', 'Young professional residential explosion', 'Wakad and Baner proximity'],
      businessCount: 52,
    },
    wakad: {
      display: 'Wakad',
      tagline: "Pune's most rapidly growing residential area for IT professionals",
      description: `Wakad has transformed from farmland to a densely populated residential area in under a decade — testament to Hinjewadi's gravitational pull on Pune's IT workforce. Thousands of apartment complexes have risen to house professionals who want to live close to the IT parks without paying Baner prices. The demographic is almost uniformly young (23-35), tech-educated, and digital-first. They discover everything via apps and Google, making Wakad a market where businesses with strong online presence dominate. New residents constantly arrive, creating ongoing demand for local business discovery.`,
      demographics: 'Young IT professionals, newlywed tech couples, Hinjewadi employees seeking affordable housing',
      knownFor: ['Rapid residential growth', 'IT park proximity', 'Young professional community', 'Mumbai-Pune expressway connectivity'],
      businessCount: 42,
    },
    'viman-nagar': {
      display: 'Viman Nagar',
      tagline: "Pune's upscale residential zone — airport adjacent, expat-friendly",
      description: `Viman Nagar is Pune's premium address for young professionals and expats — proximity to the airport makes it convenient for frequent flyers, and the area's infrastructure (wide roads, good restaurants, premium apartments) attracts Pune's upper-income demographic. Seasons Mall and the various high-street restaurants on Viman Nagar's main roads create a vibrant commercial scene. The resident profile — expats, senior IT managers, business owners — has the highest disposable income in Pune outside of Camp/Koregaon Park, and equally high expectations for professional business presentation.`,
      demographics: 'Expats, senior IT professionals, business owners, airport-adjacent travellers',
      knownFor: ['Airport proximity', 'Seasons Mall', 'Expat community', 'Premium residential apartments'],
      businessCount: 40,
    },
    baner: {
      display: 'Baner',
      tagline: "Pune's cosmopolitan tech suburb — craft beer and startups",
      description: `Baner has become Pune's most cosmopolitan neighbourhood — a mix of IT professionals, startup founders, and expats who've chosen this suburb for its combination of relatively affordable rents, proximity to Hinjewadi, and a thriving social scene that rivals Koregaon Park. Baner Pashan Link Road has dozens of restaurants, craft breweries, and specialty cafes. The competitive density of food and lifestyle businesses means that digital presence isn't optional — it's the primary way customers choose between a dozen similar-looking options.`,
      demographics: 'Startup founders, young IT professionals, expats, cosmopolitan Pune crowd',
      knownFor: ['Craft beer breweries', 'Restaurant strip', 'Startup ecosystem', 'Pune\'s most cosmopolitan suburb'],
      businessCount: 44,
    },
    aundh: {
      display: 'Aundh',
      tagline: "Pune's premium residential area with wide roads and quality infrastructure",
      description: `Aundh is Pune's premium residential address for established professionals — wide tree-lined roads, good schools, and a commercial strip that caters to an affluent, quality-conscious demographic. The DP Road commercial zone has some of Pune's best restaurants and specialty stores. The area's residents — senior professionals, business owners, established families — have been in Pune long enough to have trusted local service networks, but they're also sophisticated enough to search online when they need a new recommendation. A well-presented website in Aundh signals that you take your business seriously.`,
      demographics: 'Senior IT professionals, established business families, high-income Pune residents',
      knownFor: ['DP Road commercial strip', 'Premium residential colony', 'Good schools cluster', 'Quality infrastructure'],
      businessCount: 38,
    },
    hadapsar: {
      display: 'Hadapsar',
      tagline: "Pune's eastern IT and manufacturing hub",
      description: `Hadapsar is defined by Magarpatta City — one of India's most successful integrated township developments — which houses 200+ IT companies and thousands of residential units within a single planned complex. Beyond Magarpatta, Hadapsar has the Phursungi IT Park and traditional manufacturing along MIDC. The workforce is large and economically diverse: IT professionals in Magarpatta, manufacturing workers in MIDC, and a growing residential population in the areas between. Digital discovery is increasingly the primary channel for businesses here to reach all segments of this diverse market.`,
      demographics: 'IT professionals in Magarpatta, manufacturing sector workers, mixed-income residential',
      knownFor: ['Magarpatta City IT park', 'MIDC manufacturing', 'Phursungi IT Park', 'Largest IT township in Pune'],
      businessCount: 40,
    },
    kharadi: {
      display: 'Kharadi',
      tagline: "Pune's newest tech corridor — EON IT Park and World Trade Centre",
      description: `Kharadi is one of Pune's fastest-growing IT corridors, anchored by EON IT Park and the World Trade Centre Pune. The area has attracted major tech companies looking for newer, more modern office space than the older Hinjewadi or Pune Camp areas. The residential development around EON has been explosive — thousands of young IT professionals have moved here seeking new apartments close to their offices. For businesses in Kharadi, the opportunity is enormous: a large, young, high-income, and digitally native population that's constantly discovering new local services.`,
      demographics: 'Young IT professionals, EON and WTC employees, new Pune residents',
      knownFor: ['EON IT Park', 'World Trade Centre Pune', 'Rapid commercial growth', 'New residential construction'],
      businessCount: 36,
    },
    'shivaji-nagar': {
      display: 'Shivaji Nagar',
      tagline: "Pune's administrative and commercial heart",
      description: `Shivaji Nagar is Pune's civic and commercial centre — Pune Municipal Corporation headquarters, Pune University (Savitribai Phule), government offices, and the busy FC Road-JM Road commercial strip. The area sees enormous daily footfall from government employees, university students, shoppers, and office workers. FC Road is famous for its budget restaurants, book shops, and the youthful energy of thousands of college students. This high-footfall, diverse demographic makes Shivaji Nagar's businesses some of Pune's busiest — and online presence amplifies that reach further.`,
      demographics: 'Government employees, university students, city-wide shoppers, Pune office workers',
      knownFor: ['Pune University (SPPU)', 'FC Road restaurants', 'JM Road commercial strip', 'Government administrative hub'],
      businessCount: 40,
    },
    deccan: {
      display: 'Deccan',
      tagline: "Pune's youth hub — Fergusson College Road and FC Road",
      description: `Deccan Gymkhana and the surrounding FC Road (Fergusson College Road) area is Pune's cultural and youth epicentre. Thousands of students from Fergusson College, Modern College, and other institutions fill the cafes and bookshops along the road daily. The area retains an old Pune intellectual charm while embracing new cafes, bookstores, and street food. The massive student population is price-conscious but digitally sophisticated — they discover everything online and make decisions based on Instagram presence and Google reviews. Online visibility is essential for any business targeting Pune's youth market.`,
      demographics: 'College students, young Pune crowd, academics, old Pune intellectual culture',
      knownFor: ['Fergusson College', 'FC Road cafes & books', 'Deccan Gymkhana', 'Old Pune character meets new'],
      businessCount: 36,
    },
  },

  ahmedabad: {
    navrangpura: {
      display: 'Navrangpura',
      tagline: "Ahmedabad's central business and educational hub",
      description: `Navrangpura is Ahmedabad's urban core — CG Road, Gujarat University, and the city's key government offices all converge here. The area's mixed character (educational, commercial, residential) creates a diverse consumer base: students, professionals, and established Gujarati families. Gujarat University's proximity brings thousands of students, while the commercial district attracts professionals from across the city. Navrangpura businesses have access to one of Ahmedabad's highest-footfall catchment areas, but online visibility is what extends that reach beyond physical discovery.`,
      demographics: 'Gujarat University students, Ahmedabad professionals, Gujarati business families',
      knownFor: ['Gujarat University', 'CG Road proximity', 'Central Ahmedabad connectivity', 'Government offices cluster'],
      businessCount: 40,
    },
    satellite: {
      display: 'Satellite',
      tagline: "Ahmedabad's premium address for business and affluent families",
      description: `Satellite is one of Ahmedabad's most coveted residential and commercial areas — home to many of the city's diamond and textile business families, corporate professionals, and upwardly mobile young couples. The Satellite road commercial strip has some of the city's best restaurants and retail. The area's affluent, business-oriented Gujarati demographic is financially sophisticated and increasingly digital in their discovery habits — they research businesses online before visiting, particularly for high-ticket services like fitness, healthcare, and fine dining.`,
      demographics: 'Diamond and textile industry families, corporate professionals, affluent young Ahmedabad couples',
      knownFor: ['Premium residential colony', 'Business family community', 'Satellite road commercial strip', 'ISRO Space Applications Centre'],
      businessCount: 38,
    },
    'prahlad-nagar': {
      display: 'Prahlad Nagar',
      tagline: "Ahmedabad's Beverly Hills — premium SG Highway address",
      description: `Prahlad Nagar is Ahmedabad's most prestigious residential address — wide boulevards lined with luxury bungalows, gated communities, and premium apartment complexes housing the city's wealthiest families. SG Highway frontage has brought luxury malls (Maximo Mall) and premium restaurants. The consumer demographic here — diamond industry leaders, pharma entrepreneurs, senior corporate executives — represents Ahmedabad's highest spending capacity. For premium businesses targeting this market, a professional website is not just beneficial; it's a prerequisite for being taken seriously.`,
      demographics: 'Ahmedabad\'s wealthiest families, diamond industry leaders, pharma entrepreneurs',
      knownFor: ['Luxury residential bungalows', 'SG Highway premium strip', 'Maximo Mall', 'Highest per-capita income in Ahmedabad'],
      businessCount: 32,
    },
    'sg-highway': {
      display: 'SG Highway',
      tagline: "Ahmedabad's corporate corridor — malls, IT parks, new townships",
      description: `Sardar Patel Ring Road (SG Highway) has transformed into Ahmedabad's most dynamic commercial corridor — Palladium Mall, Iskon Mega Mall, multiple IT parks (GIFT City adjacent), and dozens of new residential townships line this arterial road. The daily traffic is among the highest in Gujarat, and the commercial density continues to grow. Businesses on or near SG Highway have tremendous opportunity but equally intense competition — digital visibility is the primary way to stand out in this crowded market.`,
      demographics: 'Corporate professionals, mall shoppers, upper-middle class Ahmedabad families, IT workers',
      knownFor: ['Palladium Mall', 'Iskon Mega Mall', 'GIFT City proximity', 'Ahmedabad\'s fastest-growing commercial strip'],
      businessCount: 44,
    },
    maninagar: {
      display: 'Maninagar',
      tagline: "East Ahmedabad's established Gujarati middle-class hub",
      description: `Maninagar is East Ahmedabad's most important commercial and residential centre — a traditionally middle-class Gujarati neighbourhood with strong community bonds and an active local commercial scene. The area's character is distinct from West Ahmedabad's more cosmopolitan zones — traditional values, strong community businesses, and family-oriented consumption patterns. However, the younger generation in Maninagar is increasingly digital, researching everything online before purchasing. Businesses here that adapt early to online presence have a significant first-mover advantage.`,
      demographics: 'Traditional Gujarati middle-class families, East Ahmedabad community, family-oriented consumers',
      knownFor: ['Narendra Modi\'s former constituency', 'Traditional Gujarati character', 'East Ahmedabad commercial hub', 'Strong community bonds'],
      businessCount: 34,
    },
    bopal: {
      display: 'Bopal',
      tagline: "New Ahmedabad — fastest growing residential suburb",
      description: `Bopal is Ahmedabad's most rapidly growing residential area — a suburban township that has attracted thousands of young families, IT professionals, and aspirational middle-class households seeking affordable housing with modern amenities. The demographic is young (25-40), educated, and digitally native — they moved to Bopal from all over Gujarat and rely heavily on Google and apps to discover local services in their new neighbourhood. For businesses in Bopal, online presence isn't just useful — it's the primary channel of customer discovery in a community where people don't yet have established local networks.`,
      demographics: 'Young families, IT professionals, aspirational middle class, new Ahmedabad residents',
      knownFor: ['Fastest-growing suburb', 'New residential townships', 'Young professional community', 'SG Highway proximity'],
      businessCount: 36,
    },
    vastrapur: {
      display: 'Vastrapur',
      tagline: "Ahmedabad's lakeside premium neighbourhood",
      description: `Vastrapur Lake forms the centrepiece of one of Ahmedabad's most desirable residential areas. The lake's jogging track and surrounding parks attract residents and visitors; the nearby commercial areas cater to an affluent residential catchment. Vastrapur has premium apartments, upscale restaurants, and specialty services that cater to Ahmedabad's upper-middle class. The area's pleasant environment and premium character mean that businesses here tend to attract quality-conscious consumers who expect professionalism from the businesses they frequent — online and offline.`,
      demographics: 'Upper-middle-class Ahmedabad families, young professionals, lakeside lifestyle seekers',
      knownFor: ['Vastrapur Lake and park', 'Premium apartments', 'Upscale dining options', 'IIM Ahmedabad proximity'],
      businessCount: 34,
    },
    'cg-road': {
      display: 'CG Road',
      tagline: "Ahmedabad's Oxford Street — premium shopping and dining strip",
      description: `CG Road (Chimanlal Girdharlal Road) is Ahmedabad's most prestigious commercial address — the city's answer to Mumbai's Linking Road or Delhi's Khan Market. Brand showrooms, premium restaurants, and specialty stores line this high-footfall arterial road. The consumer profile on CG Road is among Ahmedabad's most affluent — business professionals, corporate executives, and upper-class families who shop and dine here regularly. Any business on or near CG Road without a professional online presence is significantly underperforming its potential.`,
      demographics: 'Ahmedabad\'s most affluent consumers, business families, premium retail and dining seekers',
      knownFor: ['Premium retail brands', 'Best restaurants in Ahmedabad', 'Highest commercial real estate value', 'Central Ahmedabad connectivity'],
      businessCount: 40,
    },
    thaltej: {
      display: 'Thaltej',
      tagline: "Ahmedabad's upscale new residential area — SG Highway adjacent",
      description: `Thaltej has emerged as one of Ahmedabad's most sought-after residential addresses — SG Highway frontage, proximity to the airport, and luxury housing projects have attracted upper-middle-class families and NRIs returning to Ahmedabad. The area is newer than Satellite or Prahlad Nagar, which means its local commercial ecosystem is still developing — a significant first-mover opportunity for businesses that establish online presence and capture residents who are actively looking for trusted local services.`,
      demographics: 'Upper-middle-class families, NRIs, corporate executives, new Ahmedabad residents',
      knownFor: ['Airport proximity', 'Luxury residential projects', 'SG Highway access', 'NRI-friendly community'],
      businessCount: 30,
    },
    bodakdev: {
      display: 'Bodakdev',
      tagline: "Ahmedabad's diamond and business family residential hub",
      description: `Bodakdev is a premium residential area populated predominantly by Ahmedabad's diamond trading and business families — the economic backbone of Gujarat's private sector. The area has a distinctly successful, established character with luxury bungalows, premium services, and businesses catering to discerning high-income consumers. The diamond industry connection means there's a significant NRI and internationally-travelled demographic here. These consumers have high expectations and actively research businesses online before engaging with them.`,
      demographics: 'Diamond traders, established business families, affluent Gujarati HNIs',
      knownFor: ['Diamond business community', 'Luxury residential character', 'Business family network', 'Premium services market'],
      businessCount: 32,
    },
  },

  jaipur: {
    'malviya-nagar': {
      display: 'Malviya Nagar',
      tagline: "Jaipur's most modern residential hub",
      description: `Malviya Nagar is Jaipur's largest and most modern residential area, developed to accommodate the city's growing IT and services sector. The area has attracted young professionals — software developers, engineers, and corporate employees — who are establishing careers in Rajasthan's growing private sector. The proximity to Sitapura Industrial Area and the city's emerging IT parks makes Malviya Nagar the first choice for many young Jaipur professionals. This digitally active population discovers services online and expects businesses to have professional web presence — a gap that's still exploitable in Jaipur's local business market.`,
      demographics: 'IT professionals, young Jaipur families, corporate employees, modern Rajasthan workforce',
      knownFor: ['Modern residential development', 'IT sector proximity', 'Young professional community', 'World Trade Park mall'],
      businessCount: 35,
    },
    'vaishali-nagar': {
      display: 'Vaishali Nagar',
      tagline: "West Jaipur's premium residential colony",
      description: `Vaishali Nagar has developed into one of West Jaipur's most desirable residential addresses — wide roads, quality construction, and an established business community make it attractive to Jaipur's upper-middle class. The commercial strip along 22 Godam and the surrounding streets serves both local residents and shoppers from across West Jaipur. The area's business-family demographic — many from Rajasthan's trading and professional castes — is financially sophisticated and increasingly using digital tools for both business and personal decisions.`,
      demographics: 'Business families, senior professionals, West Jaipur upper-middle class',
      knownFor: ['22 Godam commercial area', 'Premium residential colony', 'West Jaipur commercial hub', 'Business family community'],
      businessCount: 30,
    },
    mansarovar: {
      display: 'Mansarovar',
      tagline: "Jaipur's largest suburb — 5 lakh residents and growing",
      description: `Mansarovar is Jaipur's most populous planned suburb — a self-sufficient township of over 5 lakh residents with its own markets, schools, hospitals, and commercial infrastructure. The population is solidly Rajasthani middle class: government employees, teachers, small business owners, and working families. Mansarovar's scale means that neighbourhood businesses here serve an enormous captive market. But in such a large area, physical discovery (walking past your shop) isn't enough — digital presence is what allows you to be found by residents in sectors far from your establishment.`,
      demographics: 'Government employees, Rajasthani middle-class families, teachers, working professionals',
      knownFor: ["Jaipur's most populated suburb", 'Self-sufficient residential township', 'Metro connectivity', 'Multiple commercial sectors'],
      businessCount: 32,
    },
    'raja-park': {
      display: 'Raja Park',
      tagline: "Jaipur's beloved middle-class suburban market",
      description: `Raja Park is one of Jaipur's most beloved and familiar neighbourhoods — a dense, established residential area with a strong community character and a busy local market that has served generations of families. The demographics are traditionally Jaipur middle class — small business owners, government employees, and established families who have been here for decades. The newer generation of Raja Park residents is more digitally active, and businesses that establish online presence are finding new customers among this growing digital-first segment while maintaining their loyal walk-in base.`,
      demographics: 'Traditional Jaipur middle-class families, small business owners, multi-generational residents',
      knownFor: ['Established residential character', 'Busy local market', 'Traditional Jaipur community', 'Central connectivity'],
      businessCount: 28,
    },
    'tonk-road': {
      display: 'Tonk Road',
      tagline: "Jaipur's IT corridor and Sitapura gateway",
      description: `Tonk Road is Jaipur's main southern arterial road connecting the old city to Sitapura — home to the Mahindra World City IT SEZ and Jaipur's emerging IT park. Corporate offices, residential townships (Jagatpura, Sanganer), and a growing young professional population line this corridor. The IT sector's growth has brought a digitally native workforce to Jaipur's southern parts, creating a market that discovers everything via search and apps. Businesses on Tonk Road that go digital first capture this growing professional audience before competitors do.`,
      demographics: 'IT professionals, corporate employees, young Jaipur families, Sitapura workforce',
      knownFor: ['Mahindra World City IT SEZ', 'Sanganer airport proximity', 'Growing IT professional community', 'Jaipur-Agra highway route'],
      businessCount: 28,
    },
    'c-scheme': {
      display: 'C Scheme',
      tagline: "Jaipur's most prestigious address — judges, IAS officers, and elite families",
      description: `C Scheme is Jaipur's most coveted address — wide leafy roads lined with the bungalows of senior IAS officers, High Court judges, and Rajasthan's business establishment. The area is also home to Jaipur's best hotels (The Rambagh Palace, ITC Rajputana) and the city's premium commercial establishments. The consumer profile is distinctly elite and accustomed to quality — they expect the businesses they patronise to be professional in every way, including their digital presence. A business in C Scheme that lacks a website is at an immediate disadvantage with this discerning clientele.`,
      demographics: 'IAS and IPS officers, High Court judges, Rajasthan\'s business elite, luxury hotel guests',
      knownFor: ['Senior government officer residences', 'Premium hotels', 'Jaipur\'s most prestigious colony', 'Lal Kothi proximity'],
      businessCount: 26,
    },
    'bani-park': {
      display: 'Bani Park',
      tagline: "Old Jaipur's heritage neighbourhood and boutique hotel hub",
      description: `Bani Park is Jaipur's original elite residential colony — built in the colonial era, it retains wide roads, old trees, and a quiet grandeur that newer areas lack. Heritage havelis have been converted into boutique hotels and homestays that attract international tourists, while the permanent residents are established Jaipur families. The tourism dimension makes Bani Park particularly interesting: international visitors Google every restaurant and experience they want during their Jaipur trip. Businesses here that are visible online capture both local residents and the high-spending tourist market.`,
      demographics: 'Heritage homestay guests, international tourists, old Jaipur families, travel-conscious consumers',
      knownFor: ['Heritage havelis and boutique hotels', 'Old Jaipur residential character', 'Tourist accommodation hub', 'Walking distance to old city'],
      businessCount: 24,
    },
    sodala: {
      display: 'Sodala',
      tagline: "Central West Jaipur's rapidly growing residential area",
      description: `Sodala is a central Jaipur neighbourhood that has grown rapidly as the city expanded westward. Its central location makes it accessible from most parts of Jaipur, and the area has a mix of established middle-class families and newer residents. The Sodala market area serves daily commercial needs, and businesses here have a broad catchment area thanks to the neighbourhood's central location. Digital presence helps Sodala businesses reach customers from adjacent colonies who might not regularly pass by the local market.`,
      demographics: 'Middle-class Jaipur families, central location mix, various age groups',
      knownFor: ['Central Jaipur location', 'Growing residential area', 'Local market', 'Connectivity to all city areas'],
      businessCount: 24,
    },
    jagatpura: {
      display: 'Jagatpura',
      tagline: "Jaipur's eastern IT and airport zone — fast-growing",
      description: `Jagatpura sits near Sanganer Airport and the Mahindra World City IT SEZ — two of the biggest drivers of Jaipur's economic growth. The area has seen rapid residential development as IT professionals and young families seek housing near the airport and IT parks. The demographic is young, aspirational, and digital-first — they've moved to Jaipur from other cities or from Jaipur's older areas seeking better housing and connectivity. This transient, mobile-native population relies entirely on Google and apps to discover local services in their new neighbourhood.`,
      demographics: 'Young IT professionals, airport proximity workers, new Jaipur residents, aspirational families',
      knownFor: ['Sanganer Airport proximity', 'Mahindra World City IT SEZ', 'Rapid residential growth', 'New Jaipur development'],
      businessCount: 26,
    },
    sitapura: {
      display: 'Sitapura',
      tagline: "Jaipur's industrial and IT hub — Rajasthan's growing tech zone",
      description: `Sitapura Industrial Area has been the backbone of Jaipur's manufacturing sector for decades — garments, gems and jewellery, and engineering industries have a large presence here. But the emergence of Mahindra World City has added a modern IT dimension, bringing tech companies and a professional workforce to Jaipur's southern periphery. The combination of industrial workers and IT professionals creates a broad economic base, and as the area develops more residential capacity, businesses serving this workforce have enormous growth potential. Online visibility is the most efficient way to reach this distributed working population.`,
      demographics: 'Industrial workers, IT professionals, factory managers, south Jaipur workforce',
      knownFor: ['Jaipur Industrial Area', 'Gems and jewellery industry', 'Garment industry', 'Mahindra World City SEZ'],
      businessCount: 24,
    },
  },

  lucknow: {
    hazratganj: {
      display: 'Hazratganj',
      tagline: "Lucknow's iconic heart — the Nawabi city's most famous street",
      description: `Hazratganj is Lucknow's most iconic address — a Victorian-era commercial street that has remained the city's cultural, social, and commercial centrepiece for over a century. Every Lucknawi knows Hazratganj; it's where they go to celebrate, to shop, to dine, and to be seen. The mix of heritage restaurants (Indian Coffee House, Royal Café), modern brands, and government offices creates an extraordinarily diverse daily footfall. Businesses in Hazratganj serve Lucknow's entire demographic range — from government officers to college students. Online presence here amplifies the already-considerable foot traffic.`,
      demographics: 'All of Lucknow — government officers, students, families, professionals, tourists',
      knownFor: ['Indian Coffee House and Royal Café', 'Victorian architecture', 'Lucknow\'s oldest commercial heart', 'Government office proximity'],
      businessCount: 40,
    },
    'gomti-nagar': {
      display: 'Gomti Nagar',
      tagline: "Lucknow's modern business and IT hub",
      description: `Gomti Nagar is Lucknow's answer to Delhi's Gurgaon — a planned modern township with IT companies, corporate offices, and luxury residential complexes that have attracted Lucknow's growing professional class. The Vibhuti Khand area has IT companies; the residential sectors have premium apartments. Gomti Nagar's consumer profile is younger, more corporate, and more digitally oriented than traditional Lucknow neighbourhoods. They research online, order food via Swiggy and Zomato, and discover local services through Google. Businesses here need professional websites to compete for this mobile-first audience.`,
      demographics: 'IT professionals, corporate employees, young Lucknow professionals, upper-middle class',
      knownFor: ['Vibhuti Khand IT hub', 'Modern planned township', 'Phoenix mall', 'Lucknow\'s new commercial centre'],
      businessCount: 36,
    },
    aliganj: {
      display: 'Aliganj',
      tagline: "North Lucknow's educational and residential hub",
      description: `Aliganj is one of North Lucknow's most established residential areas — a densely populated neighbourhood with a strong educational infrastructure (multiple schools and colleges) and a vibrant local market. The area has a mix of government employees, teachers, and middle-class families with deep roots in Lucknow. The educational character means a large student population that is digitally active. Businesses serving Aliganj — coaching centres, restaurants, salons — have a large captive audience that they can reach more effectively with digital visibility.`,
      demographics: 'Students, teachers, government employees, North Lucknow middle-class families',
      knownFor: ['Educational institutions cluster', 'Established residential area', 'Active local market', 'North Lucknow connectivity'],
      businessCount: 30,
    },
    'indira-nagar': {
      display: 'Indira Nagar',
      tagline: "Lucknow's most populous residential colony",
      description: `Indira Nagar is one of Lucknow's largest and most densely populated residential colonies — a self-contained suburb with its own markets, schools, hospitals, and social infrastructure. The population is diverse: government employees, private sector workers, and business families who have called this home for generations. The colony's scale means that businesses here serve an enormous local market. As the younger generation of Indira Nagar residents becomes increasingly digital-first in their discovery habits, businesses that adapt to online visibility gain disproportionate advantage in this large market.`,
      demographics: 'Diverse middle-class families, government employees, private sector workers, multi-generational',
      knownFor: ["Lucknow's most densely populated colony", 'Self-sufficient commercial infrastructure', 'SGPGI hospital proximity', 'Large established community'],
      businessCount: 32,
    },
    rajajipuram: {
      display: 'Rajajipuram',
      tagline: "West Lucknow's industrial-adjacent working-class hub",
      description: `Rajajipuram is a large, densely populated residential area in West Lucknow, close to the industrial areas and providing affordable housing for Lucknow's working and lower-middle class population. The area has a strong community character with active local markets. Businesses here serve a price-sensitive but volume-oriented market — the key competitive advantage is being findable when someone in the neighbourhood searches for a service, rather than relying on chance walk-ins through the dense, somewhat confusing street layout.`,
      demographics: 'Industrial workers, working-class families, West Lucknow lower-middle class',
      knownFor: ['Industrial area proximity', 'Affordable residential character', 'Dense population', 'West Lucknow connectivity'],
      businessCount: 24,
    },
    alambagh: {
      display: 'Alambagh',
      tagline: "South Lucknow's transport hub and commercial centre",
      description: `Alambagh is South Lucknow's commercial and transport hub — the Alambagh bus depot is one of UP's busiest, and the area sees massive daily footfall from commuters, travellers, and local residents. The commercial zone around the bus depot has a concentrated density of hotels, restaurants, and service businesses serving this transit population. Beyond transit, Alambagh has substantial residential areas with middle-class Lucknow families. The transit dimension makes online visibility particularly valuable — travellers searching for services before arriving or while in transit are a significant customer segment.`,
      demographics: 'Transit travellers, South Lucknow residents, middle-class families, bus depot footfall',
      knownFor: ['Alambagh bus depot (major UP hub)', 'Transit commercial zone', 'South Lucknow connector', 'Mixed residential-commercial'],
      businessCount: 28,
    },
    mahanagar: {
      display: 'Mahanagar',
      tagline: "East Lucknow's established professional colony",
      description: `Mahanagar is one of Lucknow's most well-planned and established residential colonies — a neighbourhood of orderly streets, good schools, and a stable population of government employees, teachers, and professional families. The area has a distinctly educated, cultured character reflective of old Lucknow's tehzeeb (refinement). The commercial areas around Mahanagar serve both local residents and people from adjacent areas. This educated demographic is increasingly digitally active, researching services online before engaging — making web presence a growing competitive differentiator here.`,
      demographics: 'Government employees, teachers, academic professionals, traditional Lucknow educated class',
      knownFor: ['Well-planned residential colony', 'Educational institutions', 'Stable educated community', 'East Lucknow connectivity'],
      businessCount: 26,
    },
    aminabad: {
      display: 'Aminabad',
      tagline: "Lucknow's old commercial heart — chikan and traditional markets",
      description: `Aminabad is Lucknow's original commercial district — a bustling bazaar that has been the city's trading heart for centuries. Famous for chikan embroidery, traditional Lucknawi cuisine, and wholesale markets, Aminabad attracts buyers from across UP and beyond. The market has a timeless character — narrow lanes, traditional shops, and the aroma of Lucknawi street food. But times are changing: tourists find Aminabad via Google, and younger consumers research products online before visiting. Traditional businesses here that establish digital presence are discovering entirely new customer segments.`,
      demographics: 'Traditional traders, wholesale buyers, tourists, middle-class Lucknawi families',
      knownFor: ['Chikan embroidery market', 'Traditional Lucknawi bazaar', 'Wholesale trading hub', 'Street food culture'],
      businessCount: 28,
    },
    chowk: {
      display: 'Chowk',
      tagline: "Lucknow's historic market — Nawabi heritage meets modern commerce",
      description: `Chowk is Lucknow's historic commercial district — a warren of narrow lanes famous for the finest Lucknawi cuisine (Tunday Kababi, Rahim's biryani), traditional crafts, and the city's most authentic Nawabi heritage. The area sees enormous tourist footfall, particularly food tourists from Delhi and Mumbai who travel specifically to eat here. These tourists universally research their Chowk dining experiences on Google before arriving. Restaurants, sweet shops, and craft businesses in Chowk that have websites capture this high-value, intent-driven tourist traffic far more effectively than those relying only on word-of-mouth.`,
      demographics: 'Food tourists, heritage seekers, traditional traders, old Lucknow families',
      knownFor: ['Tunday Kababi and Rahim\'s biryani', 'Lucknawi Nawabi heritage', 'Traditional craft market', 'Food tourism destination'],
      businessCount: 26,
    },
    'vikas-nagar': {
      display: 'Vikas Nagar',
      tagline: "East Lucknow's growing residential expansion zone",
      description: `Vikas Nagar is part of Lucknow's eastern residential expansion — a growing area of apartment complexes and planned housing that has attracted government employees, teachers, and working families seeking affordable but well-connected housing. The area's growth has brought demand for all local services, but the community is still new enough that word-of-mouth networks haven't fully formed. This makes online discovery particularly important — new residents actively search for trusted local services, giving digitally-present businesses a first-mover advantage in this growing market.`,
      demographics: 'Government employees, teachers, working families, new Lucknow residents',
      knownFor: ['Growing eastern Lucknow expansion', 'Affordable residential development', 'Government employee community', 'East Lucknow connectivity'],
      businessCount: 22,
    },
  },

  patna: {
    'boring-road': {
      display: 'Boring Road',
      tagline: "Patna's most vibrant commercial strip — coaching and cafes",
      description: `Boring Road is Patna's most energetic commercial corridor — the most important street for coaching institutes, restaurants, and youth-oriented businesses in Bihar's capital. Thousands of students preparing for UPSC, BPSC, IIT-JEE, and medical entrance exams frequent the coaching institutes and affordable restaurants that line this road. The student population is young, aspirational, and increasingly digital. They research coaching institutes online, find cafes via Zomato, and discover local services through search. Businesses on Boring Road that establish strong online presence capture this enormous, high-intent student market.`,
      demographics: 'UPSC and competitive exam students, young Patna professionals, coaching institute seekers',
      knownFor: ['Coaching institute cluster', 'Student-friendly restaurants', "Patna's youth commercial hub", 'BPSC/UPSC prep ecosystem'],
      businessCount: 30,
    },
    kankarbagh: {
      display: 'Kankarbagh',
      tagline: "South Patna's largest residential colony",
      description: `Kankarbagh is one of Bihar's largest housing colonies — a massive residential area in South Patna housing hundreds of thousands of middle-class families. Government employees, teachers, and working families form the backbone of this community. The area's enormous residential scale creates consistent demand for every type of local service. As Patna's economy grows and smartphone penetration deepens, Kankarbagh residents are increasingly turning to Google to find local services — giving early-mover businesses significant advantage in this large, largely untapped digital market.`,
      demographics: 'Government employees, teachers, middle-class Bihar families, working professionals',
      knownFor: ["Bihar's one of the largest housing colonies", 'Stable middle-class community', 'Self-sufficient commercial areas', 'South Patna residential hub'],
      businessCount: 26,
    },
    'rajendra-nagar': {
      display: 'Rajendra Nagar',
      tagline: "Patna's planned colony — secretariat proximity",
      description: `Rajendra Nagar is a well-planned residential colony in Patna, adjacent to the Bihar Secretariat. The area houses a significant proportion of Bihar's IAS officers, senior government officials, and legal professionals (High Court proximity). This educated, professional demographic represents Patna's most affluent consumer segment and has strong digital adoption. Businesses catering to this premium segment need to have professional online presence — it signals quality and seriousness to a demographic that judges establishments by their professionalism.`,
      demographics: 'IAS officers, senior government officials, legal professionals, affluent Patna families',
      knownFor: ['Bihar Secretariat proximity', 'Government officer residences', 'Planned colony infrastructure', 'Affluent Patna address'],
      businessCount: 22,
    },
    'patna-city': {
      display: 'Patna City',
      tagline: "Old Patna's commercial heart on the Ganges",
      description: `Patna City is the historical commercial district on the banks of the Ganga — the original heart of the ancient city of Pataliputra. The area's traditional markets, religious sites, and the Ganga ghats create a distinct character. Important religious sites (Harmandir Takht, Mahavir Mandir) bring massive daily footfall of pilgrims from across Bihar and Eastern India. Tourism and pilgrimage create a substantial customer base for restaurants, accommodation, and retail — a base that increasingly plans and researches online before arriving.`,
      demographics: 'Pilgrims, religious tourists, traditional traders, Old Patna families',
      knownFor: ['Ganga ghats', 'Harmandir Takht (Sikh pilgrimage)', 'Historical Pataliputra heritage', 'Traditional bazaars'],
      businessCount: 22,
    },
    danapur: {
      display: 'Danapur',
      tagline: "Patna's western cantonment town",
      description: `Danapur is Patna's cantonment city — home to one of India's oldest military establishments. The military residential population (army officers, defence civilians, canteen employees) creates a stable, middle-income consumer market. Beyond the cantonment, Danapur has grown as a residential suburb for Patna's working class seeking affordable housing. The two demographics — disciplined military community and growing suburban population — together represent a consistent, reliable market for local businesses with digital visibility.`,
      demographics: 'Army officers and families, defence civilians, West Patna working class',
      knownFor: ['Danapur Cantonment (one of India\'s oldest)', 'Military residential community', 'West Patna connectivity', 'Stable family community'],
      businessCount: 20,
    },
    'phulwari-sharif': {
      display: 'Phulwari Sharif',
      tagline: "South Patna's expanding residential frontier",
      description: `Phulwari Sharif is South Patna's growth zone — new apartment complexes and housing projects are rapidly expanding this area as Patna's urban boundary extends southward. The population is growing quickly with young families and professionals seeking newer, more affordable housing than central Patna. This new demographic is mobile-native and relies on Google and apps to discover all local services since they lack established neighbourhood networks. First-mover businesses in Phulwari Sharif that go digital now will own the digital discovery space as the area grows.`,
      demographics: 'Young Patna families, first-time homeowners, mobile-native new residents',
      knownFor: ['Rapid residential growth', 'New construction projects', 'South Patna frontier', 'Affordable housing market'],
      businessCount: 18,
    },
    'bailey-road': {
      display: 'Bailey Road',
      tagline: "Patna's prestigious residential address",
      description: `Bailey Road is Patna's most prestigious residential address — wide tree-lined avenues housing the city's senior government officials, judges, university professors, and established business families. The road connects Patna to Danapur and has some of the city's most well-regarded schools and institutions along its length. The resident demographic is educated, affluent, and accustomed to quality. They research before they engage with any business, and they expect the businesses they patronise to present themselves professionally — including online.`,
      demographics: 'Senior IAS officers, High Court judges, university professors, affluent Patna families',
      knownFor: ['Premium residential address', 'Senior government officer residences', 'Quality schools', 'Patna to Danapur connector'],
      businessCount: 22,
    },
    ashiana: {
      display: 'Ashiana',
      tagline: "Patna's modern planned suburb",
      description: `Ashiana Nagar is one of Patna's best-planned modern residential areas — organized street layouts, parks, and a growing commercial zone that serves an educated middle-class population. The area attracts government employees, educators, and young professional families who prefer the planned, orderly character of Ashiana over the density of older Patna neighbourhoods. This educated demographic is above-average in digital adoption, making Ashiana's local business market particularly responsive to businesses with professional online presence.`,
      demographics: 'Educated middle-class families, government employees, teachers, young Patna professionals',
      knownFor: ['Well-planned residential layout', 'Parks and green spaces', 'Educated middle-class character', 'Modern Patna residential'],
      businessCount: 20,
    },
    kidwaipuri: {
      display: 'Kidwaipuri',
      tagline: "Central Patna's established residential colony",
      description: `Kidwaipuri is a central Patna residential colony with an established character and good connectivity to the city's main commercial and administrative areas. Government employees and private sector professionals form the core demographic. The area's central location makes it accessible and attracts foot traffic from adjacent areas. Local businesses here benefit from neighbourhood loyalty while digital presence helps capture the broader central Patna market that passes through the area.`,
      demographics: 'Government employees, private sector professionals, central Patna families',
      knownFor: ['Central Patna location', 'Established residential colony', 'Good city connectivity', 'Mixed professional demographics'],
      businessCount: 18,
    },
    gardanibagh: {
      display: 'Gardanibagh',
      tagline: "East Patna's residential area — growing digital adoption",
      description: `Gardanibagh is one of East Patna's prominent residential areas — a large community of middle-class families with the characteristic Bihari residential density and community culture. Traditional businesses have dominated the local commercial scene for years, but smartphone penetration and the younger generation's digital habits are creating new dynamics. Businesses in Gardanibagh that establish digital presence now have a genuine first-mover advantage in a market that hasn't yet been meaningfully served online.`,
      demographics: 'Middle-class Bihar families, East Patna community, various age groups',
      knownFor: ['East Patna residential density', 'Traditional community character', 'Growing digital adoption', 'Established local markets'],
      businessCount: 18,
    },
  },

  ranchi: {
    'main-road': {
      display: 'Main Road',
      tagline: "Ranchi's commercial spine — Jharkhand's busiest commercial strip",
      description: `Main Road is exactly what its name suggests — Ranchi's primary commercial artery and the most important shopping and dining destination in Jharkhand's capital. Running through the heart of the city, it concentrates the highest footfall of any street in the state. Businesses on Main Road serve Ranchi residents as well as visitors from across Jharkhand who come to the capital for commerce and administration. Online visibility complements this physical footfall by capturing intent-driven searches from people planning their Main Road visits in advance.`,
      demographics: 'All of Ranchi — government officials, students, families, district visitors, shoppers',
      knownFor: ['Ranchi\'s main shopping destination', 'Highest commercial footfall in Jharkhand', 'Government office proximity', 'All demographics'],
      businessCount: 28,
    },
    lalpur: {
      display: 'Lalpur',
      tagline: "Ranchi's upscale residential and commercial area",
      description: `Lalpur is Ranchi's premium residential and commercial neighbourhood — home to the city's best restaurants, upscale residences, and the business community's preferred address. The area's consumer profile includes senior government officials, successful business owners, and Ranchi's upper-middle class. Lalpur's commercial scene has been growing rapidly with new restaurants and specialty services catering to this affluent demographic. Being discoverable online is increasingly important here as consumers research options before making premium purchases.`,
      demographics: 'Senior officials, business families, Ranchi upper-middle class, professionals',
      knownFor: ['Premium restaurants and dining', 'Upscale residential colony', 'Business community address', 'Ranchi\'s premium market'],
      businessCount: 24,
    },
    doranda: {
      display: 'Doranda',
      tagline: "South Ranchi's government quarter",
      description: `Doranda is known as Ranchi's government quarter — home to the Jharkhand secretariat, various government departments, and the residences of government officials. The stable, disciplined government employee community creates consistent local demand for services, restaurants, and retail. Beyond the government character, Doranda has substantial residential areas housing Ranchi's middle class. The area's solid, reliable consumer base is a strong foundation for local businesses that can capture them online and offline.`,
      demographics: 'Government employees, Jharkhand secretariat officials, South Ranchi middle class',
      knownFor: ['Jharkhand Secretariat', 'Government employee residences', 'Stable middle-class community', 'South Ranchi connectivity'],
      businessCount: 22,
    },
    harmu: {
      display: 'Harmu',
      tagline: "Central Ranchi's residential and commercial hub",
      description: `Harmu is one of Ranchi's most centrally located residential areas — the Harmu Housing Colony and surrounding commercial areas serve a large middle-class population. The area's central location gives businesses here access to Ranchi's broad consumer base. Harmu market area is a bustling local commercial zone. The area's residential diversity — government employees, private sector workers, business families — creates demand for every type of local service, and digital presence helps reach this diverse community beyond walk-in traffic.`,
      demographics: 'Middle-class Ranchi families, government employees, private sector workers',
      knownFor: ['Harmu Housing Colony', 'Central Ranchi location', 'Active local market', 'Residential diversity'],
      businessCount: 20,
    },
    bariatu: {
      display: 'Bariatu',
      tagline: "Ranchi's medical and educational hub",
      description: `Bariatu houses Ranchi Medical College & Hospital — one of Jharkhand's most important healthcare institutions — and several other educational institutions. The medical college brings thousands of students, doctors, and patients from across Jharkhand and neighbouring states. This creates an unusual consumer market: medical students and faculty with regular income and urban consumption habits, patients and their families, and the established residential population. Businesses serving this diverse mix benefit enormously from being findable online, especially by the large out-of-state population who research services while in Ranchi.`,
      demographics: 'Medical students, doctors, hospital staff, patients, educational community',
      knownFor: ['Ranchi Medical College & Hospital', 'Educational institutions', 'Healthcare tourism', 'Student community'],
      businessCount: 20,
    },
    'kanke-road': {
      display: 'Kanke Road',
      tagline: "Northern Ranchi's residential corridor",
      description: `Kanke Road is Ranchi's northern residential corridor — a long arterial road connecting the city centre to the Kanke Dam area. The road is lined with residential colonies, educational institutions, and local commercial establishments. The area's character is middle-class residential with a stable population of working families. As Ranchi grows northward, Kanke Road's residential density continues to increase. Businesses along this corridor benefit from the passing traffic and residential proximity, with digital presence adding reach to the deeper residential areas off the main road.`,
      demographics: 'Middle-class Ranchi families, residential corridor population, working professionals',
      knownFor: ['Kanke Dam proximity', 'Northern Ranchi residential', 'Educational institutions', 'Long arterial corridor'],
      businessCount: 18,
    },
    'ashok-nagar': {
      display: 'Ashok Nagar',
      tagline: "Ranchi's planned residential colony",
      description: `Ashok Nagar is a well-planned residential colony in Ranchi with a solid middle-class character. Government employees, teachers, and professionals make up the core residential base — a community that values stability, quality, and trustworthiness in the businesses they engage with. The planned layout and good infrastructure make it an attractive residential address. Businesses serving this established community benefit from the loyalty of a stable resident base, and digital presence extends their reach to the broader Ranchi market.`,
      demographics: 'Government employees, teachers, middle-class Ranchi families',
      knownFor: ['Planned colony infrastructure', 'Stable middle-class community', 'Government employee housing', 'Quality of life'],
      businessCount: 18,
    },
    hinoo: {
      display: 'Hinoo',
      tagline: "East Ranchi's residential and commercial area",
      description: `Hinoo is an established residential and commercial area in East Ranchi — a dense, working-class to lower-middle-class neighbourhood with high population density and an active local economy. The area's commercial activity focuses on daily necessities — food, utilities, services — serving a large residential population. As smartphone adoption deepens across Ranchi's working-class demographic, local businesses in Hinoo that establish digital presence are positioned to be the first credible online option for this underserved market.`,
      demographics: 'Working-class and lower-middle-class Ranchi families, East Ranchi residents',
      knownFor: ['East Ranchi residential density', 'Working-class community', 'Local market activity', 'Growing digital adoption'],
      businessCount: 16,
    },
    morabadi: {
      display: 'Morabadi',
      tagline: "Ranchi's premium residential area near Morabadi Ground",
      description: `Morabadi is one of Ranchi's most desirable residential addresses — the area around Morabadi Ground (a large open space used for public events, sports, and the famous Morabadi Maidan gatherings) has premium residential character. Senior officials, established professionals, and Ranchi's social elite make their homes here. The area's premium character means that businesses serving this demographic need to match expectations in quality — including their online presentation.`,
      demographics: 'Senior officials, established professionals, Ranchi\'s social elite, affluent families',
      knownFor: ['Morabadi Maidan', 'Premium residential character', 'Public event venue', 'Ranchi\'s affluent address'],
      businessCount: 18,
    },
    kokar: {
      display: 'Kokar',
      tagline: "Ranchi's central residential area",
      description: `Kokar is a centrally located residential area in Ranchi with a mixed-income demographic — working-class families alongside small business owners and government employees. The area's central location gives businesses here access to the broader Ranchi consumer base, and the residential density creates consistent local demand. The commercial stretch in Kokar serves neighbourhood needs, and as Ranchi's overall digital adoption grows, local businesses with online presence gain access to the full catchment area rather than just walk-in proximity.`,
      demographics: 'Mixed-income Ranchi families, small business owners, government employees',
      knownFor: ['Central Ranchi location', 'Mixed residential character', 'Local commercial area', 'Good city connectivity'],
      businessCount: 16,
    },
  },

  indore: {
    'vijay-nagar': {
      display: 'Vijay Nagar',
      tagline: "Indore's largest and most modern residential hub",
      description: `Vijay Nagar is Indore's most important residential area — a large, modern township that has become the city's commercial and lifestyle hub for young professionals and families. The area's commercial development (Treasure Island Mall, multiple restaurant zones, educational institutions) has made it Indore's most self-sufficient suburb. The demographic is young (25-40), educated, and digitally active — Indore consistently ranks as India's cleanest city, and its residents have developed civic pride alongside digital habits. Businesses in Vijay Nagar targeting this quality-conscious, digitally active population need professional online presence to compete.`,
      demographics: 'Young IT and corporate professionals, educated Indore families, quality-conscious consumers',
      knownFor: ['Treasure Island Mall', 'Largest modern residential area', 'Indore\'s commercial hub', 'Quality infrastructure'],
      businessCount: 40,
    },
    palasia: {
      display: 'Palasia',
      tagline: "Indore's central commercial hub — old money, new businesses",
      description: `Palasia is Indore's original premium business district — a central area that has historically housed the city's most successful commercial establishments, restaurants, and professional services. The area's established character and central location make it one of the highest-footfall commercial zones in Madhya Pradesh. Palasia serves Indore's established business families and professional community. As newer commercial zones emerge (Vijay Nagar, AB Road), Palasia businesses need digital visibility to maintain their share of Indore's growing consumer base.`,
      demographics: 'Established Indore business families, professionals, central Indore consumers',
      knownFor: ['Central Indore commercial hub', 'Established business district', 'Premium restaurants', 'Professional services cluster'],
      businessCount: 34,
    },
    'sapna-sangeeta': {
      display: 'Sapna Sangeeta',
      tagline: "Indore's premium shopping and dining strip",
      description: `Sapna Sangeeta Road is one of Indore's most celebrated commercial addresses — a premium shopping and dining destination where the city's upper-middle class comes to spend. Brand showrooms, specialty restaurants, and lifestyle stores line this avenue, creating a concentrated luxury retail zone. The consumer profile is affluent and aspirational — Indore's successful families, young professionals, and the city's social set. Competition among businesses here is intense, and digital presence is increasingly the deciding factor for customers choosing between similar establishments.`,
      demographics: 'Affluent Indore families, young professionals, upper-middle class shoppers',
      knownFor: ['Premium retail strip', 'Upscale restaurants', 'Indore\'s luxury shopping address', 'High footfall commercial zone'],
      businessCount: 36,
    },
    rajwada: {
      display: 'Rajwada',
      tagline: "Indore's historic centre — Holkar Palace and traditional markets",
      description: `Rajwada is Indore's historic heart — the Holkar Palace (Rajwada) anchors a dense traditional market that has been the city's commercial centre for over two centuries. Traditional businesses — mithai shops, jewellers, textile traders — coexist with modern establishments. The area sees significant tourist footfall (Rajwada is a major heritage attraction) alongside local commercial traffic. Businesses here that establish online presence capture the tourist market that researches Indore experiences before visiting, as well as the city's residents who Google before heading to the busy traditional market.`,
      demographics: 'Historical tourists, traditional traders, all of Indore, heritage seekers',
      knownFor: ['Rajwada (Holkar Palace)', 'Traditional Indore bazaar', 'Heritage tourism', 'Historical significance'],
      businessCount: 28,
    },
    sarwate: {
      display: 'Sarwate',
      tagline: "Indore's transport hub — bus terminal commercial zone",
      description: `Sarwate is Indore's main bus terminal area — a bustling commercial zone serving the massive daily footfall of travellers entering and leaving the city. Hotels, restaurants, and service businesses serving this transit population thrive in Sarwate. Beyond transit, the area has substantial residential character serving Indore's working class. The transit dimension makes digital visibility particularly valuable — travellers research accommodation and dining options online before arriving, and local residents use Google to discover services near this central hub.`,
      demographics: 'Bus travellers, transit visitors, working-class Indore residents, commercial traders',
      knownFor: ['Sarwate bus stand (major Madhya Pradesh hub)', 'Transit commercial zone', 'Central Indore location', 'Diverse daily footfall'],
      businessCount: 26,
    },
    'new-palasia': {
      display: 'New Palasia',
      tagline: "Palasia's modern extension — Indore's growing premium zone",
      description: `New Palasia has emerged as Palasia's modern extension — newer commercial buildings, updated restaurants, and residential apartments for Indore's growing professional class who want the central location of Palasia with modern amenities. The area bridges old Indore's commercial character with new Indore's lifestyle aspirations. As one of Indore's most sought-after central addresses, businesses here serve a premium clientele who expects quality — and increasingly, expects quality businesses to have professional online representation.`,
      demographics: 'Young Indore professionals, upper-middle class, central Indore premium consumers',
      knownFor: ['Modern Palasia extension', 'Central Indore premium address', 'New commercial buildings', 'Young professional residential'],
      businessCount: 30,
    },
    'ab-road': {
      display: 'AB Road',
      tagline: "Indore's main commercial artery — Agra-Bombay highway strip",
      description: `AB Road (Agra-Bombay Road) is Indore's most important commercial artery — a highway-adjacent commercial strip with malls (C21 Mall, Malhar Mega Mall), showrooms, and corporate offices that makes it one of Madhya Pradesh's busiest commercial corridors. The road generates enormous daily traffic from across Indore and adjacent towns. Businesses here have the advantage of massive visibility from road traffic, but digital presence compounds this by capturing intent-driven online searches from the Indore market looking for specific services or products.`,
      demographics: 'All of Indore, highway commuters, mall shoppers, corporate professionals',
      knownFor: ['C21 Mall', 'Malhar Mega Mall', 'Showroom corridor', 'Indore\'s busiest highway commercial strip'],
      businessCount: 38,
    },
    bhawarkuan: {
      display: 'Bhawarkuan',
      tagline: "West Indore's established residential junction",
      description: `Bhawarkuan is a significant residential and commercial junction in West Indore — a central area that connects multiple residential colonies and serves as a local commercial hub for the surrounding area. The junction's character is distinctly middle-class Indore: practical, community-oriented, and increasingly digitally active. Businesses at the Bhawarkuan junction serve multiple surrounding residential areas, and their digital presence determines whether they capture the search demand from residents who Google before visiting.`,
      demographics: 'West Indore middle-class families, residential junction population',
      knownFor: ['Major West Indore junction', 'Residential connector', 'Local market hub', 'Ring Road proximity'],
      businessCount: 24,
    },
    'sudama-nagar': {
      display: 'Sudama Nagar',
      tagline: "Indore's residential area with strong Jain community",
      description: `Sudama Nagar is a western Indore residential area with a notable Jain community presence — Jain families are known for their business acumen and financial sophistication. The area has established residential character with well-regarded families and a strong community support network. Businesses serving this community need to meet high standards of quality and professionalism. The Jain community's business orientation means they are often among the earliest adopters of practical business tools — including digital presence.`,
      demographics: 'Jain families, established Indore business community, middle-class residents',
      knownFor: ['Jain community presence', 'Established residential character', 'Business-oriented community', 'West Indore connectivity'],
      businessCount: 22,
    },
    aerodrome: {
      display: 'Aerodrome',
      tagline: "Indore's upscale airport-adjacent residential area",
      description: `The Aerodrome area is one of Indore's most prestigious residential addresses — proximity to Devi Ahilya Bai Holkar Airport attracts business families, NRIs, and frequent-travelling professionals who value connectivity. The area has premium apartments, well-regarded schools, and upscale commercial establishments. The NRI and frequent-traveller demographic has high international exposure and expects premium quality from everything — including the digital presence of businesses they engage with locally. A professionally designed website is a baseline expectation from this audience.`,
      demographics: 'Business families, NRIs, frequent flyers, affluent Indore professionals',
      knownFor: ['Devi Ahilya Bai Holkar Airport proximity', 'NRI-friendly residential', 'Premium commercial area', 'Indore\'s most connected address'],
      businessCount: 26,
    },
  },

  bhopal: {
    'mp-nagar': {
      display: 'MP Nagar',
      tagline: "Bhopal's IT and commercial hub — Zone 1 & 2",
      description: `MP Nagar is Bhopal's most important commercial zone — Zone 1 and Zone 2 together house Madhya Pradesh's most concentrated cluster of IT companies, corporate offices, premium hotels, and the city's best restaurants. Young professionals working in MP Nagar's tech companies represent Bhopal's most digitally active consumer segment. The area's commercial density makes competition fierce — businesses need to be visible online to stand out in a zone where dozens of competitors offer similar services. Digital presence is the primary differentiator in MP Nagar's competitive landscape.`,
      demographics: 'IT professionals, corporate employees, Bhopal\'s young professional class',
      knownFor: ['IT companies cluster', 'Premium hotels and restaurants', "Bhopal's commercial hub", 'Zone 1 & 2 commercial area'],
      businessCount: 36,
    },
    'arera-colony': {
      display: 'Arera Colony',
      tagline: "Bhopal's most prestigious residential address",
      description: `Arera Colony is Bhopal's equivalent of Delhi's Civil Lines — a wide-road bungalow colony housing the city's senior government officials, High Court judges, and established professional families. The area has Bhopal's most prestigious residential character and some of its best schools and institutions. The consumer profile here is thoroughly affluent and quality-conscious — they engage with businesses that present themselves professionally and are easily discoverable. A Bhopal business targeting Arera Colony's demographic without a website is operating with one hand tied behind its back.`,
      demographics: 'IAS officers, judges, senior professionals, Bhopal\'s established elite',
      knownFor: ['Senior government officer residences', 'Bhopal\'s premium colony', 'Quality schools', 'Wide tree-lined roads'],
      businessCount: 28,
    },
    'new-market': {
      display: 'New Market',
      tagline: "Bhopal's central shopping district — near Upper Lake",
      description: `New Market is Bhopal's central commercial hub — a large shopping district adjacent to the Upper Lake that serves the city's broadest consumer cross-section. The scenic Upper Lake proximity makes it a destination for both shopping and leisure, creating high daily footfall. New Market's commercial diversity — from budget stores to premium boutiques — means it serves Bhopal's full economic range. Businesses here compete intensely for this large, diverse market, and online presence is increasingly critical to capture customers who research before the trip to New Market.`,
      demographics: 'All of Bhopal — broad consumer cross-section, leisure visitors, shoppers',
      knownFor: ['Upper Lake proximity', 'Central Bhopal commercial', 'Diverse retail range', 'Weekend destination'],
      businessCount: 32,
    },
    'tt-nagar': {
      display: 'TT Nagar',
      tagline: "Bhopal's commercial heart adjacent to the old city",
      description: `TT Nagar (Tatya Tope Nagar) is one of Bhopal's busiest commercial areas — government offices, banks, traditional markets, and retail establishments make this a high-footfall zone day and night. The area serves both government employees from adjacent offices and the large residential population of Central Bhopal. TT Nagar's commercial diversity and footfall volume make it one of the best locations in Madhya Pradesh for local businesses. Digital visibility helps these businesses capture the online research that increasingly precedes physical visits to this busy district.`,
      demographics: 'Government employees, Central Bhopal residents, Bhopal-wide commercial visitors',
      knownFor: ['Government offices cluster', 'Traditional Bhopal market', 'High commercial footfall', 'Central Bhopal location'],
      businessCount: 28,
    },
    habibganj: {
      display: 'Habibganj',
      tagline: "Bhopal's modern commercial area — railway station adjacent",
      description: `Habibganj (now renamed Rani Kamlapati railway station) is Bhopal's newly upgraded world-class railway station, surrounded by a rapidly developing commercial zone. The station's premium development has attracted high-end retail, hotels, and corporate offices to the Habibganj area. As Bhopal's most visible transit gateway, the area sees massive daily footfall from across Madhya Pradesh. Businesses establishing digital presence here capture both transit visitors searching for services and the growing permanent commercial population attracted by the station's development.`,
      demographics: 'Railway travellers, corporate visitors, transit population, new commercial developers',
      knownFor: ['Rani Kamlapati (Habibganj) world-class station', 'Rapid commercial development', 'Bhopal\'s transit gateway', 'Premium hotel zone'],
      businessCount: 26,
    },
    kolar: {
      display: 'Kolar',
      tagline: "Bhopal's large southern residential area",
      description: `Kolar is one of Bhopal's largest southern residential areas — a sprawling mix of housing colonies that has grown to accommodate the city's southward expansion. Young families and working professionals seeking affordable housing with city connectivity have made Kolar one of Bhopal's fastest-growing residential zones. The area's growing population creates increasing demand for all local services, and the relative lack of established online presence from local businesses creates significant first-mover opportunity for those who go digital early.`,
      demographics: 'Young Bhopal families, working professionals, growing south Bhopal residential population',
      knownFor: ['South Bhopal residential growth', 'Affordable housing', 'Growing young family community', 'City connectivity'],
      businessCount: 24,
    },
    misrod: {
      display: 'Misrod',
      tagline: "Bhopal's eastern residential expansion",
      description: `Misrod is part of Bhopal's eastern residential expansion — new apartment complexes and housing developments have brought working families to this area seeking modern accommodation at reasonable prices. The demographic is young and mobile-first — they've moved to Misrod without established local networks and rely on Google and apps to discover all services. For businesses establishing early in Misrod's growing market, digital presence is the primary customer acquisition channel.`,
      demographics: 'Young Bhopal families, working-class residents, new arrivals to Bhopal',
      knownFor: ['Eastern Bhopal residential growth', 'Affordable apartments', 'New community development', 'Industrial area proximity'],
      businessCount: 18,
    },
    bairagarh: {
      display: 'Bairagarh',
      tagline: "West Bhopal's established residential area near the old airport",
      description: `Bairagarh is West Bhopal's established residential and commercial area — historically located near the old Bhopal airport, the area has a mature community character with established families, small businesses, and a vibrant local commercial scene. The demographic spans multiple generations and income levels, creating diverse demand for local services. Bairagarh's established commercial character means businesses here have existing customer bases, and digital presence helps expand reach to the broader West Bhopal market.`,
      demographics: 'Established West Bhopal families, small business owners, mixed-income community',
      knownFor: ['Old Bhopal airport area', 'Established residential character', 'West Bhopal connectivity', 'Traditional community'],
      businessCount: 22,
    },
    shahpura: {
      display: 'Shahpura',
      tagline: "Bhopal's southern residential hub — growing fast",
      description: `Shahpura is one of Bhopal's most active southern residential areas, with a mix of established colonies and newer apartment developments catering to government employees and working families. The area's Shahpura Lake provides a pleasant natural setting, and the local market caters well to the residential community's daily needs. As Bhopal's southern expansion continues, Shahpura's residential base grows, creating increasing opportunity for businesses that can reach this growing consumer base digitally.`,
      demographics: 'Government employees, working families, South Bhopal residents, young couples',
      knownFor: ['Shahpura Lake', 'South Bhopal residential', 'Government employee community', 'Growing residential development'],
      businessCount: 22,
    },
    govindpura: {
      display: 'Govindpura',
      tagline: "Bhopal's industrial zone — factory workers and residential mix",
      description: `Govindpura is Bhopal's industrial area — factories, manufacturing units, and the Govindpura Industrial Estate employ thousands of workers who live in the adjacent residential areas. The demographic mix includes factory managers, engineers, and working-class families. The industrial character means businesses here serve a volume market with consistent daily footfall. As smartphone penetration deepens across income levels, even traditionally offline businesses in Govindpura are finding digital presence increasingly important for reaching this large workforce.`,
      demographics: 'Industrial workers, factory managers, engineers, East Bhopal working-class families',
      knownFor: ['Govindpura Industrial Estate', 'Manufacturing sector', 'Working-class community', 'East Bhopal industrial hub'],
      businessCount: 20,
    },
  },

  chandigarh: {
    'sector-17': {
      display: 'Sector 17',
      tagline: "Chandigarh's commercial heart — the Plaza every Chandigarhian knows",
      description: `Sector 17 Plaza is Chandigarh's most iconic public space and commercial district — Le Corbusier's masterpiece of urban planning that has functioned as the city's social, commercial, and cultural heart since the city was built. Every Chandigarhian has memories of Sector 17: the Friday shopping trip, the Sunday outing, the celebratory dinner. Businesses here benefit from the highest footfall in the city, but also the most intense competition. Digital visibility helps Sector 17 businesses capture the out-of-city visitors (tourists, business travellers) who research Chandigarh's best establishments online before visiting.`,
      demographics: 'All Chandigarh plus Panchkula and Mohali — the entire tri-city area',
      knownFor: ['Sector 17 Plaza (Le Corbusier)', 'Chandigarh\'s most iconic commercial zone', 'Cinema complex', 'Tri-city focal point'],
      businessCount: 42,
    },
    'sector-22': {
      display: 'Sector 22',
      tagline: "Chandigarh's most densely populated sector",
      description: `Sector 22 is Chandigarh's most densely populated residential sector — the sector's central market complex is one of the city's busiest local commercial areas, and the residential population is the city's largest per sector. The area has a strongly middle-class character with established families, working professionals, and students (DAV College is nearby). Sector 22's commercial area serves both local residents and people from adjacent sectors. Digital presence helps businesses here reach beyond their immediate neighbourhood to the broader city consumer.`,
      demographics: 'Dense middle-class residential, DAV College students, Central Chandigarh residents',
      knownFor: ['Densest Chandigarh sector', 'Busy local market complex', 'DAV College proximity', 'Central city location'],
      businessCount: 32,
    },
    'sector-35': {
      display: 'Sector 35',
      tagline: "Chandigarh's restaurant row — the city's best food destination",
      description: `Sector 35's main commercial area is widely considered Chandigarh's best restaurant destination — dozens of the city's most popular restaurants, dhabas, and cafes are concentrated here, making it a food tourism destination for the entire tri-city area (Chandigarh, Panchkula, Mohali). Families from across the tricity drive to Sector 35 specifically for the dining experience. Restaurants here that have a professional online presence with menus and photos capture customers who plan their Sector 35 dining visit in advance — a behaviour that's become standard among Chandigarh's food-conscious residents.`,
      demographics: 'Food-conscious tri-city consumers, families, young Chandigarh crowd, food tourists',
      knownFor: ['Best restaurant strip in Chandigarh', 'Family dining destination', 'Tri-city food pilgrimage', 'Dhaba and café culture'],
      businessCount: 38,
    },
    'sector-43': {
      display: 'Sector 43',
      tagline: "Chandigarh's education and IT hub",
      description: `Sector 43 houses Chandigarh's most important educational and professional infrastructure — the IT Park (home to Infosys and other tech companies), ISBT (inter-state bus terminal), and multiple educational institutions. The IT Park professionals are young, highly educated, and digital-first in their consumer habits. The ISBT brings massive daily transit footfall. Together, these create a high-volume, digitally active market that rewards businesses with strong online presence. The student and young professional population of Sector 43 represents Chandigarh's most app-native consumer segment.`,
      demographics: 'IT professionals, engineering students, ISBT travellers, young educated Chandigarh',
      knownFor: ['Chandigarh IT Park (Infosys)', 'ISBT inter-state bus terminal', 'Educational institutions cluster', 'Young professional hub'],
      businessCount: 34,
    },
    'sector-8': {
      display: 'Sector 8',
      tagline: "Chandigarh's premium residential sector — government officials and elite families",
      description: `Sector 8 is among Chandigarh's most prestigious residential sectors — adjacent to the Capitol Complex (Punjab and Haryana High Court, Legislative Assembly), it houses senior IAS and IPS officers, senior judiciary, and Punjab & Haryana's established elite. The wide roads, large plots, and leafy character make it one of India's most liveable premium neighbourhoods. Businesses targeting Sector 8's demographic need to match their quality expectations in every dimension, including professional digital presentation.`,
      demographics: 'Senior IAS/IPS officers, High Court judges, Punjab & Haryana elite families',
      knownFor: ['Capitol Complex proximity', 'Senior government officer residences', 'Chandigarh\'s most prestigious sector', 'Wide plots and roads'],
      businessCount: 22,
    },
    'sector-9': {
      display: 'Sector 9',
      tagline: "Chandigarh's administrative sector — professional hub",
      description: `Sector 9 is part of Chandigarh's government and professional district — the General Hospital and medical college give it an important healthcare character, while the residential component houses medical professionals, government workers, and established families. The presence of a major hospital means the area sees significant out-of-city patient footfall from Punjab and Haryana. Businesses here — particularly food, accommodation, and medical services — benefit from being discoverable online by families accompanying patients who research everything before arriving in Chandigarh.`,
      demographics: 'Medical professionals, government employees, hospital-adjacent population, patients and families',
      knownFor: ['Government Multi Speciality Hospital', 'Medical college', 'Government sector character', 'Healthcare hub'],
      businessCount: 24,
    },
    'sector-15': {
      display: 'Sector 15',
      tagline: "Chandigarh's residential sector with active local market",
      description: `Sector 15 is one of Chandigarh's well-established middle residential sectors with a vibrant local commercial scene. The sector has a broad middle-class residential population with a good mix of government employees and private sector workers. The Sector 15 market area serves as a busy local commercial hub for the sector and adjacent areas. Businesses here enjoy the proximity of a large, stable residential base and benefit from digital presence to capture residents from neighbouring sectors who search for services online.`,
      demographics: 'Middle-class Chandigarh families, government employees, private sector professionals',
      knownFor: ['Well-established residential sector', 'Active local market', 'Middle-class community', 'Central sector location'],
      businessCount: 26,
    },
    'sector-26': {
      display: 'Sector 26',
      tagline: "Chandigarh's grain market hub — fresh produce and food",
      description: `Sector 26 is famous for the Grain Market — Chandigarh's wholesale produce hub — and has evolved into a busy mixed commercial and residential area. The grain market's wholesale character attracts traders and retailers from across the region. Beyond the market, Sector 26 has a large residential population and commercial establishments serving local needs. Food businesses particularly benefit here from proximity to fresh produce, and those with websites can attract the growing number of consumers who prefer to research food suppliers and restaurants online before visiting the busy market area.`,
      demographics: 'Wholesale traders, residential families, food business operators, regional buyers',
      knownFor: ['Chandigarh Grain Market', 'Wholesale fresh produce hub', 'Mixed commercial-residential', 'Regional agricultural trade'],
      businessCount: 28,
    },
    'sector-34': {
      display: 'Sector 34',
      tagline: "Chandigarh's education district — colleges and coaching institutes",
      description: `Sector 34 is Chandigarh's education district — DAV College, multiple professional coaching institutes, and student-oriented services define the area's character. Thousands of students from across Punjab, Haryana, and Himachal Pradesh study in Sector 34's institutions, creating a dense, young, digitally active consumer population. These students — preparing for UPSC, CA, medical, or other competitive exams — are heavy internet users. Coaching institutes, student restaurants, stationery shops, and PGs that serve this population need strong online visibility to capture the incoming student market every academic year.`,
      demographics: 'Students from across Punjab/Haryana/HP, coaching institute seekers, young competitive exam prep',
      knownFor: ['DAV College', 'Coaching institutes cluster', 'Student community hub', 'Educational density'],
      businessCount: 30,
    },
    'sector-44': {
      display: 'Sector 44',
      tagline: "Chandigarh's southeastern growth sector",
      description: `Sector 44 is one of Chandigarh's outer residential sectors that has seen significant commercial growth as the city has matured and expanded. IT offices have established presence here, and the residential population includes a growing number of young professionals who work in the IT Park (Sector 43) and choose Sector 44 for housing. The area's professional demographic is mobile-first and digitally active. Businesses establishing digital presence in Sector 44 now capture a growing, underserved online market in one of the city's developing commercial zones.`,
      demographics: 'Young IT professionals, working families, outer Chandigarh residential population',
      knownFor: ['Growing southeastern sector', 'IT proximity (Sector 43)', 'Young professional residential', 'Chandigarh expansion zone'],
      businessCount: 22,
    },
  },
};

// Cities that have area data (for Level 2 pages)
export const AREA_CITIES = Object.keys(CITY_AREAS);

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function getCategoryFaqsHtml(category: string): string {
  const faqs = CATEGORY_FAQS[category] || [];
  if (faqs.length === 0) return '';

  const items = faqs.map((f, i) => `
    <div class="faq-item">
      <button class="faq-q" onclick="this.parentElement.classList.toggle('open')" aria-expanded="false">
        <span>${f.q}</span>
        <span class="faq-arrow">▼</span>
      </button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('\n');

  return `
  <section>
    <h2>❓ Frequently Asked Questions</h2>
    <div class="faq-list">
      ${items}
    </div>
  </section>`;
}

function getRelatedLinks(category: string, city: string): string {
  const otherCities = CITIES.filter(c => c !== city).slice(0, 5);
  const otherCats = CATEGORIES.filter(c => c !== category).slice(0, 4);

  const cityLinks = otherCities.slice(0, 3).map(c =>
    `<a href="/free-website/${category}/${c}" class="rel-link">${CATEGORY_DISPLAY[category]} Website in ${CITY_DISPLAY[c]}</a>`
  ).join('');

  const catLinks = otherCats.slice(0, 3).map(c =>
    `<a href="/free-website/${c}/${city}" class="rel-link">Free ${CATEGORY_DISPLAY[c]} Website in ${CITY_DISPLAY[city]}</a>`
  ).join('');

  const areaLinks = CITY_AREAS[city]
    ? Object.entries(CITY_AREAS[city]).slice(0, 4).map(([slug, area]) =>
        `<a href="/free-website/${category}/${city}/${slug}" class="rel-link">${CATEGORY_DISPLAY[category]} in ${area.display}</a>`
      ).join('')
    : '';

  return `
    <section class="related">
      <h3>Free ${CATEGORY_DISPLAY[category]} Websites in Other Cities</h3>
      <div class="rel-grid">${cityLinks}</div>
      ${areaLinks ? `<h3 style="margin-top:24px">Popular Areas in ${CITY_DISPLAY[city]}</h3><div class="rel-grid">${areaLinks}</div>` : ''}
      <h3 style="margin-top:24px">Other Free Websites in ${CITY_DISPLAY[city]}</h3>
      <div class="rel-grid">${catLinks}</div>
    </section>`;
}

function getSiblingAreaLinks(category: string, city: string, currentArea: string): string {
  const areas = CITY_AREAS[city];
  if (!areas) return '';

  const siblings = Object.entries(areas)
    .filter(([slug]) => slug !== currentArea)
    .slice(0, 5);

  if (siblings.length === 0) return '';

  const links = siblings.map(([slug, area]) =>
    `<a href="/free-website/${category}/${city}/${slug}" class="rel-link">${CATEGORY_DISPLAY[category]} in ${area.display}</a>`
  ).join('');

  return `
    <section class="related">
      <h3>Also in ${CITY_DISPLAY[city]} — Other Areas</h3>
      <div class="rel-grid">${links}</div>
      <div style="margin-top:16px">
        <a href="/free-website/${category}/${city}" class="rel-link" style="background:rgba(37,211,102,0.1); border-color:rgba(37,211,102,0.3); color:#25D366;">
          ← All ${CATEGORY_DISPLAY[category]} Websites in ${CITY_DISPLAY[city]}
        </a>
      </div>
    </section>`;
}

// Shared CSS + FAQ JS (injected into both page types)
const SHARED_STYLES = `
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --green: #25D366;
      --green-dark: #128C7E;
      --purple: #6366f1;
      --bg: #030712;
      --card: rgba(255,255,255,0.03);
      --card2: rgba(255,255,255,0.05);
      --border: rgba(255,255,255,0.08);
      --text: #e5e7eb;
      --muted: #9ca3af;
    }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; overflow-x: hidden; }
    nav { position: sticky; top: 0; z-index: 100; padding: 14px 24px; backdrop-filter: blur(20px); background: rgba(3,7,18,0.85); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 18px; font-weight: 800; text-decoration: none; color: var(--text); }
    .logo span { color: var(--green); }
    .nav-cta { background: var(--green); color: #000; padding: 8px 20px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 13px; transition: transform 0.2s, box-shadow 0.2s; }
    .nav-cta:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(37,211,102,0.4); }
    .breadcrumb { padding: 12px 24px; font-size: 13px; color: var(--muted); border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); }
    .breadcrumb a { color: var(--muted); text-decoration: none; }
    .breadcrumb a:hover { color: var(--green); }
    .breadcrumb span { margin: 0 6px; }
    .hero { padding: 64px 24px 48px; text-align: center; background: radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.12) 0%, transparent 65%); }
    .hero-emoji { font-size: 56px; margin-bottom: 16px; display: block; }
    .hero h1 { font-size: clamp(28px, 5vw, 52px); font-weight: 900; line-height: 1.15; margin-bottom: 20px; background: linear-gradient(135deg, #fff 40%, var(--green) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-tagline { display: inline-block; background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.3); color: var(--green); padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .hero-desc { max-width: 680px; margin: 0 auto 36px; font-size: 17px; color: var(--muted); line-height: 1.8; }
    .cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--green); color: #000; padding: 14px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 24px rgba(37,211,102,0.35); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,211,102,0.5); }
    .btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--text); padding: 14px 28px; border-radius: 50px; font-weight: 600; font-size: 15px; text-decoration: none; border: 1px solid var(--border); transition: border-color 0.2s, background 0.2s; }
    .btn-secondary:hover { border-color: var(--green); background: rgba(37,211,102,0.08); }
    .container { max-width: 780px; margin: 0 auto; padding: 0 24px; }
    section { margin: 56px 0; }
    section h2 { font-size: clamp(22px, 3.5vw, 32px); font-weight: 800; margin-bottom: 20px; }
    section p { font-size: 16px; color: var(--muted); margin-bottom: 16px; }
    section p strong { color: var(--text); }
    .pain-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 16px; padding: 24px 28px; margin: 28px 0; }
    .pain-box p { color: #fca5a5; margin: 0; font-size: 16px; }
    .area-profile-card { background: linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(99,102,241,0.06) 100%); border: 1px solid rgba(37,211,102,0.2); border-radius: 20px; padding: 28px 32px; margin: 28px 0; }
    .area-profile-card h3 { font-size: 18px; font-weight: 700; color: var(--green); margin-bottom: 12px; }
    .area-profile-card p { color: var(--text); margin-bottom: 12px; font-size: 15px; }
    .known-for { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .kf-tag { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; padding: 4px 12px; border-radius: 50px; font-size: 12px; }
    .social-proof-badge { background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.25); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; margin: 20px 0; }
    .social-proof-badge .sp-num { font-size: 28px; font-weight: 900; color: var(--green); }
    .social-proof-badge .sp-text { font-size: 14px; color: var(--muted); }
    .features-card { background: var(--card2); border: 1px solid var(--border); border-radius: 20px; padding: 32px; }
    .features-card ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media(max-width: 520px){ .features-card ul { grid-template-columns: 1fr; } }
    .features-card li { font-size: 15px; color: var(--text); padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; }
    .steps { display: flex; flex-direction: column; gap: 20px; }
    .step { display: flex; align-items: flex-start; gap: 20px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; }
    .step-num { flex-shrink: 0; width: 40px; height: 40px; background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: var(--green); }
    .step h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .step p { margin: 0; font-size: 14px; color: var(--muted); }
    .faq-list { display: flex; flex-direction: column; gap: 12px; }
    .faq-item { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .faq-q { width: 100%; background: none; border: none; color: var(--text); padding: 18px 20px; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: left; }
    .faq-arrow { flex-shrink: 0; color: var(--muted); transition: transform 0.3s; font-size: 11px; }
    .faq-item.open .faq-arrow { transform: rotate(180deg); }
    .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
    .faq-item.open .faq-a { max-height: 400px; }
    .faq-a p { padding: 0 20px 18px; color: var(--muted); font-size: 15px; line-height: 1.7; }
    .cta-block { background: linear-gradient(135deg, rgba(37,211,102,0.12) 0%, rgba(99,102,241,0.08) 100%); border: 1px solid rgba(37,211,102,0.25); border-radius: 24px; padding: 48px 36px; text-align: center; }
    .cta-block h2 { margin-bottom: 12px; }
    .cta-block p { color: var(--muted); margin-bottom: 28px; }
    .related h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text); }
    .rel-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .rel-link { display: inline-block; padding: 8px 16px; background: var(--card2); border: 1px solid var(--border); border-radius: 50px; color: var(--muted); text-decoration: none; font-size: 13px; transition: color 0.2s, border-color 0.2s; }
    .rel-link:hover { color: var(--green); border-color: rgba(37,211,102,0.4); }
    footer { margin-top: 80px; border-top: 1px solid var(--border); padding: 32px 24px; text-align: center; color: var(--muted); font-size: 13px; }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--green); }`;

const FAQ_JS = `
  <script>
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(el => {
          el.classList.remove('open');
          el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  </script>`;

// ─── LEVEL 1: CITY PAGE GENERATOR ─────────────────────────────────────────────

export function generateSeoPage(category: string, city: string): string | null {
  const cityKey = city.toLowerCase();
  const catKey = category.toLowerCase();

  if (!CITIES.includes(cityKey as City) || !CATEGORIES.includes(catKey as Category)) {
    return null;
  }

  const cityName = CITY_DISPLAY[cityKey];
  const catName = CATEGORY_DISPLAY[catKey];
  const content = CATEGORY_CONTENT[catKey];
  const flavor = CITY_FLAVOR[cityKey] || cityKey;
  const isMetro = METRO_CITIES.has(cityKey);
  const shouldNoindex = NOINDEX_COMBOS.has(`${catKey}-${cityKey}`);
  const count = CITY_COUNTS[cityKey] || 50;

  const title = `Free ${catName} Website in ${cityName} | WhatsWebsite`;
  const metaDesc = `Get a FREE ${catName.toLowerCase()} website in ${cityName} in 2 minutes via WhatsApp — digital menu, booking form, Google-ready. ${count}+ ${cityName} businesses already use WhatsWebsite. Custom domain ₹999/year.`;
  const h1 = `Free ${catName} Website in ${cityName}`;

  const mainDesc = isMetro ? content.descEn(cityName, flavor) : content.descHi(cityName, flavor);
  const mainDesc2 = isMetro ? content.descEn2(cityName) : content.descHi2(cityName);
  const pain = isMetro ? content.pain_en : content.pain_hi;
  const benefitText = isMetro
    ? `${content.benefit_en} ${cityName}" on Google — free organic traffic every single day, for as long as your site is live.`
    : `${content.benefit_hi} ${cityName}" — yeh free organic traffic hai aapke business ke liye roz.`;

  const features = content.features.map(f => `<li>${f}</li>`).join('\n          ');
  const faqHtml = getCategoryFaqsHtml(catKey);
  const relatedLinks = getRelatedLinks(catKey, cityKey);

  const knownForFlavor = isMetro
    ? `${cityName} is ${flavor} — a market that values quality, discovery, and convenience. Businesses that make themselves easy to find online consistently outperform those that rely solely on walk-in traffic.`
    : `${cityName} — ${flavor} — mein businesses tezi se online ho rahe hain. Jo pehle hoga, woh aage rahega.`;

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://whatswebsite.com/free-website/${catKey}/${cityKey}`,
        url: `https://whatswebsite.com/free-website/${catKey}/${cityKey}`,
        name: title,
        description: metaDesc,
        inLanguage: 'en-IN',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whatswebsite.com' },
            { '@type': 'ListItem', position: 2, name: `Free ${catName} Website`, item: `https://whatswebsite.com/free-website/${catKey}` },
            { '@type': 'ListItem', position: 3, name: cityName, item: `https://whatswebsite.com/free-website/${catKey}/${cityKey}` },
          ],
        },
      },
      {
        '@type': 'Product',
        name: `Free ${catName} Website in ${cityName}`,
        description: metaDesc,
        brand: { '@type': 'Brand', name: 'WhatsWebsite' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock', description: 'Free website. Custom domain ₹999/year.' },
      },
    ],
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  ${shouldNoindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">'}
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://whatswebsite.com/free-website/${catKey}/${cityKey}">
  <meta property="og:image" content="https://whatswebsite.com/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://whatswebsite.com/free-website/${catKey}/${cityKey}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NEPBFF65V7"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-NEPBFF65V7');</script>
  <script type="application/ld+json">${schema}</script>
  <style>${SHARED_STYLES}</style>
</head>
<body>

<nav>
  <a href="/" class="logo">Whats<span>Website</span></a>
  <a href="https://wa.me/919187578351?text=Hi%2C%20I%20want%20a%20free%20${encodeURIComponent(catName)}%20website%20in%20${encodeURIComponent(cityName)}" class="nav-cta" target="_blank" rel="noopener">Get Free Website →</a>
</nav>

<div class="breadcrumb">
  <a href="/">Home</a><span>›</span>
  <a href="/free-website/${catKey}">Free ${catName} Website</a><span>›</span>
  ${cityName}
</div>

<div class="hero">
  <span class="hero-emoji">${content.emoji}</span>
  <div class="hero-tagline">${content.tagline}</div>
  <h1>${h1}</h1>
  <p class="hero-desc">${mainDesc}</p>
  <div class="cta-group">
    <a href="https://wa.me/919187578351?text=Hi%2C%20I%20want%20a%20free%20${encodeURIComponent(catName)}%20website%20in%20${encodeURIComponent(cityName)}" class="btn-primary" target="_blank" rel="noopener">
      📱 Start on WhatsApp — It's Free
    </a>
    <a href="/" class="btn-secondary">See Examples ↓</a>
  </div>
</div>

<div class="container">

  <section>
    <h2>Why ${cityName} ${catName} Businesses Need a Website in 2026</h2>
    <p>${mainDesc2}</p>
    <div class="pain-box">
      <p>⚠️ ${pain}</p>
    </div>
    <p>${benefitText}</p>
    <p>${knownForFlavor}</p>
    <div class="social-proof-badge">
      <span class="sp-num">${count}+</span>
      <div class="sp-text">
        <strong style="color:var(--text)">${catName} businesses in ${cityName}</strong> already have their website via WhatsWebsite.<br>
        Join them — setup takes 2 minutes on WhatsApp.
      </div>
    </div>
  </section>

  <section>
    <h2>What's Included in Your Free ${catName} Website</h2>
    <div class="features-card">
      <ul>${features}</ul>
    </div>
  </section>

  <section>
    <h2>How It Works — 3 Simple Steps</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div><h4>Send "Hi" on WhatsApp</h4><p>Click the button and send Hi. Our bot guides you through setup — no app to download, no account to create.</p></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div><h4>Answer 5 Questions</h4><p>Business name, location in ${cityName}, services, phone number, and a few photos if you have them. Takes 2 minutes.</p></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div><h4>Your Website is LIVE ✅</h4><p>Get your free whatswebsite.com link immediately. Upgrade to your own domain (like your${catKey}.in) for just ₹999/year.</p></div>
      </div>
    </div>
  </section>

  ${faqHtml}

  <section class="cta-block">
    <h2>${content.emoji} Get Your Free ${catName} Website in ${cityName} Now</h2>
    <p>No credit card. No coding. No app download. Just WhatsApp.<br>2 minutes to a professional online presence that works 24/7.</p>
    <a href="https://wa.me/919187578351?text=Hi%2C%20I%20want%20a%20free%20${encodeURIComponent(catName)}%20website%20in%20${encodeURIComponent(cityName)}" class="btn-primary" target="_blank" rel="noopener" style="font-size:18px; padding:16px 40px;">
      📱 Get Free Website on WhatsApp
    </a>
    <p style="margin-top:16px; font-size:13px; color:var(--muted);">
      💬 WhatsApp: +91 91875 78351 &nbsp;|&nbsp; Free forever • Custom domain ₹999/year
    </p>
  </section>

  ${relatedLinks}

</div>

<footer>
  <p><a href="/">WhatsWebsite</a> — India's simplest website builder for small businesses &nbsp;|&nbsp; <a href="/privacy.html">Privacy</a> &nbsp;|&nbsp; <a href="/terms.html">Terms</a></p>
  <p style="margin-top:8px">Free ${catName} website in ${cityName} — ${flavor}. WhatsApp: +91 91875 78351</p>
</footer>

${FAQ_JS}
</body>
</html>`;
}

// ─── LEVEL 2: AREA PAGE GENERATOR ─────────────────────────────────────────────

export function generateAreaSeoPage(category: string, city: string, area: string): string | null {
  const cityKey = city.toLowerCase();
  const catKey = category.toLowerCase();
  const areaKey = area.toLowerCase();

  if (!CATEGORIES.includes(catKey as Category)) return null;
  if (!CITY_AREAS[cityKey]) return null;
  if (!CITY_AREAS[cityKey][areaKey]) return null;

  const cityName = CITY_DISPLAY[cityKey] || cityKey;
  const catName = CATEGORY_DISPLAY[catKey];
  const content = CATEGORY_CONTENT[catKey];
  const areaData = CITY_AREAS[cityKey][areaKey];
  const isMetro = METRO_CITIES.has(cityKey);
  const count = areaData.businessCount;

  const title = `Free ${catName} Website in ${areaData.display}, ${cityName} | WhatsWebsite`;
  const metaDesc = `Get a FREE ${catName.toLowerCase()} website in ${areaData.display}, ${cityName} in 2 minutes via WhatsApp. ${areaData.tagline}. Join ${count}+ local businesses already online. Custom domain ₹999/year.`;

  const h1 = `Free ${catName} Website in ${areaData.display}, ${cityName}`;

  // Area + category specific intro (unique combination)
  const areaIntroEn = `${areaData.display} is ${areaData.tagline.toLowerCase()} — and that context matters deeply for your ${catName.toLowerCase()} business. ${areaData.demographics} make up the core of this neighbourhood, and they're the audience you're trying to reach. These are people who Google businesses before visiting, who research options online before committing. A ${catName.toLowerCase()} in ${areaData.display} without a website is invisible to a significant portion of its natural customer base.`;

  const areaIntroHi = `${areaData.display} ${cityName} ka ek khaas area hai — ${areaData.tagline.toLowerCase()}. Yahan ke log — ${areaData.demographics} — online search karke businesses dhundhte hain. ${catName} business ke liye ${areaData.display} mein website hona zyada zaroori hai kyunki yahan ka market is type ka hai.`;

  const mainIntro = isMetro ? areaIntroEn : areaIntroHi;

  const knownForItems = areaData.knownFor.map(k => `<span class="kf-tag">📍 ${k}</span>`).join('');
  const features = content.features.map(f => `<li>${f}</li>`).join('\n          ');
  const faqHtml = getCategoryFaqsHtml(catKey);
  const siblingLinks = getSiblingAreaLinks(catKey, cityKey, areaKey);

  const whatsappMsg = encodeURIComponent(`Hi, I want a free ${catName} website in ${areaData.display}, ${cityName}`);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://whatswebsite.com/free-website/${catKey}/${cityKey}/${areaKey}`,
        url: `https://whatswebsite.com/free-website/${catKey}/${cityKey}/${areaKey}`,
        name: title,
        description: metaDesc,
        inLanguage: 'en-IN',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whatswebsite.com' },
            { '@type': 'ListItem', position: 2, name: `Free ${catName} Website`, item: `https://whatswebsite.com/free-website/${catKey}` },
            { '@type': 'ListItem', position: 3, name: cityName, item: `https://whatswebsite.com/free-website/${catKey}/${cityKey}` },
            { '@type': 'ListItem', position: 4, name: areaData.display, item: `https://whatswebsite.com/free-website/${catKey}/${cityKey}/${areaKey}` },
          ],
        },
      },
      {
        '@type': 'Product',
        name: `Free ${catName} Website in ${areaData.display}, ${cityName}`,
        description: metaDesc,
        brand: { '@type': 'Brand', name: 'WhatsWebsite' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
      },
    ],
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://whatswebsite.com/free-website/${catKey}/${cityKey}/${areaKey}">
  <meta property="og:image" content="https://whatswebsite.com/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://whatswebsite.com/free-website/${catKey}/${cityKey}/${areaKey}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NEPBFF65V7"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-NEPBFF65V7');</script>
  <script type="application/ld+json">${schema}</script>
  <style>${SHARED_STYLES}</style>
</head>
<body>

<nav>
  <a href="/" class="logo">Whats<span>Website</span></a>
  <a href="https://wa.me/919187578351?text=${whatsappMsg}" class="nav-cta" target="_blank" rel="noopener">Get Free Website →</a>
</nav>

<div class="breadcrumb">
  <a href="/">Home</a><span>›</span>
  <a href="/free-website/${catKey}">Free ${catName} Website</a><span>›</span>
  <a href="/free-website/${catKey}/${cityKey}">${cityName}</a><span>›</span>
  ${areaData.display}
</div>

<div class="hero">
  <span class="hero-emoji">${content.emoji}</span>
  <div class="hero-tagline">${areaData.display} · ${cityName}</div>
  <h1>${h1}</h1>
  <p class="hero-desc">${mainIntro}</p>
  <div class="cta-group">
    <a href="https://wa.me/919187578351?text=${whatsappMsg}" class="btn-primary" target="_blank" rel="noopener">
      📱 Start on WhatsApp — It's Free
    </a>
    <a href="/free-website/${catKey}/${cityKey}" class="btn-secondary">
      ← All ${cityName} ${catName} Pages
    </a>
  </div>
</div>

<div class="container">

  <section>
    <h2>About ${areaData.display}</h2>
    <div class="area-profile-card">
      <h3>📍 ${areaData.display} — ${areaData.tagline}</h3>
      <p>${areaData.description}</p>
      <div>
        <strong style="color:var(--muted); font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Who lives & works here:</strong>
        <p style="margin-top:6px; font-size:14px;">${areaData.demographics}</p>
      </div>
      <div style="margin-top:12px">
        <strong style="color:var(--muted); font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Known for:</strong>
        <div class="known-for">${knownForItems}</div>
      </div>
    </div>

    <div class="social-proof-badge">
      <span class="sp-num">${count}+</span>
      <div class="sp-text">
        <strong style="color:var(--text)">${catName} businesses in ${areaData.display}</strong> have already set up their website via WhatsWebsite.<br>
        Join them — 2 minutes on WhatsApp is all it takes.
      </div>
    </div>
  </section>

  <section>
    <h2>Why ${catName} Businesses in ${areaData.display} Need a Website</h2>
    <div class="pain-box">
      <p>⚠️ ${isMetro ? content.pain_en : content.pain_hi}</p>
    </div>
    <p>${isMetro ? content.benefit_en : content.benefit_hi} ${areaData.display}, ${cityName}" on Google — capturing customers who are actively searching for your service right now, in your neighbourhood.</p>
    <p>The demographic in ${areaData.display} — <em>${areaData.demographics}</em> — researches online before spending. A professional website is how you get on their shortlist before a competitor does.</p>
  </section>

  <section>
    <h2>What's in Your Free ${catName} Website for ${areaData.display}</h2>
    <div class="features-card">
      <ul>${features}</ul>
    </div>
  </section>

  <section>
    <h2>How It Works — 3 Minutes to Live</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div><h4>WhatsApp Us from ${areaData.display}</h4><p>Tap the button and send "Hi" on WhatsApp. Our bot will guide you through setup — no app needed.</p></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div><h4>Tell Us About Your Business</h4><p>Your name, your ${catName.toLowerCase()} in ${areaData.display}, services offered, phone number, and optional photos. 5 questions, 2 minutes.</p></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div><h4>Go Live ✅</h4><p>Your website is live at a free whatswebsite.com link. Upgrade to a custom domain for ₹999/year — your own ${catKey}name.in or ${cityKey.replace(/-/g,'')}${catKey}.com.</p></div>
      </div>
    </div>
  </section>

  ${faqHtml}

  <section class="cta-block">
    <h2>${content.emoji} Get Your Free ${catName} Website in ${areaData.display} Now</h2>
    <p>No credit card. No coding. No app. Just WhatsApp.<br>
    Serving ${areaData.display}, ${cityName} and surrounding areas.</p>
    <a href="https://wa.me/919187578351?text=${whatsappMsg}" class="btn-primary" target="_blank" rel="noopener" style="font-size:18px; padding:16px 40px;">
      📱 Get Free Website on WhatsApp
    </a>
    <p style="margin-top:16px; font-size:13px; color:var(--muted);">
      💬 WhatsApp: +91 91875 78351 &nbsp;|&nbsp; Free forever • Custom domain ₹999/year
    </p>
  </section>

  ${siblingLinks}

</div>

<footer>
  <p><a href="/">WhatsWebsite</a> — Free websites for small businesses in ${areaData.display}, ${cityName} &nbsp;|&nbsp; <a href="/privacy.html">Privacy</a> &nbsp;|&nbsp; <a href="/terms.html">Terms</a></p>
  <p style="margin-top:8px">Free ${catName} website in ${areaData.display} — ${areaData.tagline}. WhatsApp: +91 91875 78351</p>
</footer>

${FAQ_JS}
</body>
</html>`;
}

// ─── SITEMAP GENERATORS ───────────────────────────────────────────────────────

export function generateSeoSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  const urls = CATEGORIES.flatMap(cat =>
    CITIES.map(city =>
      `  <url><loc>https://whatswebsite.com/free-website/${cat}/${city}</loc><changefreq>monthly</changefreq><priority>0.8</priority><lastmod>${today}</lastmod></url>`
    )
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateAreasSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  const urls: string[] = [];

  for (const [cityKey, areas] of Object.entries(CITY_AREAS)) {
    for (const areaKey of Object.keys(areas)) {
      for (const cat of CATEGORIES) {
        urls.push(
          `  <url><loc>https://whatswebsite.com/free-website/${cat}/${cityKey}/${areaKey}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`
        );
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}
