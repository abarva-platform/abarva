// value-at-risk-portfolio-view.ts — TOWER3
//
// Deterministic view model for the Value at Risk Portfolio Lens
// in the Control Tower.
//
// Answers: "What value is at stake, and how confident are we in the evidence?"
//
// Summarizes value at stake, evidence confidence, blockers, and decision needs
// across the Apex Retail programme and source portfolio.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// Does NOT import from src/lib/source/** — standalone tower domain fixture.

// ─── Output types ─────────────────────────────────────────────────────────────

export type ValueRiskTier = 'high' | 'medium' | 'low';

export type EvidenceConfidence = 'strong' | 'partial' | 'weak' | 'missing';

export type ValueRiskStatus = 'at_risk' | 'on_track' | 'blocked' | 'deferred';

export interface ValueAtRiskItem {
  itemId: string;
  /** Programme or event this item relates to. */
  source: string;
  /** Short label for the value at stake. */
  label: string;
  /** USD value at stake (annual or one-time as appropriate). */
  valueAtStakeUsd: number;
  /** Whether the value estimate is quantified with current evidence. */
  valueQuantified: boolean;
  riskTier: ValueRiskTier;
  status: ValueRiskStatus;
  evidenceConfidence: EvidenceConfidence;
  /** Key risk narrative — what could cause the value to be lost. */
  riskNarrative: string;
  /** Next action to protect or realise this value. */
  nextAction: string;
  /** Active blocker (if status === 'blocked'). */
  blockerNote: string | null;
}

export interface PortfolioValueSummary {
  /** Total value at stake across all items, USD. */
  totalValueAtStakeUsd: number;
  /** Value at stake for at_risk items only, USD. */
  atRiskValueUsd: number;
  /** Value at stake for blocked items only, USD. */
  blockedValueUsd: number;
  /** Overall evidence confidence across the portfolio. */
  portfolioEvidenceConfidence: EvidenceConfidence;
  highRiskItemCount: number;
  blockedItemCount: number;
}

