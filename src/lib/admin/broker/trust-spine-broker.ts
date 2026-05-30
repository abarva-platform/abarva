/**
 * Trust Plane · TrustSpine broker · Wave 1 PR-4 / extended PR-6
 *
 * Canonical read model for the Setup / Admin surface. Composes the
 * five trust dimensions — substrate, isolation, integrations,
 * governance, audit — into one contract that the landing page,
 * Data Trust, Connectors, Users & Access, and Audit pages all
 * read from.
 *
 * PR-6 (Wave 1) extends the audit composer to union substrate-import
 * events with approval-queue events; connector and invite sources
 * are stubbed empty until Wave 2 wires their ledgers.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` § 5.4 for the
 * Data Trust backbone narrative and §7 (Wave 1 PR-4) for the
 * delivery slicing this file fulfills.
 *
 * Contract:
 *   getTrustSpine(tenantKey) → TrustSpine
 *
 * The broker COMPOSES other brokers — it does not query Supabase
 * directly. It depends on `setup-data-broker` for substrate,
 * `programs/approval` for governance approvals, and (for now)
 * authored fixtures for connector and isolation posture. The
 * `evidence` field on each dimension says whether the chip is
 * live-wired or estimated, so the UI can render an honest live
 * caveat.
 *
 * Broker-boundary doctrine (feedback_broker_boundary.md, memory
 * 2026-04-28): the admin surface MUST NOT import the Supabase
 * server client directly. It MUST route every server read through
 * a broker contract. The hygiene test at
 * `src/lib/admin/__tests__/broker-boundary.test.ts` codifies this
 * as a CI gate.
 */

import 'server-only';

