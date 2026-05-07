// Canonical Source gate criteria · per stage-transition catalog
//
// Each gate transition (Step N → Step N+1) carries a list of criteria that
// must be `met` (or `waived`) before the event can advance. Criteria can be:
//   - `hard` — must be met or waived; otherwise the gate panel disables Promote
//   - `soft` — should be met; soft criteria emit warnings but do not block
//   - `informational` — surfaced for context; do not gate
//
// Criterion IDs follow `GATE-<STAGE>-<NN>` for hard/soft criteria and
// `EVID-<STAGE>-<NN>` for evidence-tied criteria. Stable IDs let downstream
// systems (artifact-gate-map, audit log, waiver records) reference them.
//
// `linkedArtifactCodes` ties a criterion to the artifact specs that satisfy
// it. When that artifact reaches the required tier (typically `outline` or
// `rich`), the criterion auto-flips to `met`. The artifact-gate-map already
// implements this for the family→criterion mapping; this catalog widens it
// to artifact-code precision.

import type { SourceStageKey } from '../types';

export type GateCriterionSeverity = 'hard' | 'soft' | 'informational';

export interface SourceGateCriterion {
  /** `GATE-SCOPE-01`, `EVID-RFP-02`, etc. Stable canonical id. */
  criterionId: string;
  /** Stage this criterion belongs to (the stage being EXITED). */
  fromStage: SourceStageKey;
  /** Next stage. */
  toStage: SourceStageKey | 'closed';
  title: string;
  description: string;
  severity: GateCriterionSeverity;
  /** Required by default; false means it appears as informational only. */
  required: boolean;
  /** Artifact codes that satisfy this criterion when their tier ≥ required. */
  linkedArtifactCodes: string[];
  /** Lead role accountable for advancing this criterion to `met`. */
  ownerRole:
    | 'sourcing-lead'
    | 'sponsor'
    | 'ea-council'
    | 'steward'
    | 'sentinel'
    | 'atlas'
    | 'finance'
    | 'legal';
}

// ── Strategy → Scope ─────────────────────────────────────────────────────────
const STRATEGY_TO_SCOPE: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-STRATEGY-01',
    fromStage: 'strategy',
    toStage: 'scope',
    title: 'Sourcing strategy memo signed by sponsor',
    description: 'Sponsor confirms why now, what, and value target before scope work begins.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d01_strategy_memo'],
    ownerRole: 'sponsor',
  },
  {
    criterionId: 'GATE-STRATEGY-02',
    fromStage: 'strategy',
    toStage: 'scope',
    title: 'Value target set with range and confidence band',
    description: 'Projected value range exists with low/high estimate and v2 confidence flag.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d02_value_target'],
    ownerRole: 'atlas',
  },
  {
    criterionId: 'GATE-STRATEGY-03',
    fromStage: 'strategy',
    toStage: 'scope',
    title: 'Archetype + rigor level chosen',
    description: 'Sourcing archetype (AMS / Cloud / Data / etc.) and rigor selected with rationale.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d03_archetype_decision'],
    ownerRole: 'sourcing-lead',
  },
];

// ── Scope → RFP ──────────────────────────────────────────────────────────────
const SCOPE_TO_RFP: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-SCOPE-01',
    fromStage: 'scope',
    toStage: 'rfp',
    title: 'Application portfolio inventoried with tier classification',
    description: 'In-scope apps tiered (1/2/3) and signed by EA council.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d04_app_inv'],
    ownerRole: 'ea-council',
  },
  {
    criterionId: 'GATE-SCOPE-02',
    fromStage: 'scope',
    toStage: 'rfp',
    title: 'Sponsor commitment letter on record',
    description: 'Sponsor commits to scope decision and resourcing.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d05_scope_memo'],
    ownerRole: 'sponsor',
  },
  {
    criterionId: 'EVID-SCOPE-01',
    fromStage: 'scope',
    toStage: 'rfp',
    title: 'L2/L3 ticket history parsed and available',
    description: 'Sentinel evidence — ticket volume by tier and time-of-day usable for sizing.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d07_ticket_synth'],
    ownerRole: 'sentinel',
  },
  {
    criterionId: 'GATE-SCOPE-03',
    fromStage: 'scope',
    toStage: 'rfp',
    title: 'Exclusion log reviewed by sponsor',
    description: 'Out-of-scope list reviewed; sponsor confirms understanding.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d06_excl_log'],
    ownerRole: 'sponsor',
  },
  {
    criterionId: 'GATE-SCOPE-04',
    fromStage: 'scope',
    toStage: 'rfp',
    title: 'Scope memo signed by sponsor + EA',
    description: 'Final scope memo with both sponsor and EA-council signatures.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d05_scope_memo'],
    ownerRole: 'sponsor',
  },
];

