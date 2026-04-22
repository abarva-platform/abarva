// Fix Spec v4 §2 + §3 · PatternImpactViz data for demo-critical patterns.
// Keyed by patternKey · the viz component reads from this module to
// preserve separation between UI (PatternImpactViz.tsx) and content
// (author-editable without touching the render).

export type ImpactCompositionLayer = {
  label: string;
  rangeLow: number;
  rangeHigh: number;
  unit: string;
  // Teal shade ramp · maps to Recharts fill. Descending lightness as
  // layers stack upward in the chart.
  color: string;
};

export type ImpactTimeline = {
  monthsOut: number[];
  severityCurve: number[];
  // Optional reference baseline (when the unit is an indexed cost scale).
  baseline?: number;
  annotation: {
    monthMark: number;
    label: string;
  };
};

export type ImpactCaptionTile = {
  label: string;
  href: string;
};

export type PatternImpactData = {
  patternKey: string;
  eyebrow: string;
  title: string;
  composition: ImpactCompositionLayer[];
  timeline: ImpactTimeline;
  caption: string;
  evidenceLink: string;
  captionTiles: ImpactCaptionTile[];
};

const TEAL_500 = '#2DD4C8';
const TEAL_400 = '#5EEBE0';
const TEAL_300 = '#8FF1E8';
const TEAL_200 = '#BFF7F0';

// ─── Owned Brand Margin (retail · Apex composite · Morrison) ───────────
const OWNED_BRAND_MARGIN: PatternImpactData = {
  patternKey: 'owned-brand-margin',
  eyebrow: 'IMPACT MAGNITUDE × COMPOUNDING TIMELINE',
  title: '180 bps gap. Without intervention, ~290 bps in 18 months.',
  composition: [
    { label: 'Promo architecture mismatch', rangeLow: 80, rangeHigh: 100, unit: 'bps', color: TEAL_500 },
    { label: 'Sourcing pass-through failure', rangeLow: 40, rangeHigh: 60, unit: 'bps', color: TEAL_400 },
    { label: 'Mix optimization gap', rangeLow: 20, rangeHigh: 40, unit: 'bps', color: TEAL_300 },
    { label: 'Operational compounding', rangeLow: 15, rangeHigh: 25, unit: 'bps', color: TEAL_200 },
  ],
  timeline: {
    monthsOut: [0, 3, 6, 9, 12, 15, 18],
    severityCurve: [180, 205, 228, 248, 265, 280, 290],
    annotation: {
      monthMark: 6,
      label: 'Q3 2026 contracting cycle window closes',
    },
  },
  caption:
    'Composition stacks show where the 155-225 bps total gap lives, by attribution from Diagnostic Findings v4. Severity curve assumes no intervention; compounding rate reflects F018 + F015 + F022 cluster activation observed in n=14 analogous programs from Genome library.',
  evidenceLink: '/intelligence/evidence?pattern=owned-brand-margin',
  captionTiles: [
    { label: 'n=14 analogous programs', href: '/intelligence/patterns/apex_pattern_owned_brand_margin_underperformance#historical-instances' },
    { label: 'F018 + F015 + F022 cluster', href: '/intelligence/patterns/apex_pattern_owned_brand_margin_underperformance#related' },
    { label: 'Decision-gate Nov 30 2026', href: '/engagements?pattern=owned-brand-margin' },
  ],
};

// ─── Shadow AI (F008 · cross-sector · enterprise IT) ────────────────────
const SHADOW_AI: PatternImpactData = {
  patternKey: 'shadow-ai',
  eyebrow: 'IMPACT MAGNITUDE × PROLIFERATION TIMELINE',
  title: 'Cost compounds at ~15% MoM in F008-active orgs. Most surface 6-9 months after material proliferation.',
  composition: [
    { label: 'Breach risk premium', rangeLow: 40, rangeHigh: 60, unit: '% of total cost', color: TEAL_500 },
    { label: 'Productivity loss to unsanctioned tools', rangeLow: 20, rangeHigh: 30, unit: '% of total cost', color: TEAL_400 },
    { label: 'Duplicated AI spend across departments', rangeLow: 15, rangeHigh: 25, unit: '% of total cost', color: TEAL_300 },
    { label: 'Compliance exposure', rangeLow: 10, rangeHigh: 20, unit: '% of total cost', color: TEAL_200 },
  ],
  timeline: {
    monthsOut: [0, 3, 6, 9, 12, 15, 18],
    severityCurve: [100, 132, 175, 232, 308, 408, 540],
    baseline: 100,
    annotation: {
      monthMark: 6,
      label: 'Typical F008 detection lag (6-9 months from material proliferation)',
    },
  },
  caption:
    'Cost is indexed (baseline = 100 at detection moment). Composition reflects F008 cost-driver attribution from Genome library (n=23 Fortune-100 enterprise IT observations). Compounding rate ~15% MoM matches observed vendor-tool proliferation pace in F008-active orgs.',
  evidenceLink: '/intelligence/evidence?pattern=shadow-ai',
  captionTiles: [
    { label: 'n=23 Fortune-100 enterprise IT observations', href: '/intelligence/patterns/F008#historical-instances' },
    { label: 'Avg detection lag 7.4 months', href: '/intelligence/patterns/F008#detection-signature' },
    { label: 'Recommended · Sanctioned-AI catalog + procurement gate', href: '/intelligence/patterns/F008#interventions' },
  ],
};

