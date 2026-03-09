/**
 * WhatsWebsite Web App — Auth (WhatsApp OTP)
 * Sends OTP via existing Meta WhatsApp API, verifies, issues JWT
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../bot/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'whatswebsite_jwt_secret_2026';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 1 min between requests

// ─── DB Setup ────────────────────────────────────────────────────────────────

const db = getDb();
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS web_users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── OTP Generation ─────────────────────────────────────────────────────────

export function generateOTP(phone: string): { otp: string; error?: string } {
  // Check cooldown
  const existing = db.prepare('SELECT created_at FROM otp_codes WHERE phone = ?').get(phone) as any;
  if (existing) {
    const created = new Date(existing.created_at + 'Z').getTime();
    if (Date.now() - created < OTP_COOLDOWN_MS) {
      return { otp: '', error: 'Please wait 60 seconds before requesting again' };
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(`
    INSERT INTO otp_codes (phone, code, attempts, created_at, expires_at)
    VALUES (?, ?, 0, datetime('now'), ?)
    ON CONFLICT(phone) DO UPDATE SET code=?, attempts=0, created_at=datetime('now'), expires_at=?
  `).run(phone, otp, expiresAt, otp, expiresAt);

  return { otp };
}

// ─── OTP Verification ───────────────────────────────────────────────────────

export function verifyOTP(phone: string, code: string): { valid: boolean; error?: string } {
  const row = db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone) as any;
  if (!row) return { valid: false, error: 'No OTP found. Request a new one.' };

  // Check expiry
  const expires = new Date(row.expires_at + 'Z').getTime();
  if (Date.now() > expires) {
    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    return { valid: false, error: 'OTP expired. Request a new one.' };
  }

  // Check attempts (max 5)
  if (row.attempts >= 5) {
    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    return { valid: false, error: 'Too many attempts. Request a new OTP.' };
  }

  db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?').run(phone);

  if (row.code !== code) {
    return { valid: false, error: 'Wrong OTP. Try again.' };
  }

  // Success — clean up and upsert web_user
  db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
  db.prepare(`
    INSERT INTO web_users (phone, last_login) VALUES (?, datetime('now'))
    ON CONFLICT(phone) DO UPDATE SET last_login = datetime('now')
  `).run(phone);

  return { valid: true };
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export function createToken(phone: string): string {
  return jwt.sign({ phone }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { phone: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { phone: string };
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function authMiddleware(req: any, res: any, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login');
  const decoded = verifyToken(token);
  if (!decoded) return res.redirect('/login');
  req.user = decoded;
  next();
}

export function apiAuthMiddleware(req: any, res: any, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.user = decoded;
  next();
}
