// award-decision-view.ts — SRC46
//
// Deterministic view model for the Source Event Award Decision Tracker.
// Provides a ranked vendor comparison and award recommendation at
// Stage 7 (BAFO Evaluation Complete) of the AMS Vendor Consolidation event.
//
// Answers: "Given everything we know — BAFO, pricing, risk, readiness,
// and transition — which vendor should be awarded, and why?"
//
// Rendered as the 'award' tab within SourceEventDetailPage.
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/intelligence/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ─────────────────────────────────────────────────────────────

export type AwardDecisionStatus =
  | 'recommended'
  | 'conditional'
  | 'not_recommended';

export type DecisionReadiness = 'ready' | 'conditional' | 'not_ready';

export interface VendorScoreCard {
  /** Commercial: pricing, contract value, cost structure (0–100). */
  commercial: number;
  /** Technical: capability fit, integration depth, platform maturity (0–100). */
  technical: number;
  /** Transition: KTP readiness, staffing, parallel-run plan (0–100). */
  transition: number;
  /** Risk: SOC-2, governance, CDP compatibility, exit clause (0–100). */
  risk: number;
  /** Overall weighted score (0–100). */
  overall: number;
}

export interface VendorAwardProfile {
  vendorId: string;
  vendorName: string;
  /** Award rank: 1 = top-ranked. */
  rank: 1 | 2 | 3;
  status: AwardDecisionStatus;
  scores: VendorScoreCard;
  strengthSummary: string;
  weaknessSummary: string;
  /** One-line decision note for the evaluation committee. */
  decisionNote: string;
  /** Issues that must be resolved before award can proceed (if any). */
  blockingIssues: string[];
}

export interface AwardDecisionSummary {
  recommendedVendorId: string;
  recommendedVendorName: string;
  decisionReadiness: DecisionReadiness;
  /** Headline rationale for the recommendation. */
  rationale: string;
  /** Key factors that distinguish the recommendation. */
  keyDecisionFactors: string[];
  /** Gate conditions that must close before contract execution. */
  preAwardConditions: string[];
}

