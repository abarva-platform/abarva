/**
 * W4-PR-7 · Resend webhook signature verification
 *
 * Resend uses Standard Webhooks (svix-style) signing. Each delivery
 * carries three headers:
 *
 *   svix-id          · unique message id
 *   svix-timestamp   · unix seconds when the webhook was sent
 *   svix-signature   · space-separated list of `v1,<base64-sig>` entries
 *
 * The signature is HMAC-SHA256 over `${id}.${timestamp}.${body}` using
 * the secret (which Resend issues as a `whsec_...` base64-encoded key).
 *
 * We implement the verification natively here rather than depending on
 * the `svix` or `standardwebhooks` packages — neither is in our
 * dependency tree and the algorithm is small enough that a vetted
 * inline implementation is preferable to a transitive dep.
 *
 * Replay protection: the timestamp must be within ±5 minutes of `now`.
 * That window matches the Resend / Standard Webhooks recommendation.
 *
 * Multiple-key support: Resend signature headers can carry multiple
 * `v1,<sig>` entries (a key-rotation tool). We accept the delivery if
 * ANY entry matches our computed HMAC. The secret is the active one
 * configured via `RESEND_WEBHOOK_SECRET`.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface VerifyInput {
  /** Raw request body, exactly as Resend signed it (do NOT JSON.parse first). */
  rawBody: string;
  /** Value of the `svix-id` header. */
  svixId: string;
  /** Value of the `svix-timestamp` header (unix seconds, string). */
  svixTimestamp: string;
  /** Value of the `svix-signature` header. */
  svixSignature: string;
  /**
   * The webhook secret as Resend issues it: `whsec_<base64>`. The
   * `whsec_` prefix is stripped; the rest is base64-decoded to obtain
   * the HMAC key bytes.
   */
  secret: string;
  /**
   * Override `now` for tests. Defaults to a real `Date.now()` call.
   * Units: milliseconds.
   */
  now?: number;
}

export type VerifyResult =
  | { ok: true }
  | {
    ok: false;
    reason:
      | 'missing_header'
      | 'invalid_secret'
      | 'timestamp_out_of_window'
      | 'signature_mismatch'
      | 'malformed_signature_header';
  };

/** Replay window — Resend / Standard Webhooks recommendation. */
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/**
 * Decode a Resend `whsec_<base64>` secret to its HMAC key bytes.
 *
 * Exported for tests; routes should pass `RESEND_WEBHOOK_SECRET` to
 * `verifyResendSignature` directly.
 */
export function decodeWebhookSecret(secret: string): Buffer | null {
  if (!secret) return null;
  const trimmed = secret.trim();
  const body = trimmed.startsWith('whsec_') ? trimmed.slice('whsec_'.length) : trimmed;
  if (!body) return null;
  try {
    const buf = Buffer.from(body, 'base64');
    if (buf.length === 0) return null;
    return buf;
  } catch {
    return null;
  }
}

/**
 * Verify a Resend webhook request. Returns a typed result; never throws.
 */
export function verifyResendSignature(input: VerifyInput): VerifyResult {
  if (!input.svixId || !input.svixTimestamp || !input.svixSignature) {
    return { ok: false, reason: 'missing_header' };
  }

  const keyBytes = decodeWebhookSecret(input.secret);
  if (!keyBytes) {
    return { ok: false, reason: 'invalid_secret' };
  }

  // Replay window.
  const tsSeconds = Number(input.svixTimestamp);
  if (!Number.isFinite(tsSeconds)) {
    return { ok: false, reason: 'timestamp_out_of_window' };
  }
  const nowMs = input.now ?? Date.now();
  const skewSeconds = Math.abs(nowMs / 1000 - tsSeconds);
  if (skewSeconds > TIMESTAMP_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp_out_of_window' };
  }

  // Compute the expected HMAC.
  const signingTarget = `${input.svixId}.${input.svixTimestamp}.${input.rawBody}`;
  const expected = createHmac('sha256', keyBytes).update(signingTarget).digest();

  // Parse the header: space-separated entries of `v1,<base64-sig>`.
  // We accept ANY matching v1 entry (multi-key rotation).
  const entries = input.svixSignature.split(/\s+/u).filter(Boolean);
  if (entries.length === 0) {
    return { ok: false, reason: 'malformed_signature_header' };
  }

  let anyParsed = false;
  for (const entry of entries) {
    const commaIdx = entry.indexOf(',');
    if (commaIdx < 0) continue;
    const version = entry.slice(0, commaIdx);
    const sigB64 = entry.slice(commaIdx + 1);
    if (version !== 'v1' || !sigB64) continue;
    anyParsed = true;
    let provided: Buffer;
    try {
      provided = Buffer.from(sigB64, 'base64');
    } catch {
      continue;
    }
    if (provided.length !== expected.length) continue;
    if (timingSafeEqual(provided, expected)) {
      return { ok: true };
    }
  }
  if (!anyParsed) {
    return { ok: false, reason: 'malformed_signature_header' };
  }
  return { ok: false, reason: 'signature_mismatch' };
}
