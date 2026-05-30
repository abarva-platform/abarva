/**
 * W4-PR-2 · Resend email channel wrapper
 *
 * Thin wrapper around the Resend SDK. Returns typed results instead of
 * throwing, so the broker can decide whether to retry, suppress, or
 * fail-closed.
 *
 * Posture:
 *   • If `RESEND_API_KEY` is set, dispatches through Resend.
 *   • Otherwise returns `{ ok: false, reason: 'provider_not_configured' }`
 *     — the broker treats this as a non-retryable infra-level failure.
 *     We do NOT silently console-log a "fake-sent" record from this
 *     wrapper. (The legacy `src/lib/email/send.ts` keeps a dev-fallback
 *     for the older approval flow; the notifications pipeline is built
 *     for honesty per Spine doctrine.)
 *
 * Per Spine §13 decision #1: Phase 1 sender is `notifications@abarva.com`
 * shared across tenants. Per-tenant custom senders land in Phase 2.
 *
 * Per Spine §4: the wrapper applies a 5s timeout. Resend rate-limit
 * errors map to `rate_limit` (retryable); invalid-recipient errors map
 * to `invalid_recipient` (non-retryable); everything else falls under
 * `provider_error` (retryable=true; the broker decides via retry policy).
 */

import 'server-only';

import { PHASE1_SHARED_SENDER } from '../can-spam-headers';

// ─────────────────────────────────────────────────────────────────────────────
// Public contract
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailDispatchInput {
  /** Recipient email. Wrapper does NOT validate format — Resend does. */
  to: string;
  /** Optional sender override. Defaults to PHASE1_SHARED_SENDER. */
  from?: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Extra SMTP-like headers — CAN-SPAM, List-Unsubscribe, X-Entity-Ref-ID,
   * tracking tags. The Resend SDK passes these through verbatim.
   */
  headers?: Record<string, string>;
  /**
   * Tags Resend records on the delivery for filtering / analytics.
   * Use sparingly — Resend caps the tag count; we cap each key/value
   * at 32 chars to be safe.
   */
  tags?: Record<string, string>;
}

export type EmailDispatchResult =
  | {
    ok: true;
    providerMessageId: string;
  }
  | {
    ok: false;
    reason:
      | 'rate_limit'
      | 'invalid_recipient'
      | 'provider_error'
      | 'provider_not_configured'
      | 'timeout';
    retryable: boolean;
    message?: string;
  };

// ─────────────────────────────────────────────────────────────────────────────
// Internals — Resend SDK shape we depend on. We type the surface we
// touch so a future Resend SDK update can be migrated by changing this
// one interface.
// ─────────────────────────────────────────────────────────────────────────────

interface ResendCreateResponse {
  data?: { id?: string } | null;
  error?: { name?: string; message?: string } | null;
}

interface ResendLike {
  emails: {
    send: (args: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
      headers?: Record<string, string>;
      tags?: ReadonlyArray<{ name: string; value: string }>;
    }) => Promise<ResendCreateResponse>;
  };
}

let cachedClient: ResendLike | null = null;

/** Injectable for tests — replace the cached client. */
export function __setResendClientForTest(client: ResendLike | null): void {
  cachedClient = client;
}

async function getResendClient(apiKey: string): Promise<ResendLike> {
  if (cachedClient) return cachedClient;
  const mod = (await import('resend')) as { Resend: new (key: string) => ResendLike };
  cachedClient = new mod.Resend(apiKey);
  return cachedClient;
}

/**
 * Convert a tags record to the Resend SDK shape. Truncates each
 * key/value to 32 chars (Resend's cap) and drops empty entries.
 */
function tagsToResend(
  tags: Record<string, string> | undefined,
): ReadonlyArray<{ name: string; value: string }> | undefined {
  if (!tags) return undefined;
  const out: Array<{ name: string; value: string }> = [];
  for (const [k, v] of Object.entries(tags)) {
    const name = String(k).slice(0, 32);
    const value = String(v).slice(0, 32);
    if (!name || !value) continue;
    // Resend tag names: lowercase letters, digits, underscore only.
    const safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const safeValue = value.replace(/[^a-zA-Z0-9_]/g, '_');
    out.push({ name: safeName, value: safeValue });
  }
  return out.length === 0 ? undefined : out;
}

type DispatchFailReason =
  | 'rate_limit'
  | 'invalid_recipient'
  | 'provider_error'
  | 'provider_not_configured'
  | 'timeout';

function mapErrorToReason(err: { name?: string; message?: string } | undefined): {
  reason: DispatchFailReason;
  retryable: boolean;
  message?: string;
} {
  const name = err?.name?.toLowerCase() ?? '';
  const message = err?.message ?? '';
  const lower = message.toLowerCase();
  if (name.includes('rate') || lower.includes('rate limit') || lower.includes('too many')) {
    return { reason: 'rate_limit', retryable: true, message };
  }
  if (
    name.includes('validation')
    || lower.includes('invalid')
    || lower.includes('not a valid email')
    || lower.includes('recipient')
  ) {
    return { reason: 'invalid_recipient', retryable: false, message };
  }
  return { reason: 'provider_error', retryable: true, message };
}

/**
 * Race a promise against a timeout. The timer is cleared on settle
 * so we don't leak handles in long-running workers.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per Spine §4 — 5 second timeout.
 */
const RESEND_TIMEOUT_MS = 5000;

/**
 * Dispatch an email through Resend. Never throws; always returns a
 * typed result.
 *
 * The broker decides whether to retry based on `retryable`. Resend
 * 429 / network failures are retryable; invalid-recipient errors are
 * not. `provider_not_configured` is non-retryable — the broker should
 * mark the delivery `suppressed` until the env is configured.
 */
export async function sendEmail(input: EmailDispatchInput): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      ok: false,
      reason: 'provider_not_configured',
      retryable: false,
      message: 'RESEND_API_KEY is not set; email channel is dormant.',
    };
  }

  let client: ResendLike;
  try {
    client = await getResendClient(apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reason: 'provider_error',
      retryable: true,
      message: `Failed to load Resend SDK: ${message}`,
    };
  }

  const from = input.from?.trim() ?? PHASE1_SHARED_SENDER;
  const tags = tagsToResend(input.tags);

  let response: ResendCreateResponse;
  try {
    response = await withTimeout(
      client.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: input.headers,
        tags,
      }),
      RESEND_TIMEOUT_MS,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'timeout') {
      return {
        ok: false,
        reason: 'timeout',
        retryable: true,
        message: `Resend dispatch exceeded ${RESEND_TIMEOUT_MS}ms`,
      };
    }
    return {
      ok: false,
      reason: 'provider_error',
      retryable: true,
      message,
    };
  }

  if (response.error) {
    const mapped = mapErrorToReason(response.error);
    return {
      ok: false,
      reason: mapped.reason,
      retryable: mapped.retryable,
      message: mapped.message,
    };
  }
  const id = response.data?.id;
  if (!id) {
    return {
      ok: false,
      reason: 'provider_error',
      retryable: true,
      message: 'Resend returned no error and no message id.',
    };
  }
  return { ok: true, providerMessageId: id };
}