// ─── Data-Owner Bottleneck (F015 · cross-sector · governance) ─────────
const DATA_OWNER_BOTTLENECK: PatternImpactData = {
  patternKey: 'F015',
  eyebrow: 'PROGRAM VELOCITY LOSS × CAPACITY DEBT',
  title: 'Each AI program loses ~6 weeks. With no capacity fix, portfolio velocity halves inside 12 months.',
  composition: [
    { label: 'Access-request queue wait', rangeLow: 35, rangeHigh: 50, unit: '% of velocity loss', color: TEAL_500 },
    { label: 'Shadow-copy rework + compliance', rangeLow: 20, rangeHigh: 30, unit: '% of velocity loss', color: TEAL_400 },
    { label: 'Serial program scheduling', rangeLow: 15, rangeHigh: 25, unit: '% of velocity loss', color: TEAL_300 },
    { label: 'Escalation + re-scope cycles', rangeLow: 10, rangeHigh: 20, unit: '% of velocity loss', color: TEAL_200 },
  ],
  timeline: {
    monthsOut: [0, 3, 6, 9, 12, 15, 18],
    severityCurve: [100, 118, 138, 162, 190, 222, 258],
    baseline: 100,
    annotation: {
      monthMark: 9,
      label: 'Velocity halving point (n=11 observed instances)',
    },
  },
  caption:
    'Velocity loss is indexed (baseline = 100 at first AI program launch). Composition reflects source-team attribution across n=11 enterprises in the Genome library. Compounding rate assumes no owner-team capacity expansion; fix at month 6-9 is materially cheaper than fix at month 12+.',
  evidenceLink: '/intelligence/evidence?pattern=F015',
  captionTiles: [
    { label: 'n=11 enterprises · 5 resolved', href: '/intelligence/patterns/F015#historical-instances' },
    { label: 'Fix at month 6 vs month 12 · 3× cost delta', href: '/intelligence/patterns/F015#interventions' },
    { label: 'Data-owner team capacity · the only durable fix', href: '/intelligence/patterns/F015#interventions' },
  ],
};

// ─── Co-Sponsor Pace Divergence (F022 · cross-sector · governance) ─────
const CO_SPONSOR_PACE_DIVERGENCE: PatternImpactData = {
  patternKey: 'F022',
  eyebrow: 'DECISION-CYCLE DRAG × SCOPE COMPRESSION',
  title: 'Median program slips 6 months before pattern surfaces. Scope compresses ~30% by the time tiebreaker is named.',
  composition: [
    { label: 'Joint-decision cadence gap', rangeLow: 30, rangeHigh: 45, unit: '% of pace drag', color: TEAL_500 },
    { label: 'Parked disagreements re-surfacing', rangeLow: 20, rangeHigh: 30, unit: '% of pace drag', color: TEAL_400 },
    { label: 'Optionality-heavy recommendation cycles', rangeLow: 15, rangeHigh: 25, unit: '% of pace drag', color: TEAL_300 },
    { label: 'Scope-refinement re-work', rangeLow: 10, rangeHigh: 20, unit: '% of pace drag', color: TEAL_200 },
  ],
  timeline: {
    monthsOut: [0, 3, 6, 9, 12, 15, 18],
    severityCurve: [0, 4, 10, 18, 28, 40, 55],
    annotation: {
      monthMark: 6,
      label: 'Pattern typically surfaces · charter amendment window',
    },
  },
  caption:
    'Severity measured as program-slippage weeks accumulated (0 = on-plan at launch). Composition reflects drag-source attribution across n=13 enterprises in the Genome library. Early charter intervention (month ≤2) prevents the curve; remediation at month 9+ recovers pace but not original scope.',
  evidenceLink: '/intelligence/evidence?pattern=F022',
  captionTiles: [
    { label: 'n=13 enterprises · 6 resolved', href: '/intelligence/patterns/F022#historical-instances' },
    { label: 'Named tiebreaker · 88% effectiveness', href: '/intelligence/patterns/F022#interventions' },
    { label: 'RAPID framework (Bain) · the canonical reference', href: '/intelligence/patterns/F022#evidence-base' },
  ],
};

export const PATTERN_IMPACT_DATA: Record<string, PatternImpactData> = {
  [OWNED_BRAND_MARGIN.patternKey]: OWNED_BRAND_MARGIN,
  // Apex composite uses the long slug as the primary key in PATTERN_AUGMENTATIONS.
  apex_pattern_owned_brand_margin_underperformance: OWNED_BRAND_MARGIN,
  [SHADOW_AI.patternKey]: SHADOW_AI,
  F008: SHADOW_AI,
  [DATA_OWNER_BOTTLENECK.patternKey]: DATA_OWNER_BOTTLENECK,
  f015: DATA_OWNER_BOTTLENECK,
  [CO_SPONSOR_PACE_DIVERGENCE.patternKey]: CO_SPONSOR_PACE_DIVERGENCE,
  f022: CO_SPONSOR_PACE_DIVERGENCE,
};

export function getPatternImpactData(patternKey: string): PatternImpactData | null {
  return PATTERN_IMPACT_DATA[patternKey] ?? null;
}
