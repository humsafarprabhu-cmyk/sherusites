# Template SOP — WhatsWebsite Category Templates

> **RULE: If you edit ANY template or renderer, update this SOP too.**

---

## 1. Core Principles

### 1.1 ZERO Hardcoding
- **ALL business data comes from `__SITE_DATA__` (SQLite DB)**
- No business names, taglines, addresses, timings, phone numbers in HTML
- Use `__BUSINESS_NAME__`, `__TAGLINE__`, `__ADDRESS__`, `__TIMINGS__` placeholders in HTML (renderer replaces these)
- JS populates everything else from `window.__SITE_DATA__`

### 1.2 JS Fallbacks Are OK
- Section headers can have defaults: `sec.servicesTitle || 'What We Offer'`
- These are **UI defaults**, not business data — DB `sectionContent` overrides them
- Trust badges, section eyebrows, section descriptions — all from `D.sectionContent || {}` with sensible defaults

### 1.3 No Duplicate Content
- Business name appears ONLY in: **Header** (top-left), **Hero h1**, **Footer brand**, **Footer copyright**
- No hero badges repeating the name
- No redundant about text in hero (about section handles that)

### 1.4 Everything AI-Generated
- User provides: category, name, phone, address, timings
- AI generates: tagline, about, services/menu, reviews, trust badges, section content
- User can edit everything later via AI agent on WhatsApp

---

## 2. Required Sections (Every Template Must Have)

| # | Section | Element IDs | Data Source | Notes |
|---|---------|------------|-------------|-------|
| 1 | **Scroll Progress Bar** | `prog` | Scroll position | Fixed top, 3px, gradient |
| 2 | **Header** | `hdr`, `hdrName`, `hdrBook` | `businessName` | Sticky, glass blur on scroll. Name WHITE on hero, DARK when scrolled. CTA button transparent on hero, colored when scrolled |
| 3 | **Hero** | `heroName`, `heroTagline`, `heroOpen`, `heroImg` | `businessName`, `tagline`, `isOpen`, `photos[type:hero]` | Fullscreen bg image (Unsplash default), dark overlay, Ken Burns animation, Open/Closed status |
| 4 | **Trust Strip** | `trustStrip` | `D.trustBadges` or `sec.trustBadges` | Pills with icon+text, from DB with defaults |
| 5 | **Offer Banner** | `offerSection`, `offerTitle`, `offerDesc` | `D.activeOffer` | Hidden by default, shown only if data exists |
| 6 | **Main Content** | varies by category | `D.services` / `D.menu` | Category-specific (see §4) |
| 7 | **Gallery** | `galGrid`, `gallerySection`, `galEye`, `galTitle`, `galDesc` | `D.photos[type:gallery]` | 6 max + "See All →" link. **Default Unsplash photos per category when empty** |
| 8 | **About** | `aboutText`, `aboutOwner`, `aboutExp`, `aboutEye`, `aboutTitle` | `D.about`, `D.ownerName`, `D.experience` | Card with about text, owner name, experience |
| 9 | **Reviews** | `revList`, `reviewSection`, `revEye`, `revTitle` | `D.reviews[]` | Stars + text + author. Hide section if no reviews |
| 10 | **Google Maps** | `locMap` | `D.businessName + D.address` | Embedded iframe, `maps.google.com/maps?q=...&output=embed` |
| 11 | **Location** | `locAddr`, `locTime`, `locBtn`, `locEye`, `locTitle` | `D.address`, `D.timings` | Address, timings, Get Directions link |
| 12 | **Footer** | `ftrName`, `ftrTag`, `ftrCopy` | `businessName`, `tagline` | Brand, tagline, nav links, copyright |
| 13 | **Sticky Bottom CTA** | `stickyCta`, `stickyBook` | WhatsApp link | Shows after 400px scroll |
| 14 | **`<!-- __PAGE_END__ -->`** | — | — | Marker for promo/credit footer injection |
| 15 | **`<!-- __INJECT_DATA__ -->`** | — | — | Marker for `__SITE_DATA__` JSON injection |

