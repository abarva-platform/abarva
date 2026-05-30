/**
 * Invite Events broker · Wave 2 PR-3
 *
 * Live per-tenant user-invitation posture for the Setup / Admin
 * Trust Plane audit ribbon. Sources Clerk's invitations API via
 * `@clerk/backend` when the server SDK is wired (CLERK_SECRET_KEY
 * present); otherwise returns [] with a structured warn so the
 * Trust Plane stays honest.
 *
 * Contract:
 *   getRecentInviteEvents(tenantKey, sinceIso?) → InviteEvent[]
 *
 * Wave 2 PR-3 mission · per `SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6
 * Zone E: the unified audit ribbon mixes substrate + auth + policy +
 * connector + invite + approval events on one temporal axis. This
 * broker contributes the `invite` source.
 *
 * Schema sourcing:
 *   - No first-party `tenant_invites` / `user_invitations` table
 *     exists today (see `users-access-page-view.ts` comment "live
 *     writes deferred to Wave 27"). When that schema lands, this
 *     broker swaps the Clerk path for a `tenant_invites` azureRead
 *     query — the upstream composer signature does not change.
 *   - Clerk's invitations live at the *organization* level today.
 *     Until tenant→Clerk-org mapping is first-class, we fetch the
 *     instance-wide invitation list and filter by metadata when
 *     a `tenantKey` stamp exists on the invite's
 *     `public_metadata.tenantKey`. When the stamp is absent we
 *     surface ALL recent invitations regardless of tenant — the
 *     alternative (filtering to nothing) would silently hide
 *     real events from the admin. The verdict's honesty doctrine
 *     prefers "all visible, plain-labeled" over "filtered to
 *     emptiness" here.
 *
 * Event mapping (Clerk → ribbon):
 *   - `created_at`            → ts; action = 'invite sent'
 *   - `revoked: true`         → action = 'invite revoked'
 *                                (overrides 'sent' for the row)
 *   - `status === 'accepted'` → action = 'invite accepted',
 *                                ts = `updated_at` (acceptance time)
 *   - `status === 'expired'`  → action = 'invite expired'
 *
 *   When a single invite carries multiple lifecycle marks (e.g.
 *   sent → accepted), we emit the LATEST state as one event. This
 *   keeps the ribbon scannable (one row per invite, not three).
 *   A future per-event Clerk webhook ledger could fan out into
 *   multiple rows.
 *
 * PII safety (FOUNDER REQUIREMENT — masking):
 *   Email addresses are masked to first-char + domain before any
 *   surface receives them. Example:
 *     `mary.chen@example.com` → `m***@example.com`
 *     `j@example.com`         → `j***@example.com`
 *     `@example.com`          → `***@example.com`  (edge case)
 *
 *   The masking is applied at the broker boundary so downstream
 *   composers, log lines, and UI rows never see raw addresses.
 *   The Clerk SDK row itself is NEVER returned upstream; only
 *   the masked `InviteEvent` shape.
 *
 *   Per W2-PR-2 precedent (`isolation-posture-broker.ts`), we also
 *   never surface invite metadata that could leak corporate detail
 *   (custom invite payloads, `public_metadata` blobs). The actor
 *   and target fields are the only string columns yielded.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   - When `CLERK_SECRET_KEY` is absent, the broker returns [].
 *     We do NOT throw — the upstream composer treats [] as "no
 *     invite events visible" rather than a degraded chip.
 *   - When the Clerk API call fails, the broker returns [] AFTER
 *     emitting a structured warn so the failure is observable.
 *   - When NO invite ledger and NO Clerk SDK exist, the broker
 *     still returns [] (defaultsafe).
 *
 * Broker-boundary doctrine: this file is inside
 * `src/lib/admin/broker/**` and is therefore the canonical zone
 * where third-party SDK / direct data reads are permitted
 * (`broker-boundary.test.ts` exempts this directory).
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone E,
 * §7 Wave 2 PR-3 for the surface narrative this fulfills.
 */

import 'server-only';

// ── Contract ────────────────────────────────────────────────────────────────

export type InviteAction =
  | 'invite sent'
  | 'invite accepted'
  | 'invite expired'
  | 'invite revoked';

