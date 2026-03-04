# WhatsWebsite.com — SEO Backlink Content
> Ready-to-post across 6 platforms. All authentic, no spam.

---

## 1. Reddit — r/SideProject Post

**Title:** I built a website builder that works entirely over WhatsApp — no app, no laptop, no coding (India-focused)

---

My chai tapri uncle has been asking me for months to make him a "website wala page" for his small shop. Every time I tried to explain Wix or Google Sites to him, his eyes glazed over.

He doesn't have a laptop. He barely uses apps outside WhatsApp and YouTube. But WhatsApp? He's a power user. Voice notes, forwards, groups — the man is fluent.

So I built something for him. And for the 63 million small businesses in India just like him.

**The idea:** You WhatsApp "+91 91875 78351" with just "Hi". A bot replies, asks you a few questions (business name, category, phone, description), and in under 2 minutes — you have a live website. No form filling, no dashboard, no laptop required.

**Tech stack:**
- Node.js + Express backend
- SQLite for simplicity (no over-engineering)
- Meta Cloud API for the WhatsApp integration
- GPT-4o to generate the actual website copy from the conversation
- Hosted on a VPS, reverse proxied with Nginx

**The result:** Each business gets a `whatswebsite.com/s/businessname` page with their info, menu/services, Google Maps link, WhatsApp contact button, and photos if they send any.

**What surprised me:** I posted on my WhatsApp status at 11pm. By the next morning, 9 people had already created sites. No ads, no Product Hunt, just status views. These were real people — a salon, a tutor, a caterer.

Total as of today: 46 sites created.

**Monetization:** Free tier gets a `whatswebsite.com/s/` link. Premium is a custom `.in` domain for ₹1,499/year (~$17). That's it. No monthly subscription to confuse people.

**What I learned:**
1. Meet users where they already are. Don't make them download another app.
2. WhatsApp IS the internet for a huge chunk of India.
3. SQLite is underrated for early-stage projects.
4. Conversational UX beats forms for low-tech audiences.

Happy to answer questions on the Meta Cloud API integration — it's got some quirks.

Live at: **whatswebsite.com**

---

## 2. Quora Answer

**Question:** How can small businesses in India create a website for free?

---

Great question, and I'll give you a real answer — not just "use Wix."

Most website builders assume you have a laptop, time to design, and comfort with dashboards. For a huge portion of Indian small business owners — kirana stores, salons, tutors, local clinics — that's just not the reality.

Here are actually useful options based on the business owner's tech comfort level:

**If they're comfortable with laptops and forms:**
- **Google Sites** — free, no coding, links to Google Drive. Good for simple pages.
- **Wix Free Tier** — drag and drop, but ads on the free plan.
- **Carrd.co** — very clean one-page sites, free tier available.

**If they only use smartphones and WhatsApp (most common in Tier 2/3 cities):**

This is where most tools fail. Filling out forms on mobile is annoying. Learning a new dashboard takes time nobody has.

**WhatsWebsite** (full disclosure: I built this) works differently — you just WhatsApp the number (+91 91875 78351) and say "Hi". The bot asks you a few questions over chat — business name, category, description, phone number — and generates a live website in under 2 minutes. No app download, no laptop, no coding.

It supports 10 business types: restaurants, salons, gyms, clinics, stores, tutors, photographers, service providers, wedding vendors, and event planners.

The site is free at a `whatswebsite.com/s/yourname` link. If you want a custom `.in` domain, that's ₹1,499/year.

46 businesses have already created sites through it, and many found it through word of mouth on WhatsApp status — which tells you the target audience is actually using it.

**Bottom line:** Use Google Sites or Wix if you're comfortable on a laptop. Use WhatsWebsite (whatswebsite.com) if you or your client just wants to send a WhatsApp and have a website ready in 2 minutes.

---

## 3. Dev.to Article

**Title:** How I Built a WhatsApp Bot That Creates Websites in 2 Minutes (Node.js + Meta Cloud API + GPT-4o)

**Tags:** node, webdev, startup, javascript

---

Last year I was trying to help my local chai shop owner get a website. He doesn't use a laptop. He's not going to learn Wix. But he's on WhatsApp 8 hours a day.

That gave me an idea: what if the entire website creation flow happened inside a WhatsApp conversation?

I built **WhatsWebsite** — a WhatsApp bot that takes a business owner from "Hi" to a live website in under 2 minutes. Here's the technical breakdown.

### Architecture Overview

```
User sends "Hi" on WhatsApp
        ↓
Meta Cloud API webhook → Express server
        ↓
Conversation state machine (SQLite)
        ↓
GPT-4o generates website copy
        ↓
Dynamic HTML page rendered & deployed
        ↓
Bot replies with live link
```

### Stack

- **Node.js + Express** — webhook receiver and API server
- **SQLite** — conversation state + business data (no over-engineering for MVP)
- **Meta Cloud API** — WhatsApp Business messaging
- **GPT-4o** — generating website copy from raw user inputs
- **Nginx** — reverse proxy + serving the generated pages