export interface ValueAtRiskPortfolioView {
  headline: string;
  contextLine: string;
  summary: PortfolioValueSummary;
  items: ValueAtRiskItem[];
  /** Atlas guidance on the highest-priority value protection action. */
  topPriorityGuidance: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const PORTFOLIO_ITEMS: ValueAtRiskItem[] = [
  {
    itemId: 'var-ams-savings',
    source: 'SRC-AMS-2026',
    label: 'AMS vendor consolidation — annual run cost savings',
    valueAtStakeUsd: 300000,
    valueQuantified: true,
    riskTier: 'high',
    status: 'at_risk',
    evidenceConfidence: 'partial',
    riskNarrative:
      'Vendor B SOC-2 gap and Vendor C scope uncertainty reduce the negotiation leverage needed to achieve the $300K+ annualised saving opportunity. If Vendor C is disqualified, Vendor A\'s stretch scenario becomes the only path and has low confidence.',
    nextAction:
      'Resolve Vendor B SOC-2 by May 2 and validate Vendor C scope by May 5 to preserve full negotiation leverage',
    blockerNote: 'Vendor B SOC-2 Type II attestation outstanding — blocks full evaluation',
  },
  {
    itemId: 'var-ams-transition',
    source: 'SRC-AMS-2026',
    label: 'AMS transition cost overrun risk',
    valueAtStakeUsd: 530000,
    valueQuantified: true,
    riskTier: 'medium',
    status: 'at_risk',
    evidenceConfidence: 'partial',
    riskNarrative:
      'Vendor A has not separated transition costs from YR1 AMS costs. If the blended figure includes scope items that expand in Phase 3, the transition cost could exceed the $500-530K range currently modelled.',
    nextAction:
      'Issue BAFO clarification requesting itemised transition cost vs. YR1 steady-state split from Vendor A',
    blockerNote: null,
  },
  {
    itemId: 'var-cdp-gate',
    source: 'APX-CDP-2026',
    label: 'CDP Phase 3 gate delay — programme cost and timeline risk',
    valueAtStakeUsd: 0,
    valueQuantified: false,
    riskTier: 'high',
    status: 'blocked',
    evidenceConfidence: 'partial',
    riskNarrative:
      'The APX-CDP-2026 P3 Design gate is pending. Gate delay cascades into AMS award timing risk and increases the probability of scope lock-in with an AMS vendor whose architecture is incompatible with the confirmed CDP design.',
    nextAction:
      'Convene out-of-cycle gate review before May 5 to unblock CDP Design gate before AMS BAFO deadline',
    blockerNote: 'APX-CDP-2026 P3 Design gate pending — unmet criteria must be resolved',
  },
  {
    itemId: 'var-cdp-programme',
    source: 'APX-CDP-2026',
    label: 'CDP programme value — revenue and data capability uplift',
    valueAtStakeUsd: 0,
    valueQuantified: false,
    riskTier: 'medium',
    status: 'on_track',
    evidenceConfidence: 'partial',
    riskNarrative:
      'The CDP programme is in P3 Design. Value realisation depends on completing Design gate and progressing to Build. Current gate hold is a leading indicator of delay risk but has not yet materialised into a schedule slip.',
    nextAction:
      'Monitor gate progress — escalate if Design gate is not resolved by May 5',
    blockerNote: null,
  },
  {
    itemId: 'var-ams-bafo-leverage',
    source: 'SRC-AMS-2026',
    label: 'BAFO negotiation leverage — cross-vendor competitive tension',
    valueAtStakeUsd: 150000,
    valueQuantified: false,
    riskTier: 'medium',
    status: 'at_risk',
    evidenceConfidence: 'weak',
    riskNarrative:
      'Cross-vendor competitive tension (using Vendor C as a price anchor) is only viable if Vendor C\'s scope is validated. If Vendor C is disqualified, the leverage evaporates and Vendor A\'s base scenario saving reduces to the conservative scenario ($75K).',
    nextAction:
      'Validate Vendor C scope before using as competitive anchor — if disqualified, revise Vendor A negotiation strategy to conservative scenario',
    blockerNote: null,
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the value at risk portfolio view for the Control Tower.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildValueAtRiskPortfolioView(): ValueAtRiskPortfolioView {
  const totalValueAtStakeUsd = PORTFOLIO_ITEMS
    .filter((i) => i.valueQuantified)
    .reduce((acc, i) => acc + i.valueAtStakeUsd, 0);

  const atRiskValueUsd = PORTFOLIO_ITEMS
    .filter((i) => i.status === 'at_risk' && i.valueQuantified)
    .reduce((acc, i) => acc + i.valueAtStakeUsd, 0);

  const blockedValueUsd = PORTFOLIO_ITEMS
    .filter((i) => i.status === 'blocked' && i.valueQuantified)
    .reduce((acc, i) => acc + i.valueAtStakeUsd, 0);

  const highRiskItemCount = PORTFOLIO_ITEMS.filter((i) => i.riskTier === 'high').length;
  const blockedItemCount = PORTFOLIO_ITEMS.filter((i) => i.status === 'blocked').length;

  const summary: PortfolioValueSummary = {
    totalValueAtStakeUsd,
    atRiskValueUsd,
    blockedValueUsd,
    portfolioEvidenceConfidence: 'partial',
    highRiskItemCount,
    blockedItemCount,
  };

  return {
    headline: 'Value at risk portfolio',
    contextLine: `${PORTFOLIO_ITEMS.length} items tracked · $${(atRiskValueUsd / 1000).toFixed(0)}K quantified value at risk · ${highRiskItemCount} high-risk items`,
    summary,
    items: PORTFOLIO_ITEMS,
    topPriorityGuidance:
      'The AMS $300K+ savings opportunity is the highest-value quantified risk. ' +
      'Resolving the Vendor B SOC-2 blocker and validating Vendor C scope by May 5 ' +
      'preserves full negotiation leverage going into the BAFO close.',
    honestDisclaimer:
      'Deterministic seed · Value estimates are directional, derived from fixture BAFO and programme data. ' +
      'Live portfolio value tracking, evidence confidence scoring, and risk quantification are deferred.',
    deterministicSeed: true,
  };
}
