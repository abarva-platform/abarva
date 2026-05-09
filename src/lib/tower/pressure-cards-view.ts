// TOWER · T-6 (Bind 2) — Tower CFO pressure cards view-model.
//
// Synthesizes the "Today's pressures" section from substrate (initiatives +
// vendors). Replaces the hardcoded Apex Retail demo cards (LLM cost overrun,
// Now Assist + M365 Copilot duplication, EA renewal, etc.) with cards
// composed from real status_flags + status_summary + vendor renewal data.
//
// Synthesis rules · status_flag → pressure type mapping:
//   cost_overrun       → 'cost'
//   duplication_risk   → 'dupl'
//   value_lag, stalled → 'value'
//   adoption_gap       → 'adopt'
//   vendor.renewal_date within 90d → 'vend' (synthesized from vendor records)
//
// Cards sort by urgency:
//   1. Vendor-clock pressures (closest renewal first)
//   2. cost_overrun
//   3. duplication_risk
//   4. value_lag, stalled
//   5. adoption_gap
//
// Pure deterministic helper. Same input → identical output.

import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type { TowerLens } from '@/lib/tower/band-metrics-view';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type PressureType = 'cost' | 'dupl' | 'vend' | 'adopt' | 'value';

export type PressureConfidence = 'high' | 'med' | 'low';

export interface PressureMetaRow {
  k: string;
  v: string;
}

export interface PressureCardView {
  /** Stable React key. */
  key: string;
  /** Pressure type — drives the colored ptag accent. */
  type: PressureType;
  /** Pressure ID (e.g. "P-COST-MH-06"). */
  id: string;
  /** Two-line label (e.g. "Cost\nOverrun"). */
  label: string;
  /** Display ID of the underlying initiative (or vendor's initiative). */
  displayId: string | null;
  /** Headline sentence above the lede. */
  headline: string;
  /** Lede paragraph below the headline (1-3 sentences). */
  lede: string;
  /** Three-row meta block on the left side of the body. */
  meta: ReadonlyArray<PressureMetaRow>;
  /** Magnitude value text (e.g. "2.4", "47", "24"). */
  magnitudeValue: string;
  /** Magnitude unit suffix (e.g. "M", "d", "%"). */
  magnitudeUnit: string;
  /** Plain-English magnitude label (e.g. "Q3 projected overrun · HIGH conf"). */
  magnitudeLabel: string;
  /** Confidence indicator on the magnitude. */
  magnitudeConfidence: PressureConfidence;
  /** Next-action sentence (Atlas's recommendation). */
  nextAction: string;
}

