/**
 * Steward Trust-Spine context · Wave 3 PR-3
 *
 * Composes the TrustSpine read model into a system-prompt block that
 * grounds the Steward chat dock (SetupChatRail / StewardDockPane) in
 * real tenant posture: substrate maturity, connector health, isolation
 * anomalies, and governance state.
 *
 * Today, Steward gives generic guidance ("upload your foundational
 * datasets first"). With TrustSpine wired into the system prompt,
 * Steward answers "what should I do next?" with sentences like
 * "Your sparsest segment is Vendor Contracts — load it next to unlock
 * Source vendor diligence. Two connectors are degraded (Salesforce —
 * scope mismatch). One approval is pending."
 *
 * See docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md § 3 (Setup chat rail)
 * and § 7 (Wave 3 PR 3).
 *
 * Privacy:
 *   - Never include user emails or anomaly reasons that may contain PII.
 *   - The composer reads only counts + redacted labels from TrustSpine.
 *     Anomaly descriptions are categorical (e.g. "tenant-resolution
 *     anomaly: unknown_tenant"); the composer drops anything that
 *     looks like an email address or UUID.
 *
 * Broker boundary:
 *   - This module is the only Steward-facing consumer of getTrustSpine.
 *   - It is server-only and never imported by client components.
 *   - The TrustSpine broker itself routes through other brokers; no
 *     direct Supabase access.
 */

import 'server-only';

import {
  getTrustSpine,
  type TrustSpine,
} from '@/lib/admin/broker/trust-spine-broker';

// ── PII redaction ────────────────────────────────────────────────────────────

// Email addresses and bare UUIDs are the two PII shapes most likely to
// appear in anomaly reasons or invite events. We redact both before
// echoing any label into the prompt block.
const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/**
 * Strip emails and UUIDs from a string before including it in the
 * Steward system prompt. Exported for tests.
 */
export function redactPii(input: string): string {
  return input
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(UUID_RE, '[redacted-id]')
    .trim();
}

// ── System prompt composer ───────────────────────────────────────────────────

export interface StewardTrustSpineContextInput {
  tenantName: string;
  industry?: string | null;
  spine: TrustSpine;
}

/**
 * Compose the TrustSpine system-prompt block for the Steward chat
 * surface. Always returns a non-empty block when called — the caller
 * is responsible for gating on the agent/surface combination. The
 * shape is stable so snapshot tests stay tight.
 */