### The Meta Cloud API Webhook

Meta sends a POST to your webhook for every incoming message. Here's the basic handler:

```javascript
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    body.entry?.forEach(entry => {
      const changes = entry.changes;
      changes?.forEach(change => {
        const messages = change.value?.messages;
        if (messages) {
          messages.forEach(msg => handleMessage(msg, change.value.metadata));
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
```

**Tip:** Always return 200 immediately, even before processing. Meta will retry if you don't, and you'll get duplicate messages.

### Conversation State Machine

The bot walks users through a multi-step flow. I store state per phone number in SQLite:

```sql
CREATE TABLE conversations (
  phone TEXT PRIMARY KEY,
  step TEXT DEFAULT 'welcome',
  business_name TEXT,
  category TEXT,
  description TEXT,
  phone_display TEXT,
  created_at INTEGER
);
```

Each incoming message is routed based on the current `step`:

```javascript
async function handleMessage(msg, metadata) {
  const phone = msg.from;
  const text = msg.text?.body?.trim();

  const state = await getConversationState(phone);

  switch (state.step) {
    case 'welcome':
      await sendCategoryMenu(phone);
      await updateStep(phone, 'awaiting_category');
      break;

    case 'awaiting_category':
      await handleCategorySelection(phone, text);
      break;

    case 'awaiting_name':
      await handleNameInput(phone, text);
      break;

    // ... more steps
  }
}
```

### GPT-4o for Website Copy

Once I have the raw inputs (business name, category, description), I pass them to GPT-4o to generate clean, structured website content:

```javascript
async function generateWebsiteCopy(businessData) {
  const prompt = `
    You are a copywriter for Indian small businesses.
    Generate website content for:
    - Business: ${businessData.name}
    - Category: ${businessData.category}
    - Description: ${businessData.description}

    Return JSON with: tagline, about, services (array), cta_text
    Keep it concise. Indian English is fine.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Sending WhatsApp Replies