// ── RFP → Responses ──────────────────────────────────────────────────────────
const RFP_TO_RESPONSES: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-RFP-01',
    fromStage: 'rfp',
    toStage: 'responses',
    title: 'RFP package complete and approved',
    description: 'All mandatory items, scoring rubric, response checklist, contractual terms.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d09_rfp_pack'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-RFP-02',
    fromStage: 'rfp',
    toStage: 'responses',
    title: 'Vendor shortlist locked',
    description: 'Approved vendors with rationale; disqualified vendors logged.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d12_vendor_shortlist'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-RFP-03',
    fromStage: 'rfp',
    toStage: 'responses',
    title: 'Response checklist published to all vendors',
    description: 'Vendors received the checklist with format expectations and deadlines.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d11_response_checklist'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-RFP-04',
    fromStage: 'rfp',
    toStage: 'responses',
    title: 'Legal review of RFP terms',
    description: 'Legal cleared boilerplate, IP clauses, data residency.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d09_rfp_pack'],
    ownerRole: 'legal',
  },
];

// ── Responses → Evaluate ─────────────────────────────────────────────────────
const RESPONSES_TO_EVALUATE: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-RESP-01',
    fromStage: 'responses',
    toStage: 'evaluation',
    title: 'All shortlisted vendors submitted responses',
    description: 'Either submitted, or formally withdrawn with logged reason.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d13_vendor_responses'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-RESP-02',
    fromStage: 'responses',
    toStage: 'evaluation',
    title: 'Response completeness verified per vendor',
    description: 'Mandatory items 100% complete or noted as deviations with rationale.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d15_response_completeness'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-RESP-03',
    fromStage: 'responses',
    toStage: 'evaluation',
    title: 'Q&A log closed and published',
    description: 'All vendor questions answered and shared across bidders.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d14_qa_log'],
    ownerRole: 'sourcing-lead',
  },
];

// ── Evaluate → Pricing ───────────────────────────────────────────────────────
const EVALUATE_TO_PRICING: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-EVAL-01',
    fromStage: 'evaluation',
    toStage: 'pricing',
    title: 'All vendors scored by ≥2 raters with deviation logged',
    description: 'Two-rater minimum; deviations >5 points reconciled.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d16_scorecard'],
    ownerRole: 'steward',
  },
  {
    criterionId: 'GATE-EVAL-02',
    fromStage: 'evaluation',
    toStage: 'pricing',
    title: 'Evidence cited for every score',
    description: 'Each score has an evidence citation; no ungrounded numbers.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d16_scorecard'],
    ownerRole: 'sentinel',
  },
  {
    criterionId: 'GATE-EVAL-03',
    fromStage: 'evaluation',
    toStage: 'pricing',
    title: 'Disqualification rationale logged',
    description: 'For any vendor below threshold or excluded, the reason is documented.',
    severity: 'soft',
    required: true,
    linkedArtifactCodes: ['d18_disqualification_log'],
    ownerRole: 'steward',
  },
  {
    criterionId: 'GATE-EVAL-04',
    fromStage: 'evaluation',
    toStage: 'pricing',
    title: 'Weight set signed by EA council',
    description: 'EA-council and sponsor approval recorded for the locked weight set.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d17_weight_log'],
    ownerRole: 'ea-council',
  },
  {
    criterionId: 'GATE-EVAL-05',
    fromStage: 'evaluation',
    toStage: 'pricing',
    title: 'Scorecard signed by Steward',
    description: 'Steward attests scorecard governance is complete.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d16_scorecard'],
    ownerRole: 'steward',
  },
];

