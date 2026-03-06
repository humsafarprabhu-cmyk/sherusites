#!/usr/bin/env node --experimental-strip-types
/**
 * Sales Scanner — Gathers all lead data for the Sales Agent.
 * Outputs a structured JSON report. AI agent reads this and decides.
 * 
 * Usage: node --experimental-strip-types scripts/sales-scan.ts [--send PHONE MESSAGE] [--update-stage PHONE STAGE NOTES]
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(import.meta.dirname, '..', 'data', 'sherusites.db');
const STATE_PATH = path.join(import.meta.dirname, '..', 'sales-state.json');
const OWNER_PHONE = '918210329601';

// IST time
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000;
const ist = new Date(now.getTime() + istOffset);
const istHour = ist.getUTCHours();
const istMin = ist.getUTCMinutes();
const istDateStr = ist.toISOString().split('T')[0];
const istTimeStr = `${String(istHour).padStart(2,'0')}:${String(istMin).padStart(2,'0')}`;
const isQuietHours = istHour >= 23 || istHour < 9;

const db = new Database(DB_PATH, { readonly: true });

// Load state
let state: any = { leads: {}, last_scan: null };
try {
  state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
} catch {}

const mode = process.argv[2];

// --- SEND MODE: Send a WhatsApp message and log it ---
if (mode === '--send') {
  const phone = process.argv[3];
  const message = process.argv.slice(4).join(' ');
  if (!phone || !message) {
    console.log(JSON.stringify({ error: 'Usage: --send PHONE MESSAGE' }));
    process.exit(1);
  }

  // Load env
  const envPath = path.join(import.meta.dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }

  const phoneId = env.META_PHONE_NUMBER_ID;
  const token = env.META_ACCESS_TOKEN;

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  });
  const data = await resp.json() as any;
  const success = !!data?.messages?.[0]?.id;

  // Update state
  if (success && state.leads[phone]) {
    state.leads[phone].last_contacted = now.toISOString();
    state.leads[phone].messages_sent = (state.leads[phone].messages_sent || 0) + 1;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  }

  console.log(JSON.stringify({ success, phone, messageId: data?.messages?.[0]?.id || null }));
  process.exit(0);
}

// --- UPDATE STAGE MODE ---
if (mode === '--update-stage') {
  const phone = process.argv[3];
  const newStage = process.argv[4];
  const notes = process.argv.slice(5).join(' ');
  if (!phone || !newStage) {
    console.log(JSON.stringify({ error: 'Usage: --update-stage PHONE STAGE [NOTES]' }));
    process.exit(1);
  }
  // Re-read state as writable
  try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch {}
  if (state.leads[phone]) {
    state.leads[phone].stage = newStage;
    if (notes) state.leads[phone].notes = notes;
    state.leads[phone].updated_at = now.toISOString();
  } else {
    state.leads[phone] = { stage: newStage, notes, updated_at: now.toISOString(), messages_sent: 0 };
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ ok: true, phone, stage: newStage }));
  process.exit(0);
}

// --- ADD LEAD MODE ---
if (mode === '--add-lead') {
  const phone = process.argv[3];
  const name = process.argv[4] || '';
  const slug = process.argv[5] || '';
  const category = process.argv[6] || '';
  if (!phone) {
    console.log(JSON.stringify({ error: 'Usage: --add-lead PHONE [NAME] [SLUG] [CATEGORY]' }));
    process.exit(1);
  }
  try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch {}
  if (!state.leads[phone]) {
    state.leads[phone] = {
      name, slug, category,
      last_contacted: null, last_reply: null,
      stage: 'identified', messages_sent: 0,
      notes: 'Auto-detected by scanner',
      next_action: 'Check site and send intro',
      added_at: now.toISOString()
    };
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log(JSON.stringify({ ok: true, added: true, phone }));
  } else {
    console.log(JSON.stringify({ ok: true, added: false, reason: 'already exists', phone }));
  }
  process.exit(0);
}

// --- DEFAULT: SCAN MODE ---

// 1. Find leads with buying signals (last 48h)
const buyingSignals = db.prepare(`
  SELECT DISTINCT ch.phone, s.business_name, s.slug, s.category, s.address, s.tagline
  FROM chat_history ch
  JOIN sites s ON ch.phone = s.owner_phone
  WHERE ch.role='user' 
  AND ch.created_at > datetime('now', '-48 hours')
  AND (
    ch.content LIKE '%premium%' OR ch.content LIKE '%upgrade%' 
    OR ch.content LIKE '%domain%' OR ch.content LIKE '%payment%'
    OR ch.content LIKE '%price%' OR ch.content LIKE '%kitna%'
    OR ch.content LIKE '%kharcha%' OR ch.content LIKE '%paisa%'
    OR ch.content LIKE '%chahiye%' OR ch.content LIKE '%kharidna%'
    OR ch.content LIKE '%buy%' OR ch.content LIKE '%plan%'
  )
  AND ch.phone != ?
`).all(OWNER_PHONE);

// 2. Find warm leads (high engagement, no buying signal)
const warmLeads = db.prepare(`
  SELECT ch.phone, s.business_name, s.slug, s.category, s.address,
    COUNT(ch.id) as msg_count, MAX(ch.created_at) as last_msg
  FROM chat_history ch
  JOIN sites s ON ch.phone = s.owner_phone
  WHERE ch.role='user' AND ch.phone != ?
  AND ch.created_at > datetime('now', '-72 hours')
  GROUP BY ch.phone
  HAVING msg_count >= 8
  ORDER BY msg_count DESC
`).all(OWNER_PHONE);

// 3. For each existing lead, get recent messages
const leadDetails: any = {};
for (const [phone, lead] of Object.entries(state.leads) as any) {
  if (lead.stage === 'dropped' || lead.stage === 'converted') continue;

  const recentMsgs = db.prepare(`
    SELECT content, role, created_at FROM chat_history 
    WHERE phone = ? ORDER BY created_at DESC LIMIT 15
  `).all(phone);

  const lastUserMsg = recentMsgs.find((m: any) => m.role === 'user');
  const lastBotMsg = recentMsgs.find((m: any) => m.role === 'assistant');

  // Hours since last contact
  const hoursSinceContact = lead.last_contacted 
    ? (now.getTime() - new Date(lead.last_contacted).getTime()) / 3600000 
    : 999;

  // Hours since last user reply
  const hoursSinceReply = lastUserMsg 
    ? (now.getTime() - new Date(lastUserMsg.created_at + 'Z').getTime()) / 3600000 
    : 999;

  leadDetails[phone] = {
    ...lead,
    recent_messages: recentMsgs.slice(0, 10).reverse(), // chronological
    last_user_message: lastUserMsg?.content || null,
    last_user_message_time: lastUserMsg?.created_at || null,
    last_bot_message: lastBotMsg?.content?.substring(0, 200) || null,
    hours_since_we_contacted: Math.round(hoursSinceContact * 10) / 10,
    hours_since_they_replied: Math.round(hoursSinceReply * 10) / 10,
    can_message: hoursSinceContact >= 8 || hoursSinceReply < 0.5
  };
}

// 4. Check for new leads not in state
const newBuyingLeads = buyingSignals.filter((l: any) => !state.leads[l.phone]);
const newWarmLeads = warmLeads.filter((l: any) => !state.leads[l.phone] && !newBuyingLeads.find((b: any) => b.phone === l.phone));

const report = {
  timestamp: now.toISOString(),
  ist_time: istTimeStr,
  ist_date: istDateStr,
  ist_hour: istHour,
  is_quiet_hours: isQuietHours,
  
  existing_leads: leadDetails,
  new_buying_signal_leads: newBuyingLeads,
  new_warm_leads: newWarmLeads,
  
  summary: {
    total_active_leads: Object.keys(leadDetails).length,
    new_buying: newBuyingLeads.length,
    new_warm: newWarmLeads.length,
    actionable: isQuietHours ? 0 : Object.values(leadDetails).filter((l: any) => l.can_message).length
  }
};

console.log(JSON.stringify(report, null, 2));
db.close();