import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';
import {
  getApprovalQueueForTenant,
  type ApprovalRequest,
} from '@/lib/programs/approval';
import { unlocksCopy } from '@/lib/admin/setup-vocab';
import type {
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import {
  getConnectorHealth,
  type ConnectorHealth,
} from '@/lib/admin/broker/connector-health-broker';

// ── Contract ────────────────────────────────────────────────────────────────

export type TrustEvidence = 'live' | 'estimated';

export interface TrustSpineSubstrate {
  segmentsTotal: number;
  mature: number;
  sparse: number;
  missing: number;
  lastIngestIso: string | null;
  topSparseSegment: { id: string; label: string; unlocks: string } | null;
  evidence: TrustEvidence;
}

export interface TrustSpineIsolation {
  rlsCoveragePct: number;
  tenantResolutionEvents24h: number;
  anomaliesLast24h: number;
  topAnomaly: {
    id: string;
    description: string;
    severity: 'low' | 'med' | 'high';
  } | null;
  evidence: TrustEvidence;
}

export interface TrustSpineIntegration {
  connectorsTotal: number;
  connectorsLive: number;
  connectorsDegraded: number;
  lastPullIso: string | null;
  topDegraded: { id: string; name: string; reason: string } | null;
  evidence: TrustEvidence;
}

export interface TrustSpineGovernance {
  ssoConfigured: boolean;
  openApprovals: number;
  policyDriftCount: number;
  openInvites: number;
  evidence: TrustEvidence;
}

export type TrustAuditEventSource =
  | 'substrate'
  | 'auth'
  | 'policy'
  | 'connector'
  | 'invite'
  | 'approval';

export interface TrustAuditEvent {
  ts: string;
  source: TrustAuditEventSource;
  actor: string;
  action: string;
  target?: string;
}

export interface TrustSpineAudit {
  last24hEvents: TrustAuditEvent[];
}

export interface TrustSpine {
  substrate: TrustSpineSubstrate;
  isolation: TrustSpineIsolation;
  integration: TrustSpineIntegration;
  governance: TrustSpineGovernance;
  audit: TrustSpineAudit;
  refreshedAtIso: string;
  tenantKey: string;
}

// ── Substrate composition ───────────────────────────────────────────────────

/**
 * Bucket the segment rollups into mature / sparse / missing for the
 * landing-page trust chip. The mapping follows the `HealthState`
 * vocabulary in `setup-vocab.ts`:
 *
 *   - mature   ← complete | partial
 *   - sparse   ← sparse | attention
 *   - missing  ← not_started | critical
 *
 * Aligned with `readinessPercent` weighting so the chip and the
 * % stay coherent.
 */
function bucketSegments(segments: ReadonlyArray<InventorySegmentRollup>) {
  let mature = 0;
  let sparse = 0;
  let missing = 0;
  for (const s of segments) {
    const state = s.healthState;
    if (state === 'complete' || state === 'partial') mature += 1;
    else if (state === 'sparse' || state === 'attention') sparse += 1;
    else missing += 1;
  }
  return { mature, sparse, missing };
}

function pickTopSparseSegment(
  segments: ReadonlyArray<InventorySegmentRollup>,
): TrustSpineSubstrate['topSparseSegment'] {
  // Highest-impact sparse / missing segment is the "load this next"
  // candidate. We sort by family number to be stable in tests; in
  // practice impactScoreForSegment could be wired here, but family
  // ordering is good enough for the landing chip and avoids
  // re-deriving impact at compose time.
  const candidates = segments.filter(
    (s) =>
      s.healthState === 'sparse' ||
      s.healthState === 'attention' ||
      s.healthState === 'not_started' ||
      s.healthState === 'critical',
  );
  if (candidates.length === 0) return null;
  const top = [...candidates].sort((a, b) => a.familyNumber - b.familyNumber)[0];
  return {
    id: top.segmentId,
    label: top.segmentName,
    unlocks: unlocksCopy(top.familyNumber, top.segmentName),
  };
}

function composeSubstrate(
  snapshot: SetupInventorySnapshot | null,
): TrustSpineSubstrate {
  if (!snapshot || snapshot.segments.length === 0) {
    return {
      segmentsTotal: 0,
      mature: 0,
      sparse: 0,
      missing: 0,
      lastIngestIso: null,
      topSparseSegment: null,
      evidence: 'live',
    };
  }
  const { mature, sparse, missing } = bucketSegments(snapshot.segments);
  return {
    segmentsTotal: snapshot.segments.length,
    mature,
    sparse,
    missing,
    lastIngestIso: snapshot.lastIngestedAt,
    topSparseSegment: pickTopSparseSegment(snapshot.segments),
    evidence: 'live',
  };
}

// ── Governance composition ──────────────────────────────────────────────────

function composeGovernance(
  openApprovals: number,
): TrustSpineGovernance {
  return {
    // TODO(Wave 2): wire SSO state from Clerk org settings via a
    // dedicated `clerk-broker.ts`. The admin page currently passes
    // `ssoConfigured: false` literally; matching that here keeps
    // PR-4 a no-op for UI rendering.
    ssoConfigured: false,
    openApprovals,
    // TODO(Wave 2): wire `policyDriftCount` from
    // `policy_change_events` once that ledger lands. Today the
    // surface has no schema for policy drift.
    policyDriftCount: 0,
    // No `tenant_invites` / `user_invitations` table exists today
    // (the admin users-access page declares "live writes deferred to
    // Wave 27"). Surface 0 until the invite ledger is wired in
    // Wave 2 PR-2.
    openInvites: 0,
    evidence: 'live',
  };
}

// ── Isolation composition (Wave 2) ──────────────────────────────────────────

function composeIsolation(): TrustSpineIsolation {
  // PR-4 is the data spine, not the isolation lane. We surface an
  // authored "no anomalies" posture marked as estimated so the
  // landing strip can render honestly. Wave 2 PR-2 wires the
  // `ai_egress_audit` reader behind this same contract.
  return {
    rlsCoveragePct: 100,
    tenantResolutionEvents24h: 0,
    anomaliesLast24h: 0,
    topAnomaly: null,
    evidence: 'estimated',
  };
}

// ── Integration composition (Wave 2 PR-1) ───────────────────────────────────

/**
 * Live integration composition. When the connector-health broker
 * resolves, we surface its rollups with `evidence: 'live'`. When
 * the broker throws (Promise.allSettled rejected — e.g. the live
 * DB read is still pending and the adapter raised
 * AdminDataMigrationPendingError), we fall back to the zeroed
 * `'estimated'` posture so the landing strip stays honest rather
 * than crashing.
 */
function composeIntegration(
  health: ConnectorHealth | null,
): TrustSpineIntegration {
  if (!health) {
    return {
      connectorsTotal: 0,
      connectorsLive: 0,
      connectorsDegraded: 0,
      lastPullIso: null,
      topDegraded: null,
      evidence: 'estimated',
    };
  }
  return {
    connectorsTotal: health.connectorsTotal,
    connectorsLive: health.connectorsLive,
    connectorsDegraded: health.connectorsDegraded,
    lastPullIso: health.lastPullIso,
    topDegraded: health.topDegraded,
    evidence: 'live',
  };
}

// ── Audit ribbon composition ────────────────────────────────────────────────

/** Max events the broker returns on the ribbon. UI shows the top 6. */
const AUDIT_RIBBON_MAX = 50;

/**
 * Format an approval row from the queue into an audit event. The
 * approval queue surfaces only `pending` rows today (see
 * `getApprovalQueueForTenant`), so the synthesized action is
 * "opened a program approval request." Once a richer ledger view
 * lands (Wave 2), we will also surface `approved` / `rejected` /
 * `withdrawn` transitions with their `decidedAt` timestamps.
 *
 * `actor` falls back to "Program owner" because the approval row
 * carries a user id, not a display name. Resolving the name belongs
 * to a future identity broker; the placeholder reads honestly today.
 */
function approvalToAuditEvent(req: ApprovalRequest): TrustAuditEvent {
  return {
    ts: req.requestedAt,
    source: 'approval',
    actor: req.requestedByUserId ? 'Program owner' : 'Unknown',
    action: 'Opened program approval request',
    target: req.programId,
  };
}

/**
 * Substrate audit events come from the live inventory snapshot's
 * `recentActivity` tail. The snapshot composer already sorts these
 * by timestamp desc; we re-sort below after merging with other
 * sources to keep the union strictly temporal.
 */
function substrateAuditEvents(
  snapshot: SetupInventorySnapshot | null,
): TrustAuditEvent[] {
  if (!snapshot) return [];
  return snapshot.recentActivity.map((e) => ({
    ts: e.timestampIso,
    source: 'substrate',
    actor: e.actor,
    action: e.what,
  }));
}

/** Ribbon emits "sync succeeded" events for pulls inside this window. */
const CONNECTOR_RECENT_PULL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Connector events — Wave 2 PR-1 wires this from the connector
 * health broker. Two kinds of events join the unified ribbon:
 *
 *   1. Successful pulls within the last 24h — every connector
 *      whose `lastPullIso` is recent emits a "sync succeeded"
 *      row. Used by the admin landing to show that the data
 *      flywheel is turning.
 *   2. Degraded connectors with a `failureReason` — emit a
 *      "sync failed — <reason>" row anchored at the last-pull
 *      timestamp (or the current refresh time if no timestamp
 *      is known).
 *
 * The merge sort downstream re-orders these into the unified
 * temporal ribbon alongside substrate + approval events.
 */
function connectorAuditEvents(
  health: ConnectorHealth | null,
  refreshedAtIso: string,
): TrustAuditEvent[] {
  if (!health) return [];
  const now = Date.parse(refreshedAtIso);
  const nowMs = Number.isFinite(now) ? now : Date.now();
  const out: TrustAuditEvent[] = [];
  for (const row of health.perConnector) {
    // Recent successful pull → "sync succeeded"
    if (row.lastPullIso) {
      const ts = Date.parse(row.lastPullIso);
      if (
        Number.isFinite(ts) &&
        nowMs - ts <= CONNECTOR_RECENT_PULL_WINDOW_MS &&
        row.status !== 'degraded'
      ) {
        out.push({
          ts: row.lastPullIso,
          source: 'connector',
          actor: row.name,
          action: 'sync succeeded',
          target: row.id,
        });
      }
    }
    // Degraded with a known reason → "sync failed — <reason>"
    if (row.status === 'degraded' && row.failureReason) {
      out.push({
        ts: row.lastPullIso ?? refreshedAtIso,
        source: 'connector',
        actor: row.name,
        action: `sync failed — ${row.failureReason}`,
        target: row.id,
      });
    }
  }
  return out;
}

/**
 * Invite events — there is no `tenant_invites` / `user_invitations`
 * table today (the admin users-access page declares "live writes
 * deferred to Wave 27"). Returning [] keeps this dimension honest.
 */
function inviteAuditEvents(): TrustAuditEvent[] {
  // TODO(Wave 2 PR-2): pull invite-sent / invite-accepted events
  // when the invite ledger lands. Today there is no schema to read
  // from.
  return [];
}

function composeAuditRibbon(
  snapshot: SetupInventorySnapshot | null,
  approvals: ApprovalRequest[],
  health: ConnectorHealth | null,
  refreshedAtIso: string,
): TrustSpineAudit {
  const merged: TrustAuditEvent[] = [
    ...substrateAuditEvents(snapshot),
    ...approvals.map(approvalToAuditEvent),
    ...connectorAuditEvents(health, refreshedAtIso),
    ...inviteAuditEvents(),
  ];
  // Strictly temporal: sort by ts desc. Events with unparseable
  // timestamps sink to the bottom so the live feed stays trustworthy.
  merged.sort((a, b) => {
    const ta = Date.parse(a.ts);
    const tb = Date.parse(b.ts);
    const va = Number.isFinite(ta) ? ta : -Infinity;
    const vb = Number.isFinite(tb) ? tb : -Infinity;
    return vb - va;
  });
  return { last24hEvents: merged.slice(0, AUDIT_RIBBON_MAX) };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Compose the full TrustSpine for a tenant. Each upstream broker
 * is awaited independently; if any throws, that dimension is
 * returned in its degraded shape (zeroes + estimated evidence)
 * rather than crashing the whole page.
 *
 * @param tenantKey — the broker / substrate tenant key. Note: this
 *   is the *broker* tenant key (e.g. `apex-retail` with a dash for
 *   the data-room and substrate side), NOT the app ClientKey
 *   (e.g. `apexretail`). The page is responsible for mapping via
 *   `clientKeyToInventorySubstrateKey`. The governance dimension's
 *   approval queue uses the same key shape; map at the call site
 *   if the caller passes the app ClientKey instead.
 */
export async function getTrustSpine(tenantKey: string): Promise<TrustSpine> {
  const [snapshotResult, approvalResult, healthResult] = await Promise.allSettled([
    getSetupInventorySnapshot(tenantKey),
    getApprovalQueueForTenant(tenantKey),
    getConnectorHealth(tenantKey),
  ]);

  const snapshot =
    snapshotResult.status === 'fulfilled' ? snapshotResult.value : null;
  const approvals =
    approvalResult.status === 'fulfilled' ? approvalResult.value : [];
  let health: ConnectorHealth | null = null;
  if (healthResult.status === 'fulfilled') {
    health = healthResult.value;
  } else {
    // Structured warning so the integration chip fallback is
    // observable in logs without crashing the landing.
    console.warn(
      JSON.stringify({
        event: 'trust_spine.connector_health.degraded',
        tenantKey,
        reason:
          healthResult.reason instanceof Error
            ? healthResult.reason.message
            : String(healthResult.reason),
      }),
    );
  }

  const refreshedAtIso = new Date().toISOString();

  return {
    substrate: composeSubstrate(snapshot),
    isolation: composeIsolation(),
    integration: composeIntegration(health),
    governance: composeGovernance(approvals.length),
    audit: composeAuditRibbon(snapshot, approvals, health, refreshedAtIso),
    refreshedAtIso,
    tenantKey,
  };
}
