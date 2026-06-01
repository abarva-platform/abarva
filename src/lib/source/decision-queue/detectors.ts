// Decision Queue detectors — Phase-1 (Practitioner-Fit §3.1).
//
// Pure functions over the normalized substrate. Each detector emits zero or
// more `SourceDecisionItem`s. The cardinal rule (§3.3): NO FABRICATION — a
// detector emits an item only when its grounding is real. Absent data => no
// card, never a guessed one.
//
// Phase-1 detectors (computable from existing data):
//   renewal                 — vendor_contracts term-end + date math
//   notice_window           — auto-renew clause + notice-window math
//   overlap_shelfware       — it_financials + vendor_contracts category join
//   savings_opportunity     — contract spend vs. budget/benchmark
//   blocked_missing_evidence — freshness model verdict
//
// No DB, no network, no clock — `asOf` is injected.

import { deriveGroundingVerdict } from '@/lib/context-trust/freshness-model';
import type {
  DecisionQueueInput,
  VendorContractInput,
} from './detector-inputs';
import type {
  DecisionUrgency,
  SourceDecisionItem,
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole-day count from `asOf` to a future ISO date; negative if past. */
function daysUntil(isoDate: string, asOf: Date): number | null {
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.floor((target - asOf.getTime()) / MS_PER_DAY);
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Map a day-count to an urgency band. Truthful, calendar-anchored thresholds
 * (Practitioner-Fit FIX 3) — the labels in `URGENCY_LABEL` match these exactly,
 * so a 26-day-out renewal lands in `next_45_days` ("Next 45 days"), never the
 * misleading "this week".
 *   <= 0  -> due_now       (overdue or due today)
 *   <= 14 -> next_14_days
 *   <= 45 -> next_45_days
 *   <= 90 -> next_90_days
 *   else  -> watch
 */
export function urgencyFromDays(days: number): DecisionUrgency {
  if (days <= 0) return 'due_now';
  if (days <= 14) return 'next_14_days';
  if (days <= 45) return 'next_45_days';
  if (days <= 90) return 'next_90_days';
  return 'watch';
}

/** Deep-link into the Renewal Cockpit for a contract. */
function cockpitLink(contractId: string): string {
  return `/source/renewal/${encodeURIComponent(contractId)}`;
}

// ---------------------------------------------------------------------------
// renewal — a contract term-end is approaching
// ---------------------------------------------------------------------------

/**
 * Emit a `renewal` item for every contract whose term-end falls within the
 * forward horizon. No term-end date => no card (no fabrication).
 */
export function detectRenewals(input: DecisionQueueInput): SourceDecisionItem[] {
  const surfacedAt = input.asOf.toISOString();
  const out: SourceDecisionItem[] = [];
  for (const c of input.contracts) {
    if (!c.termEndDate) continue;
    const days = daysUntil(c.termEndDate, input.asOf);
    if (days === null) continue;
    // Horizon: only the next ~9 months are decision-relevant; older or
    // far-future contracts are not surfaced as renewals.
    if (days < -30 || days > 270) continue;

    const urgency = urgencyFromDays(days);
    const window =
      days < 0
        ? `lapsed ${Math.abs(days)} days ago`
        : `in ${days} days`;
    const value = c.annualSpendUsd;
    out.push({
      itemId: `renewal:${c.contractId}`,
      clientKey: input.clientKey,
      kind: 'renewal',
      urgency,
      headline: `${c.vendorName} — ${c.product} renewal ${window}`,
      whyItMatters:
        value !== null
          ? `${formatUsd(value)}/yr of ${c.criticality}-criticality spend reaches term-end; a posture decision is needed before re-commit.`
          : `A ${c.criticality}-criticality contract reaches term-end; a posture decision is needed before re-commit.`,
      recommendedAction: 'Open the Renewal Cockpit and set the posture',
      deepLink: cockpitLink(c.contractId),
      evidenceRefs: [c.contractId, 'vendor_contracts'],
      valueAtStakeUsd: value,
      surfacedAt,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// notice_window — auto-renewal trap
// ---------------------------------------------------------------------------

/**
 * Emit a `notice_window` item when an auto-renewing contract's last date to
 * serve notice is closing. The notice deadline is `termEndDate - noticePeriod`.
 * Requires both an auto-renew flag and a known notice period — otherwise the
 * trap cannot be asserted and no card is emitted.
 */
export function detectNoticeWindows(
  input: DecisionQueueInput,
): SourceDecisionItem[] {
  const surfacedAt = input.asOf.toISOString();
  const out: SourceDecisionItem[] = [];
  for (const c of input.contracts) {
    if (!c.autoRenew) continue;
    if (c.noticePeriodDays === null || !c.termEndDate) continue;
    const daysToTermEnd = daysUntil(c.termEndDate, input.asOf);
    if (daysToTermEnd === null) continue;
    const daysToNoticeDeadline = daysToTermEnd - c.noticePeriodDays;
    // Only surface while the notice window is still actionable-soon: from
    // 90 days out down to 14 days past (a just-missed window is still worth
    // flagging so the VP knows).
    if (daysToNoticeDeadline > 90 || daysToNoticeDeadline < -14) continue;

    const urgency = urgencyFromDays(daysToNoticeDeadline);
    const value = c.annualSpendUsd;
    const window =
      daysToNoticeDeadline < 0
        ? `notice deadline passed ${Math.abs(daysToNoticeDeadline)} days ago`
        : `notice must be served within ${daysToNoticeDeadline} days`;
    out.push({
      itemId: `notice_window:${c.contractId}`,
      clientKey: input.clientKey,
      kind: 'notice_window',
      urgency,
      headline: `${c.vendorName} — ${c.product} auto-renews; ${window}`,
      whyItMatters:
        `This contract auto-renews unless notice is served ${c.noticePeriodDays} days before term-end.` +
        (value !== null
          ? ` ${formatUsd(value)}/yr re-commits silently if the window is missed.`
          : ' The commitment renews silently if the window is missed.'),
      recommendedAction:
        daysToNoticeDeadline < 0
          ? 'Open the Renewal Cockpit — confirm whether the renewal can still be unwound'
          : 'Open the Renewal Cockpit and decide before the notice deadline',
      deepLink: cockpitLink(c.contractId),
      evidenceRefs: [c.contractId, 'vendor_contracts'],
      valueAtStakeUsd: value,
      surfacedAt,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// overlap_shelfware — overlapping spend / shelfware
// ---------------------------------------------------------------------------

const SHELFWARE_UTILIZATION_CEILING = 0.55;

/**
 * Emit `overlap_shelfware` items in two grounded cases:
 *   1. Two or more active contracts cover the SAME capability category
 *      (a consolidation candidate).
 *   2. A contract's measured utilization is below the shelfware ceiling
 *      (paying for capacity nobody uses).
 * Both are grounded in real fields — no card without the data.
 */
export function detectOverlapShelfware(
  input: DecisionQueueInput,
): SourceDecisionItem[] {
  const surfacedAt = input.asOf.toISOString();
  const out: SourceDecisionItem[] = [];

  // --- Case 1: category overlap ---
  const byCategory = new Map<string, VendorContractInput[]>();
  for (const c of input.contracts) {
    const key = c.category.trim().toLowerCase();
    if (!key) continue;
    const bucket = byCategory.get(key) ?? [];
    bucket.push(c);
    byCategory.set(key, bucket);
  }
  for (const [category, group] of byCategory) {
    if (group.length < 2) continue;
    // Deterministic: anchor on the lowest contractId so the same overlap
    // always produces the same single card.
    const sorted = [...group].sort((a, b) =>
      a.contractId.localeCompare(b.contractId),
    );
    const anchor = sorted[0];
    const others = sorted.slice(1);
    const totalSpend = sorted.reduce(
      (s, c) => s + (c.annualSpendUsd ?? 0),
      0,
    );
    out.push({
      itemId: `overlap_shelfware:category:${category}`,
      clientKey: input.clientKey,
      kind: 'overlap_shelfware',
      urgency: 'next_90_days',
      headline: `${sorted.length} contracts cover overlapping ${category} capability`,
      whyItMatters:
        `${sorted.map((c) => c.vendorName).join(', ')} all fund ${category} capability` +
        (totalSpend > 0
          ? ` — ${formatUsd(totalSpend)}/yr combined. Consolidation may remove a redundant contract.`
          : ' — a consolidation review may remove a redundant contract.'),
      recommendedAction: 'Open the Renewal Cockpit to assess consolidation',
      deepLink: cockpitLink(anchor.contractId),
      evidenceRefs: [
        ...sorted.map((c) => c.contractId),
        'vendor_contracts',
        'it_financials',
      ],
      valueAtStakeUsd: totalSpend > 0 ? totalSpend : null,
      // Stash the other contract ids in evidenceRefs above; consumers can
      // resolve them. `others` referenced to keep intent explicit.
      surfacedAt,
    });
    void others;
  }

  // --- Case 2: low-utilization shelfware ---
  for (const c of input.contracts) {
    if (c.utilizationRate === null) continue;
    if (c.utilizationRate >= SHELFWARE_UTILIZATION_CEILING) continue;
    const value = c.annualSpendUsd;
    const wastedAnnual =
      value !== null ? value * (1 - c.utilizationRate) : null;
    const pct = Math.round(c.utilizationRate * 100);
    out.push({
      itemId: `overlap_shelfware:shelfware:${c.contractId}`,
      clientKey: input.clientKey,
      kind: 'overlap_shelfware',
      urgency: 'next_90_days',
      headline: `${c.vendorName} — ${c.product} is ${pct}% utilized`,
      whyItMatters:
        `Measured utilization is ${pct}% of entitlement.` +
        (wastedAnnual !== null
          ? ` Roughly ${formatUsd(wastedAnnual)}/yr funds unused capacity — a downsize or right-size candidate.`
          : ' A downsize or right-size review is warranted.'),
      recommendedAction: 'Open the Renewal Cockpit to right-size the contract',
      deepLink: cockpitLink(c.contractId),
      evidenceRefs: [c.contractId, 'vendor_contracts'],
      valueAtStakeUsd: wastedAnnual,
      surfacedAt,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// savings_opportunity — spend materially above a defensible benchmark
// ---------------------------------------------------------------------------

const SAVINGS_THRESHOLD_RATIO = 0.15;

/**
 * Emit a `savings_opportunity` item when a contract's annual spend exceeds a
 * defensible benchmark by more than the threshold. The benchmark is taken
 * from the matching `it_financials` line — no benchmark, no card.
 */
export function detectSavingsOpportunities(
  input: DecisionQueueInput,
): SourceDecisionItem[] {
  const surfacedAt = input.asOf.toISOString();
  const out: SourceDecisionItem[] = [];
  const benchmarkByCategory = new Map<string, number>();
  for (const f of input.financials) {
    const key = f.category.trim().toLowerCase();
    if (!key) continue;
    const bench = f.benchmarkUsd;
    if (bench === null || bench <= 0) continue;
    // Keep the lowest benchmark per category — the most demanding target.
    const existing = benchmarkByCategory.get(key);
    if (existing === undefined || bench < existing) {
      benchmarkByCategory.set(key, bench);
    }
  }
  for (const c of input.contracts) {
    if (c.annualSpendUsd === null || c.annualSpendUsd <= 0) continue;
    const benchmark = benchmarkByCategory.get(
      c.category.trim().toLowerCase(),
    );
    if (benchmark === undefined) continue;
    const overspend = c.annualSpendUsd - benchmark;
    if (overspend <= benchmark * SAVINGS_THRESHOLD_RATIO) continue;
    const pct = Math.round((overspend / benchmark) * 100);
    out.push({
      itemId: `savings_opportunity:${c.contractId}`,
      clientKey: input.clientKey,
      kind: 'savings_opportunity',
      urgency: 'next_90_days',
      headline: `${c.vendorName} — ${c.product} runs ${pct}% above benchmark`,
      whyItMatters:
        `Annual spend of ${formatUsd(c.annualSpendUsd)} exceeds the ${formatUsd(benchmark)} ` +
        `category benchmark by ${formatUsd(overspend)}/yr — a should-cost-anchored renegotiation target.`,
      recommendedAction:
        'Open the Renewal Cockpit and anchor renegotiation on should-cost',
      deepLink: cockpitLink(c.contractId),
      evidenceRefs: [c.contractId, 'vendor_contracts', 'it_financials'],
      valueAtStakeUsd: overspend,
      surfacedAt,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// blocked_missing_evidence — a decision is blocked on stale/missing context
// ---------------------------------------------------------------------------

/**
 * Emit a single `blocked_missing_evidence` item when the freshness model says
 * the substrate backing renewal decisions is stale or missing. This is the
 * honest "we cannot ground this" flag — the VP should not be blindsided by a
 * silent gap.
 */
export function detectBlockedEvidence(
  input: DecisionQueueInput,
): SourceDecisionItem[] {
  if (input.segmentFreshness.length === 0) return [];
  const verdict = deriveGroundingVerdict(
    input.segmentFreshness.map((s) => ({
      segment: s.segment,
      lastUpdated: s.lastUpdated,
      sourceType: s.sourceType,
    })),
    input.asOf,
  );
  // Only block when grounding is materially weak.
  if (verdict.confidence === 'high') return [];

  const weak = [...verdict.staleSegments, ...verdict.missingSegments];
  if (weak.length === 0) return [];

  const surfacedAt = input.asOf.toISOString();
  return [
    {
      itemId: 'blocked_missing_evidence:vendor_contracts',
      clientKey: input.clientKey,
      kind: 'blocked_missing_evidence',
      urgency: verdict.confidence === 'insufficient' ? 'next_14_days' : 'next_45_days',
      headline: `Renewal decisions are weakly grounded — ${weak.join(', ')} need a refresh`,
      whyItMatters: verdict.summary,
      recommendedAction:
        'Open a renewal intake and assign the missing evidence refresh before acting',
      deepLink: '/source/new?intent=renewal',
      evidenceRefs: weak,
      valueAtStakeUsd: null,
      surfacedAt,
    },
  ];
}

/** Run every Phase-1 detector and return the concatenated, unsorted items. */
export function runAllDetectors(
  input: DecisionQueueInput,
): SourceDecisionItem[] {
  return [
    ...detectRenewals(input),
    ...detectNoticeWindows(input),
    ...detectOverlapShelfware(input),
    ...detectSavingsOpportunities(input),
    ...detectBlockedEvidence(input),
  ];
}
