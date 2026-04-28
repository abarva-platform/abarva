// bafo-scenario-compare-view.ts — SRC44
//
// Deterministic view model for the BAFO scenario compare.
//
// Answers: "What can we realistically improve in BAFO?"
//
// Shows conservative, base, and stretch negotiation scenarios across vendors.
// Each scenario has a rationale, risk level, estimated saving, and next actions.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// Submit/dispatch is ALWAYS disabled — live negotiation dispatch is deferred.

// ─── Output types ─────────────────────────────────────────────────────────────

export type BafoScenarioType = 'conservative' | 'base' | 'stretch';

export type BafoScenarioRisk = 'low' | 'medium' | 'high';

export interface BafoScenarioLever {
  leverId: string;
  label: string;
  detail: string;
  /** Estimated saving vs. current BAFO submission, USD. 0 = not quantifiable. */
  estimatedSavingUsd: number;
  /** Is the saving quantifiable with current data? */
  savingQuantified: boolean;
}

export interface BafoVendorScenario {
  scenarioType: BafoScenarioType;
  /** Short label shown on the scenario tab/card. */
  label: string;
  /** One-line scenario description. */
  description: string;
  riskLevel: BafoScenarioRisk;
  /** Probability of achieving this scenario's outcome, as a label (not a live prediction). */
  probabilityLabel: string;
  /** Negotiation levers available in this scenario. */
  levers: BafoScenarioLever[];
  /** Total estimated saving across all quantified levers, USD. */
  totalEstimatedSavingUsd: number;
  /** Key caveat for this scenario. */
  caveat: string;
  /** Recommended next action to pursue this scenario. */
  nextAction: string;
}

export interface BafoVendorScenarioSet {
  vendorId: string;
  vendorName: string;
  /** Current BAFO YR2+ annual run cost, USD. */
  currentAnnualRunCostUsd: number;
  /** Scenarios in order: conservative → base → stretch. */
  scenarios: [BafoVendorScenario, BafoVendorScenario, BafoVendorScenario];
  /** Whether this vendor has any active blockers that affect scenario reliability. */
  hasActiveBlocker: boolean;
  blockerNote: string | null;
}

