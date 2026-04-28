// pricing-completeness-view.ts — SRC43
//
// Deterministic view model for the Pricing completeness drilldown.
//
// Answers: "Why is this vendor not comparable?"
//
// Shows missing sections, unresolved assumptions, transition vs steady-state
// split, exclusions, and comparability gaps for each vendor in the event.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// All actions are always disabled — live workflow integration is deferred.

// ─── Output types ─────────────────────────────────────────────────────────────

export type PricingGapSeverity = 'blocker' | 'risk' | 'advisory';

export type PricingGapCategory =
  | 'missing_section'
  | 'unresolved_assumption'
  | 'scope_exclusion'
  | 'transition_vs_steady_state'
  | 'comparability';

export interface PricingCompletenessGap {
  gapId: string;
  category: PricingGapCategory;
  severity: PricingGapSeverity;
  label: string;
  detail: string;
  /** Recommended next action to close this gap. */
  nextAction: string;
}

export interface PricingVendorCompleteness {
  vendorId: string;
  vendorName: string;
  /** Overall comparability verdict for this vendor. */
  comparabilityStatus: 'comparable' | 'partially_comparable' | 'not_comparable' | 'blocked';
  /** One-line comparability reason. */
  comparabilityReason: string;
  /** Annual run cost YR2+, USD. */
  annualRunCostUsd: number;
  /** Transition cost YR1, USD. */
  transitionCostUsd: number;
  /** Known exclusions from the vendor's submission. */
  exclusions: string[];
  /** Key assumptions the vendor's price is based on. */
  assumptions: string[];
  /** Gaps identified for this vendor. */
  gaps: PricingCompletenessGap[];
  /** Count of blocker gaps. */
  blockerCount: number;
  /** Count of risk gaps. */
  riskCount: number;
}

export interface PricingCompletenessSummary {
  /** High-level comparability verdict across the event. */
  overallComparability: 'ready' | 'conditionally_ready' | 'blocked';
  /** One-line reason. */
  overallReason: string;
  /** Count of vendors that are fully comparable. */
  comparableVendorCount: number;
  /** Total vendor count. */
  totalVendorCount: number;
  /** Cross-vendor comparability gaps (scoping or assumption mismatches). */
  crossVendorGaps: PricingCompletenessGap[];
}

