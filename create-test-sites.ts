import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'data', 'sherusites.db'));

// Create users first
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (phone, name, sites, created_at) 
  VALUES (?, ?, ?, datetime('now'))
`);

insertUser.run('9123456789', 'Wedding User', '[]');
insertUser.run('9987654321', 'Event User', '[]');
console.log('✅ Test users created');

// Wedding test site
const weddingServices = [
  {
    name: "Mehendi",
    date: "2026-03-10",
    time: "6:00 PM - 9:00 PM",
    venue: "Bride's Home",
    description: "Traditional henna ceremony with music and dance"
  },
  {
    name: "Haldi",
    date: "2026-03-11",
    time: "10:00 AM - 12:00 PM", 
    venue: "Family Garden",
    description: "Turmeric ceremony for blessing the couple"
  },
  {
    name: "Sangeet",
    date: "2026-03-11",
    time: "7:00 PM - 11:00 PM",
    venue: "Grand Ballroom, Hotel Taj",
    description: "Musical night with dance performances"
  },
  {
    name: "Wedding",
    date: "2026-03-12",
    time: "8:00 AM - 12:00 PM",
    venue: "Shree Ram Temple",
    description: "Sacred wedding ceremony with all rituals"
  },
  {
    name: "Reception",
    date: "2026-03-12", 
    time: "7:00 PM - 11:00 PM",
    venue: "Royal Gardens, Patna",
    description: "Grand celebration dinner with family and friends"
  }
];

const eventServices = [
  {
    name: "Registration & Networking",
    time: "9:00 AM - 10:00 AM",
    description: "Welcome coffee and networking with fellow developers"
  },
  {
    name: "Keynote: Future of Tech",
    time: "10:00 AM - 11:00 AM",
    speaker: "Rahul Kumar, CTO at TechCorp",
    description: "Exploring emerging technologies and industry trends"
  },
  {
    name: "Workshop: React Performance",
    time: "11:30 AM - 12:30 PM",
    speaker: "Priya Singh, Senior Dev",
    description: "Hands-on workshop on optimizing React applications"
  },
  {
    name: "Panel Discussion: Startup Journey",
    time: "2:00 PM - 3:00 PM",
    description: "Insights from successful entrepreneurs and founders"
  },
  {
    name: "Networking & Closing",
    time: "3:30 PM - 4:30 PM",
    description: "Final networking session and event wrap-up"
  }
];

// Insert wedding test site
const insertWedding = db.prepare(`
  INSERT INTO sites (
    slug, owner_phone, business_name, category, tagline, phone, whatsapp,
    address, timings, about, services, plan, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

try {
  insertWedding.run(
    'sharma-wedding',
    '9123456789',
    'Amit & Priya Wedding',
    'wedding',
    'Two hearts, one soul, endless love ✨',
    '9123456789',
    '919123456789',
    'Shree Ram Temple, Gandhi Maidan, Patna, Bihar',
    'March 10-12, 2026',
    'Join us as we celebrate the union of Amit and Priya in a traditional ceremony filled with joy, love, and blessings.',
    JSON.stringify(weddingServices),
    'free'
  );
  console.log('✅ Wedding test site created: sharma-wedding');
} catch (err: any) {
  console.log('Wedding site already exists or error:', err.message);
}

// Insert event test site  
const insertEvent = db.prepare(`
  INSERT INTO sites (
    slug, owner_phone, business_name, category, tagline, phone, whatsapp,
    address, timings, about, services, plan, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

try {
  insertEvent.run(
    'tech-meetup-patna',
    '9987654321',
    'Tech Meetup Patna',
    'event',
    'Connect. Learn. Innovate. 🚀',
    '9987654321',
    '919987654321',
    'Hotel Chandragupta, Fraser Road, Patna',
    'March 15, 2026 | 9:00 AM - 4:30 PM',
    'Join Patna\'s biggest tech meetup featuring industry leaders, hands-on workshops, and networking opportunities for developers and entrepreneurs.',
    JSON.stringify(eventServices),
    'free'
  );
  console.log('✅ Event test site created: tech-meetup-patna');
} catch (err: any) {
  console.log('Event site already exists or error:', err.message);
}

db.close();
console.log('✅ Test sites creation completed');