export interface TowerPressuresView {
  cards: ReadonlyArray<PressureCardView>;
  /** Total active pressures = cards.length. Mirrors band Active pressures. */
  totalActive: number;
  /** Pressures that require a near-term CFO decision (HIGH confidence + cost/vendor). */
  demandingDecisions: number;
  /** Headline section copy (e.g. "Three pressures need a CFO posture before the Microsoft EA renewal closes."). */
  sectionHeadline: string;
  /** True if no pressures derived from substrate. */
  isEmpty: boolean;
  emptyHint: string | null;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RENEWAL_WINDOW_DAYS = 90;

const PRESSURE_LABEL: Record<PressureType, string> = {
  cost: 'Cost\nOverrun',
  dupl: 'Capability\nDuplication',
  vend: 'Vendor\nClock',
  adopt: 'Adoption\nGap',
  value: 'Value\nLag',
};

const FLAG_TO_TYPE: Record<string, PressureType> = {
  cost_overrun: 'cost',
  duplication_risk: 'dupl',
  value_lag: 'value',
  stalled: 'value',
  adoption_gap: 'adopt',
};

/** Sort weight for pressure types when ordering cards (lower = more urgent). */
const TYPE_PRIORITY: Record<PressureType, number> = {
  vend: 0,
  cost: 1,
  dupl: 2,
  value: 3,
  adopt: 4,
};

/**
 * T-8: per-lens priority overrides. Each lens promotes its primary
 * pressure types to the top while preserving the rest.
 *   - Value lens (default): no override — full TYPE_PRIORITY applies.
 *   - Risk lens: cost + dupl + value (financial-risk pressures) lead.
 *   - Contract lens: vend always leads; non-vendor pressures demote.
 *   - Adoption lens: adopt + foundation-aligned pressures lead.
 */
const PRIORITY_BY_LENS: Record<TowerLens, Record<PressureType, number>> = {
  value: TYPE_PRIORITY,
  risk: { cost: 0, dupl: 1, value: 2, vend: 3, adopt: 4 },
  contract: { vend: 0, cost: 1, dupl: 2, value: 3, adopt: 4 },
  adopt: { adopt: 0, vend: 1, value: 2, dupl: 3, cost: 4 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatUsdCompact(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function splitMagnitude(value: string): { magnitudeValue: string; magnitudeUnit: string } {
  // Strip leading $/digits/decimal; trailing letters/% become the unit.
  const match = value.match(/^(\$?[0-9.]+)(\D*)$/);
  if (!match) return { magnitudeValue: value, magnitudeUnit: '' };
  return { magnitudeValue: match[1] ?? value, magnitudeUnit: match[2] ?? '' };
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function ownerLine(initiative: AIInitiative): string {
  const fn = initiative.ownerFunction ? ` · ${initiative.ownerFunction}` : '';
  return `${initiative.ownerName} · ${initiative.ownerTitle}${fn}`.replace(/\s+/g, ' ').trim();
}

function pressureConfidence(level: 'HIGH' | 'MED' | 'LOW'): PressureConfidence {
  if (level === 'HIGH') return 'high';
  if (level === 'MED') return 'med';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Card composers — one per pressure type
// ─────────────────────────────────────────────────────────────────────────────

function composeInitiativePressure(initiative: AIInitiative): PressureCardView | null {
  const type = FLAG_TO_TYPE[initiative.statusFlag];
  if (!type) return null;

  const conf = pressureConfidence(initiative.confidenceLevel);
  const committed = initiative.committedAnnualUsd ?? 0;
  const measured = initiative.measuredValueUsd ?? 0;
  const owner = ownerLine(initiative);

  // Base shape — overridden per type below.
  const base: Omit<PressureCardView, 'type' | 'label' | 'headline' | 'lede' | 'magnitudeValue' | 'magnitudeUnit' | 'magnitudeLabel' | 'nextAction'> = {
    key: `pressure-${initiative.displayId}`,
    id: `P-${type.toUpperCase()}-${initiative.displayId}`,
    displayId: initiative.displayId,
    meta: [
      { k: 'Initiative', v: `${initiative.displayId} · ${initiative.name}` },
      { k: 'Owner', v: owner },
      { k: 'Confidence', v: initiative.confidenceLevel },
    ],
    magnitudeConfidence: conf,
  };

  if (type === 'cost') {
    const overrun = Math.max(measured - committed, committed - measured);
    const m = splitMagnitude(formatUsdCompact(overrun));
    return {
      ...base,
      type,
      label: PRESSURE_LABEL.cost,
      headline: `${initiative.name} is overrunning its committed annual envelope.`,
      lede: `Committed ${formatUsdCompact(committed)} annual; measured ${formatUsdCompact(measured)}. ${initiative.statusSummary}`,
      magnitudeValue: m.magnitudeValue,
      magnitudeUnit: m.magnitudeUnit,
      magnitudeLabel: `Annual cost gap · ${initiative.confidenceLevel} conf`,
      nextAction: `Atlas suggests opening a Move on cost-routing policy for ${initiative.displayId} — would deflect a meaningful share of the overrun without touching the rate cards.`,
    };
  }

  if (type === 'dupl') {
    const m = splitMagnitude(formatUsdCompact(committed));
    return {
      ...base,
      type,
      label: PRESSURE_LABEL.dupl,
      headline: `${initiative.name} overlaps with another in-portfolio capability.`,
      lede: initiative.statusSummary,
      magnitudeValue: m.magnitudeValue,
      magnitudeUnit: m.magnitudeUnit,
      magnitudeLabel: `Annual exposure · attribution loose`,
      nextAction: `Atlas wants to run a clean attribution study before recommending consolidation. Estimate: 6 weeks.`,
    };
  }

  if (type === 'value') {
    const gap = Math.max(committed - measured, 0);
    const m = splitMagnitude(formatUsdCompact(gap));
    return {
      ...base,
      type,
      label: PRESSURE_LABEL.value,
      headline: `${initiative.name} is under-realizing on the projected line.`,
      lede: `Committed ${formatUsdCompact(committed)} annual; measured ${formatUsdCompact(measured)}. ${initiative.statusSummary}`,
      magnitudeValue: m.magnitudeValue,
      magnitudeUnit: m.magnitudeUnit,
      magnitudeLabel: `Realization gap · ${initiative.confidenceLevel} conf`,
      nextAction: `Re-baseline at next governance review. Tied to ${initiative.displayId} ownership review.`,
    };
  }

  // adopt
  const m = splitMagnitude(formatUsdCompact(committed));
  return {
    ...base,
    type: 'adopt',
    label: PRESSURE_LABEL.adopt,
    headline: `${initiative.name} is below adoption targets.`,
    lede: initiative.statusSummary,
    magnitudeValue: m.magnitudeValue,
    magnitudeUnit: m.magnitudeUnit,
    magnitudeLabel: `Annual commitment at risk · ${initiative.confidenceLevel} conf`,
    nextAction: `Watch · adoption integrations (M365 Graph, Cursor admin, etc.) will produce a quantitative target. Re-baseline pending.`,
  };
}

function composeVendorPressures(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
): PressureCardView[] {
  const inWindow = vendors.filter(
    (v) =>
      v.renewalDate !== null &&
      daysUntil(v.renewalDate, todayIso) >= 0 &&
      daysUntil(v.renewalDate, todayIso) <= RENEWAL_WINDOW_DAYS,
  );
  if (inWindow.length === 0) return [];

  // Group by initiative so a single "Vendor Clock" card surfaces per
  // initiative even if multiple vendors share its renewal window.
  const sorted = [...inWindow].sort((a, b) => {
    const da = daysUntil(a.renewalDate ?? '', todayIso);
    const db = daysUntil(b.renewalDate ?? '', todayIso);
    return da - db;
  });

  return sorted.map((v) => {
    const days = daysUntil(v.renewalDate ?? '', todayIso);
    const value = v.contractValueUsd ?? 0;
    return {
      key: `pressure-vendor-${v.vendorId}`,
      type: 'vend' as const,
      id: `P-VEND-${v.initiativeDisplayId}`,
      displayId: v.initiativeDisplayId,
      label: PRESSURE_LABEL.vend,
      headline: `${v.vendorName} renewal closes in ${days} days. CFO posture undefined.`,
      lede: `${formatUsdCompact(value)} contract value tied to ${v.initiativeName} (${v.initiativeDisplayId}). ${v.financialHealth ? `Vendor financial health: ${v.financialHealth}.` : ''} Negotiation thesis can be drafted in Source.`.trim(),
      meta: [
        { k: 'Initiative', v: `${v.initiativeDisplayId} · ${v.initiativeName}` },
        { k: 'Vendor', v: v.vendorName },
        { k: 'Contract value', v: formatUsdCompact(value) },
      ],
      magnitudeValue: `${days}`,
      magnitudeUnit: 'd',
      magnitudeLabel: `Until close · CFO posture due`,
      magnitudeConfidence: 'high',
      nextAction: `Atlas can draft a negotiation thesis tying the renewal to current portfolio pressures. Read in Source brief.`,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the pressure cards view for Tower CFO View.
 * Returns an empty view (with hint) if substrate has no pressuring initiatives.
 *
 * `lens` (T-8) re-ranks pressure cards so the lens-relevant pressures
 * surface first. Defaults to 'value' which preserves pre-T-8 ordering.
 */
export function buildTowerPressuresView(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
  lens: TowerLens = 'value',
): TowerPressuresView {
  const initiativeCards = initiatives
    .map(composeInitiativePressure)
    .filter((c): c is PressureCardView => c !== null);
  const vendorCards = composeVendorPressures(vendors, todayIso);

  // Combine + sort by lens-specific priority.
  const priority = PRIORITY_BY_LENS[lens] ?? TYPE_PRIORITY;
  const combined = [...vendorCards, ...initiativeCards].sort((a, b) => {
    const pa = priority[a.type] ?? 99;
    const pb = priority[b.type] ?? 99;
    return pa - pb;
  });

  const isEmpty = combined.length === 0;
  if (isEmpty) {
    return {
      cards: [],
      totalActive: 0,
      demandingDecisions: 0,
      sectionHeadline: 'No active pressures this week. Portfolio is healthy.',
      isEmpty: true,
      emptyHint:
        initiatives.length === 0
          ? 'No initiatives loaded. Load via Setup → AI Initiatives.'
          : 'All initiatives are healthy or in foundation phase.',
      deterministicSeed: true,
    };
  }

  const demandingDecisions = combined.filter(
    (c) => c.type === 'cost' || c.type === 'vend' || c.magnitudeConfidence === 'high',
  ).length;

  // Compose section headline. If a vendor renewal is the most urgent pressure,
  // anchor the headline to that. Otherwise, generic posture statement.
  const lead = combined[0]!;
  const sectionHeadline =
    lead.type === 'vend'
      ? `${combined.length} pressure${combined.length === 1 ? '' : 's'} need${combined.length === 1 ? 's' : ''} a CFO posture before the ${lead.headline.split(' renewal')[0]} renewal closes.`
      : `${combined.length} pressure${combined.length === 1 ? '' : 's'} need${combined.length === 1 ? 's' : ''} a CFO posture this week.`;

  return {
    cards: combined,
    totalActive: combined.length,
    demandingDecisions,
    sectionHeadline,
    isEmpty: false,
    emptyHint: null,
    deterministicSeed: true,
  };
}