export interface BafoScenarioCompareView {
  headline: string;
  contextLine: string;
  vendorSets: BafoVendorScenarioSet[];
  /** Label for the scenario compare action. */
  compareActionLabel: string;
  /** Why the compare action is disabled. */
  compareActionDisabledReason: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const VENDOR_A_SCENARIOS: [BafoVendorScenario, BafoVendorScenario, BafoVendorScenario] = [
  {
    scenarioType: 'conservative',
    label: 'Conservative',
    description: 'Minor optimisations only — scope and delivery model unchanged',
    riskLevel: 'low',
    probabilityLabel: 'High confidence',
    levers: [
      {
        leverId: 'va-c1',
        label: 'Rate escalation cap',
        detail: 'Negotiate annual rate escalation cap from 2% to 1.5%',
        estimatedSavingUsd: 45000,
        savingQuantified: true,
      },
      {
        leverId: 'va-c2',
        label: 'Governance reporting cadence',
        detail: 'Reduce governance reporting from monthly to quarterly, removing one FTE equivalent',
        estimatedSavingUsd: 30000,
        savingQuantified: true,
      },
    ],
    totalEstimatedSavingUsd: 75000,
    caveat: 'Saving is YR2+ annualised. YR1 transition cost is unchanged in this scenario.',
    nextAction: 'Include rate escalation cap and governance cadence in BAFO clarification instruction',
  },
  {
    scenarioType: 'base',
    label: 'Base',
    description: 'Offshore ratio improvement + transition cost reduction with deliverable-based YR1 payment',
    riskLevel: 'medium',
    probabilityLabel: 'Moderate confidence',
    levers: [
      {
        leverId: 'va-b1',
        label: 'Offshore ratio uplift',
        detail: 'Negotiate offshore ratio from current blended to 40% offshore. Vendor A has capacity.',
        estimatedSavingUsd: 120000,
        savingQuantified: true,
      },
      {
        leverId: 'va-b2',
        label: 'Transition payment milestones',
        detail: 'Restructure $500K YR1 transition to 4 deliverable-based milestone payments, reducing cash exposure',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
      {
        leverId: 'va-b3',
        label: 'Rate escalation cap (carried from conservative)',
        detail: 'As per conservative scenario',
        estimatedSavingUsd: 45000,
        savingQuantified: true,
      },
    ],
    totalEstimatedSavingUsd: 165000,
    caveat: 'Offshore ratio change requires Vendor A confirmation. Saving is directional until confirmed.',
    nextAction:
      'Issue BAFO clarification requesting offshore ratio confirmation and milestone payment structure',
  },
  {
    scenarioType: 'stretch',
    label: 'Stretch',
    description: 'Full YR2+ run cost renegotiation using competitive tension from Vendor C pricing',
    riskLevel: 'high',
    probabilityLabel: 'Low confidence — requires competitive pressure',
    levers: [
      {
        leverId: 'va-s1',
        label: 'Run cost rebid using Vendor C as anchor',
        detail:
          'Use Vendor C\'s $1.8M YR2+ as leverage to request Vendor A to rebid toward $1.95M. Requires Vendor C to be credible after scope validation.',
        estimatedSavingUsd: 150000,
        savingQuantified: false,
      },
      {
        leverId: 'va-s2',
        label: 'Multi-year commitment discount',
        detail: 'Offer a 5-year commitment in exchange for a 5% discount on YR2+ run cost',
        estimatedSavingUsd: 105000,
        savingQuantified: true,
      },
    ],
    totalEstimatedSavingUsd: 105000,
    caveat:
      'Stretch scenario requires Vendor C pricing to be validated first (SRC43). Using unvalidated Vendor C price as leverage could backfire if Vendor C is disqualified.',
    nextAction:
      'Validate Vendor C scope assumptions before using as leverage. If validated, prepare competitive tension memo for procurement lead.',
  },
];

const VENDOR_B_SCENARIOS: [BafoVendorScenario, BafoVendorScenario, BafoVendorScenario] = [
  {
    scenarioType: 'conservative',
    label: 'Conservative',
    description: 'SOC-2 holdback resolution only — no negotiation until compliance gap is closed',
    riskLevel: 'high',
    probabilityLabel: 'Contingent on SOC-2 resolution',
    levers: [
      {
        leverId: 'vb-c1',
        label: 'Obtain SOC-2 Type II attestation',
        detail:
          'Vendor B must submit a current SOC-2 Type II report before any price is accepted as final. This is a compliance gate, not a negotiation lever.',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
    ],
    totalEstimatedSavingUsd: 0,
    caveat:
      'Vendor B headline price of $2.3M is indicative only until SOC-2 holdback and security tower exclusion are resolved. Do not negotiate on this price until the blocker is cleared.',
    nextAction:
      'Escalate SOC-2 attestation requirement to Vendor B procurement contact — deadline May 2, 2026',
  },
  {
    scenarioType: 'base',
    label: 'Base',
    description: 'Post-SOC-2 resolution: security tower inclusion + application count correction',
    riskLevel: 'high',
    probabilityLabel: 'Contingent on SOC-2 resolution + scope correction',
    levers: [
      {
        leverId: 'vb-b1',
        label: 'Security operations tower repricing',
        detail:
          'Once SOC-2 is resolved, request Vendor B to include security ops tower at a bundled rate rather than as an add-on',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
      {
        leverId: 'vb-b2',
        label: 'Application count correction',
        detail:
          'Vendor B scoped 142 applications vs. the RFP baseline of 160. Correcting this will increase Vendor B\'s price — not a saving, but required for a fair comparison.',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
    ],
    totalEstimatedSavingUsd: 0,
    caveat:
      'Application count correction will likely increase Vendor B\'s headline price, not reduce it. Scenario is about reaching a comparable, not a lower, price.',
    nextAction:
      'Prioritise SOC-2 resolution before pursuing base scenario negotiations with Vendor B',
  },
  {
    scenarioType: 'stretch',
    label: 'Stretch',
    description: 'Not recommended — blockers must be resolved before stretch negotiation is viable',
    riskLevel: 'high',
    probabilityLabel: 'Not viable until blockers resolved',
    levers: [
      {
        leverId: 'vb-s1',
        label: 'Deferred — contingent on blocker resolution',
        detail:
          'Stretch negotiation with Vendor B is not a useful exercise until SOC-2 and scope parity are confirmed. Pursuing stretch savings on an incomparable baseline is misleading.',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
    ],
    totalEstimatedSavingUsd: 0,
    caveat:
      'Do not pursue stretch negotiation with Vendor B until conservative and base scenario conditions are met.',
    nextAction:
      'Hold Vendor B stretch scenario — revisit after May 2, 2026 SOC-2 deadline',
  },
];

const VENDOR_C_SCENARIOS: [BafoVendorScenario, BafoVendorScenario, BafoVendorScenario] = [
  {
    scenarioType: 'conservative',
    label: 'Conservative',
    description: 'Scope assumption validation only — price accepted as indicative pending confirmation',
    riskLevel: 'medium',
    probabilityLabel: 'Depends on scope validation outcome',
    levers: [
      {
        leverId: 'vc-c1',
        label: 'Confirm scope basis matches RFP',
        detail:
          'Vendor C must confirm their $1.8M price is based on the 160-application RFP scope and explain below-median positioning before the price can be used in any comparison',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
    ],
    totalEstimatedSavingUsd: 0,
    caveat:
      'Vendor C\'s below-median pricing may reflect scope gaps rather than genuine cost advantage. Validation is required before treating this as a saving vs. Vendor A.',
    nextAction:
      'Issue Vendor C scope confirmation request in BAFO clarification — require written response by May 5, 2026',
  },
  {
    scenarioType: 'base',
    label: 'Base',
    description: 'Post-validation: Vendor C as credible comparator, enabling cross-vendor leverage',
    riskLevel: 'medium',
    probabilityLabel: 'Moderate confidence — if scope validated',
    levers: [
      {
        leverId: 'vc-b1',
        label: 'Use validated Vendor C price as anchor for Vendor A negotiation',
        detail:
          'If Vendor C confirms the $1.8M price on a comparable scope basis, it becomes a credible anchor for renegotiating Vendor A\'s $2.1M',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
      {
        leverId: 'vc-b2',
        label: 'Governance scope uplift clause',
        detail:
          'Negotiate a governance scalability clause to protect against scope creep as CDP program grows — reduces future change order exposure',
        estimatedSavingUsd: 40000,
        savingQuantified: true,
      },
    ],
    totalEstimatedSavingUsd: 40000,
    caveat: 'Base scenario only activates if Vendor C scope validation passes.',
    nextAction:
      'Prepare scope validation checklist for Vendor C; brief procurement lead on leverage opportunity if validation passes',
  },
  {
    scenarioType: 'stretch',
    label: 'Stretch',
    description: 'Vendor C as preferred vendor: 5-year deal with nearshore capacity commitment',
    riskLevel: 'high',
    probabilityLabel: 'Low confidence — capacity and scope risks remain',
    levers: [
      {
        leverId: 'vc-s1',
        label: '5-year commitment in exchange for further rate reduction',
        detail:
          'If Vendor C is selected, offer a 5-year term in exchange for a 3% further discount on YR2+ run cost, targeting ~$1.75M',
        estimatedSavingUsd: 50000,
        savingQuantified: true,
      },
      {
        leverId: 'vc-s2',
        label: 'Nearshore capacity commitment clause',
        detail:
          'Require Vendor C to contractually commit nearshore capacity for CDP integration workstream to mitigate the Q3 capacity risk flagged by Steward',
        estimatedSavingUsd: 0,
        savingQuantified: false,
      },
    ],
    totalEstimatedSavingUsd: 50000,
    caveat:
      'Stretch assumes Vendor C passes scope validation and capacity risk is contractually mitigated. High risk of scope and delivery failure if capacity commitment is not secured.',
    nextAction:
      'Confirm Vendor C capacity with delivery lead before pursuing 5-year term negotiation',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the BAFO scenario compare view model.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildBafoScenarioCompareView(): BafoScenarioCompareView {
  const vendorSets: BafoVendorScenarioSet[] = [
    {
      vendorId: 'vendor-a',
      vendorName: 'Vendor A',
      currentAnnualRunCostUsd: 2100000,
      scenarios: VENDOR_A_SCENARIOS,
      hasActiveBlocker: false,
      blockerNote: null,
    },
    {
      vendorId: 'vendor-b',
      vendorName: 'Vendor B',
      currentAnnualRunCostUsd: 2300000,
      scenarios: VENDOR_B_SCENARIOS,
      hasActiveBlocker: true,
      blockerNote:
        'SOC-2 Type II attestation outstanding — Vendor B scenarios are contingent on blocker resolution before May 2, 2026.',
    },
    {
      vendorId: 'vendor-c',
      vendorName: 'Vendor C',
      currentAnnualRunCostUsd: 1800000,
      scenarios: VENDOR_C_SCENARIOS,
      hasActiveBlocker: true,
      blockerNote:
        'Below-median pricing unconfirmed — Vendor C scenarios are contingent on scope validation.',
    },
  ];

  return {
    headline: 'What can we realistically improve in BAFO?',
    contextLine:
      'SRC-AMS-2026 · BAFO scenario compare · 3 vendors · Conservative / Base / Stretch',
    vendorSets,
    compareActionLabel: 'Prepare negotiation brief',
    compareActionDisabledReason:
      'Live negotiation brief generation is deferred to a later slice. ' +
      'Review scenarios and next actions — brief dispatch will be wired when the Atlas negotiation session seam is available.',
    honestDisclaimer:
      'Deterministic seed · SRC-AMS-2026 BAFO scenarios reflect fixture context only. ' +
      'Saving estimates are directional and deterministic — not live predictions. ' +
      'Vendor B and Vendor C scenarios are contingent on active blocker resolution.',
    deterministicSeed: true,
  };
}