```javascript
async function sendMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

### Quirks I Hit with Meta Cloud API

1. **Webhook verification** — Meta sends a GET with `hub.verify_token` before any messages. Handle it or nothing works.
2. **Message deduplication** — Users sometimes send the same message twice quickly. Store processed message IDs.
3. **24-hour session window** — You can only send free-form messages within 24 hours of a user's last message. After that, you need a pre-approved template. Plan your flows accordingly.
4. **Phone number format** — Meta sends numbers without the `+` prefix. Normalize before storing.

### What I Shipped

10 business categories, live site generation, photo uploads via WhatsApp, and a premium custom `.in` domain upsell.

**Results so far:** 46 sites created, 9 users in the first day from a single WhatsApp status post.

Live: **[whatswebsite.com](https://whatswebsite.com)**

If you're building anything with the Meta Cloud API, happy to answer questions in the comments. The documentation is... let's say "dense."

---

## 4. Medium Article

**Title:** Why Indian Small Businesses Don't Need Traditional Websites

**Subtitle:** The website builder built for WhatsApp India, not Silicon Valley

---

When you think of building a website for your business, what comes to mind?

Probably a laptop. A designer. Maybe WordPress, or Wix, or some agency that charges ₹15,000 for a "basic site." You need to pick a template, write content, upload photos, connect a domain, figure out hosting.

For a restaurant owner in Nagpur or a tutor in Bhopal, that's not a website problem. That's a full-time job.

And here's the thing — they don't need that. Not really.

### What Indian small businesses actually need

They need a page that answers three questions for a potential customer:
1. **Who are you and what do you do?**
2. **Where are you / how do I reach you?**
3. **Can I contact you right now?**

That's it. Not a 5-page website with a blog and a newsletter. A clean, mobile-first page that loads fast and has a WhatsApp button front and center.

Most website builders are built for people in San Francisco, not shopkeepers in Surat.

### The tool problem runs deeper than UI

It's not just that Wix has too many options. It's the entire assumption:

- *Assumption: You have a laptop.* Most kirana owners, local salon workers, and street food vendors don't use laptops day-to-day.
- *Assumption: You're comfortable with forms.* Filling out registration forms, choosing plans, verifying emails — each step loses people.
- *Assumption: You want a dashboard.* After setup, traditional builders expect you to log in, edit, update. That's a habit most small business owners won't build.

The tool that wins for this audience meets them where they already are.

### Where they already are: WhatsApp

India has 500+ million WhatsApp users. It's the operating system of small business communication. Orders come in on WhatsApp. Customer queries, supplier coordination, team updates — all WhatsApp.

If you want to build a tool for Indian small businesses, it has to work over WhatsApp.

### What I built

**WhatsWebsite** is a website builder that lives entirely in a WhatsApp conversation.

You message the number. The bot asks you a few questions — what's your business name, what category, tell me a little about what you offer. In under 2 minutes, you have a live website.

No app. No laptop. No coding. No forms.

The site is clean, mobile-first, loads fast, and has a WhatsApp contact button built in. Because of course it does.

Ten categories are supported: restaurants, salons, gyms, clinics, stores, tutors, photographers, service providers, wedding vendors, and event planners. Free tier gives you a `whatswebsite.com/s/yourname` link. Premium is a custom `.in` domain for ₹1,499/year — a single payment, no monthly subscription to confuse anyone.

**46 businesses have already created sites.** On day one, 9 users signed up from a single WhatsApp status post — no ads, no launch campaign.

That number tells you something: the people who need this product are already on WhatsApp, already sharing things on status, already ready to use a tool like this. It just needed to exist.

### The lesson for anyone building for Bharat

Don't port a Silicon Valley product and add Hindi text. Start from scratch with the actual user in mind:

- What devices do they use? (Smartphone only)
- What apps are they fluent in? (WhatsApp, YouTube, UPI)
- What's their literacy with forms and dashboards? (Low)
- What outcome do they want? (Something that works, fast)

Build for *that* person. Everything else is secondary.

---

If you're a small business owner — or know one — who wants a website without the headache:

👉 **[whatswebsite.com](https://whatswebsite.com)**
Or just WhatsApp **+91 91875 78351** and say "Hi".

A live website in 2 minutes. Seriously.

---

## 5. Product Hunt

### Tagline (short, under 60 chars)
> Get a website by WhatsApp. 2 minutes. No laptop needed.

### Short Description (under 260 chars)
> WhatsWebsite lets Indian small businesses create a live website by just chatting on WhatsApp. Send "Hi", answer a few questions, and your site is live in 2 minutes. Free. No app, no coding, no laptop.

### Long Description

**WhatsWebsite — Your Website, Built Over WhatsApp**

India has 63 million small businesses. Most don't have a website. Not because they don't want one — because every website builder assumes you have a laptop, time, and tech comfort they don't have.

WhatsWebsite fixes this.

**How it works:**
1. WhatsApp `+91 91875 78351` and say "Hi"
2. The bot asks: business name, category, description, contact number
3. Your website is live in under 2 minutes

That's it.

**Who it's for:**
Restaurants, salons, gyms, clinics, kirana stores, tutors, photographers, service providers, wedding vendors, event planners — anyone who needs a web presence without the complexity.

**What you get (Free):**
- Live page at `whatswebsite.com/s/yourname`
- Mobile-first design, loads fast
- WhatsApp contact button
- Business info, services, photos
- Share the link anywhere

**Premium (₹1,499/year):**
- Custom `.in` domain for your business
- One payment, no monthly confusion

**Tech behind it:**
Node.js + Express, SQLite, Meta Cloud API, GPT-4o for copy generation.

**Early traction:**
46 sites created. 9 users on day one from a single WhatsApp status post — no ads.

The internet for small-town India isn't a browser. It's WhatsApp. We built where they already are.

👉 **[whatswebsite.com](https://whatswebsite.com)**

---

## 6. Hacker News — Show HN Post

**Title:** Show HN: WhatsWebsite – create a business website by chatting on WhatsApp (India)

---

Built this after watching my local shopkeeper struggle with every website builder I recommended. He has no laptop, no comfort with web forms, but he's a WhatsApp power user.

**How it works:**

User texts "Hi" to a WhatsApp Business number → a state machine built on Meta Cloud API walks them through 4 questions (name, category, description, phone) → GPT-4o generates structured website copy → an HTML page is rendered and served at `whatswebsite.com/s/slug` → bot replies with the live link.

Total time: ~2 minutes.

**Stack:**
- Node.js + Express (webhook handler + page server)
- SQLite (conversation state + business records)
- Meta Cloud API (WhatsApp Business messaging)
- GPT-4o (copy generation from raw inputs)
- Nginx (reverse proxy + static serving)

**Some Meta Cloud API gotchas I hit:**
- Must return 200 immediately on webhook POST or Meta retries and you get dupes — process async
- 24-hour session window after which you can only send pre-approved templates
- No `+` in phone numbers sent by Meta — normalize before storing/looking up
- Webhook GET verification step must be handled before any messages flow

**Monetization:** Free tier is the `whatswebsite.com/s/` subdomain. Premium is a custom `.in` domain for ₹1,499/year (~$17). No subscriptions — a single annual payment felt more trustworthy for the target audience.

**Traction so far:** 46 sites created. Posted on WhatsApp status one evening, had 9 signups by morning. No other marketing.

**10 supported categories:** restaurant, salon, gym, clinic, store, tutor, photographer, service, wedding, event.

Live: **https://whatswebsite.com**
WhatsApp to try it: +91 91875 78351

Curious if anyone has built multi-step conversational flows on WhatsApp at scale — specifically around handling session expiry and re-engagement without spamming.

---

*Generated: 2026-03-02 | For: whatswebsite.com*
