// Canonical Source evidence requirements · per-stage catalog
//
// Per the dossier (§6, seven-state evidence ramp), each stage expects a set
// of evidence sources to be at a minimum readiness state before that stage
// can advance. This catalog encodes the canonical expectations.
//
// Readiness ramp (per dossier):
//   1. Not Requested  — known source, not yet pulled
//   2. Loaded         — file ingested, not yet parsed
//   3. Parsed         — fields extracted, not yet validated
//   4. Available      — parsed + sample-checked, queryable
//   5. Usable         — validated, citable in artifacts and gates
//   6. Stale          — older than freshness window
//   7. Low Confidence — Sentinel-flagged
//
// Each requirement has a `minimumState` — the lowest acceptable state for the
// gate to consider this evidence satisfied. Stale and Low Confidence count
// as failure modes (not a level on the ramp), and are tracked separately.

import type { SourceStageKey } from '../types';
import type { SourceDataReadinessState } from '../types';

export type EvidenceMinimumState = Extract<
  SourceDataReadinessState,
  'Loaded' | 'Parsed' | 'Available' | 'Usable Evidence'
>;

export interface SourceEvidenceRequirement {
  /** Stable id, e.g. `EVID-SRC-SCOPE-TICKET-HISTORY`. */
  requirementId: string;
  stage: SourceStageKey;
  /** Human label for the readiness panel. */
  label: string;
  /** Where this evidence comes from in the source system. */
  sourceLabel: string;
  /** Lowest readiness state that satisfies the requirement. */
  minimumState: EvidenceMinimumState;
  /** required = blocks gate; recommended = surfaces but doesn't block. */
  level: 'required' | 'recommended';
  /** Description for the data-readiness drawer. */
  description: string;
  /** What the evidence unlocks if it reaches minimum state. */
  unlocks: string;
}

// ── Stage 1 · Strategy ───────────────────────────────────────────────────────
const STRATEGY: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-STR-INCUMBENT',
    stage: 'strategy',
    label: 'Incumbent contract',
    sourceLabel: 'Contract management system / SharePoint',
    minimumState: 'Available',
    level: 'required',
    description: 'Active or expiring incumbent contract; baseline pricing reference.',
    unlocks: 'Value target sizing; archetype rationale.',
  },
  {
    requirementId: 'EVID-SRC-STR-SPONSOR-COMMIT',
    stage: 'strategy',
    label: 'Sponsor commitment',
    sourceLabel: 'Email / governance log',
    minimumState: 'Loaded',
    level: 'required',
    description: 'Written sponsor commitment to run a sourcing event.',
    unlocks: 'Strategy memo signing.',
  },
];

// ── Stage 2 · Scope ─────────────────────────────────────────────────────────
const SCOPE: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-SCOPE-APP-INV',
    stage: 'scope',
    label: 'Application inventory',
    sourceLabel: 'CMDB / EA tool',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Authoritative app inventory with tier classification.',
    unlocks: 'Scope memo §1, RFP application list.',
  },
  {
    requirementId: 'EVID-SRC-SCOPE-ORG',
    stage: 'scope',
    label: 'Org chart',
    sourceLabel: 'Workday / HRIS',
    minimumState: 'Available',
    level: 'required',
    description: 'IT staffing structure for sizing transition impact.',
    unlocks: 'KT planning, sizing model.',
  },
  {
    requirementId: 'EVID-SRC-SCOPE-TICKET-HISTORY',
    stage: 'scope',
    label: 'L2/L3 ticket history',
    sourceLabel: 'ServiceNow / ITSM tool',
    minimumState: 'Available',
    level: 'required',
    description: 'Ticket volume by tier and time-of-day; basis for support tier sizing.',
    unlocks: 'Scope §3 target tier; RFP fidelity.',
  },
  {
    requirementId: 'EVID-SRC-SCOPE-FY-CONTRACT',
    stage: 'scope',
    label: 'Prior fiscal AMS contract',
    sourceLabel: 'Procurement / contract repository',
    minimumState: 'Available',
    level: 'required',
    description: 'Baseline pricing reference; helps detect anomalies.',
    unlocks: 'Pricing assumption set.',
  },
];

// ── Stage 3 · RFP ────────────────────────────────────────────────────────────
const RFP: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-RFP-VENDOR-INTEL',
    stage: 'rfp',
    label: 'Vendor market intelligence',
    sourceLabel: 'Industry analyst reports / RFI',
    minimumState: 'Available',
    level: 'recommended',
    description: 'Vendor capability landscape, peer references, recent moves.',
    unlocks: 'Shortlist rationale.',
  },
  {
    requirementId: 'EVID-SRC-RFP-LEGAL-TEMPLATE',
    stage: 'rfp',
    label: 'Approved RFP legal template',
    sourceLabel: 'Legal team',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Boilerplate contractual terms cleared by Legal.',
    unlocks: 'RFP package release.',
  },
];

// ── Stage 4 · Responses ──────────────────────────────────────────────────────
const RESPONSES: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-RESP-PROPOSALS',
    stage: 'responses',
    label: 'Vendor proposals',
    sourceLabel: 'Vendor portal / email',
    minimumState: 'Available',
    level: 'required',
    description: 'Submitted responses parsed into structured fields.',
    unlocks: 'Evaluation matrix.',
  },
  {
    requirementId: 'EVID-SRC-RESP-CLARIFICATIONS',
    stage: 'responses',
    label: 'Q&A clarifications',
    sourceLabel: 'Vendor Q&A log',
    minimumState: 'Loaded',
    level: 'required',
    description: 'All vendor questions and answers; published to all bidders.',
    unlocks: 'Response completeness check.',
  },
];