export interface InviteEvent {
  id: string;
  ts: string;
  /**
   * Who triggered the event. For Clerk invites this is the
   * inviting user's id (Clerk subject like `user_xxx`) or the
   * literal `'system'` for system-generated invites. We do NOT
   * surface the inviter's email.
   */
  actor: string;
  action: InviteAction;
  /**
   * Masked email of the invited address. See PII masking notes
   * at the top of this file: first-char + domain only.
   */
  target: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Default lookback when caller does not pass `sinceIso`. */
const DEFAULT_WINDOW_HOURS = 24;

/** Max rows the broker returns. The ribbon caps at 50 events total. */
const INVITE_EVENT_LIMIT = 50;

/** Clerk SDK page size. Bounded so the broker never loads the world. */
const CLERK_PAGE_LIMIT = 100;

// ── PII masking ─────────────────────────────────────────────────────────────

/**
 * Mask an email address to first-char + domain. Tests cover the
 * edge cases:
 *   - normal:    `mary@example.com`  → `m***@example.com`
 *   - empty:     ``                  → `***`
 *   - no @:      `mary`              → `m***`
 *   - empty:     `@example.com`      → `***@example.com`
 */
export function maskEmail(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '***';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '***';
  const atIdx = trimmed.indexOf('@');
  if (atIdx < 0) {
    // No domain — mask everything after the first character.
    return `${trimmed.charAt(0)}***`;
  }
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx); // includes '@'
  if (local.length === 0) {
    return `***${domain}`;
  }
  return `${local.charAt(0)}***${domain}`;
}

// ── Clerk SDK row shape (minimal — only fields we use) ──────────────────────

/**
 * The Clerk invitations endpoint returns rows with these fields.
 * We type only what the broker reads — the rest is intentionally
 * not modeled so future SDK changes don't break the broker.
 */
interface ClerkInvitationRow {
  id: string;
  email_address?: string | null;
  emailAddress?: string | null;
  status?: string | null;
  created_at?: number | string | null;
  createdAt?: number | string | null;
  updated_at?: number | string | null;
  updatedAt?: number | string | null;
  revoked?: boolean | null;
  public_metadata?: Record<string, unknown> | null;
  publicMetadata?: Record<string, unknown> | null;
  invited_by?: string | null;
  invitedBy?: string | null;
}

