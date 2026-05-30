/**
 * Policy Events broker · Wave 2 PR-3
 *
 * Live per-tenant tenant-policy-change posture for the Setup / Admin
 * Trust Plane audit ribbon. Reads the `tenant_policy_audit` ledger
 * added in `20260522170000_ai_egress_control_plane.sql` (canonical
 * AI-egress policy-change audit table).
 *
 * Contract:
 *   getRecentPolicyEvents(tenantKey, sinceIso?) → PolicyEvent[]
 *
 * Wave 2 PR-3 mission · per `SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6
 * Zone E: the unified audit ribbon mixes substrate + auth + policy +
 * connector + invite + approval events on one temporal axis. This
 * broker contributes the `policy` source.
 *
 * Schema mapping (`tenant_policy_audit`):
 *   - `id`              → event id
 *   - `tenant_id`       → resolved via `resolveClientId` upstream
 *   - `actor_id`        → kept internal; we surface `actor_label` only
 *   - `actor_label`     → human-readable actor (e.g. "Admin · CIO")
 *   - `prior_policy`    → JSONB; NEVER surfaced (payload-fingerprint)
 *   - `new_policy`      → JSONB; NEVER surfaced (payload-fingerprint)
 *   - `reason`          → plain-language; used to derive action
 *   - `created_at`      → timestamp
 *
 * PII / payload safety (per W2-PR-2 precedent — see
 * `isolation-posture-broker.ts` honesty doctrine):
 *
 *   - `prior_policy` / `new_policy` JSONB columns are NEVER selected
 *     by this broker. The action is derived deterministically from
 *     the row's existence and reason; the actual policy delta lives
 *     in the row store and is read only by the dedicated policy
 *     drilldown surface (NOT this ribbon).
 *   - `actor_id` UUID is NEVER surfaced. We use `actor_label` (a
 *     human-readable string) or fall back to "system" when null.
 *
 * Action derivation:
 *   The schema doesn't carry an explicit `event_type` enum. We
 *   derive create / update / delete from the policy column shapes
 *   we DO query: a row exists iff a policy mutation happened.
 *   Today every row is treated as `'policy updated'` since the
 *   egress writer only ever emits update rows (there is no
 *   create / delete path for tenant ai_policy — it's a single
 *   JSONB column on `clients`, mutated in place).
 *
 *   When a future schema grows distinct event_type rows
 *   ('created' | 'updated' | 'deleted'), the action mapping
 *   should branch on that column. Until then, "policy updated"
 *   is the honest single-shape action.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   - If the table is missing (migration not applied), the broker
 *     returns []. We do NOT throw — the upstream composer treats
 *     [] as "no policy events" rather than a degraded chip.
 *   - If the tenant cannot be resolved, the broker returns [].
 *   - If the query fails for any other reason, the broker returns
 *     [] AFTER emitting a structured warn so the failure is
 *     observable in logs.
 *
 * Broker-boundary doctrine: this file is inside
 * `src/lib/admin/broker/**` and is therefore the canonical zone
 * where direct data reads via the `azureRead` adapter are
 * permitted (`broker-boundary.test.ts` exempts this directory).
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone E,
 * §7 Wave 2 PR-3 for the surface narrative this fulfills.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';

// ── Contract ────────────────────────────────────────────────────────────────

export type PolicyAction =
  | 'policy created'
  | 'policy updated'
  | 'policy deleted';

export interface PolicyEvent {
  id: string;
  ts: string;
  /** Human-readable actor label, or `'system'` when no actor recorded. */
  actor: string;
  action: PolicyAction;
  /**
   * Target identifier — a short label for the policy that changed.
   * Today this is the tenant key itself since `clients.ai_policy` is
   * a single column; when a multi-policy schema lands, this will
   * become the policy name.
   */
  target: string;
  /**
   * Plain-language reason carried in the row. The composer may use
   * this as a tooltip / drilldown signal. Trimmed and bounded so a
   * pathological reason string cannot bloat the ribbon payload.
   */
  reason: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Default lookback when caller does not pass `sinceIso`. */
const DEFAULT_WINDOW_HOURS = 24;

/** Max rows the broker returns. The ribbon caps at 50 events total. */
const POLICY_EVENT_LIMIT = 50;

/** Hard cap on reason string length so the ribbon row stays scannable. */
const REASON_MAX_LEN = 280;

// ── Row shape from tenant_policy_audit ──────────────────────────────────────

/**
 * EXPLICIT column allow-list. We never select `prior_policy` or
 * `new_policy` — those JSONB columns are payload-fingerprint material
 * (the egress writer stamps the full policy delta into them) and
 * have no place on the audit ribbon. The reason column already
 * carries the plain-language summary the ribbon needs.
 */
interface PolicyAuditRow {
  id: string;
  tenant_id: string;
  actor_label: string | null;
  reason: string;
  created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clampReason(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= REASON_MAX_LEN) return trimmed;
  return trimmed.slice(0, REASON_MAX_LEN - 1) + '…';
}

function isoWindowStart(): string {
  return new Date(
    Date.now() - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

function mapRow(row: PolicyAuditRow, tenantKey: string): PolicyEvent {
  // Action: today every row is an in-place update of the tenant's
  // single `ai_policy` JSONB column. When a richer schema lands,
  // branch here on the (future) event_type column.
  const action: PolicyAction = 'policy updated';
  return {
    id: row.id,
    ts: row.created_at,
    actor: row.actor_label && row.actor_label.length > 0
      ? row.actor_label
      : 'system',
    action,
    target: tenantKey,
    reason: clampReason(row.reason),
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Compose recent policy-change events for one tenant.
 *
 * @param tenantKey — kebab-form tenant slug (e.g. `apex-retail`). The
 *   broker resolves this to the `clients.id` UUID via
 *   `resolveClientId` before querying `tenant_policy_audit`.
 * @param sinceIso — optional explicit window start. Defaults to 24h
 *   ago to match the ribbon's window.
 *
 * Errors are caught here — this broker is graceful by design. If
 * the tenant cannot be resolved, the table doesn't exist, or the
 * underlying query fails, the broker returns `[]` with a structured
 * console.warn (where appropriate) so the upstream composer can
 * keep the ribbon honest rather than crashing.
 */
export async function getRecentPolicyEvents(
  tenantKey: string,
  sinceIso?: string,
): Promise<PolicyEvent[]> {
  let clientId: string | null = null;
  try {
    clientId = await resolveClientId(tenantKey);
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'policy_events.client_resolve_failed',
        tenantKey,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }

  if (!clientId) {
    // Honest empty case: we asked, no client row. Surface [] —
    // upstream treats this as "no policy events" rather than an
    // error.
    return [];
  }

  const windowStart = sinceIso ?? isoWindowStart();

  let rows: PolicyAuditRow[] = [];
  try {
    rows = await azureRead.select<PolicyAuditRow>({
      table: 'tenant_policy_audit',
      // Allow-list: id, tenant_id, actor_label, reason, created_at.
      // NEVER select prior_policy / new_policy / actor_id —
      // payload-fingerprint and internal-id columns are kept out
      // of the broker result per W2-PR-2 precedent.
      columns: ['id', 'tenant_id', 'actor_label', 'reason', 'created_at'],
      where: {
        tenant_id: clientId,
        created_at: { op: 'gte', value: windowStart },
      },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: POLICY_EVENT_LIMIT,
      // Migration may not be applied in every environment — return
      // [] rather than throwing if the relation is missing.
      missingTable: 'empty',
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'policy_events.query_failed',
        tenantKey,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }

  return rows.map((r) => mapRow(r, tenantKey));
}