### Promo/Credit Footer (Injected by Renderer)
- **Free sites**: Slim fixed bottom bar — `Free website chahiye? [WhatsApp karo →]`
- **Premium sites**: Subtle static text — `Made with WhatsWebsite`
- WhatsApp number from single `WA_NUMBER` constant in `template-renderer.ts`
- Renderer handles injection via `<!-- __PAGE_END__ -->` marker — template doesn't include this

---

## 3. Design System Per Category

Each template has its own **fonts, color palette, and vibe**. No two categories look the same.

| Category | Fonts (Google) | Color Palette | Vibe | Hero Default Unsplash |
|----------|---------------|---------------|------|----------------------|
| 🍽️ **restaurant** | DM Serif Display + DM Sans + Caveat | Warm cream, orange, dark brown | Warm, appetizing, inviting | Food photography `photo-1504674900247-0877df9cc836` |
| 💇 **salon** | Playfair Display + Poppins + Dancing Script | Rose `#B76E79`, gold `#C9A96E`, blush `#FDF2F0`, cream `#FFFAF8` | Luxury, elegant, rose gold | Salon interior `photo-1560066984-138dadb4c035` |
| 🏪 **store** | Space Grotesk + Inter | Blue `#3B82F6`, slate `#1E293B`, white, light gray | Clean, modern, product-focused | Store/retail |
| 📚 **tutor** | Nunito + Source Sans 3 | Yellow `#F59E0B`, teal `#14B8A6`, warm white | Friendly, warm, trust-first | Education/classroom |
| 🏥 **clinic** | Plus Jakarta Sans + DM Sans | Teal `#0D9488`, white, soft blue `#F0FDFA` | Clinical, calming, professional | Medical/clinic |
| 💪 **gym** | Bebas Neue + Outfit | Dark `#0F0F0F`, neon green `#22C55E`, red accent | Bold, high energy, dark | Gym/fitness |
| 📸 **photographer** | Cormorant Garamond + Raleway | Pure white, black, minimal gray | Minimal, elegant, full-bleed photos | Photography portfolio |
| 🔧 **service** | Manrope + Inter | Blue `#2563EB`, slate, white | Professional, trustworthy, clean | Service/handyman |

---

## 4. Category-Specific Content Sections

### 🍽️ Restaurant
- **Menu with category tabs** (`m-tabs`): Filter by category (Starters, Main Course, etc.)
- **Today's Special** (`sp-box`): Featured dish with 🔥 badge
- **Food strip marquee**: Scrolling food emojis
- **Item count**: "X dishes available"
- Data: `D.menu[]` with `{name, price, description, category, veg, popular}`

### 💇 Salon
- **Services grid**: 2-col on desktop, 1-col mobile
- **Duration badge**: 🕐 per service
- **Popular badge**: Gold tag on popular services
- Data: `D.services[]` with `{name, price, duration, description, popular}`

### 🏪 Store
- **Product grid**: 3-col desktop, 2-col mobile
- **Category filter tabs**
- **Price + "Add to Cart" CTA** (WhatsApp order)
- **"In Stock" / "Out of Stock" badges**
- Data: `D.services[]` with `{name, price, description, category, inStock, image}`

### 📚 Tutor
- **Subjects offered**: Cards with subject, level, mode (online/offline)
- **Qualifications / credentials section**
- **Student testimonials** (reviews section)
- **Fee structure table**
- Data: `D.services[]` with `{name, price, description, level, mode}`

### 🏥 Clinic
- **Services/Treatments list**: Clean cards
- **Doctor profile**: Photo, qualifications, experience
- **Appointment CTA** prominent
- **Timings table** (day-wise if available)
- Data: `D.services[]` with `{name, price, duration, description}`

### 💪 Gym
- **Membership plans**: Pricing cards with features
- **Facilities/Equipment list**
- **Trainers section**
- **Class schedule**
- Data: `D.services[]` with `{name, price, duration, description, features[]}`