// ── Stage 5 · Evaluate ───────────────────────────────────────────────────────
const EVALUATE: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-EVAL-RATER-SCORES',
    stage: 'evaluation',
    label: 'Rater scores',
    sourceLabel: 'Scorecard tool / spreadsheet',
    minimumState: 'Available',
    level: 'required',
    description: '≥2 raters per vendor with deviation logged.',
    unlocks: 'Steward sign-off.',
  },
  {
    requirementId: 'EVID-SRC-EVAL-WEIGHT-RATIONALE',
    stage: 'evaluation',
    label: 'Weight rationale',
    sourceLabel: 'EA-council minutes',
    minimumState: 'Available',
    level: 'required',
    description: 'EA-council and sponsor-approved weight rationale per criterion.',
    unlocks: 'Weight set lock.',
  },
];

// ── Stage 6 · Pricing ────────────────────────────────────────────────────────
const PRICING: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-PRICE-VENDOR-PRICING',
    stage: 'pricing',
    label: 'Vendor pricing responses',
    sourceLabel: 'Vendor proposals (pricing section)',
    minimumState: 'Available',
    level: 'required',
    description: 'Per-vendor pricing parsed into normalized line items.',
    unlocks: 'TCO matrix; trap log.',
  },
  {
    requirementId: 'EVID-SRC-PRICE-ASSUMPTIONS',
    stage: 'pricing',
    label: 'Sponsor-approved assumption set',
    sourceLabel: 'Governance memo',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Sponsor-confirmed assumption set v3 (horizon, FX, escalators).',
    unlocks: 'Pricing normalization.',
  },
];

// ── Stage 7 · BAFO ───────────────────────────────────────────────────────────
const BAFO: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-BAFO-OPEN-TRAPS',
    stage: 'bafo',
    label: 'Open trap inventory',
    sourceLabel: 'Pricing trap log',
    minimumState: 'Available',
    level: 'required',
    description: 'Every open P0/P1 trap is tied to a BAFO question.',
    unlocks: 'BAFO question pack lock.',
  },
];

// ── Stage 8 · Decision ───────────────────────────────────────────────────────
const DECISION: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-DEC-FINALIST-PRICING',
    stage: 'executive_decision',
    label: 'Finalist post-BAFO pricing',
    sourceLabel: 'BAFO round log',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Final-round pricing, signed concessions, normalized TCO.',
    unlocks: 'Decision brief tradeoff card.',
  },
  {
    requirementId: 'EVID-SRC-DEC-RISK-REGISTER',
    stage: 'executive_decision',
    label: 'Risk register',
    sourceLabel: 'Sentinel risk attestation',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Aggregated risks (financial, security, concentration, geopolitical).',
    unlocks: 'Sentinel attestation; sponsor commit.',
  },
];

// ── Stage 9 · Selection ──────────────────────────────────────────────────────
const SELECTION: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-SEL-CONTRACT',
    stage: 'selection',
    label: 'Signed contract',
    sourceLabel: 'Legal repository',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Signed contract with effective date and commercial terms snapshot.',
    unlocks: 'Selection memo lock; transition kickoff.',
  },
];

// ── Stage 10 · Transition ────────────────────────────────────────────────────
const TRANSITION: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-TRAN-MILESTONES',
    stage: 'transition',
    label: 'Milestone checkpoints',
    sourceLabel: 'Project tracking tool',
    minimumState: 'Available',
    level: 'required',
    description: 'Per-milestone status; checkpoint go/no-go decisions logged.',
    unlocks: 'Stage promotion; KT sign-off.',
  },
  {
    requirementId: 'EVID-SRC-TRAN-KT-EVIDENCE',
    stage: 'transition',
    label: 'Knowledge transfer evidence',
    sourceLabel: 'KT session records',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'KT sessions held with receiving-team sign-off.',
    unlocks: 'Transition close.',
  },
];

// ── Stage 11 · Value ─────────────────────────────────────────────────────────
const VALUE: SourceEvidenceRequirement[] = [
  {
    requirementId: 'EVID-SRC-VAL-MEASUREMENT',
    stage: 'value',
    label: 'Measurement evidence per value line',
    sourceLabel: 'Finance / ops measurement',
    minimumState: 'Usable Evidence',
    level: 'required',
    description: 'Each value line has measurement owner + evidence artifact.',
    unlocks: 'Realized value claim.',
  },
];

// ── Combined catalog ─────────────────────────────────────────────────────────

export const SOURCE_EVIDENCE_REQUIREMENTS: readonly SourceEvidenceRequirement[] = [
  ...STRATEGY,
  ...SCOPE,
  ...RFP,
  ...RESPONSES,
  ...EVALUATE,
  ...PRICING,
  ...BAFO,
  ...DECISION,
  ...SELECTION,
  ...TRANSITION,
  ...VALUE,
] as const;

export function evidenceForStage(stage: SourceStageKey): SourceEvidenceRequirement[] {
  return SOURCE_EVIDENCE_REQUIREMENTS.filter((e) => e.stage === stage);
}

export function requiredEvidenceForStage(stage: SourceStageKey): SourceEvidenceRequirement[] {
  return SOURCE_EVIDENCE_REQUIREMENTS.filter(
    (e) => e.stage === stage && e.level === 'required',
  );
}

export function evidenceById(id: string): SourceEvidenceRequirement | undefined {
  return SOURCE_EVIDENCE_REQUIREMENTS.find((e) => e.requirementId === id);
}
