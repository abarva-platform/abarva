import 'server-only';

// Source vendor portal — session tokens.
//
// Several concurrent sessions per credential is the EXPECTED case, not an
// anomaly to defend against: the credential is shared by a vendor's bid team and
// three of them may be in the portal at once. Nothing here caps concurrency.
//
// The token is opaque and random. Only its SHA-256 is stored, so a database
// read cannot impersonate a vendor.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;

/** Cookie name. Scoped per event so one vendor's session cannot address another event. */
export function sessionCookieName(sourceEventId: string): string {
  return `abv_rfp_${sourceEventId.replace(/-/g, '').slice(0, 12)}`;
}

export interface IssuedSession {
  /** Goes in the cookie. Never stored. */
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Mint a session.
 *
 * `respondBy` caps the lifetime: a credential must not outlive the event it was
 * issued for. The grace window keeps a vendor who is mid-upload at the deadline
 * from being thrown out by their own session expiring, without extending what
 * they are allowed to do — the upload route enforces `respond_by` separately.
 */
export function issueSession(opts: {
  respondBy: Date;
  now?: Date;
  maxHours?: number;
  graceHours?: number;
}): IssuedSession {
  const now = opts.now ?? new Date();
  const maxHours = opts.maxHours ?? 12;
  const graceHours = opts.graceHours ?? 2;
  const rollingExpiry = new Date(now.getTime() + maxHours * 3_600_000);
  const hardCeiling = new Date(opts.respondBy.getTime() + graceHours * 3_600_000);
  const expiresAt = rollingExpiry < hardCeiling ? rollingExpiry : hardCeiling;
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashToken(token), expiresAt };
}

/** Constant-time comparison of a presented token against a stored hash. */
export function tokenMatchesHash(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  let b: Buffer;
  try {
    b = Buffer.from(storedHash, 'hex');
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sessionIsLive(row: {
  expiresAt: Date | string;
  revokedAt?: Date | string | null;
}, now: Date = new Date()): boolean {
  if (row.revokedAt) return false;
  const expires = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt);
  return expires.getTime() > now.getTime();
}

/**
 * Hash a client IP for the audit trail.
 *
 * The audit spine records that an action came from a consistent origin without
 * the product becoming a store of vendor staff IP addresses. Salted with a
 * server secret so the hashes are not reversible via a rainbow table of the
 * IPv4 space, which is small enough to enumerate.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.VENDOR_PORTAL_IP_SALT ?? '';
  if (!salt) return null; // no salt configured — record nothing rather than something reversible
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}