### 📸 Photographer
- **Portfolio grid**: Full-bleed, masonry-style
- **Packages**: Wedding, Portrait, Event, etc.
- **Booking CTA**
- Data: `D.services[]` with `{name, price, description, category}`

### 🔧 Service (General)
- **Services list**: Clean cards with pricing
- **Service area / coverage**
- **Trust badges prominent** (years exp, jobs done, etc.)
- Data: `D.services[]` with `{name, price, description, duration}`

---

## 5. Technical Checklist (Before Shipping a Template)

### HTML Structure
- [ ] `<!-- __INJECT_DATA__ -->` marker present before `</body>`
- [ ] `<!-- __PAGE_END__ -->` marker after footer for promo injection
- [ ] All `__BUSINESS_NAME__`, `__TAGLINE__`, `__ADDRESS__`, `__TIMINGS__` placeholders used (not hardcoded text)
- [ ] No hardcoded business data anywhere in HTML
- [ ] Responsive meta viewport tag
- [ ] Title tag: `<title>__BUSINESS_NAME__</title>`
- [ ] OG meta tags with placeholders
- [ ] Favicon with category emoji

### CSS
- [ ] CSS variables for all colors (easy theming)
- [ ] Font imports via Google Fonts `<link>`
- [ ] Category-specific font variables: `--serif`, `--sans`, `--hand` (if applicable)
- [ ] Mobile-first responsive (works on 320px+)
- [ ] Full-width layout on desktop, content sections max-width 900px
- [ ] Header: name WHITE before scroll, DARK after scroll (`.hdr.scrolled`)
- [ ] Header CTA: transparent/glass before scroll, colored after scroll
- [ ] Scroll progress bar: 3px fixed top, gradient
- [ ] Sticky bottom CTA: hidden initially, shows after 400px scroll
- [ ] `.fade-up` class for scroll animations
- [ ] Hero: min-height 85-90vh, dark overlay on image
- [ ] Ken Burns / zoom animation on hero image

### JavaScript
- [ ] All content populated from `window.__SITE_DATA__`
- [ ] `t(id, value)` helper for setting text content
- [ ] Hero image: swap `#heroImg` src if `photos.find(type:'hero')` exists
- [ ] Default Unsplash gallery photos for the category when `photos` is empty
- [ ] Gallery: max 6, "See All →" links to `/site/{slug}/gallery`
- [ ] Hide sections with no data (gallery, reviews, offer)
- [ ] Open/Closed status: green dot + "Open Now" / red dot + "Closed Now"
- [ ] WhatsApp link built from `D.whatsapp || D.phone`
- [ ] Google Maps embed from `D.businessName + ', ' + D.address`
- [ ] IntersectionObserver for `.fade-up` elements
- [ ] Scroll listener: header class toggle, progress bar, sticky CTA
- [ ] Section headers from `D.sectionContent || {}` with defaults
- [ ] Trust badges from `D.trustBadges || sec.trustBadges` with defaults
- [ ] Title update: `document.title = D.businessName + ' | Category'`
- [ ] `const` for static, `let` for reassigned (e.g., `galPhotos`)

### Renderer Integration
- [ ] Template filename added to `CATEGORY_TEMPLATE` map in `bot/template-renderer.ts`
- [ ] `getContentKey()` returns correct key for category (`menu`, `services`, `subjects`, `plans`)
- [ ] Placeholder replacement works (`__BUSINESS_NAME__` etc.)
- [ ] `__SITE_DATA__` JSON injection works at `<!-- __INJECT_DATA__ -->` marker
- [ ] Promo footer injection works via `<!-- __PAGE_END__ -->` marker
- [ ] Re-render existing sites of that category after template change

### Unsplash Photos
- [ ] Hero default: 1 high-quality photo, `w=1400&q=80`
- [ ] Gallery defaults: 6 photos, `w=600&q=80`
- [ ] **VERIFY every Unsplash URL returns 200** (not 404) before committing
- [ ] Photos match the category vibe

