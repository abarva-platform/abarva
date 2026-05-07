// Source portfolio filtering, state determination, and need-attention derivation.
//
// Pure utilities — no React, no Supabase. The page component imports these to
// transform the raw `SourcingEventSummary[]` from `listSourcingEvents()` into
// the view-model the redesigned `/source` portfolio surface needs.
//
// Three concerns:
//   1. Test-artifact filter — strip E2E-CRAWL events before display
//   2. needsAttention derivation — classify which events demand admin focus
//   3. Portfolio state — empty / partial / mature based on filtered count
//
// See docs/design/source/Source_Portfolio___Redesign___standalone.html for the
// locked design and SOURCE_PORTFOLIO_IMPL_PROMPT_2026-05-07 for the spec.

import type { SourceLifecycleStatus, SourceStageKey, SourcingEventSummary } from './types';
import { SOURCE_STAGE_ORDER, SOURCE_LEGACY_STAGE_ALIASES } from './constants';

export type PortfolioState = 'empty' | 'partial' | 'mature';

export type AttentionSeverity = 'critical' | 'standard';
export type AttentionKind = 'overdue' | 'blocked' | 'stale' | 'awaiting_decision';

export interface AttentionDescriptor {
  kind: AttentionKind;
  severity: AttentionSeverity;
  badgeLabel: string;
  badgeDays: number;
  diagnosis: string;
  detail: string;
}

export type StageBandKey = 'discovery' | 'evaluation' | 'decision' | 'transition' | 'completed';

export interface StageBand {
  key: StageBandKey;
  rangeLabel: string;
  title: string;
}

// ── Test-artifact filter ─────────────────────────────────────────────────────
// E2E-CRAWL events leak into the user-facing portfolio because the substrate
// stores them alongside real seeded events. They must NEVER be shown.
//
// Pattern-based, not whitelisted — new test artifact names will appear
// (different timestamps, different stages) and the filter must catch them
// generically. Match any of:
//   - leading "E2E-" prefix (case-insensitive)
//   - "-CRAWL-" anywhere in the name (case-insensitive)
//   - ISO timestamp suffix like "-20260502T175236Z"
//   - "playwright" anywhere (defensive — Playwright spec helpers create them)

const TEST_ARTIFACT_PATTERNS: RegExp[] = [
  /^E2E-/i,
  /-CRAWL-/i,
  /-\d{8}T\d{6}Z$/i,
  /playwright/i,
];

export function isTestArtifactEvent(event: SourcingEventSummary): boolean {
  const name = event.name ?? '';
  const code = event.code ?? '';
  return TEST_ARTIFACT_PATTERNS.some((re) => re.test(name) || re.test(code));
}

export function filterOutTestArtifacts(events: SourcingEventSummary[]): SourcingEventSummary[] {
  return events.filter((event) => !isTestArtifactEvent(event));
}

// ── Dedupe by event_code ─────────────────────────────────────────────────────
// The substrate occasionally has multiple persisted rows with the same
// event_code (e.g. when the seed loader re-ran). The portfolio surface should
// show one row per code — the most recent / most progressed one.

export function dedupeByEventCode(events: SourcingEventSummary[]): SourcingEventSummary[] {
  const byCode = new Map<string, SourcingEventSummary>();
  for (const event of events) {
    const existing = byCode.get(event.code);
    if (!existing) {
      byCode.set(event.code, event);
      continue;
    }
    // Prefer the more advanced stage; tie-break with higher aging (older row).
    const existingIdx = SOURCE_STAGE_ORDER.indexOf(existing.currentStageKey);
    const candidateIdx = SOURCE_STAGE_ORDER.indexOf(event.currentStageKey);
    if (candidateIdx > existingIdx) {
      byCode.set(event.code, event);
    } else if (candidateIdx === existingIdx && event.agingDays > existing.agingDays) {
      byCode.set(event.code, event);
    }
  }
  return Array.from(byCode.values());
}

// ── Tenant abbreviation ──────────────────────────────────────────────────────
// Three-letter mono-cased badge per the design vocabulary. Reads from the
// event's accountName (display string) since the SourcingEventSummary doesn't
// carry the canonical client_key. Keep this resilient — unknown tenants get a
// short uppercase fallback rather than throwing.

export function tenantAbbreviationForAccount(accountName: string): string {
  const normalized = (accountName ?? '').trim().toLowerCase();
  if (!normalized) return 'TEN';
  if (normalized.includes('apex')) return 'APEX';
  if (normalized.includes('meridian')) return 'MER';
  if (normalized.includes('first capital') || normalized.includes('arcturus')) return 'FCF';
  if (normalized.includes('keystone')) return 'KEY';
  if (normalized.includes('northstar')) return 'NSH';
  // Fallback: take first 3 letters of first significant word.
  const firstWord = normalized.split(/\s+/).find((w) => w.length > 0) ?? '';
  return firstWord.slice(0, 4).toUpperCase() || 'TEN';
}

// ── Lifecycle / status grouping ──────────────────────────────────────────────
// The redesigned surface uses a coarser status taxonomy than the substrate's
// 9 lifecycle states. Map them to the 4 visible buckets.