// ── Pricing → BAFO ───────────────────────────────────────────────────────────
const PRICING_TO_BAFO: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-PRICE-01',
    fromStage: 'pricing',
    toStage: 'bafo',
    title: 'All vendor pricing normalized to common assumption set',
    description: 'TCO calculated against the locked assumption set v3.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d19_pricing_workbook'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-PRICE-02',
    fromStage: 'pricing',
    toStage: 'bafo',
    title: 'Trap log produced and reviewed by Steward',
    description: 'P0/P1/P2 traps logged; resolution plan or BAFO question staged.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d20_trap_log'],
    ownerRole: 'steward',
  },
  {
    criterionId: 'GATE-PRICE-03',
    fromStage: 'pricing',
    toStage: 'bafo',
    title: 'TCO horizon agreed with sponsor',
    description: 'Sponsor confirmed 3-year vs 5-year horizon for normalization.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d21_assumption_set'],
    ownerRole: 'sponsor',
  },
  {
    criterionId: 'GATE-PRICE-04',
    fromStage: 'pricing',
    toStage: 'bafo',
    title: 'P0 traps resolved or queued for BAFO',
    description: 'No P0 trap is open without a BAFO question targeting it.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d20_trap_log', 'd22_bafo_question_pack'],
    ownerRole: 'steward',
  },
  {
    criterionId: 'GATE-PRICE-05',
    fromStage: 'pricing',
    toStage: 'bafo',
    title: 'BAFO question pack signed by Steward',
    description: 'Steward signs off on the question pack before send.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d22_bafo_question_pack'],
    ownerRole: 'steward',
  },
];

// ── BAFO → Decision ──────────────────────────────────────────────────────────
const BAFO_TO_DECISION: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-BAFO-01',
    fromStage: 'bafo',
    toStage: 'executive_decision',
    title: '≥1 BAFO round complete per finalist',
    description: 'Every finalist has at least one BAFO round on record.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d23_bafo_round_log'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-BAFO-02',
    fromStage: 'bafo',
    toStage: 'executive_decision',
    title: 'Open clarifications closed',
    description: 'No open vendor clarifications remain.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d23_bafo_round_log'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-BAFO-03',
    fromStage: 'bafo',
    toStage: 'executive_decision',
    title: 'BAFO concessions accepted in writing',
    description: 'Vendor responses to security uplift, transition cost, etc. signed.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d23_bafo_round_log'],
    ownerRole: 'sourcing-lead',
  },
];

// ── Decision → Selection ─────────────────────────────────────────────────────
const DECISION_TO_SELECTION: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-DEC-01',
    fromStage: 'executive_decision',
    toStage: 'selection',
    title: 'Atlas decision brief signed off',
    description: 'Atlas-produced brief with finalist comparison + recommendation.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d24_decision_brief'],
    ownerRole: 'atlas',
  },
  {
    criterionId: 'GATE-DEC-02',
    fromStage: 'executive_decision',
    toStage: 'selection',
    title: 'Steward sign-off recorded',
    description: 'Steward attests scorecard governance + weight lock.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d26_steward_signoff'],
    ownerRole: 'steward',
  },
  {
    criterionId: 'GATE-DEC-03',
    fromStage: 'executive_decision',
    toStage: 'selection',
    title: 'Sentinel risk attestation signed',
    description: 'Aggregated risk register attested by Sentinel; concentration acknowledged.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d25_risk_attestation'],
    ownerRole: 'sentinel',
  },
  {
    criterionId: 'GATE-DEC-04',
    fromStage: 'executive_decision',
    toStage: 'selection',
    title: 'Sponsor commitment letter signed',
    description: 'Final sponsor commitment to selected vendor and value target.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d24_decision_brief'],
    ownerRole: 'sponsor',
  },
];

