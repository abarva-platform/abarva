// Pricing & negotiation intelligence — archetype-bound, evidence-grounded.
//
// These are deterministic commercial analyses, not LLM guesses. Each consumes
// GROUNDED inputs (every figure carries a citation to the evidence family it
// came from) and refuses to assert a number it cannot ground. No unsupported
// savings %, no fabricated benchmark. Outputs carry confidence derived from
// input completeness, plus the archetype's pricing traps and a time-sequenced
// negotiation plan.

import type { NegotiationLever, SourceEventArchetype } from './types';

export interface GroundedValue {
  value: number;
  /** Evidence citation, e.g. "ev:run_cost_baseline#row12". */
  citation: string;
  label?: string;
}

export type PricingConfidence = 'high' | 'medium' | 'low' | 'insufficient_evidence';

export interface AnalysisBase {
  archetypeId: string;
  confidence: PricingConfidence;
  citations: string[];
  /** Evidence families that were needed but not supplied (never silent). */
  missingInputs: string[];
  /** Archetype-specific pricing traps to watch. */
  traps: string[];
}

// ── Should-cost (AMS-style: bottom-up independent baseline) ──────────────────

export interface ShouldCostInputs {
  /** Annualized run cost components, each grounded. */
  components: GroundedValue[];
  /** Optional productivity glide-path % per year (e.g. 0.05 = 5%). */
  productivityGlidePath?: number;
}

export interface ShouldCostResult extends AnalysisBase {
  totalShouldCost: number;
  /** Year-2 should-cost after productivity glide-path, if supplied. */
  glidePathYear2?: number;
}

export function shouldCostModel(
  archetype: SourceEventArchetype,
  inputs: ShouldCostInputs,
): ShouldCostResult {
  const citations = inputs.components.map((c) => c.citation);
  const total = inputs.components.reduce((s, c) => s + c.value, 0);
  const hasInputs = inputs.components.length > 0;
  const result: ShouldCostResult = {
    archetypeId: archetype.id,
    totalShouldCost: total,
    confidence: hasInputs ? (inputs.components.length >= 3 ? 'high' : 'medium') : 'insufficient_evidence',
    citations,
    missingInputs: hasInputs ? [] : ['run_cost_baseline'],
    traps: archetype.pricingModel.traps,
  };
  if (inputs.productivityGlidePath && hasInputs) {
    result.glidePathYear2 = +(total * (1 - inputs.productivityGlidePath)).toFixed(2);
  }
  return result;
}

// ── TCO normalization (compare proposals on a common basis) ──────────────────

export interface VendorProposal {
  vendor: string;
  /** Cost lines keyed by component, each grounded. */
  lines: GroundedValue[];
  /** Components this vendor EXCLUDED (drives apples-to-apples adjustment). */
  excludedComponents?: string[];
}

export interface NormalizedVendor {
  vendor: string;
  statedTotal: number;
  /** Total after adding back excluded components present in peers. */
  normalizedTotal: number;
  excludedComponents: string[];
  citations: string[];
}

export interface TcoNormalizationResult extends AnalysisBase {
  vendors: NormalizedVendor[];
  /** Lowest normalized total. */
  bestVendor: string | null;
}

/**
 * Normalize proposals to a common cost basis. For any component a vendor
 * excluded, we add back the MEDIAN of peers that priced it (a transparent,
 * defensible adjustment) — and we record the exclusion, never hide it.
 */