export type PortfolioStatus = 'active' | 'waiting' | 'completed' | 'attention';

export function portfolioStatusOf(event: SourcingEventSummary): PortfolioStatus {
  if (event.status === 'completed' || event.status === 'archived') return 'completed';
  if (event.status === 'active' && !event.isAtRisk) return 'active';
  if (event.status.startsWith('waiting_')) return 'waiting';
  return 'attention';
}

// ── needsAttention derivation ────────────────────────────────────────────────
// Per spec §6.5: an event "needs attention" if any of:
//   - status = blocked AND aging ≥ 1 day  → in our substrate this is at_risk
//     OR a non-null blocker (the substrate has no first-class "blocked" status)
//   - status = waiting AND aging ≥ 5 days
//   - pending executive decision AND aging ≥ 3 days
//   - evidence stale flag set on a gate-eligible stage  → openAlerts ≥ 1
//   - regulatory pressure  → not represented in current substrate
//
// Substrate gaps (logged in the PR description):
//   - There is no `evidence_stale_flag` column. We treat openAlerts > 0 as the
//     proxy because alerts are the substrate's existing surfacing mechanism.
//   - There is no `regulatory_pressure_flag`. Critical severity is currently
//     limited to overdue executive decisions and AT_RISK blocks.

export function deriveAttention(event: SourcingEventSummary): AttentionDescriptor | null {
  const aging = Math.max(0, event.agingDays | 0);

  // Highest priority — overdue executive decision (≥ 5d critical, ≥ 3d standard).
  if (event.status === 'waiting_on_executive_decision' && aging >= 3) {
    const severity: AttentionSeverity = aging >= 5 ? 'critical' : 'standard';
    return {
      kind: 'awaiting_decision',
      severity,
      badgeLabel: 'Decision overdue',
      badgeDays: aging,
      diagnosis: 'Executive decision not yet recorded.',
      detail: event.nextDecision || 'Confirm the decision package and route for sign-off.',
    };
  }

  // At-risk or blocker text — treated as blocked.
  const hasBlocker = Boolean(event.blocker && event.blocker.trim().length > 0);
  if (event.isAtRisk || (hasBlocker && aging >= 1)) {
    const severity: AttentionSeverity = aging >= 5 || event.isAtRisk ? 'critical' : 'standard';
    return {
      kind: 'blocked',
      severity,
      badgeLabel: 'Blocked',
      badgeDays: aging,
      diagnosis: 'Workstream cannot advance without intervention.',
      detail: event.blocker ?? event.nextAction,
    };
  }

  // Waiting on someone for too long — stale.
  if (event.status.startsWith('waiting_') && aging >= 5) {
    const severity: AttentionSeverity = aging >= 8 ? 'critical' : 'standard';
    return {
      kind: 'stale',
      severity,
      badgeLabel: 'Stale',
      badgeDays: aging,
      diagnosis: `${event.statusLabel} for ${aging} days.`,
      detail: event.nextAction,
    };
  }

  // Open alerts — proxy for evidence stale / pricing template gaps.
  if (event.openAlerts > 0) {
    const severity: AttentionSeverity = event.openAlerts >= 3 ? 'critical' : 'standard';
    return {
      kind: 'overdue',
      severity,
      badgeLabel: 'Overdue',
      badgeDays: aging,
      diagnosis: `${event.openAlerts} open alert${event.openAlerts === 1 ? '' : 's'} on this event.`,
      detail: event.nextAction,
    };
  }

  return null;
}

export function needsAttention(event: SourcingEventSummary): boolean {
  return deriveAttention(event) !== null;
}

// ── Portfolio state determination ────────────────────────────────────────────
// Empty: 0 events after filtering. Partial: 1-9. Mature: 10+.

export function determinePortfolioState(filteredCount: number): PortfolioState {
  if (filteredCount === 0) return 'empty';
  if (filteredCount < 10) return 'partial';
  return 'mature';
}

// ── KPI computation ──────────────────────────────────────────────────────────
// Pure calculation against a pre-filtered events array.

export interface PortfolioKpis {
  total: number;
  active: number;
  waiting: number;
  completed: number;
  attentionCount: number;
  attentionTopReason: string | null;
  onTrack: number;
  valueAtStakeUsd: number;
}

export function computePortfolioKpis(events: SourcingEventSummary[]): PortfolioKpis {
  let active = 0;
  let waiting = 0;
  let completed = 0;
  let attentionCount = 0;
  let onTrack = 0;
  let valueAtStakeUsd = 0;
  let topReason: string | null = null;
  let topSeverity: AttentionSeverity | null = null;

  for (const event of events) {
    const bucket = portfolioStatusOf(event);
    if (bucket === 'active') active += 1;
    else if (bucket === 'waiting') waiting += 1;
    else if (bucket === 'completed') completed += 1;
    // 'attention' bucket is counted via the dedicated check below.

    const attention = deriveAttention(event);
    if (attention) {
      attentionCount += 1;
      // Carry forward the most severe top reason for the KPI subtitle.
      if (
        topReason === null ||
        (topSeverity !== 'critical' && attention.severity === 'critical')
      ) {
        topReason = `${attention.badgeLabel} on ${event.code}`;
        topSeverity = attention.severity;
      }
    } else if (event.status === 'active') {
      onTrack += 1;
    }

    if (event.status !== 'completed' && event.status !== 'archived') {
      valueAtStakeUsd += Math.max(0, event.valueAtStakeUsd ?? 0);
    }
  }

  return {
    total: events.length,
    active,
    waiting,
    completed,
    attentionCount,
    attentionTopReason: topReason,
    onTrack,
    valueAtStakeUsd,
  };
}

