// TOWER · T-5 (Bind 1) — Tower CFO band metrics view-model.
//
// Computes the five dashboard band tiles from the AI Initiatives substrate
// (initiatives + vendors). Replaces the hardcoded Apex Retail demo values
// (2.8×, 7, $8.4M, 4, 53%) with tenant-aware aggregations.
//
// Per the AI Initiatives Substrate Package v1.1.0 Load Path Manifest:
//   - Portfolio ROI    = sum(measured_value_usd) / sum(committed_annual_usd)
//   - Active pressures = count of initiatives in pressure-bearing status flags
//   - Spend at risk    = sum(committed_annual_usd) over those pressure rows
//   - Renewals · 90d   = count of vendors with renewal_date within 90d
//   - Adoption rate    = % of non-foundation initiatives in 'scaled' stage
//                        (proxy until per-tool MAU integrations land;
//                         the ⓘ panel surfaces this caveat)
//
// Pure deterministic helper. No DB, no model calls, no Date.now (callers
// supply `todayIso`). Same input → identical output.

import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * T-8 (Bind 4): the four CFO lenses. Driven by `?lens=<key>` URL param.
 * Default = 'value'.
 */
export type TowerLens = 'value' | 'risk' | 'contract' | 'adopt';

export type BandMetricKey =
  | 'portfolio_roi'
  | 'active_pressures'
  | 'spend_at_risk'
  | 'renewals_90d'
  | 'adoption_rate';

export type BandConfidence = 'high' | 'med' | 'low' | 'none';

export interface BandMetric {
  key: BandMetricKey;
  label: string;
  /** True for the first/lead tile (rendered in the larger hero font). */
  hero: boolean;
  /** Formatted value (e.g. "2.8×", "$8.4M", "53%", "—"). */
  value: string;
  /** Plain text subtext shown directly below the value. */
  subtext: string;
  /** Confidence indicator. 'none' means no substrate; render with low-emphasis. */
  confidence: BandConfidence;
  /** Tooltip text describing the underlying calculation + caveats. */
  tooltip: string;
}