### Testing
- [ ] Re-render: `npx tsx scripts/re-render-all.ts`
- [ ] PM2 restart: `pm2 restart sherusites`
- [ ] Check live URL: `https://whatswebsite.com/site/{slug}`
- [ ] Verify on mobile viewport (320px, 375px, 414px)
- [ ] Verify all sections render with data
- [ ] Verify sections hide gracefully with no data
- [ ] Verify promo footer shows for free sites
- [ ] Verify promo footer hidden for premium sites
- [ ] Git commit + push after every change

### AI Content Generation
- [ ] Update `bot/ai-content.ts` if new category needs specific content structure
- [ ] Ensure AI generates: tagline, about, services/menu, reviews, trust badges
- [ ] Trust badges should be relevant to category (not generic)
- [ ] Reviews should feel authentic for that category

---

## 6. File Locations

| File | Purpose |
|------|---------|
| `templates/{category}-2026.html` | Template HTML file |
| `bot/template-renderer.ts` | Renders template + injects data + promo footer |
| `bot/ai-content.ts` | AI-generates content per category |
| `bot/db.ts` | SQLite data access |
| `bot/site-agent.ts` | AI edit agent (35+ actions) |
| `scripts/re-render-all.ts` | Re-render all sites |
| `TEMPLATE-SOP.md` | **This file — keep updated!** |

---

## 7. Template Creation Workflow

```
1. Check category design in §3 (fonts, colors, vibe)
2. Check category-specific sections in §4
3. Copy salon-2026.html as base (cleanest template)
4. Replace: fonts, CSS variables, color palette
5. Add/remove category-specific sections
6. Add default Unsplash photos (hero + gallery) — VERIFY URLs!
7. Update CATEGORY_TEMPLATE map in template-renderer.ts
8. Update getContentKey() if needed
9. Run through §5 checklist
10. Re-render → PM2 restart → verify live → git commit+push
```

---

## 8. WhatsApp Number (Single Source of Truth)

- **Location**: `bot/template-renderer.ts` → `const WA_NUMBER = '918210329601'`
- Used in: promo footer (free), credit footer (premium)
- Change here → all sites get updated on next re-render

---

## 9. Default Gallery Photos Registry

Every category must have 6 default Unsplash gallery photos. Defined in the template JS.

**Salon:**
1. `photo-1522337360788-8b13dee7a37e` — Salon Interior
2. `photo-1521590832167-7bcbfaa6381f` — Hair Styling
3. `photo-1516975080664-ed2fc6a32937` — Spa Treatment
4. `photo-1457972729786-0411a3b2b626` — Makeup
5. `photo-1560066984-138dadb4c035` — Beauty Care
6. `photo-1604654894610-df63bc536371` — Nail Art

**Restaurant:**
1. `photo-1517248135467-4c7edcad34c4` — Restaurant
2. `photo-1414235077428-338989a2e8c0` — Fine Dining
3. `photo-1504674900247-0877df9cc836` — Cuisine
4. `photo-1555396273-367ea4eb4db5` — Ambience
5. `photo-1476224203421-9ac39bcb3327` — Plating
6. `photo-1540189549336-e6e99c3679fe` — Fresh Food

**Store:**
1. `photo-1472851294608-062f824d29cc` — Store
2. `photo-1555529669-e69e7aa0ba9a` — Shopping
3. `photo-1604719312566-8912e9227c6a` — Products
4. `photo-1581783898377-1c85bf937427` — Display
5. `photo-1556740758-90de374c12ad` — Collection
6. `photo-1567401893414-76b7b1e5a7a5` — Store Front

> Add new category photos here as templates are built.

---

## 10. Changelog

| Date | Change | Template |
|------|--------|----------|
| 2026-02-25 | Created salon-2026.html | salon |
| 2026-02-25 | Removed all hardcoding, dynamic sections from DB | salon |
| 2026-02-25 | Header name white→dark on scroll | salon |
| 2026-02-25 | Added hero Unsplash default + Ken Burns | salon |
| 2026-02-25 | Added Google Maps embed | salon |
| 2026-02-25 | Fixed promo footer injection for non-div markers | renderer |
| 2026-02-25 | Slim promo banner, single WA_NUMBER | renderer |
| 2026-02-25 | Default gallery photos per category | salon |
| 2026-02-25 | Fixed 2 broken Unsplash URLs | salon |
## 10.0 Simple Commands (smart-router.ts) — NO AI NEEDED