export function normalizeProposals(
  archetype: SourceEventArchetype,
  proposals: VendorProposal[],
): TcoNormalizationResult {
  // peer median per component
  const byComponent: Record<string, number[]> = {};
  for (const p of proposals) {
    for (const l of p.lines) {
      (byComponent[l.label ?? l.citation] ??= []).push(l.value);
    }
  }
  const median = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  const vendors: NormalizedVendor[] = proposals.map((p) => {
    const stated = p.lines.reduce((s, l) => s + l.value, 0);
    const addBacks = (p.excludedComponents ?? [])
      .map((c) => (byComponent[c]?.length ? median(byComponent[c]) : 0))
      .reduce((s, v) => s + v, 0);
    return {
      vendor: p.vendor,
      statedTotal: +stated.toFixed(2),
      normalizedTotal: +(stated + addBacks).toFixed(2),
      excludedComponents: p.excludedComponents ?? [],
      citations: p.lines.map((l) => l.citation),
    };
  });

  const best = vendors.length
    ? vendors.reduce((a, b) => (b.normalizedTotal < a.normalizedTotal ? b : a)).vendor
    : null;

  return {
    archetypeId: archetype.id,
    vendors,
    bestVendor: best,
    confidence: proposals.length >= 2 ? 'high' : proposals.length === 1 ? 'low' : 'insufficient_evidence',
    citations: vendors.flatMap((v) => v.citations),
    missingInputs: proposals.length ? [] : ['vendor proposals'],
    traps: archetype.pricingModel.traps,
  };
}

// ── Switching-cost leverage (renewal BATNA / walk-away) ──────────────────────

export interface SwitchingLeverageInputs {
  currentAnnualSpend?: GroundedValue;
  switchingCost?: GroundedValue;
  /** Months until renewal — timing pressure. */
  monthsToRenewal?: number;
  /** Target concession fraction the leverage supports (0..1). */
}

export interface SwitchingLeverageResult extends AnalysisBase {
  /** Payback in years for a switch (switchingCost / annualSpend). null if ungrounded. */
  switchPaybackYears: number | null;
  /** Qualitative BATNA strength. */
  batna: 'strong' | 'moderate' | 'weak' | 'unknown';
  rationale: string;
}

export function switchingLeverage(
  archetype: SourceEventArchetype,
  inputs: SwitchingLeverageInputs,
): SwitchingLeverageResult {
  const missing: string[] = [];
  if (!inputs.currentAnnualSpend) missing.push('spend_baseline');
  if (!inputs.switchingCost) missing.push('switching_cost');

  const citations: string[] = [];
  if (inputs.currentAnnualSpend) citations.push(inputs.currentAnnualSpend.citation);
  if (inputs.switchingCost) citations.push(inputs.switchingCost.citation);

  let payback: number | null = null;
  let batna: SwitchingLeverageResult['batna'] = 'unknown';
  let rationale = 'Insufficient grounded evidence to compute switching leverage.';

  if (inputs.currentAnnualSpend && inputs.switchingCost && inputs.currentAnnualSpend.value > 0) {
    payback = +(inputs.switchingCost.value / inputs.currentAnnualSpend.value).toFixed(2);
    const near = (inputs.monthsToRenewal ?? 99) <= 6;
    if (payback <= 1 && near) { batna = 'strong'; rationale = 'Switch pays back within a year and renewal is imminent — credible walk-away.'; }
    else if (payback <= 2) { batna = 'moderate'; rationale = 'Switch pays back within two years — usable but not decisive leverage.'; }
    else { batna = 'weak'; rationale = 'High switching cost relative to spend — leverage is limited; lead with utilization/SLA levers.'; }
  }

  return {
    archetypeId: archetype.id,
    switchPaybackYears: payback,
    batna,
    rationale,
    confidence: missing.length === 0 ? 'high' : missing.length === 1 ? 'low' : 'insufficient_evidence',
    citations,
    missingInputs: missing,
    traps: archetype.pricingModel.traps,
  };
}

// ── Negotiation plan (sequence the archetype's levers by timing) ─────────────

export interface NegotiationPlan {
  archetypeId: string;
  /** Levers grouped + ordered by deployment timing. */
  sequence: Array<{ timing: NegotiationLever['timing']; levers: NegotiationLever[] }>;
  pricingModel: string;
  traps: string[];
}

const TIMING_ORDER: NegotiationLever['timing'][] = ['pre_rfp', 'rfp', 'bafo', 'final_contracting'];

export function negotiationPlan(archetype: SourceEventArchetype): NegotiationPlan {
  const sequence = TIMING_ORDER.map((timing) => ({
    timing,
    levers: archetype.negotiationLevers.filter((l) => l.timing === timing),
  })).filter((g) => g.levers.length > 0);

  return {
    archetypeId: archetype.id,
    sequence,
    pricingModel: archetype.pricingModel.model,
    traps: archetype.pricingModel.traps,
  };
}