interface ClerkClientLike {
  invitations: {
    getInvitationList: (params?: {
      limit?: number;
      offset?: number;
    }) => Promise<ClerkInvitationRow[] | { data?: ClerkInvitationRow[] }>;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isoWindowStart(): string {
  return new Date(
    Date.now() - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

function rowEmail(row: ClerkInvitationRow): string {
  return row.email_address ?? row.emailAddress ?? '';
}

function rowCreatedAt(row: ClerkInvitationRow): string | null {
  const raw = row.created_at ?? row.createdAt;
  return normalizeTimestamp(raw);
}

function rowUpdatedAt(row: ClerkInvitationRow): string | null {
  const raw = row.updated_at ?? row.updatedAt;
  return normalizeTimestamp(raw);
}

function rowMetadata(row: ClerkInvitationRow): Record<string, unknown> {
  const md = row.public_metadata ?? row.publicMetadata;
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    return md as Record<string, unknown>;
  }
  return {};
}

function rowInvitedBy(row: ClerkInvitationRow): string {
  const id = row.invited_by ?? row.invitedBy;
  return typeof id === 'string' && id.length > 0 ? id : 'system';
}

function normalizeTimestamp(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Clerk's epoch millis convention.
    return new Date(raw).toISOString();
  }
  if (typeof raw === 'string' && raw.length > 0) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return null;
}

/**
 * Determine the latest lifecycle action for an invitation. Priority
 * order (latest state wins):
 *
 *   revoked  > expired  > accepted  > sent
 */
function deriveAction(row: ClerkInvitationRow): InviteAction {
  if (row.revoked === true) return 'invite revoked';
  const status = (row.status ?? '').toLowerCase();
  if (status === 'expired') return 'invite expired';
  if (status === 'accepted') return 'invite accepted';
  return 'invite sent';
}

/**
 * Pick the timestamp matching the derived action. Acceptance /
 * revoke / expiry use the row's updated_at when available; "sent"
 * uses created_at. Falls back to whatever timestamp IS present.
 */
function deriveTimestamp(row: ClerkInvitationRow, action: InviteAction): string {
  const created = rowCreatedAt(row);
  const updated = rowUpdatedAt(row);
  if (action === 'invite sent') {
    return created ?? updated ?? new Date(0).toISOString();
  }
  return updated ?? created ?? new Date(0).toISOString();
}

function rowMatchesTenant(
  row: ClerkInvitationRow,
  tenantKey: string,
): boolean {
  const meta = rowMetadata(row);
  const stamped = meta.tenantKey;
  if (typeof stamped !== 'string' || stamped.length === 0) {
    // No tenant stamp — surface to all tenants (see honesty
    // doctrine at the top of this file).
    return true;
  }
  return stamped === tenantKey;
}

function rowInsideWindow(ts: string, windowStart: string): boolean {
  const tsMs = Date.parse(ts);
  const startMs = Date.parse(windowStart);
  if (!Number.isFinite(tsMs) || !Number.isFinite(startMs)) return false;
  return tsMs >= startMs;
}

function mapRow(row: ClerkInvitationRow): InviteEvent {
  const action = deriveAction(row);
  return {
    id: row.id,
    ts: deriveTimestamp(row, action),
    actor: rowInvitedBy(row),
    action,
    target: maskEmail(rowEmail(row)),
  };
}

// ── Clerk SDK acquisition ───────────────────────────────────────────────────

/**
 * Load the Clerk SDK only if CLERK_SECRET_KEY is set. We do a
 * dynamic import so:
 *   1. The module is not loaded in environments without the SDK.
 *   2. Tests can mock the loader cleanly.
 *
 * Returns `null` when the SDK is unavailable.
 */
async function loadClerkClient(): Promise<ClerkClientLike | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || secretKey.length === 0) {
    return null;
  }
  try {
    // Inline import so the SDK is only resolved when wired.
    const mod = (await import('@clerk/backend')) as {
      createClerkClient: (opts: { secretKey: string }) => ClerkClientLike;
    };
    if (typeof mod.createClerkClient !== 'function') return null;
    return mod.createClerkClient({ secretKey });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'invite_events.clerk_sdk_load_failed',
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Compose recent invite-lifecycle events for one tenant.
 *
 * @param tenantKey — kebab-form tenant slug (e.g. `apex-retail`).
 *   Used to filter Clerk invitations whose `public_metadata.tenantKey`
 *   stamp matches. Invitations without the stamp are surfaced to
 *   all tenants (visible by default; the inviter is responsible
 *   for stamping when they want tenant scoping).
 * @param sinceIso — optional explicit window start. Defaults to 24h
 *   ago to match the ribbon's window.
 */
export async function getRecentInviteEvents(
  tenantKey: string,
  sinceIso?: string,
): Promise<InviteEvent[]> {
  const clerk = await loadClerkClient();
  if (!clerk) {
    // No SDK wired → honest empty. The verdict's audit ribbon stays
    // empty for the invite source rather than synthesizing rows.
    return [];
  }

  const windowStart = sinceIso ?? isoWindowStart();

  let raw: ClerkInvitationRow[] = [];
  try {
    const response = await clerk.invitations.getInvitationList({
      limit: CLERK_PAGE_LIMIT,
    });
    // Some Clerk SDK versions wrap the list in `{ data: [...] }`;
    // others return the array directly. Handle both shapes.
    if (Array.isArray(response)) {
      raw = response;
    } else if (response && Array.isArray((response as { data?: unknown }).data)) {
      raw = (response as { data: ClerkInvitationRow[] }).data;
    } else {
      raw = [];
    }
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'invite_events.clerk_query_failed',
        tenantKey,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }

  const events: InviteEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object' || !row.id) continue;
    if (!rowMatchesTenant(row, tenantKey)) continue;
    const mapped = mapRow(row);
    if (!rowInsideWindow(mapped.ts, windowStart)) continue;
    events.push(mapped);
  }

  // Sort by ts desc so the broker's caller gets a predictable order
  // even before the audit composer re-sorts on union.
  events.sort((a, b) => {
    const ta = Date.parse(a.ts);
    const tb = Date.parse(b.ts);
    const va = Number.isFinite(ta) ? ta : -Infinity;
    const vb = Number.isFinite(tb) ? tb : -Infinity;
    return vb - va;
  });

  return events.slice(0, INVITE_EVENT_LIMIT);
}
