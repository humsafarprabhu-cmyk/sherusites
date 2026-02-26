/**
 * Programmatic SEO Pages — /free-website/:category/:city
 * 300 landing pages (10 categories × 30 cities) targeting long-tail keywords
 */

// ─── DATA ───────────────────────────────────────────────────────────────────

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

// Metro cities — English content; rest — Hindi/Hinglish
const METRO_CITIES = new Set(['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad']);

// Proper display names
const CITY_DISPLAY: Record<string, string> = {
  mumbai: 'Mumbai', delhi: 'Delhi', bangalore: 'Bangalore', hyderabad: 'Hyderabad',
  chennai: 'Chennai', kolkata: 'Kolkata', pune: 'Pune', ahmedabad: 'Ahmedabad',
  jaipur: 'Jaipur', lucknow: 'Lucknow', patna: 'Patna', ranchi: 'Ranchi',
  bhopal: 'Bhopal', indore: 'Indore', nagpur: 'Nagpur', varanasi: 'Varanasi',
  agra: 'Agra', chandigarh: 'Chandigarh', gurgaon: 'Gurgaon', noida: 'Noida',
  kochi: 'Kochi', coimbatore: 'Coimbatore', vizag: 'Vizag', surat: 'Surat',
  vadodara: 'Vadodara', rajkot: 'Rajkot', jodhpur: 'Jodhpur', guwahati: 'Guwahati',
  dehradun: 'Dehradun', bhubaneswar: 'Bhubaneswar',
};

const CATEGORY_DISPLAY: Record<string, string> = {
  restaurant: 'Restaurant', salon: 'Salon', gym: 'Gym', tutor: 'Tutor',
  clinic: 'Clinic', store: 'Store', photographer: 'Photographer',
  service: 'Service Business', wedding: 'Wedding', event: 'Event',
};