export interface TowerBandMetricsView {
  metrics: ReadonlyArray<BandMetric>;
  /** True when initiatives is empty — values are "—" placeholders. */
  isEmpty: boolean;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Status flags that constitute "active pressure" on the portfolio. */
const PRESSURE_FLAGS = new Set([
  'cost_overrun',
  'value_lag',
  'stalled',
  'duplication_risk',
  'adoption_gap',
]);

const RENEWALS_WINDOW_DAYS = 90;
const PORTFOLIO_TARGET_ROI = 3.5;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatUsdCompact(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  if (usd === 0) return '$0';
  return `$${usd.toFixed(0)}`;
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

/** Pick a confidence level from the share of initiatives that have a measured value. */
function deriveConfidenceFromCoverage(
  numerator: number,
  denominator: number,
): BandConfidence {
  if (denominator === 0) return 'none';
  const coverage = numerator / denominator;
  if (coverage >= 0.5) return 'high';
  if (coverage >= 0.25) return 'med';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * T-8: which band tile leads (renders in `hero` font) per lens. The other
 * four tiles render in normal weight. Lens changes which decision posture
 * the CFO is reading first; tile content is the same across lenses.
 */
const HERO_BY_LENS: Record<TowerLens, BandMetricKey> = {
  value: 'portfolio_roi',
  risk: 'spend_at_risk',
  contract: 'renewals_90d',
  adopt: 'adoption_rate',
};

/**
 * Build the Tower CFO band metrics view from substrate inputs.
 * Returns deterministic placeholders ("—") when no substrate is available.
 *
 * `lens` controls which tile renders as the hero (lead) tile. Defaults to
 * 'value' which makes Portfolio ROI the hero (matches pre-T-8 behaviour).
 */
export function buildTowerBandMetrics(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
  lens: TowerLens = 'value',
): TowerBandMetricsView {
  const isEmpty = initiatives.length === 0;
  if (isEmpty) {
    return {
      metrics: applyHero(emptyPlaceholders(), HERO_BY_LENS[lens]),
      isEmpty: true,
      deterministicSeed: true,
    };
  }

  const portfolioRoi = computePortfolioRoi(initiatives);
  const activePressures = computeActivePressures(initiatives);
  const spendAtRisk = computeSpendAtRisk(initiatives);
  const renewals = computeRenewals(vendors, todayIso);
  const adoption = computeAdoption(initiatives);

  const all: BandMetric[] = [
    portfolioRoi,
    activePressures,
    spendAtRisk,
    renewals,
    adoption,
  ];

  return {
    metrics: applyHero(all, HERO_BY_LENS[lens]),
    isEmpty: false,
    deterministicSeed: true,
  };
}

/**
 * Apply the lens-driven hero swap: set `hero=true` on the lens-leading tile,
 * `hero=false` on the rest. Reorders so the hero tile is first.
 */
function applyHero(
  metrics: ReadonlyArray<BandMetric>,
  heroKey: BandMetricKey,
): ReadonlyArray<BandMetric> {
  const updated = metrics.map((m) => ({ ...m, hero: m.key === heroKey }));
  const heroIndex = updated.findIndex((m) => m.key === heroKey);
  if (heroIndex <= 0) return updated;
  return [updated[heroIndex]!, ...updated.slice(0, heroIndex), ...updated.slice(heroIndex + 1)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-metric computations
// ─────────────────────────────────────────────────────────────────────────────

function computePortfolioRoi(initiatives: ReadonlyArray<AIInitiative>): BandMetric {
  let totalCommitted = 0;
  let totalMeasured = 0;
  let measuredCount = 0;

  for (const i of initiatives) {
    if (i.committedAnnualUsd && i.committedAnnualUsd > 0) {
      totalCommitted += i.committedAnnualUsd;
    }
    if (i.measuredValueUsd !== null) {
      totalMeasured += Math.max(i.measuredValueUsd, 0);
      if (i.measuredValueUsd > 0) measuredCount += 1;
    }
  }

  const ratio = totalCommitted > 0 ? totalMeasured / totalCommitted : 0;
  const value = totalCommitted > 0 ? `${ratio.toFixed(1)}×` : '—';
  const confidence: BandConfidence =
    totalCommitted === 0
      ? 'none'
      : deriveConfidenceFromCoverage(measuredCount, initiatives.length);

  const gap = ratio - PORTFOLIO_TARGET_ROI;
  const subtext =
    totalCommitted === 0
      ? 'no committed spend'
      : gap >= 0
        ? `target ${PORTFOLIO_TARGET_ROI}× · ▲${gap.toFixed(1)}× over`
        : `target ${PORTFOLIO_TARGET_ROI}× · ▼${Math.abs(gap).toFixed(1)}× under`;

  const tooltip =
    totalCommitted > 0
      ? `Sum of measured value (${formatUsdCompact(totalMeasured)}) ÷ sum of committed annual (${formatUsdCompact(totalCommitted)}) across ${initiatives.length} initiative${initiatives.length === 1 ? '' : 's'}. ${measuredCount} of ${initiatives.length} have measured values loaded.`
      : 'No committed annual spend loaded for this tenant. Surface ROI once initiatives carry committed_annual_usd.';

  return {
    key: 'portfolio_roi',
    label: 'Portfolio ROI · 12-month rolling',
    hero: true,
    value,
    subtext,
    confidence,
    tooltip,
  };
}

function computeActivePressures(initiatives: ReadonlyArray<AIInitiative>): BandMetric {
  const pressuring = initiatives.filter((i) => PRESSURE_FLAGS.has(i.statusFlag));
  const high = pressuring.filter((i) => i.confidenceLevel === 'HIGH').length;
  const watch = pressuring.length - high;

  const value = `${pressuring.length}`;
  const subtext =
    pressuring.length === 0
      ? 'all healthy'
      : `${high} high · ${watch} watch`;

  // Confidence: high if at least one HIGH-confidence pressure; otherwise med.
  const confidence: BandConfidence =
    pressuring.length === 0 ? 'high' : high > 0 ? 'high' : 'med';

  const flagBreakdown = breakdownByFlag(pressuring);
  const tooltip =
    pressuring.length === 0
      ? `All ${initiatives.length} initiatives are healthy or in foundation phase. No active pressures.`
      : `${pressuring.length} initiatives in pressure-bearing status flags: ${flagBreakdown}. Pressure flags = cost_overrun, value_lag, stalled, duplication_risk, adoption_gap.`;

  return {
    key: 'active_pressures',
    label: 'Active pressures',
    hero: false,
    value,
    subtext,
    confidence,
    tooltip,
  };
}

function computeSpendAtRisk(initiatives: ReadonlyArray<AIInitiative>): BandMetric {
  const pressuring = initiatives.filter((i) => PRESSURE_FLAGS.has(i.statusFlag));
  const totalAtRisk = pressuring.reduce(
    (sum, i) => sum + (i.committedAnnualUsd ?? 0),
    0,
  );
  const value = pressuring.length > 0 ? formatUsdCompact(totalAtRisk) : '$0';

  const subtext =
    pressuring.length === 0
      ? 'no risk'
      : `${pressuring.length} initiative${pressuring.length === 1 ? '' : 's'}`;

  // Confidence: based on the fraction of pressuring initiatives that have a
  // committed_annual_usd loaded (so the sum is grounded).
  const withCommitted = pressuring.filter(
    (i) => i.committedAnnualUsd !== null && i.committedAnnualUsd > 0,
  ).length;
  const confidence: BandConfidence =
    pressuring.length === 0
      ? 'high'
      : deriveConfidenceFromCoverage(withCommitted, pressuring.length);

  const tooltip =
    pressuring.length === 0
      ? 'No initiatives in pressure-bearing status flags. Spend at risk is $0.'
      : `Sum of committed_annual_usd over ${pressuring.length} initiatives in pressure-bearing status flags: ${pressuring.map((i) => i.displayId).join(', ')}.`;

  return {
    key: 'spend_at_risk',
    label: 'Spend at risk',
    hero: false,
    value,
    subtext,
    confidence,
    tooltip,
  };
}

function computeRenewals(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
): BandMetric {
  const inWindow = vendors.filter(
    (v) =>
      v.renewalDate !== null &&
      daysUntil(v.renewalDate, todayIso) >= 0 &&
      daysUntil(v.renewalDate, todayIso) <= RENEWALS_WINDOW_DAYS,
  );

  // Find the soonest renewal for the subtext call-out.
  const soonest = inWindow
    .slice()
    .sort((a, b) => {
      const da = daysUntil(a.renewalDate ?? '', todayIso);
      const db = daysUntil(b.renewalDate ?? '', todayIso);
      return da - db;
    })[0];
  const totalContractValue = inWindow.reduce(
    (sum, v) => sum + (v.contractValueUsd ?? 0),
    0,
  );

  const value = `${inWindow.length}`;
  const subtext =
    inWindow.length === 0
      ? 'none in 90d'
      : soonest
        ? `${soonest.initiativeDisplayId} ${daysUntil(soonest.renewalDate ?? '', todayIso)}d · ${formatUsdCompact(totalContractValue)}`
        : `${formatUsdCompact(totalContractValue)} total`;

  const confidence: BandConfidence =
    vendors.length === 0
      ? 'none'
      : inWindow.length === 0
        ? 'high'
        : 'high';

  const tooltip =
    vendors.length === 0
      ? 'No vendors loaded for this tenant. Renewals counter requires vendor records with renewal_date.'
      : inWindow.length === 0
        ? `${vendors.length} vendors loaded; none have renewal_date within the next ${RENEWALS_WINDOW_DAYS} days from ${todayIso}.`
        : `${inWindow.length} vendor renewal${inWindow.length === 1 ? '' : 's'} within ${RENEWALS_WINDOW_DAYS} days of ${todayIso}: ${inWindow.map((v) => `${v.vendorName} (${v.initiativeDisplayId}, ${daysUntil(v.renewalDate ?? '', todayIso)}d)`).join('; ')}.`;

  return {
    key: 'renewals_90d',
    label: 'Renewals · 90d',
    hero: false,
    value,
    subtext,
    confidence,
    tooltip,
  };
}

function computeAdoption(initiatives: ReadonlyArray<AIInitiative>): BandMetric {
  // Adoption proxy until per-tool MAU integrations land:
  //   numerator   = initiatives in 'scaled' stage (production rollout)
  //   denominator = non-foundation initiatives (i.e., excludes pure groundwork)
  const eligible = initiatives.filter(
    (i) => i.statusFlag !== 'foundation_phase' && i.stage !== 'multi_year_strategic_bet',
  );
  const scaled = eligible.filter((i) => i.stage === 'scaled');
  const pct = eligible.length > 0 ? Math.round((scaled.length * 100) / eligible.length) : 0;

  const value = eligible.length > 0 ? `${pct}%` : '—';
  const subtext =
    eligible.length === 0
      ? 'foundation only'
      : `${scaled.length} of ${eligible.length} scaled`;

  const confidence: BandConfidence = eligible.length === 0 ? 'none' : 'low';

  const tooltip =
    eligible.length === 0
      ? 'No initiatives outside foundation phase. Adoption rate undefined.'
      : `Proxy metric: ${scaled.length} of ${eligible.length} non-foundation initiatives are in 'scaled' stage. Confidence is LOW because real adoption requires per-tool MAU + licensed_users integration (M365 Graph, Cursor admin, ServiceNow Performance Analytics).`;

  return {
    key: 'adoption_rate',
    label: 'Adoption',
    hero: false,
    value,
    subtext,
    confidence,
    tooltip,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty / fallback
// ─────────────────────────────────────────────────────────────────────────────

function emptyPlaceholders(): ReadonlyArray<BandMetric> {
  const stub = (
    key: BandMetricKey,
    label: string,
    hero: boolean,
  ): BandMetric => ({
    key,
    label,
    hero,
    value: '—',
    subtext: 'no substrate',
    confidence: 'none',
    tooltip:
      'No initiatives loaded for this tenant. Load via Setup → AI Initiatives.',
  });
  return [
    stub('portfolio_roi', 'Portfolio ROI · 12-month rolling', true),
    stub('active_pressures', 'Active pressures', false),
    stub('spend_at_risk', 'Spend at risk', false),
    stub('renewals_90d', 'Renewals · 90d', false),
    stub('adoption_rate', 'Adoption', false),
  ];
}

function breakdownByFlag(initiatives: ReadonlyArray<AIInitiative>): string {
  const counts = new Map<string, number>();
  for (const i of initiatives) {
    counts.set(i.statusFlag, (counts.get(i.statusFlag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([flag, n]) => `${n} ${flag.replace(/_/g, ' ')}`)
    .join(', ');
}