export interface PricingCompletenessView {
  headline: string;
  contextLine: string;
  summary: PricingCompletenessSummary;
  vendors: PricingVendorCompleteness[];
  /** Call-to-action label for requesting clarification. */
  clarificationLabel: string;
  /** Why the clarification action is disabled. */
  clarificationDisabledReason: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const VENDOR_A_GAPS: PricingCompletenessGap[] = [
  {
    gapId: 'va-g1',
    category: 'transition_vs_steady_state',
    severity: 'risk',
    label: 'Transition cost blended into YR1',
    detail:
      'Vendor A has not separated one-time transition costs from YR1 steady-state AMS costs. Blended figure makes year-over-year comparison unreliable.',
    nextAction: 'Request itemised YR1 transition line vs YR1 steady-state AMS line',
  },
  {
    gapId: 'va-g2',
    category: 'unresolved_assumption',
    severity: 'advisory',
    label: 'Offshore / onshore split unconfirmed',
    detail:
      'Vendor A references a blended rate model but has not confirmed the offshore percentage used. Rate mix affects comparability of per-ticket and per-application costs.',
    nextAction: 'Request offshore/onshore ratio confirmation in BAFO clarification round',
  },
];

const VENDOR_B_GAPS: PricingCompletenessGap[] = [
  {
    gapId: 'vb-g1',
    category: 'missing_section',
    severity: 'blocker',
    label: 'SOC-2 compliance attestation holdback not priced',
    detail:
      'Vendor B has an open SOC-2 Type II attestation gap flagged by Nexus. Compliance remediation cost has not been included or disclosed. This may materially change the total cost.',
    nextAction: 'Hold Vendor B price as indicative — request compliance cost estimate before BAFO final',
  },
  {
    gapId: 'vb-g2',
    category: 'scope_exclusion',
    severity: 'risk',
    label: 'Security operations tower excluded',
    detail:
      'Vendor B submission explicitly excludes security operations monitoring. Scope parity with Vendor A and Vendor C requires adding a security ops line or adjusting the comparison basis.',
    nextAction:
      'Either obtain Vendor B security ops add-on pricing or exclude security ops from all vendors for fair comparison',
  },
  {
    gapId: 'vb-g3',
    category: 'comparability',
    severity: 'risk',
    label: 'Application count based on stale inventory',
    detail:
      'Vendor B scoped 142 applications; current APX CDP program scope targets 160+. Undercount will produce an artificially low headline price.',
    nextAction:
      'Reconfirm application inventory with Vendor B before BAFO sign-off',
  },
];

const VENDOR_C_GAPS: PricingCompletenessGap[] = [
  {
    gapId: 'vc-g1',
    category: 'unresolved_assumption',
    severity: 'blocker',
    label: 'Below-median pricing basis unconfirmed',
    detail:
      'Vendor C\'s YR2+ run cost ($1.8M) is 14% below the market median for comparable scope. Nexus signals flag structural pricing risk — scope assumptions or exclusions may be incorrect.',
    nextAction:
      'Require Vendor C to confirm scope assumptions match the RFP definition and explain below-median positioning before accepting price',
  },
  {
    gapId: 'vc-g2',
    category: 'scope_exclusion',
    severity: 'advisory',
    label: 'Governance & reporting scope at minimum threshold',
    detail:
      'Vendor C priced governance and reporting at the minimum contractual threshold. Scope may need to increase as CDP program complexity grows in Phase 3.',
    nextAction:
      'Flag to contract team for governance scalability clause — request Vendor C confirm price bands for scope uplift',
  },
];

const CROSS_VENDOR_GAPS: PricingCompletenessGap[] = [
  {
    gapId: 'xv-g1',
    category: 'comparability',
    severity: 'risk',
    label: 'Application count varies by vendor',
    detail:
      'Vendor A scoped 160 applications, Vendor B 142, Vendor C 155. Inconsistent scope baseline makes headline price comparison unreliable.',
    nextAction:
      'Issue clarification request to all vendors to reconfirm price on a common 160-application basis',
  },
  {
    gapId: 'xv-g2',
    category: 'transition_vs_steady_state',
    severity: 'advisory',
    label: 'Transition period length differs',
    detail:
      'Vendor A assumes 9-month transition, Vendor B 12-month, Vendor C 6-month. Different transition lengths affect YR1 cost and time-to-steady-state.',
    nextAction:
      'Standardise transition window to 9 months in BAFO instruction to all vendors',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the pricing completeness drilldown view model.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildPricingCompletenessView(): PricingCompletenessView {
  const vendors: PricingVendorCompleteness[] = [
    {
      vendorId: 'vendor-a',
      vendorName: 'Vendor A',
      comparabilityStatus: 'partially_comparable',
      comparabilityReason:
        'Transition cost is blended into YR1; offshore split unconfirmed. Comparable after YR2 normalisation.',
      annualRunCostUsd: 2100000,
      transitionCostUsd: 500000,
      exclusions: [],
      assumptions: [
        '160 applications in scope',
        '9-month transition period',
        'Blended offshore/onshore rate — ratio TBC',
        '2% annual rate escalation',
      ],
      gaps: VENDOR_A_GAPS,
      blockerCount: 0,
      riskCount: 1,
    },
    {
      vendorId: 'vendor-b',
      vendorName: 'Vendor B',
      comparabilityStatus: 'not_comparable',
      comparabilityReason:
        'SOC-2 compliance cost gap and security tower exclusion make headline price unreliable for selection.',
      annualRunCostUsd: 2300000,
      transitionCostUsd: 530000,
      exclusions: ['Security operations monitoring', 'Compliance attestation holdback'],
      assumptions: [
        '142 applications in scope (stale inventory)',
        '12-month transition period',
        '30% offshore / 70% onshore',
        '2.5% annual rate escalation',
      ],
      gaps: VENDOR_B_GAPS,
      blockerCount: 1,
      riskCount: 2,
    },
    {
      vendorId: 'vendor-c',
      vendorName: 'Vendor C',
      comparabilityStatus: 'not_comparable',
      comparabilityReason:
        'Below-median pricing basis unconfirmed; scope assumptions require validation before acceptance.',
      annualRunCostUsd: 1800000,
      transitionCostUsd: 390000,
      exclusions: [],
      assumptions: [
        '155 applications in scope',
        '6-month transition period',
        '45% offshore / 55% onshore',
        '1.8% annual rate escalation',
      ],
      gaps: VENDOR_C_GAPS,
      blockerCount: 1,
      riskCount: 1,
    },
  ];

  const summary: PricingCompletenessSummary = {
    overallComparability: 'conditionally_ready',
    overallReason:
      'No vendor is fully comparable today. Vendor A is the closest — YR2 normalised view is usable for directional comparison. Vendors B and C have active blockers.',
    comparableVendorCount: 0,
    totalVendorCount: 3,
    crossVendorGaps: CROSS_VENDOR_GAPS,
  };

  return {
    headline: 'Why is this vendor not comparable?',
    contextLine:
      'SRC-AMS-2026 · Pricing completeness drilldown · 3 vendors · 2 cross-vendor gaps',
    summary,
    vendors,
    clarificationLabel: 'Send clarification request',
    clarificationDisabledReason:
      'Live clarification dispatch is deferred to a later slice. ' +
      'Review gaps and next actions — vendor comms will be wired when the Nexus messaging seam is available.',
    honestDisclaimer:
      'Deterministic seed · SRC-AMS-2026 pricing completeness reflects fixture context only. ' +
      'Live vendor submissions, SOC-2 attestation status, and scope reconfirmation are deferred.',
    deterministicSeed: true,
  };
}
