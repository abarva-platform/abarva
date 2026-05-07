// Portfolio-row derivations.
//
// The redesigned `/source` row pulls in three things the substrate doesn't
// carry as first-class columns:
//
//   1. Lead agent for the current stage  (substrate has `leadAgent: 'Sentinel'`
//      hardcoded across all events; v0.3 wants per-stage leadership)
//   2. Value range with confidence caveat (substrate has a single
//      `valueAtStakeUsd`; v0.3 wants `$8.4M – $14.2M · v2 PENDING`)
//   3. Stage display number for the table   (`02` not `scope`)
//
// All three are pure derivations — no DB calls. When substrate adds these
// fields properly the helpers become trivial passthroughs.
//
// See SOURCE_DOSSIER_DIGESTION.md §4 for the agent leadership contract.

import type { SourceStageKey, SourcingEventSummary } from './types';
import { SOURCE_LEGACY_STAGE_ALIASES, SOURCE_STAGE_ORDER } from './constants';

// ── Lead agent per stage ─────────────────────────────────────────────────────
// Per the dossier:
//   Strategy / Decision / Value           → Atlas (executive framing)
//   Scope / RFP / BAFO / Transition       → Nexus (orchestrator)
//   Responses / Pricing                   → Sentinel (evidence + traps)
//   Evaluate / Selection                  → Steward (scorecard governance)
//
// The substrate's `leadAgent: 'Sentinel'` literal is overridden by this map
// because it was hardcoded for an earlier surface contract. When substrate
// adds a per-stage `lead_agent` field this function becomes a passthrough.

export type SourceLeadAgent = 'Nexus' | 'Sentinel' | 'Steward' | 'Atlas';

const STAGE_LEAD_AGENT: Record<SourceStageKey, SourceLeadAgent> = {
  strategy: 'Atlas',
  scope: 'Nexus',
  rfp: 'Nexus',
  responses: 'Sentinel',
  evaluation: 'Steward',
  pricing: 'Sentinel',
  bafo: 'Nexus',
  executive_decision: 'Atlas',
  selection: 'Steward',
  transition: 'Nexus',
  value: 'Atlas',
  // Legacy aliases route to the canonical leader.
  intake: 'Atlas',
  sourcing_strategy: 'Atlas',
  rfp_rfi_package: 'Nexus',
  vendor_responses: 'Sentinel',
  orals_bafo: 'Nexus',
  contract_mobilization: 'Nexus',
  value_realization: 'Atlas',
};

export function leadAgentForStage(stageKey: SourceStageKey): SourceLeadAgent {
  return STAGE_LEAD_AGENT[stageKey] ?? 'Sentinel';
}

// ── Agent-tagged blocker line ───────────────────────────────────────────────
// Format mirrors v0.3 rows: `SENTINEL · ticket history missing from L2/L3`.
// Returns null when there is no blocker AND no notable next-decision text —
// the row should fall back to a stage intent line in that case.

export interface BlockerLine {
  agent: SourceLeadAgent;
  body: string;
}

export function deriveBlockerLine(event: SourcingEventSummary): BlockerLine | null {
  const agent = leadAgentForStage(event.currentStageKey);
  const blocker = (event.blocker ?? '').trim();
  if (blocker) {
    return { agent, body: blocker };
  }
  // No blocker — show the most useful adjacent signal: at-risk reason or next
  // decision. Fall through to null only when nothing is informative.
  if (event.isAtRisk && event.nextDecision) {
    return { agent, body: event.nextDecision };
  }
  return null;
}

// ── Value range with confidence caveat ──────────────────────────────────────
// Substrate has a single `valueAtStakeUsd`. v0.3 surfaces `$8.4M – $14.2M`
// with a `v2 PENDING` caveat. Until the substrate carries low/high bands we
// derive a ±20% band as a placeholder, with a flag the renderer uses to
// stamp `v2 pending` on the row. When real bands land, replace the function
// body and drop the caveat.
//
// Substrate gap (logged on the redesign PR): add `value_at_stake_low_usd`
// and `value_at_stake_high_usd` to `source_events`, populated by the v2
// substrate joint output (Sentinel + Atlas).

export interface ValuePosture {
  low: number;
  high: number;
  isDerivedBand: boolean; // true while substrate gap is open
}

const DERIVED_BAND_PERCENT = 0.20;

export function deriveValuePosture(event: SourcingEventSummary): ValuePosture | null {
  const point = event.valueAtStakeUsd;
  if (!Number.isFinite(point) || point <= 0) return null;
  // No real range fields yet — derive a symmetric ±20% band so the row reads
  // like the v0.3 design without lying about precision.
  const low = Math.round(point * (1 - DERIVED_BAND_PERCENT));
  const high = Math.round(point * (1 + DERIVED_BAND_PERCENT));
  return { low, high, isDerivedBand: true };
}

export function formatValuePosture(
  posture: ValuePosture | null,
  canViewFinancialValues: boolean,
): { primary: string; secondary: string } {
  if (!canViewFinancialValues) {
    return { primary: '$ — restricted', secondary: 'Financial visibility off' };
  }
  if (!posture) {
    return { primary: '—', secondary: 'No value posture' };
  }
  const lowS = formatCompactUsd(posture.low);
  const highS = formatCompactUsd(posture.high);
  return {
    primary: lowS === highS ? lowS : `${lowS} – ${highS}`,
    secondary: posture.isDerivedBand ? 'v2 pending' : 'projected',
  };
}

function formatCompactUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '$0';
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${usd}`;
}

// ── Stage progress (for the mini-rail) ──────────────────────────────────────
// Returns the canonical 0-based index in the 11-step lifecycle, or 0 when the
// stage key is unrecognized. Aliased keys (e.g. 'intake') resolve to their
// canonical position.

export function stageIndex(stageKey: SourceStageKey): number {
  const canonical = (SOURCE_LEGACY_STAGE_ALIASES[stageKey] ?? stageKey) as SourceStageKey;
  const idx = SOURCE_STAGE_ORDER.indexOf(canonical);
  return idx < 0 ? 0 : idx;
}

export function stageStepCount(): number {
  return SOURCE_STAGE_ORDER.length;
}

// ── "Entered N days ago" copy ───────────────────────────────────────────────
// `agingDays` from the substrate is interpreted as days since the event
// entered its current stage (the seed and persisted-row mapping use
// `daysSince(created_at)` today; this becomes more precise when we move to
// per-stage entry timestamps).

export function formatStageEntered(agingDays: number): string {
  const d = Math.max(0, agingDays | 0);
  if (d === 0) return 'entered today';
  if (d === 1) return 'entered 1 day ago';
  return `entered ${d} days ago`;
}