Simple regex-based commands work instantly without AI. These are the PRIMARY edit method.

### Supported Commands (all categories):
| Command | Examples |
|---------|----------|
| **Remove item** | "remove samosa", "litti chokha delete karo", "hatao paneer tikka", "remove X from our products" |
| **Remove category** | "remove electronics category", "starters category hatao" |
| **Add item** | "add samosa ₹50", "dalo coffee ₹80" |
| **Change price** | "samosa ka price 60 karo", "price of coffee to 90" |
| **Bulk add** | Multiple lines: "Samosa - ₹50\nChai - ₹20" |

### Pattern Priority (ORDER MATTERS):
1. `matchAddItem` — add items
2. `matchRemoveCategory` — remove whole category (must be BEFORE item remove)
3. `matchRemoveItem` — remove single item
4. `matchPriceChange` — update price
5. `matchBulkPrice` — bulk price update
6. AI agent — fallback for complex edits

### Data Field Handling:
| Category | Items stored in | Notes |
|----------|----------------|-------|
| Restaurant | `menu` | Has `category` field (Starters, Main Course, etc.) |
| Salon | `services` | May not have categories |
| Store | `services` | Has `category` field |
| Tutor | `subjects` | Has schedule/duration |
| Clinic | `services` | Has duration |

**All simple commands check ALL lists** (`menu`, `services`, `packages`, `plans`, `subjects`) — works for every category.

### Regex Rules:
- Suffix patterns (X delete karo) must come BEFORE prefix patterns (delete X) to avoid capturing command words as item names
- Strip noise words: "from our products", "menu se", "karo", "kar", "do"
- `(.+?)` (lazy) for suffix, `(.+?)` for prefix with noise stripping
- Always skip if message contains photo/gallery/hero keywords → let AI handle

## 10.1 AI Agent Actions — CRITICAL RULE

**NEVER use `siteData.menu` directly for item operations.** Different categories store items in different fields:
- Restaurant → `siteData.menu`
- Store/Salon/Clinic/Gym/etc → `siteData.services`
- Tutor → `siteData.subjects`

**Always use `getItems()` / `setItems()` helpers** in `bot/site-agent.ts` which auto-detect the correct field.

Actions affected: `add_menu_item`, `remove_menu_item`, `mark_popular`, `unmark_popular`, `set_veg`, `set_nonveg`, `rename_category`, `reorder_category`, `remove_category`, `update_item_description`.

## 10.2 AI Agent Response — JSON Leak Prevention

AI agent sometimes returns text + JSON mixed. The parser in `bot/site-agent.ts`:
1. First tries regex extraction: `raw.match(/\{.*"reply".*"actions".*\}/)`
2. Falls back to stripping JSON fragments: `raw.replace(/\{[\s\S]*\}/g, '')`
3. Never expose raw JSON to the user

## 10.3 AI Content Generation — Smart & Fast

- **3 parallel API calls**: menu/services, meta (tagline/about/reviews), photo queries
- Each call has its own timeout (menu: 15s, meta: 12s, photos: 8s)
- **Category-specific menu prompts** — restaurant gets cuisine prompt, store gets products prompt, salon gets services prompt
- **Business name inference** — "Bihari Restaurant" → Bihari dishes, "Kumar Electronics" → electronics products
- If any call fails, others still succeed → partial AI + partial defaults
- Fallback defaults used when ALL calls fail
- **Progress message** sent to user before generation: "🔨 Website ban rahi hai..."
- Unsplash photos fetched in parallel based on AI-generated search queries

---

| 2026-02-25 | SOP created | — |
| 2026-02-25 | Created store-2026.html with product grid + category tabs | store |