export interface AwardDecisionView {
  eventId: string;
  eventName: string;
  /** Human-readable decision stage label. */
  decisionStage: string;
  vendors: VendorAwardProfile[];
  summary: AwardDecisionSummary;
  /** Atlas guidance synthesis on the award decision. */
  atlasGuidance: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const VENDOR_PROFILES: VendorAwardProfile[] = [
  {
    vendorId: 'vendor-c',
    vendorName: 'Vendor C',
    rank: 1,
    status: 'recommended',
    scores: {
      commercial: 82,
      technical: 88,
      transition: 76,
      risk: 80,
      overall: 83,
    },
    strengthSummary:
      'Highest technical capability score (88) — strongest platform maturity and integration depth. ' +
      'CDP-compatible architecture reduces downstream integration risk. ' +
      'Commercial score (82) reflects competitive pricing with structured transition cost disclosure.',
    weaknessSummary:
      'Scope confirmation outstanding before BAFO close — prevents final commercial lock. ' +
      'Transition score (76) reflects a newer incumbent relationship requiring intensive KTP phase.',
    decisionNote:
      'Recommended subject to scope confirmation before BAFO close (May 5 2026). ' +
      'CDP integration advantage is decisive — locks in the architecture for both AMS and CDP programs.',
    blockingIssues: ['Scope confirmation required before BAFO close (May 5 2026)'],
  },
  {
    vendorId: 'vendor-a',
    vendorName: 'Vendor A',
    rank: 2,
    status: 'conditional',
    scores: {
      commercial: 79,
      technical: 74,
      transition: 84,
      risk: 85,
      overall: 80,
    },
    strengthSummary:
      'Highest transition score (84) — strong incumbent knowledge transfer plan and parallel-run commitment. ' +
      'Best risk profile (85): no SOC-2 exceptions, clean governance terms, exit clause accepted. ' +
      'Solid commercial position at rank 2.',
    weaknessSummary:
      'Technical score (74) trails Vendor C by 14 points — platform maturity gaps in AI tooling and CDP integration. ' +
      'Itemised YR1 cost split (transition vs. steady-state) outstanding — prevents full commercial validation.',
    decisionNote:
      'Conditional: second preference if Vendor C scope confirmation fails. ' +
      'Strongest risk and transition posture; technical gap vs. Vendor C is the deciding factor.',
    blockingIssues: [
      'Itemised YR1 steady-state vs. transition cost split required before final commercial evaluation',
    ],
  },
  {
    vendorId: 'vendor-b',
    vendorName: 'Vendor B',
    rank: 3,
    status: 'not_recommended',
    scores: {
      commercial: 71,
      technical: 77,
      transition: 68,
      risk: 52,
      overall: 67,
    },
    strengthSummary:
      'Competitive technical score (77) — capable platform with strong AI tooling commitment in BAFO. ' +
      'Commercial pricing is within acceptable range at rank 3.',
    weaknessSummary:
      'Critical risk gap (52): SOC-2 Type II certification outstanding — blocks full InfoSec evaluation. ' +
      'Lowest transition score (68): KTP plan is thin, parallel-run commitment not quantified. ' +
      'CDP integration approach requires architecture review that is not yet scheduled.',
    decisionNote:
      'Not recommended at this stage. SOC-2 blocker is a hard gate — cannot proceed to award ' +
      'without resolution. If SOC-2 clears before May 2, re-evaluate against Vendor A.',
    blockingIssues: [
      'SOC-2 Type II certification outstanding — hard gate for award (deadline: May 2 2026)',
      'CDP integration architecture review not yet scheduled',
    ],
  },
];

const DECISION_SUMMARY: AwardDecisionSummary = {
  recommendedVendorId: 'vendor-c',
  recommendedVendorName: 'Vendor C',
  decisionReadiness: 'conditional',
  rationale:
    'Vendor C leads on technical capability (88) and CDP architecture compatibility, ' +
    'which is decisive given the active APX-CDP-2026 program dependency. ' +
    'The sole pre-award condition — scope confirmation — is resolvable before BAFO close.',
  keyDecisionFactors: [
    'CDP-compatible architecture eliminates a critical program dependency risk',
    'Technical capability gap of +14 points over Vendor A is decisive at this engagement scale',
    'Commercial position is competitive — no meaningful savings case for Vendor A over 3-year horizon',
    'Vendor B SOC-2 blocker disqualifies at current stage regardless of commercial merits',
  ],
  preAwardConditions: [
    'Vendor C scope confirmation received before BAFO close (May 5 2026)',
    'Vendor C CDP integration plan validated by CDP Programme Lead before contract execution',
    'Legal review of AI tooling exit clause terms before contract signing',
  ],
};

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the award decision view for the AMS Vendor Consolidation sourcing event.
 *
 * Returns a ranked vendor comparison with recommendation and pre-award conditions.
 * Deterministic: derives from fixture data only.
 */
export function buildAwardDecisionView(): AwardDecisionView {
  return {
    eventId: 'SRC-AMS-2026',
    eventName: 'AMS Vendor Consolidation 2026',
    decisionStage: 'Stage 7 · BAFO Evaluation Complete · Award Pending',
    vendors: VENDOR_PROFILES,
    summary: DECISION_SUMMARY,
    atlasGuidance:
      'The award decision is convergent on Vendor C pending scope confirmation. ' +
      'The CDP architecture advantage is not recoverable from Vendor A at contract execution — ' +
      'it would require a subsequent architecture change programme. Vendor B remains disqualified ' +
      'until SOC-2 clears, which is past the BAFO timeline. ' +
      'Recommend proceeding to conditional award on May 5 if scope confirmation is received.',
    honestDisclaimer:
      'Deterministic seed · Award decision reflects fixture evaluation data for the Apex Retail ' +
      'AMS Vendor Consolidation engagement at Stage 7. Live scoring, vendor updates, and final ' +
      'committee ratification are deferred to the programme award management workflow.',
    deterministicSeed: true,
  };
}