// City-specific flavor text snippets for uniqueness
const CITY_FLAVOR: Record<string, string> = {
  mumbai: 'the city that never sleeps',
  delhi: 'the heart of India',
  bangalore: 'India\'s Silicon Valley',
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
  indore: 'the cleanest city of India',
  nagpur: 'the Orange City',
  varanasi: 'the spiritual capital of India',
  agra: 'the city of the Taj Mahal',
  chandigarh: 'the City Beautiful',
  gurgaon: 'the Millennium City',
  noida: 'the satellite city of Delhi-NCR',
  kochi: 'the Queen of Arabian Sea',
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

// Category-specific content blocks
interface CategoryContent {
  emoji: string;
  tagline: string;
  descEn: (city: string, flavor: string) => string;
  descHi: (city: string, flavor: string) => string;
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
      `Running a restaurant in ${city}, ${flavor}, is no small feat. Between managing staff, sourcing fresh ingredients, and keeping customers happy, the last thing you want is to worry about your online presence. WhatsWebsite fixes that in 2 minutes flat — just send a WhatsApp message and your restaurant gets a stunning website with a digital menu, photo gallery, and direct inquiry button.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — restaurant chalana aasaan kaam nahi hai. Staff sambhalo, khana banao, customers ko khush rakho... aur website ke liye time kahan se laoge? WhatsWebsite se sirf 2 minute mein aapke restaurant ki website ban jaati hai — digital menu, photo gallery, aur seedha WhatsApp inquiry button ke saath.`,
    features: [
      '📋 Digital Menu with photos & prices',
      '📸 Beautiful food photo gallery',
      '📍 Google Maps location embed',
      '📞 Direct call & WhatsApp order button',
      '⭐ Customer reviews section',
      '🕐 Opening hours display',
      '📱 Mobile-first design',
      '🔍 Google-indexed automatically',
    ],
    pain_en: 'Customers search online before dining out. If your restaurant has no website, you\'re losing orders to competitors every single day.',
    pain_hi: 'Customers online search karte hain pehle. Agar aapke restaurant ki website nahi hai, toh roz orders competitors ke paas ja rahe hain.',
    benefit_en: 'Get found on Google when someone searches "restaurant near me" or "best food in',
    benefit_hi: 'Jab koi search kare "restaurant near me" ya "best khana',
    schema_type: 'Restaurant',
  },
  salon: {
    emoji: '💇',
    tagline: 'Appointment Booking + Service Menu Live',
    descEn: (city, flavor) =>
      `Beauty and grooming professionals in ${city}, ${flavor}, are booking clients through WhatsApp anyway — why not have a proper website that showcases your work and takes appointment requests 24/7? WhatsWebsite gives your salon or parlour a professional online home in 2 minutes, complete with your services, prices, and portfolio.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — aap already WhatsApp pe appointments le rahe ho. Ab ek proper website bhi honi chahiye jo aapka kaam dikhaye aur 24/7 booking le sake. WhatsWebsite se sirf 2 minute mein aapke salon ya parlour ki website ready — services, prices, aur portfolio ke saath.`,
    features: [
      '📅 Appointment request form',
      '💅 Services & pricing list',
      '🖼️ Before/after photo portfolio',
      '⭐ Client testimonials',
      '📍 Easy-to-find location',
      '📞 One-tap WhatsApp booking',
      '🎁 Special offers section',
      '📱 Looks great on mobile',
    ],
    pain_en: 'New clients Google salons before booking. Without a website, you only get clients from word-of-mouth — severely limiting your growth.',
    pain_hi: 'Naye clients Google pe salon dhundte hain. Website ke bina sirf word-of-mouth pe depend rehna padta hai — growth ruk jaati hai.',
    benefit_en: 'Show up when someone searches "best salon in',
    benefit_hi: 'Jab koi search kare "best salon',
    schema_type: 'BeautySalon',
  },
  gym: {
    emoji: '💪',
    tagline: 'Membership Plans + Batch Schedule Online',
    descEn: (city, flavor) =>
      `The fitness industry in ${city}, ${flavor}, is booming — but only the gyms with an online presence are capturing new members. With WhatsWebsite, your gym gets a professional website in 2 minutes: membership plans, batch timings, trainer profiles, and a direct inquiry button that converts visitors into paying members.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — fitness ka craze badh raha hai. Jo gyms online hain, unhe hi naye members mil rahe hain. WhatsWebsite se 2 minute mein aapke gym ki website ban jaaye — membership plans, batch timings, trainer profiles, aur inquiry button.`,
    features: [
      '💪 Membership plans & fees',
      '⏰ Batch timings & schedule',
      '🏋️ Equipment & facilities showcase',
      '👨‍🏫 Trainer profiles',
      '📸 Gym photo tour',
      '📞 Instant WhatsApp inquiry',
      '🎯 Special offers & discounts',
      '📱 Mobile-optimised design',
    ],
    pain_en: 'People look up gym reviews and photos before joining. A professional website makes you look credible and trustworthy — essential in the fitness business.',
    pain_hi: 'Log join karne se pehle photos aur reviews dekhte hain. Professional website se aap credible lagte ho — jo fitness business mein zaruri hai.',
    benefit_en: 'Rank on Google for "gym near me" or "fitness centre in',
    benefit_hi: '"gym near me" ya "fitness centre',
    schema_type: 'ExerciseGym',
  },
  tutor: {
    emoji: '📚',
    tagline: 'Online Presence for Coaching & Classes',
    descEn: (city, flavor) =>
      `Education is the backbone of ${city}, ${flavor}'s future — and parents are actively searching online for the best tutors and coaching centres. WhatsWebsite gives your coaching institute or home tuition a professional website in 2 minutes: subjects offered, batch details, fee structure, and results/testimonials that build trust instantly.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — parents apne bacchon ke liye best tutor online dhundte hain. WhatsWebsite se 2 minute mein aapke coaching ya home tuition ki website ready — subjects, batch details, fees, aur student results ke saath.`,
    features: [
      '📖 Subjects & courses offered',
      '📅 Batch timings & schedule',
      '💰 Fee structure',
      '🏆 Student results & achievements',
      '👨‍🏫 Teacher/faculty profiles',
      '📞 Free demo class inquiry',
      '📸 Classroom photos',
      '📱 Easy to share on WhatsApp',
    ],
    pain_en: 'Parents compare coaching institutes online before enrolling their children. A professional website builds credibility that word-of-mouth alone cannot.',
    pain_hi: 'Parents online compare karte hain pehle. Professional website se aapka coaching credible lagta hai — jo sirf WhatsApp se nahi milta.',
    benefit_en: 'Get discovered when parents search "best tutor in',
    benefit_hi: 'Jab parents search karein "best tutor',
    schema_type: 'EducationalOrganization',
  },
  clinic: {
    emoji: '🏥',
    tagline: 'Patient-Ready Website for Doctors & Clinics',
    descEn: (city, flavor) =>
      `Healthcare seekers in ${city}, ${flavor}, increasingly search Google before choosing a doctor or clinic. Your patients deserve to find you easily and trust you before they walk in. WhatsWebsite creates a professional medical website in 2 minutes — specialisations, OPD timings, doctor profile, and online appointment request.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — patients doctor choose karne se pehle Google karte hain. WhatsWebsite se 2 minute mein aapke clinic ki professional website — specialisation, OPD timings, doctor profile, aur appointment form ke saath.`,
    features: [
      '🩺 Doctor profile & qualifications',
      '⏰ OPD timings & days',
      '🏥 Specialisations & services',
      '📍 Clinic location & directions',
      '📞 Appointment booking via WhatsApp',
      '💊 Facilities & equipment',
      '⭐ Patient testimonials',
      '📱 Mobile-friendly design',
    ],
    pain_en: 'Patients Google "doctor near me" before visiting. Without a website, you\'re invisible to the most important moment — when someone needs a doctor.',
    pain_hi: '"Doctor near me" Google karna patients ka pehla kaam hai. Website ke bina aap invisible hain uss crucial moment mein.',
    benefit_en: 'Be found when patients search for doctors in',
    benefit_hi: 'Jab patient search kare "doctor',
    schema_type: 'MedicalBusiness',
  },
  store: {
    emoji: '🛒',
    tagline: 'Your Shop — Online & Open 24/7',
    descEn: (city, flavor) =>
      `Retail is changing fast in ${city}, ${flavor}. Customers browse online before they buy in-store — or they order directly. WhatsWebsite gives your shop or store a beautiful online presence in 2 minutes: product catalogue, WhatsApp ordering, location, and opening hours. Turn browsers into buyers.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — retail badal raha hai. Customers pehle online dekhte hain, phir khareedte hain ya direct order karte hain. WhatsWebsite se 2 minute mein aapki dukaan online — product catalogue, WhatsApp ordering, location, aur timings ke saath.`,
    features: [
      '🛍️ Product catalogue with photos',
      '💰 Price list',
      '📞 WhatsApp order button',
      '📍 Store location on map',
      '🕐 Opening hours',
      '🚚 Delivery info',
      '⭐ Customer reviews',
      '📱 Share on WhatsApp easily',
    ],
    pain_en: 'Your competitor\'s store with a website gets 3x more online inquiries than stores without one. Don\'t let them capture your customers.',
    pain_hi: 'Jis dukaan ki website hai, usse online 3x zyada inquiries milti hain. Competition se peeche mat raho.',
    benefit_en: 'Show up when people search "shop near me" or "buy online in',
    benefit_hi: '"shop near me" ya "online order',
    schema_type: 'Store',
  },
  photographer: {
    emoji: '📷',
    tagline: 'Portfolio Website for Photographers',
    descEn: (city, flavor) =>
      `Photography is a competitive field in ${city}, ${flavor}. The photographers who book the best gigs are those who can instantly share a stunning portfolio link — not just an Instagram page. WhatsWebsite gives you a dedicated photography portfolio website in 2 minutes: gallery, packages, and an inquiry form that books you more shoots.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — photography mein competition bahut hai. Jo photographer ek professional portfolio link share kar sakta hai, usse best bookings milti hain. WhatsWebsite se 2 minute mein aapka photography portfolio website — gallery, packages, aur booking inquiry form ke saath.`,
    features: [
      '📸 Stunning photo gallery / portfolio',
      '💰 Packages & pricing',
      '🎬 Wedding / event / portrait categories',
      '📅 Availability & booking calendar',
      '⭐ Client testimonials',
      '📞 Direct WhatsApp inquiry',
      '🎥 Video reel section',
      '📱 Portfolio looks great on mobile',
    ],
    pain_en: 'Clients Google photographers before booking. A professional portfolio website shows your work and instantly builds confidence to hire you.',
    pain_hi: 'Clients hire karne se pehle Google karte hain. Professional portfolio website aapka kaam dikhata hai aur trust banata hai.',
    benefit_en: 'Rank for "photographer in',
    benefit_hi: '"photographer',
    schema_type: 'ProfessionalService',
  },
  service: {
    emoji: '🔧',
    tagline: 'Get More Customers for Your Service Business',
    descEn: (city, flavor) =>
      `Service businesses in ${city}, ${flavor} — plumbers, electricians, AC repair, carpenters, and more — are losing customers to competitors who have websites. Customers search Google before calling anyone. WhatsWebsite creates a professional service business website in 2 minutes with your services, area coverage, and direct WhatsApp contact.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — plumber, electrician, AC repair, carpenter — sab service businesses ko website chahiye. Customers call karne se pehle Google karte hain. WhatsWebsite se 2 minute mein aapke service business ki website — services, area coverage, aur WhatsApp contact ke saath.`,
    features: [
      '🔧 Services list with details',
      '🗺️ Service area coverage',
      '💰 Pricing / rate card',
      '📞 Instant WhatsApp contact',
      '⭐ Customer reviews',
      '📸 Work photos / portfolio',
      '🕐 Availability hours',
      '📱 Works on all devices',
    ],
    pain_en: 'When someone\'s AC breaks or a pipe leaks, they Google for help immediately. If you\'re not online, you\'re not in the running.',
    pain_hi: 'Jab kisi ka AC kharab ho ya pipe leak kare, woh turant Google karta hai. Agar aap online nahi, toh customer competitor ke paas jata hai.',
    benefit_en: 'Be the first service provider they find in',
    benefit_hi: 'Sabse pehle dikho jab koi service dhundhe',
    schema_type: 'LocalBusiness',
  },
  wedding: {
    emoji: '💍',
    tagline: 'Wedding Website for Couples & Planners',
    descEn: (city, flavor) =>
      `Weddings in ${city}, ${flavor} are grand affairs, and couples increasingly share a beautiful wedding website with guests. Whether you\'re a couple wanting a wedding website or a wedding planner showcasing your portfolio — WhatsWebsite creates it in 2 minutes. Share venue details, RSVP, and wedding story with your guests.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — shaadi ek bada jashn hai. Aajkal couples ek beautiful wedding website share karte hain guests ke saath. Chahe aap couple ho ya wedding planner — WhatsWebsite se 2 minute mein website ready. Venue details, RSVP, aur shaadi ki kahani share karo.`,
    features: [
      '💑 Couple story & photos',
      '📅 Wedding date countdown',
      '📍 Venue details & map',
      '✉️ RSVP form',
      '📸 Beautiful photo gallery',
      '💐 Wedding events schedule',
      '🎁 Gift registry link',
      '📱 Easy to share with guests',
    ],
    pain_en: 'A wedding website is the modern invitation and information hub for all your guests. Elegant, easy to share, and always up to date.',
    pain_hi: 'Wedding website aaj ka modern invitation card hai. Elegant, easy to share, aur hamesha updated.',
    benefit_en: 'Beautiful wedding pages for couples in',
    benefit_hi: 'Aapki shaadi ke liye ek sundar website',
    schema_type: 'EventVenue',
  },
  event: {
    emoji: '🎉',
    tagline: 'Event Page with RSVP & Registrations',
    descEn: (city, flavor) =>
      `Organising an event in ${city}, ${flavor}? A dedicated event website is the most effective way to drive registrations, share event details, and build buzz. WhatsWebsite creates your event landing page in 2 minutes — schedule, speakers, registration, and all event details in one shareable link.`,
    descHi: (city, flavor) =>
      `${city} mein — ${flavor} — event organize kar rahe ho? Ek dedicated event website se registrations, details, aur buzz build karna sabse aasaan hai. WhatsWebsite se 2 minute mein aapka event page — schedule, speakers, registration, sab kuch ek link mein.`,
    features: [
      '🎯 Event details & description',
      '📅 Date, time & schedule',
      '📍 Venue & location map',
      '🎤 Speaker/performer profiles',
      '🎟️ Registration / ticket link',
      '📸 Event photo gallery',
      '📣 Sponsor showcase',
      '📱 Share link on WhatsApp & social',
    ],
    pain_en: 'A shareable event link is 10x more effective than a WhatsApp poster image. Capture registrations, share updates, and look professional.',
    pain_hi: 'WhatsApp poster se 10x better hai ek proper event link. Registrations capture karo, updates share karo, professional dikhao.',
    benefit_en: 'Create buzz-worthy event pages for events in',
    benefit_hi: 'Apna event famous banao',
    schema_type: 'Event',
  },
};