// ── Selection → Transition ───────────────────────────────────────────────────
const SELECTION_TO_TRANSITION: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-SEL-01',
    fromStage: 'selection',
    toStage: 'transition',
    title: 'Selection memo signed by sponsor',
    description: 'Final selection statement on record; out-of-scope appeals closed.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d27_selection_memo'],
    ownerRole: 'sponsor',
  },
  {
    criterionId: 'GATE-SEL-02',
    fromStage: 'selection',
    toStage: 'transition',
    title: 'Contract record on file',
    description: 'Contract signed and referenced in selection memo.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d28_contract_record'],
    ownerRole: 'legal',
  },
];

// ── Transition → Value ───────────────────────────────────────────────────────
const TRANSITION_TO_VALUE: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-TRAN-01',
    fromStage: 'transition',
    toStage: 'value',
    title: 'Transition plan complete',
    description: 'All milestones, KT schedule, parallel-run gates documented.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d29_transition_plan'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-TRAN-02',
    fromStage: 'transition',
    toStage: 'value',
    title: 'Checkpoint go/no-go decisions logged',
    description: 'Each transition checkpoint has a recorded decision.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d30_checkpoint_log'],
    ownerRole: 'sourcing-lead',
  },
  {
    criterionId: 'GATE-TRAN-03',
    fromStage: 'transition',
    toStage: 'value',
    title: 'Knowledge transfer evidence on record',
    description: 'KT sessions held; receiving team signed off.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d31_kt_evidence'],
    ownerRole: 'sourcing-lead',
  },
];

// ── Value → Closed ───────────────────────────────────────────────────────────
const VALUE_TO_CLOSED: SourceGateCriterion[] = [
  {
    criterionId: 'GATE-VAL-01',
    fromStage: 'value',
    toStage: 'closed',
    title: 'Value ledger initialized for all commitments',
    description: 'Each value line has projected → committed → measurement-owner assigned.',
    severity: 'hard',
    required: true,
    linkedArtifactCodes: ['d32_value_ledger'],
    ownerRole: 'atlas',
  },
  {
    criterionId: 'GATE-VAL-02',
    fromStage: 'value',
    toStage: 'closed',
    title: 'First measurement window complete',
    description:
      'At least one measurement window closed with measured value recorded.',
    severity: 'soft',
    required: true,
    linkedArtifactCodes: ['d32_value_ledger'],
    ownerRole: 'atlas',
  },
];

// ── Combined catalog ─────────────────────────────────────────────────────────

export const SOURCE_GATE_CRITERIA: readonly SourceGateCriterion[] = [
  ...STRATEGY_TO_SCOPE,
  ...SCOPE_TO_RFP,
  ...RFP_TO_RESPONSES,
  ...RESPONSES_TO_EVALUATE,
  ...EVALUATE_TO_PRICING,
  ...PRICING_TO_BAFO,
  ...BAFO_TO_DECISION,
  ...DECISION_TO_SELECTION,
  ...SELECTION_TO_TRANSITION,
  ...TRANSITION_TO_VALUE,
  ...VALUE_TO_CLOSED,
] as const;

export function criteriaForStage(stage: SourceStageKey): SourceGateCriterion[] {
  return SOURCE_GATE_CRITERIA.filter((c) => c.fromStage === stage);
}

export function hardCriteriaForStage(stage: SourceStageKey): SourceGateCriterion[] {
  return SOURCE_GATE_CRITERIA.filter((c) => c.fromStage === stage && c.severity === 'hard');
}

export function criteriaByArtifactCode(code: string): SourceGateCriterion[] {
  return SOURCE_GATE_CRITERIA.filter((c) => c.linkedArtifactCodes.includes(code));
}

export function criterionById(id: string): SourceGateCriterion | undefined {
  return SOURCE_GATE_CRITERIA.find((c) => c.criterionId === id);
}
