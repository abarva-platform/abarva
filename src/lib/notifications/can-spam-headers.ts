/**
 * W4-PR-2 · CAN-SPAM compliance headers builder
 *
 * Returns the headers + footer every outbound notification email must
 * carry to satisfy CAN-SPAM (US) and RFC 8058 (one-click List-Unsubscribe).
 *
 * Required by 15 U.S.C. § 7704:
 *   1. Clear sender identification — `From:` header.
 *   2. A functional unsubscribe mechanism — `List-Unsubscribe` URL +
 *      `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058).
 *   3. Physical postal address of the sender — appended to email body
 *      (the HTML / text builders include this footer).
 *
 * Phase 1 sender: `notifications@abarva.com` (founder-locked decision #1
 * in Spine §13). Per-tenant custom domains land in Phase 2.
 *
 * Physical address: placeholder for Phase 1. The real address must be
 * recorded in the company-registration tracker BEFORE the first
 * production tenant goes live. Wired through an env var so legal can
 * rotate without a code change.
 *
 * One-click unsubscribe target: `/admin/users-access/notifications` —
 * the user-preferences surface lands in W4-PR-4. Until that route
 * exists, the link 200s on the route's GET handler (also W4-PR-4) and
 * the user lands on their preferences with the `eventType` query
 * param highlighted.
 *
 * Honesty: this file is pure header/footer assembly. It does NOT
 * send mail. The Resend wrapper at `channels/email-resend.ts` consumes
 * the output.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants — founder-locked. Changing these requires a doctrine update.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Phase 1 shared sender. Spine §13 decision #1.
 *
 * Phase 2 will read this from a per-tenant `clients.notification_sender`
 * column. The broker passes the resolved sender to this builder; this
 * constant is the Phase 1 fallback.
 */
export const PHASE1_SHARED_SENDER = 'notifications@abarva.com';

/**
 * Phase 1 physical address (placeholder). Required before pilot.
 * Read from `ABARVA_PHYSICAL_ADDRESS` env var; falls back to a
 * placeholder string so dev/test environments stay functional.
 */
const PHYSICAL_ADDRESS_PLACEHOLDER =
  'AbarVa, Inc. · [placeholder address — replace before pilot]';

function physicalAddress(): string {
  const fromEnv = process.env.ABARVA_PHYSICAL_ADDRESS;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return PHYSICAL_ADDRESS_PLACEHOLDER;
}

/**
 * Base URL for the user preferences route. Dev → localhost; prod is
 * resolved from `NEXT_PUBLIC_APP_URL`. The unsubscribe target is the
 * preferences surface itself, scoped by the recipient's user id via
 * a signed query param (W4-PR-4 lands the signing logic; for now we
 * pass the user_id and event_type plain — production rollout depends
 * on W4-PR-4 hardening this with a HMAC).
 */
function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'https://app.abarva.com';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface CanSpamHeaderInput {
  /** Resolved sender email — Phase 1 will be PHASE1_SHARED_SENDER. */
  sender?: string;
  /** Clerk user id of the recipient. Drives unsubscribe URL. */
  recipientUserId: string;
  /** Event type — drives unsubscribe URL deep link. */
  eventType: string;
  /** notification_events.id — used for X-Entity-Ref-ID tracing. */
  eventId: string;
}

export interface CanSpamHeaders {
  /** RFC 5322 `From:` header value. */
  from: string;
  /** RFC 2369 `List-Unsubscribe:` header. */
  listUnsubscribe: string;
  /** RFC 8058 `List-Unsubscribe-Post:` header (one-click POST). */
  listUnsubscribePost: string;
  /** Tracking header — links the email back to the notification event row. */
  xEntityRefId: string;
}

/**
 * Build the four CAN-SPAM / RFC 8058 headers required on every
 * outbound notification email.
 *
 * The Resend wrapper merges these into the SDK call's `headers`
 * record. The `from` is consumed separately via the SDK's `from` arg.
 */
export function buildCanSpamHeaders(input: CanSpamHeaderInput): CanSpamHeaders {
  const sender = input.sender?.trim() ?? PHASE1_SHARED_SENDER;
  const base = appBaseUrl();
  const unsubscribeUrl = `${base}/admin/users-access/notifications?event_type=${encodeURIComponent(input.eventType)}&user_id=${encodeURIComponent(input.recipientUserId)}`;
  return {
    from: sender,
    listUnsubscribe: `<${unsubscribeUrl}>, <mailto:unsubscribe@abarva.com?subject=unsubscribe-${encodeURIComponent(input.eventType)}>`,
    listUnsubscribePost: 'List-Unsubscribe=One-Click',
    xEntityRefId: input.eventId,
  };
}

/**
 * Returns the physical-address footer that must appear in every
 * outbound notification's email body (HTML + plain text variants).
 * The Resend wrapper does not enforce this — callers building the
 * email body MUST append the footer. The notification email builder
 * (`email-resend.ts` or future renderers) call this helper to keep
 * the address in one place.
 */
export function canSpamFooterHtml(): string {
  return [
    '<hr style="border:0;border-top:1px solid #E5E1D8;margin:24px 0" />',
    '<p style="font-size:11px;color:#7A8A9A;line-height:1.5;margin:0">',
    'You received this because you are a member of an AbarVa tenant. ',
    'Manage your notification preferences in the AbarVa app at ',
    '/admin/users-access/notifications.',
    '<br />',
    physicalAddress(),
    '</p>',
  ].join('');
}

export function canSpamFooterText(): string {
  return [
    '',
    '--',
    'You received this because you are a member of an AbarVa tenant.',
    'Manage your notification preferences at /admin/users-access/notifications.',
    physicalAddress(),
  ].join('\n');
}

/**
 * Convenience — assemble the headers record the Resend SDK expects.
 * Merges the CAN-SPAM headers with any caller-supplied custom headers
 * (e.g. event_type tag). Caller-supplied headers take precedence on
 * collision EXCEPT for the four CAN-SPAM headers themselves, which
 * are always authoritative.
 */
export function assembleEmailHeaders(
  canSpam: CanSpamHeaders,
  custom?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...(custom ?? {}) };
  out['List-Unsubscribe'] = canSpam.listUnsubscribe;
  out['List-Unsubscribe-Post'] = canSpam.listUnsubscribePost;
  out['X-Entity-Ref-ID'] = canSpam.xEntityRefId;
  return out;
}