// ─── RELATED PAGES ───────────────────────────────────────────────────────────

function getRelatedLinks(category: string, city: string): string {
  // 3 other cities in same category + 3 other categories in same city
  const otherCities = CITIES.filter(c => c !== city).slice(0, 6);
  const otherCats = CATEGORIES.filter(c => c !== category).slice(0, 4);

  const cityLinks = otherCities.slice(0, 3).map(c =>
    `<a href="/free-website/${category}/${c}" class="rel-link">${CATEGORY_DISPLAY[category]} in ${CITY_DISPLAY[c]}</a>`
  ).join('');

  const catLinks = otherCats.slice(0, 3).map(c =>
    `<a href="/free-website/${c}/${city}" class="rel-link">${CATEGORY_DISPLAY[c]} in ${CITY_DISPLAY[city]}</a>`
  ).join('');

  return `
    <section class="related">
      <h3>Free Websites for ${CATEGORY_DISPLAY[category]}s in Other Cities</h3>
      <div class="rel-grid">${cityLinks}</div>
      <h3 style="margin-top:24px">Other Free Websites in ${CITY_DISPLAY[city]}</h3>
      <div class="rel-grid">${catLinks}</div>
    </section>`;
}

// ─── PAGE GENERATOR ──────────────────────────────────────────────────────────

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

  const title = `Free ${catName} Website in ${cityName} | WhatsWebsite`;
  const metaDesc = `Get a FREE ${catName.toLowerCase()} website in ${cityName} in 2 minutes via WhatsApp. Digital menu, booking, Google-ready. No coding needed. ₹999/year for custom domain.`;
  const h1 = `Free ${catName} Website in ${cityName}`;

  const mainDesc = isMetro
    ? content.descEn(cityName, flavor)
    : content.descHi(cityName, flavor);

  const pain = isMetro ? content.pain_en : content.pain_hi;
  const benefitText = isMetro
    ? `${content.benefit_en} ${cityName}" on Google — that's free organic traffic to your business every single day.`
    : `${content.benefit_hi} ${cityName}" — yeh free organic traffic hai aapke business ke liye har roz.`;

  const features = content.features
    .map(f => `<li>${f}</li>`)
    .join('\n          ');

  const relatedLinks = getRelatedLinks(catKey, cityKey);

  // Schema markup
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
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          description: 'Free website. Custom domain ₹999/year.',
        },
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
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://whatswebsite.com/free-website/${catKey}/${cityKey}">
  <meta property="og:image" content="https://whatswebsite.com/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDesc}">
  <link rel="canonical" href="https://whatswebsite.com/free-website/${catKey}/${cityKey}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <!-- GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NEPBFF65V7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-NEPBFF65V7', { page_title: '${title}', page_location: window.location.href });
  </script>

  <script type="application/ld+json">${schema}</script>

  <style>
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
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      overflow-x: hidden;
    }

    /* NAV */
    nav {
      position: sticky; top: 0; z-index: 100;
      padding: 14px 24px;
      backdrop-filter: blur(20px);
      background: rgba(3,7,18,0.85);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo { font-size: 18px; font-weight: 800; text-decoration: none; color: var(--text); }
    .logo span { color: var(--green); }
    .nav-cta {
      background: var(--green); color: #000;
      padding: 8px 20px; border-radius: 50px;
      text-decoration: none; font-weight: 700; font-size: 13px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .nav-cta:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(37,211,102,0.4); }

    /* BREADCRUMB */
    .breadcrumb {
      padding: 12px 24px;
      font-size: 13px; color: var(--muted);
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.02);
    }
    .breadcrumb a { color: var(--muted); text-decoration: none; }
    .breadcrumb a:hover { color: var(--green); }
    .breadcrumb span { margin: 0 6px; }

    /* HERO */
    .hero {
      padding: 64px 24px 48px;
      text-align: center;
      background: radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.12) 0%, transparent 65%);
    }
    .hero-emoji { font-size: 56px; margin-bottom: 16px; display: block; }
    .hero h1 {
      font-size: clamp(28px, 5vw, 52px);
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #fff 40%, var(--green) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-tagline {
      display: inline-block;
      background: rgba(37,211,102,0.15);
      border: 1px solid rgba(37,211,102,0.3);
      color: var(--green);
      padding: 6px 16px; border-radius: 50px;
      font-size: 14px; font-weight: 600;
      margin-bottom: 24px;
    }
    .hero-desc {
      max-width: 680px; margin: 0 auto 36px;
      font-size: 17px; color: var(--muted); line-height: 1.8;
    }
    .cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--green); color: #000;
      padding: 14px 32px; border-radius: 50px;
      font-weight: 800; font-size: 16px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 24px rgba(37,211,102,0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,211,102,0.5); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px;
      background: transparent; color: var(--text);
      padding: 14px 28px; border-radius: 50px;
      font-weight: 600; font-size: 15px;
      text-decoration: none;
      border: 1px solid var(--border);
      transition: border-color 0.2s, background 0.2s;
    }
    .btn-secondary:hover { border-color: var(--green); background: rgba(37,211,102,0.08); }

    /* CONTENT */
    .container { max-width: 780px; margin: 0 auto; padding: 0 24px; }
    section { margin: 56px 0; }
    section h2 {
      font-size: clamp(22px, 3.5vw, 32px);
      font-weight: 800; margin-bottom: 20px;
    }
    section p { font-size: 16px; color: var(--muted); margin-bottom: 16px; }
    section p strong { color: var(--text); }

    /* PAIN BOX */
    .pain-box {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 16px;
      padding: 24px 28px;
      margin: 28px 0;
    }
    .pain-box p { color: #fca5a5; margin: 0; font-size: 16px; }

    /* FEATURES */
    .features-card {
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
    }
    .features-card ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media(max-width: 520px){ .features-card ul { grid-template-columns: 1fr; } }
    .features-card li {
      font-size: 15px; color: var(--text);
      padding: 10px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    /* HOW IT WORKS */
    .steps { display: flex; flex-direction: column; gap: 20px; }
    .step {
      display: flex; align-items: flex-start; gap: 20px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px 24px;
    }
    .step-num {
      flex-shrink: 0;
      width: 40px; height: 40px;
      background: rgba(37,211,102,0.15);
      border: 1px solid rgba(37,211,102,0.3);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 16px; color: var(--green);
    }
    .step h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .step p { margin: 0; font-size: 14px; color: var(--muted); }

    /* CTA BLOCK */
    .cta-block {
      background: linear-gradient(135deg, rgba(37,211,102,0.12) 0%, rgba(99,102,241,0.08) 100%);
      border: 1px solid rgba(37,211,102,0.25);
      border-radius: 24px;
      padding: 48px 36px;
      text-align: center;
    }
    .cta-block h2 { margin-bottom: 12px; }
    .cta-block p { color: var(--muted); margin-bottom: 28px; }

    /* RELATED */
    .related h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text); }
    .rel-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .rel-link {
      display: inline-block;
      padding: 8px 16px;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 50px;
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
      transition: color 0.2s, border-color 0.2s;
    }
    .rel-link:hover { color: var(--green); border-color: rgba(37,211,102,0.4); }

    /* FOOTER */
    footer {
      margin-top: 80px;
      border-top: 1px solid var(--border);
      padding: 32px 24px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--green); }
  </style>