export function composeStewardTrustSpineContext(
  input: StewardTrustSpineContextInput,
): string {
  const { tenantName, industry, spine } = input;
  const { substrate, integration, isolation, governance } = spine;

  const tenantLine =
    industry && industry.trim().length > 0
      ? `Tenant: ${tenantName} (${industry.trim()})`
      : `Tenant: ${tenantName}`;

  // Substrate line — counts + sparsest segment label (no PII risk;
  // segment labels are AbarVa-controlled vocabulary).
  const substrateBase = `Substrate: ${substrate.mature}/${substrate.segmentsTotal} segments mature.`;
  const substrateSparse = substrate.topSparseSegment
    ? ` Sparsest: ${redactPii(substrate.topSparseSegment.label)} — unlocks ${redactPii(substrate.topSparseSegment.unlocks)}.`
    : substrate.segmentsTotal === 0
      ? ' No substrate loaded yet — first upload unlocks Sentinel grounding.'
      : ' All segments above sparse threshold.';
  const substrateLine = substrateBase + substrateSparse;

  // Integration line — connector counts + top degraded reason.
  const integrationBase = `Connectors: ${integration.connectorsLive}/${integration.connectorsTotal} live.`;
  const integrationDegraded =
    integration.connectorsDegraded > 0 && integration.topDegraded
      ? ` ${integration.connectorsDegraded} degraded — ${redactPii(integration.topDegraded.name)} (${redactPii(integration.topDegraded.reason)}).`
      : integration.connectorsDegraded > 0
        ? ` ${integration.connectorsDegraded} degraded.`
        : integration.connectorsTotal === 0
          ? ' No connectors registered.'
          : ' All connectors green.';
  const integrationLine = integrationBase + integrationDegraded;

  // Isolation line — RLS coverage + anomaly count. Anomaly DESCRIPTIONS
  // can carry user_id / payload hints, so we DO NOT echo the top
  // anomaly's description into the prompt; only the count and severity.
  const isolationLine =
    `Isolation: ${isolation.anomaliesLast24h} anomalies in last 24h. ` +
    `RLS coverage ${Math.round(isolation.rlsCoveragePct)}%.` +
    (isolation.topAnomaly
      ? ` Highest severity: ${isolation.topAnomaly.severity}.`
      : '');

  // Governance line — approvals + SSO + invites. Invite counts come
  // from Clerk; we never echo the masked email — just the count.
  const governanceLine =
    `Governance: ${governance.openApprovals} approvals pending. ` +
    `SSO ${governance.ssoConfigured ? 'configured' : 'not configured'}.` +
    (governance.openInvites > 0
      ? ` ${governance.openInvites} open invites.`
      : '') +
    (governance.policyDriftCount > 0
      ? ` ${governance.policyDriftCount} policy-drift events.`
      : '');

  // Action queue — deterministic ordering for Steward's "what next" voice.
  const actionQueue = composeActionQueue(spine);

  return [
    'STEWARD TRUST-SPINE CONTEXT (current tenant posture):',
    tenantLine,
    substrateLine,
    integrationLine,
    isolationLine,
    governanceLine,
    '',
    actionQueue,
    '',
    'Ground your "what should I do next" answers in this posture.',
    'Name specific segments, connectors, and approver roles from the posture above before generic guidance.',
    'If the user asks "what should I do next?", "what is stuck?", or "what is the next priority?", lead with the highest-leverage action from the action queue.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

// ── Action queue (deterministic) ─────────────────────────────────────────────

/**
 * Order the trust-spine actions by leverage. The order is:
 *   1. Top degraded connector (active operational pain)
 *   2. High-severity isolation anomalies (governance + trust signal)
 *   3. Top sparse segment (substrate gap → capability unlock)
 *   4. Open approvals (blocks downstream)
 *   5. SSO not configured (pilot readiness)
 *
 * Exported so unit tests can pin the ordering and so a future
 * deterministic question router can call it directly.
 */
export function composeActionQueue(spine: TrustSpine): string {
  const { substrate, integration, isolation, governance } = spine;
  const lines: string[] = ['Action queue (priority order):'];
  let rank = 1;

  if (integration.topDegraded) {
    lines.push(
      `  ${rank}. Repair degraded connector "${redactPii(integration.topDegraded.name)}" — ${redactPii(integration.topDegraded.reason)}.`,
    );
    rank += 1;
  }

  if (isolation.anomaliesLast24h > 0 && isolation.topAnomaly?.severity === 'high') {
    lines.push(
      `  ${rank}. Review ${isolation.anomaliesLast24h} isolation anomaly/anomalies in last 24h (highest severity: high).`,
    );
    rank += 1;
  }

  if (substrate.topSparseSegment) {
    lines.push(
      `  ${rank}. Load substrate segment "${redactPii(substrate.topSparseSegment.label)}" — unlocks ${redactPii(substrate.topSparseSegment.unlocks)}.`,
    );
    rank += 1;
  }

  if (governance.openApprovals > 0) {
    lines.push(
      `  ${rank}. Resolve ${governance.openApprovals} pending approval${governance.openApprovals === 1 ? '' : 's'} in the approval queue.`,
    );
    rank += 1;
  }

  if (
    isolation.anomaliesLast24h > 0 &&
    isolation.topAnomaly?.severity !== 'high'
  ) {
    lines.push(
      `  ${rank}. Investigate ${isolation.anomaliesLast24h} isolation anomaly/anomalies in last 24h (severity: ${isolation.topAnomaly?.severity ?? 'unknown'}).`,
    );
    rank += 1;
  }

  if (!governance.ssoConfigured) {
    lines.push(
      `  ${rank}. Configure SSO before pilot — currently not configured.`,
    );
    rank += 1;
  }

  if (rank === 1) {
    lines.push('  (No urgent actions — tenant posture is green across all four dimensions.)');
  }

  return lines.join('\n');
}

// ── Deterministic question router ────────────────────────────────────────────

const NEXT_PRIORITY_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwhat\s+should\s+i\s+do\s+next\b/i,
  /\bwhat['']?s\s+(stuck|blocked|blocking)\b/i,
  /\bwhat\s+(?:is|['']?s)\s+the\s+(next|highest)\s+priority\b/i,
  /\bwhere\s+should\s+i\s+focus\b/i,
  /\btop\s+priority\b.*\?/i,
  /\bnext\s+(step|action|move)\b.*\?/i,
];

/**
 * True when the user's message matches one of the canonical "what
 * should I do next" question patterns. Exposed so the chat route can
 * inject a stronger directive to anchor Steward's reply to the action
 * queue (deterministic-ish; Steward still composes the prose).
 */
export function matchesNextPriorityQuestion(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  return NEXT_PRIORITY_PATTERNS.some((re) => re.test(trimmed));
}

// ── Surface gating ───────────────────────────────────────────────────────────

const STEWARD_TRUST_SPINE_SURFACES: ReadonlySet<string> = new Set([
  '/admin',
]);

/**
 * True when the (agent, surface) pair is one where Steward should
 * receive the TrustSpine context block. Setup/Admin context belongs to
 * `/admin/*`; legacy `/home/*` setup aliases must not keep Steward in
 * setup posture after the Home/Admin separation.
 */
export function shouldInjectStewardTrustSpine(
  agentName: string | null,
  surface: string,
): boolean {
  if (agentName !== 'Steward') return false;
  if (!surface) return false;
  if (surface.startsWith('/admin')) return true;
  return STEWARD_TRUST_SPINE_SURFACES.has(surface);
}

// ── Entry point (resolves broker + composes) ─────────────────────────────────

export interface BuildStewardTrustSpineBlockInput {
  tenantName: string;
  tenantKey: string;
  industry?: string | null;
}

export interface StewardTrustSpineBlock {
  /** The system-prompt block — empty string if the broker failed. */
  block: string;
  /** True when the broker resolved and posture was composed. */
  resolved: boolean;
  /** Raw spine for downstream consumers (e.g. tool grounding). */
  spine: TrustSpine | null;
}

/**
 * Resolve the TrustSpine for the active tenant and compose the
 * Steward system-prompt block. Returns an empty block if the broker
 * throws — Steward then falls through to the existing generic
 * guidance rather than crashing the turn.
 */
export async function buildStewardTrustSpineBlock(
  input: BuildStewardTrustSpineBlockInput,
): Promise<StewardTrustSpineBlock> {
  try {
    const spine = await getTrustSpine(input.tenantKey);
    const block = composeStewardTrustSpineContext({
      tenantName: input.tenantName,
      industry: input.industry,
      spine,
    });
    return { block, resolved: true, spine };
  } catch (err) {
    // Structured warn — visible in logs but never crashes the chat
    // turn. Steward falls back to its voice-doctrine guidance.
    console.warn(
      JSON.stringify({
        event: 'steward_trust_spine.compose_failed',
        tenantKey: input.tenantKey,
        reason: err instanceof Error ? err.message : String(err),
      }),
    );
    return { block: '', resolved: false, spine: null };
  }
}
