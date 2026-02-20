/**
 * SheruSites Agent — AI-powered website management agent per user
 * 
 * Each user gets their own agent that:
 * - Understands natural language (Hinglish)
 * - Knows their business context
 * - Handles complex edits
 * - Can modify menu, prices, timings, offers, photos
 * - Remembers conversation history
 * 
 * Cost: ~₹0.3-0.5 per interaction (GPT-4o-mini)
 */

import { SiteData, getSiteData, saveSiteData, getOrCreateUser, saveUser, listUserSites } from './data-store.ts';
import { renderSite } from './template-renderer.ts';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

// Per-user conversation memory (last 10 messages)
const conversationHistory = new Map<string, { role: string; content: string }[]>();

function getHistory(phone: string): { role: string; content: string }[] {
  if (!conversationHistory.has(phone)) conversationHistory.set(phone, []);
  return conversationHistory.get(phone)!;
}

function addToHistory(phone: string, role: string, content: string) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Keep last 10 messages for context
  if (history.length > 10) history.splice(0, history.length - 10);
}

// ─── AGENT TOOLS ─────────────────────────────────────────────────────────────

interface AgentAction {
  action: string;
  params: Record<string, any>;
}

function executeActions(slug: string, actions: AgentAction[]): string[] {
  const results: string[] = [];
  let siteData = getSiteData(slug);
  if (!siteData) return ['Site data not found'];

  for (const { action, params } of actions) {
    try {
      switch (action) {
        case 'add_menu_item': {
          if (!siteData.menu) siteData.menu = [];
          siteData.menu.push({
            name: params.name,
            price: params.price,
            category: params.category || '',
            description: params.description || '',
            popular: params.popular || false,
          });
          results.push(`✅ Added: ${params.name} — ${params.price}`);
          break;
        }
        case 'remove_menu_item': {
          if (!siteData.menu) break;
          const idx = siteData.menu.findIndex(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = siteData.menu.splice(idx, 1)[0];
            results.push(`✅ Removed: ${removed.name}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila menu mein`);
          }
          break;
        }
        case 'update_price': {
          const allItems = [...(siteData.menu || []), ...(siteData.services || []), ...(siteData.packages || []), ...(siteData.plans || [])];
          const item = allItems.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
          if (item) {
            const oldPrice = item.price;
            item.price = params.price;
            results.push(`✅ ${item.name}: ${oldPrice} → ${params.price}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'bulk_price_change': {
          const items = [...(siteData.menu || []), ...(siteData.services || [])];
          const percent = params.percent || 0;
          let changed = 0;
          for (const item of items) {
            const numPrice = parseInt(item.price.replace(/[₹,\s]/g, ''));
            if (!isNaN(numPrice)) {
              const newPrice = Math.round(numPrice * (1 + percent / 100));
              item.price = `₹${newPrice}`;
              changed++;
            }
          }
          results.push(`✅ ${changed} items ka price ${percent > 0 ? '+' : ''}${percent}% change kiya`);
          break;
        }
        case 'add_service': {
          if (!siteData.services) siteData.services = [];
          siteData.services.push({
            name: params.name,
            price: params.price,
            duration: params.duration || '',
            description: params.description || '',
          });
          results.push(`✅ Service added: ${params.name} — ${params.price}`);
          break;
        }
        case 'remove_service': {
          if (!siteData.services) break;
          const idx = siteData.services.findIndex(s => s.name.toLowerCase().includes(params.name.toLowerCase()));
          if (idx >= 0) {
            const removed = siteData.services.splice(idx, 1)[0];
            results.push(`✅ Removed: ${removed.name}`);
          } else {
            results.push(`❌ "${params.name}" nahi mila`);
          }
          break;
        }
        case 'update_timings': {
          siteData.timings = params.timings;
          results.push(`✅ Timings: ${params.timings}`);
          break;
        }
        case 'set_offer': {
          siteData.activeOffer = { text: params.text, validTill: params.validTill };
          results.push(`🎉 Offer live: "${params.text}"`);
          break;
        }
        case 'clear_offer': {
          siteData.activeOffer = undefined;
          results.push(`✅ Offer hata diya`);
          break;
        }
        case 'set_closed': {
          siteData.isOpen = false;
          results.push(`🔒 Website: Temporarily Closed`);
          break;
        }
        case 'set_open': {
          siteData.isOpen = true;
          results.push(`✅ Website: OPEN`);
          break;
        }
        case 'update_about': {
          siteData.about = params.text;
          results.push(`✅ About section updated`);
          break;
        }
        case 'update_tagline': {
          siteData.tagline = params.text;
          results.push(`✅ Tagline: "${params.text}"`);
          break;
        }
        case 'update_address': {
          siteData.address = params.address;
          results.push(`✅ Address updated`);
          break;
        }
        case 'update_phone': {
          siteData.phone = params.phone;
          siteData.whatsapp = `91${params.phone}`;
          results.push(`✅ Phone: ${params.phone}`);
          break;
        }
        case 'mark_popular': {
          if (siteData.menu) {
            const item = siteData.menu.find(m => m.name.toLowerCase().includes(params.name.toLowerCase()));
            if (item) {
              item.popular = true;
              results.push(`⭐ ${item.name} marked as popular`);
            }
          }
          break;
        }
        case 'no_action': {
          // Agent decided no website change needed — just conversation
          break;
        }
        default:
          results.push(`Unknown action: ${action}`);
      }
    } catch (err: any) {
      results.push(`Error: ${err.message}`);
    }
  }

  // Save and re-render
  if (actions.some(a => a.action !== 'no_action')) {
    saveSiteData(siteData);
    renderSite(siteData);
  }

  return results;
}

// ─── AGENT CORE ──────────────────────────────────────────────────────────────

export async function agentHandle(phone: string, message: string, siteSlug: string): Promise<string> {
  const siteData = getSiteData(siteSlug);
  if (!siteData) return 'Site not found. "reset" karke naya banao.';

  // Build context about the business
  const context = buildSiteContext(siteData);
  
  addToHistory(phone, 'user', message);

  if (!OPENAI_KEY) {
    // Fallback: return a helpful message without AI
    addToHistory(phone, 'assistant', 'AI agent available nahi hai abhi. "edit" command use karo menu-based editing ke liye.');
    return 'AI agent available nahi hai abhi. "edit" command use karo menu-based editing ke liye.';
  }

  try {
    const systemPrompt = `You are a friendly WhatsApp business website manager for an Indian small business. You speak Hinglish (Hindi + English mix). You are helpful, efficient, and casual.

## Business Context:
${context}

## Your Capabilities:
You can perform these actions on the website. Return them as JSON array in "actions" field.

Available actions:
- add_menu_item: {name, price, category?, description?, popular?}
- remove_menu_item: {name}
- update_price: {name, price}
- bulk_price_change: {percent} (e.g. +10 for 10% increase, -5 for 5% decrease)
- add_service: {name, price, duration?, description?}
- remove_service: {name}
- update_timings: {timings}
- set_offer: {text, validTill?}
- clear_offer: {}
- set_closed: {}
- set_open: {}
- update_about: {text}
- update_tagline: {text}
- update_address: {address}
- update_phone: {phone}
- mark_popular: {name}
- no_action: {} (when just chatting, no website change needed)

## Response Format:
Always return valid JSON:
{
  "reply": "Your Hinglish message to the user",
  "actions": [{"action": "action_name", "params": {...}}]
}

## Rules:
- If user asks about something unrelated to their website, just chat friendly (use no_action)
- If user gives vague input, ask clarifying questions (use no_action)
- For price changes, always confirm the new price in your reply
- Be proactive — suggest improvements ("Aapke menu mein dessert nahi hai, add karna chahoge?")
- Keep replies short and WhatsApp-friendly (no long paragraphs)
- If user sends multiple items, handle them all in one go
- Prices should always be in ₹ format`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...getHistory(phone).slice(-8), // Last 8 messages for context
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error('[Agent] API error:', res.status);
      return 'AI agent se baat nahi ho pa rahi. Thodi der baad try karo. 😅';
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    
    // Parse response
    let parsed: { reply: string; actions: AgentAction[] };
    try {
      const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, treat the whole response as a reply
      addToHistory(phone, 'assistant', raw);
      return raw;
    }

    // Execute actions
    const actionResults = executeActions(siteSlug, parsed.actions || []);
    
    // Build final reply
    let finalReply = parsed.reply || '';
    if (actionResults.length > 0 && actionResults.some(r => !r.startsWith('Unknown'))) {
      finalReply += '\n\n' + actionResults.join('\n');
      // Add site URL if something changed
      if (parsed.actions?.some(a => a.action !== 'no_action')) {
        finalReply += `\n\n🔗 ${process.env.TUNNEL_URL || 'http://localhost:4000'}/site/${siteSlug}`;
      }
    }
    
    addToHistory(phone, 'assistant', finalReply);
    
    console.log(`[Agent] ${phone} → ${parsed.actions?.map(a => a.action).join(', ') || 'chat'}`);
    
    return finalReply;
  } catch (err: any) {
    console.error('[Agent] Error:', err.message);
    return 'Kuch gadbad ho gayi. Dobara try karo. 😅';
  }
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildSiteContext(data: SiteData): string {
  let ctx = `Business: ${data.businessName}
Category: ${data.category}
Phone: ${data.phone}
Address: ${data.address}
Timings: ${data.timings}
Status: ${data.isOpen ? 'Open' : 'Temporarily Closed'}
Plan: ${data.plan}
`;

  if (data.activeOffer) {
    ctx += `Active Offer: ${data.activeOffer.text}\n`;
  }

  if (data.menu && data.menu.length > 0) {
    ctx += `\nMenu (${data.menu.length} items):\n`;
    const categories = [...new Set(data.menu.map(m => m.category || 'Other'))];
    for (const cat of categories) {
      ctx += `  ${cat}:\n`;
      data.menu.filter(m => (m.category || 'Other') === cat).forEach(m => {
        ctx += `    - ${m.name}: ${m.price}${m.popular ? ' ⭐Popular' : ''}\n`;
      });
    }
  }

  if (data.services && data.services.length > 0) {
    ctx += `\nServices (${data.services.length}):\n`;
    data.services.forEach(s => {
      ctx += `  - ${s.name}: ${s.price}${s.duration ? ` (${s.duration})` : ''}\n`;
    });
  }

  if (data.packages && data.packages.length > 0) {
    ctx += `\nPackages (${data.packages.length}):\n`;
    data.packages.forEach(p => {
      ctx += `  - ${p.name}: ${p.price}\n`;
    });
  }

  if (data.plans && data.plans.length > 0) {
    ctx += `\nPlans (${data.plans.length}):\n`;
    data.plans.forEach(p => {
      ctx += `  - ${p.name}: ${p.price}\n`;
    });
  }

  if (data.subjects && data.subjects.length > 0) {
    ctx += `\nSubjects (${data.subjects.length}):\n`;
    data.subjects.forEach(s => {
      ctx += `  - ${s.name}: ${s.price}${s.duration ? ` (${s.duration})` : ''}\n`;
    });
  }

  return ctx;
}

export { conversationHistory };