</head>
<body>

<nav>
  <a href="/" class="logo">Whats<span>Website</span></a>
  <a href="https://wa.me/919187578351?text=Hi%2C%20I%20want%20a%20free%20${encodeURIComponent(catName)}%20website%20in%20${encodeURIComponent(cityName)}" class="nav-cta" target="_blank" rel="noopener">
    Get Free Website →
  </a>
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
    <a href="/" class="btn-secondary">
      See How It Works ↓
    </a>
  </div>
</div>

<div class="container">

  <section>
    <h2>Why Your ${cityName} ${catName} Needs a Website</h2>
    <div class="pain-box">
      <p>⚠️ ${pain}</p>
    </div>
    <p>${benefitText}</p>
    <p>With WhatsWebsite, you don't need a developer, a laptop, or technical knowledge. <strong>Just WhatsApp.</strong> Answer 5 questions about your business, and your website is live — with your name, services, photos, and contact details.</p>
  </section>

  <section>
    <h2>What's Included in Your Free ${catName} Website</h2>
    <div class="features-card">
      <ul>
          ${features}
      </ul>
    </div>
  </section>

  <section>
    <h2>How It Works — 3 Simple Steps</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div>
          <h4>Send "Hi" on WhatsApp</h4>
          <p>Click the button below and send Hi. Our WhatsApp bot will guide you through the setup — no app to download.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div>
          <h4>Answer 5 Questions</h4>
          <p>Business name, location, services, phone number, photos (optional). Takes less than 2 minutes.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div>
          <h4>Your Website is LIVE ✅</h4>
          <p>Get a free whatswebsite.com link immediately. Upgrade to your own domain (like ${catKey}.in or ${cityKey}${catKey}.com) for just ₹999/year.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="cta-block">
    <h2>${content.emoji} Get Your Free ${catName} Website in ${cityName} Now</h2>
    <p>No credit card. No coding. No app. Just WhatsApp.<br>2 minutes to a professional online presence.</p>
    <a href="https://wa.me/919187578351?text=Hi%2C%20I%20want%20a%20free%20${encodeURIComponent(catName)}%20website%20in%20${encodeURIComponent(cityName)}" class="btn-primary" target="_blank" rel="noopener" style="font-size:18px; padding:16px 40px;">
      📱 Get Free Website on WhatsApp
    </a>
    <p style="margin-top:16px; font-size:13px; color: var(--muted);">
      💬 WhatsApp: +91 91875 78351 &nbsp;|&nbsp; Free forever • Custom domain ₹999/year
    </p>
  </section>

  ${relatedLinks}

</div>

<footer>
  <p>
    <a href="/">WhatsWebsite</a> — India's simplest website builder for small businesses &nbsp;|&nbsp;
    <a href="/privacy.html">Privacy</a> &nbsp;|&nbsp;
    <a href="/terms.html">Terms</a>
  </p>
  <p style="margin-top:8px">Free ${catName} website in ${cityName} — ${cityName}, ${CITY_FLAVOR[cityKey] || cityKey}. WhatsApp: +91 91875 78351</p>
</footer>

</body>
</html>`;
}

// ─── SITEMAP GENERATOR ───────────────────────────────────────────────────────

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
