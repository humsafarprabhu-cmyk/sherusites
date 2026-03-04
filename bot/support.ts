import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../data/sherusites.db'));

export type TicketReason =
  | 'ai_no_action'
  | 'complaint'
  | 'custom_request'
  | 'hindi_user'
  | 'unhandled';

export interface SupportTicket {
  id: number;
  phone: string;
  business_name: string | null;
  message: string;
  reason: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Create a support ticket. Returns false if duplicate (same phone+message in last 10 min) */
export function createTicket(
  phone: string,
  message: string,
  reason: TicketReason,
  businessName?: string
): boolean {
  // Deduplicate: skip if same phone sent same message in last 10 min
  const existing = db.prepare(`
    SELECT id FROM support_tickets 
    WHERE phone=? AND message=? AND created_at > datetime('now', '-10 minutes')
  `).get(phone, message);
  if (existing) return false;

  db.prepare(`
    INSERT INTO support_tickets (phone, business_name, message, reason)
    VALUES (?, ?, ?, ?)
  `).run(phone, businessName || null, message, reason);
  return true;
}

/** Get all open tickets for admin panel */
export function getOpenTickets(): SupportTicket[] {
  return db.prepare(`
    SELECT t.*, s.business_name as biz
    FROM support_tickets t
    LEFT JOIN sites s ON s.owner_phone = t.phone
    WHERE t.status = 'open'
    ORDER BY t.created_at DESC
  `).all() as SupportTicket[];
}

/** Get all tickets with optional filter */
export function getAllTickets(status?: string): SupportTicket[] {
  if (status) {
    return db.prepare(`
      SELECT * FROM support_tickets WHERE status=? ORDER BY created_at DESC LIMIT 100
    `).all(status) as SupportTicket[];
  }
  return db.prepare(`
    SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 100
  `).all() as SupportTicket[];
}

/** Mark ticket resolved with optional admin reply */
export function resolveTicket(id: number, adminReply?: string): boolean {
  const result = db.prepare(`
    UPDATE support_tickets 
    SET status='resolved', admin_reply=?, resolved_at=datetime('now')
    WHERE id=?
  `).run(adminReply || null, id);
  return result.changes > 0;
}

/** Count open tickets */
export function openTicketCount(): number {
  const row = db.prepare(`SELECT count(*) as c FROM support_tickets WHERE status='open'`).get() as { c: number };
  return row.c;
}

/** Classify message reason */
export function classifyReason(msg: string): TicketReason {
  const lower = msg.toLowerCase();
  if (/galat|wrong|problem|issue|kaam nahi|nahi chal|broken|fix|theek karo/.test(lower)) return 'complaint';
  if (/hindi|हिंदी|हिन्दी/.test(lower) || /[\u0900-\u097F]/.test(msg)) return 'hindi_user';
  if (/jaise|jaisi|like|similar|type ka|wala/.test(lower)) return 'custom_request';
  return 'unhandled';
}