// ── Stage band grouping (mature state only) ─────────────────────────────────

export const STAGE_BANDS: Record<StageBandKey, StageBand> = {
  discovery: {
    key: 'discovery',
    rangeLabel: 'Steps 1-3',
    title: 'Discovery & Scope',
  },
  evaluation: {
    key: 'evaluation',
    rangeLabel: 'Steps 4-7',
    title: 'Evaluation & Pricing',
  },
  decision: {
    key: 'decision',
    rangeLabel: 'Steps 8-9',
    title: 'BAFO & Decision',
  },
  transition: {
    key: 'transition',
    rangeLabel: 'Steps 10-11',
    title: 'Transition & Closeout',
  },
  completed: {
    key: 'completed',
    rangeLabel: 'Awarded',
    title: 'Awarded / Completed',
  },
};

export function stageBandFor(stageKey: SourceStageKey, status: SourceLifecycleStatus): StageBandKey {
  if (status === 'completed' || status === 'archived') return 'completed';
  const canonical = (SOURCE_LEGACY_STAGE_ALIASES[stageKey] ?? stageKey) as SourceStageKey;
  const idx = SOURCE_STAGE_ORDER.indexOf(canonical);
  if (idx < 0) return 'discovery';
  if (idx <= 2) return 'discovery';
  if (idx <= 6) return 'evaluation';
  if (idx <= 8) return 'decision';
  return 'transition';
}

export function stageDisplayNumber(stageKey: SourceStageKey): string {
  const canonical = (SOURCE_LEGACY_STAGE_ALIASES[stageKey] ?? stageKey) as SourceStageKey;
  const idx = SOURCE_STAGE_ORDER.indexOf(canonical);
  if (idx < 0) return '01';
  return String(idx + 1).padStart(2, '0');
}

export function groupEventsByStageBand(
  events: SourcingEventSummary[],
): Map<StageBandKey, SourcingEventSummary[]> {
  const buckets = new Map<StageBandKey, SourcingEventSummary[]>();
  for (const band of Object.values(STAGE_BANDS)) {
    buckets.set(band.key, []);
  }
  for (const event of events) {
    const band = stageBandFor(event.currentStageKey, event.status);
    buckets.get(band)!.push(event);
  }
  return buckets;
}

// ── Aging treatment ──────────────────────────────────────────────────────────

export type AgingSeverity = 'normal' | 'warn' | 'bad';

export function agingSeverity(days: number): AgingSeverity {
  if (days >= 5) return 'bad';
  if (days >= 3) return 'warn';
  return 'normal';
}

// ── Value band classification ────────────────────────────────────────────────
// Four buckets for the sidebar value filter. Boundaries are pragmatic — they
// match the size distribution of seeded events.

export type ValueBandKey = 'under_5m' | '5_to_10m' | '10_to_25m' | 'over_25m';

export const VALUE_BANDS: Array<{ key: ValueBandKey; label: string; min: number; max: number }> = [
  { key: 'under_5m', label: '< $5M', min: 0, max: 5_000_000 },
  { key: '5_to_10m', label: '$5M – $10M', min: 5_000_000, max: 10_000_000 },
  { key: '10_to_25m', label: '$10M – $25M', min: 10_000_000, max: 25_000_000 },
  { key: 'over_25m', label: '> $25M', min: 25_000_000, max: Number.POSITIVE_INFINITY },
];

export function valueBandFor(usd: number): ValueBandKey {
  if (usd < 5_000_000) return 'under_5m';
  if (usd < 10_000_000) return '5_to_10m';
  if (usd < 25_000_000) return '10_to_25m';
  return 'over_25m';
}

// ── Sort key for attention banners ───────────────────────────────────────────
// Critical first, then more severe within the same severity by aging desc.

export function attentionEvents(events: SourcingEventSummary[]): Array<{
  event: SourcingEventSummary;
  attention: AttentionDescriptor;
}> {
  const list: Array<{ event: SourcingEventSummary; attention: AttentionDescriptor }> = [];
  for (const event of events) {
    const attention = deriveAttention(event);
    if (attention) list.push({ event, attention });
  }
  list.sort((a, b) => {
    const sevDiff =
      (b.attention.severity === 'critical' ? 1 : 0) -
      (a.attention.severity === 'critical' ? 1 : 0);
    if (sevDiff !== 0) return sevDiff;
    return b.attention.badgeDays - a.attention.badgeDays;
  });
  return list;
}
