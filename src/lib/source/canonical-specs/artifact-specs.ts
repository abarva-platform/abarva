// Canonical Source artifact specifications · per-stage catalog
//
// One row per (stage, artifact code). Codes follow the dossier convention
// (`d05_scope_memo`, `d07_ticket_synth`, etc.) so cross-references in the
// build pack remain stable.
//
// Each spec carries:
//   - `code` — stable identifier used in URLs, evidence citations, gate links
//   - `name` — human label for the UI
//   - `description` — one-line summary of what this artifact contains
//   - `family` — maps to existing `source_artifacts.artifact_family` enum
//   - `requirementLevel` — required / recommended / optional
//   - `gateDefining` — true if missing this artifact blocks stage promotion
//   - `tier` — default tier for the scaffold (stub | outline | rich)
//
// This is the canonical source of truth. The DB seed (Slice 2) reads these
// to populate `source_artifact_specifications`, and `createSourcingEvent`
// (Slice 3) uses these to scaffold per-event artifact stubs.

import type { SourceStageKey } from '../types';
import type { SourceArtifactFamily } from '../artifact-registry/types';

export type ArtifactRequirementLevel = 'required' | 'recommended' | 'optional';
export type ArtifactDefaultTier = 'stub' | 'outline' | 'rich';

export interface SourceArtifactSpec {
  code: string;
  name: string;
  description: string;
  stage: SourceStageKey;
  family: SourceArtifactFamily;
  requirementLevel: ArtifactRequirementLevel;
  gateDefining: boolean;
  defaultTier: ArtifactDefaultTier;
}

// ── Stage 1 · Strategy ──────────────────────────────────────────────────────
const STRATEGY: SourceArtifactSpec[] = [
  {
    code: 'd01_strategy_memo',
    name: 'Sourcing Strategy Memo',
    description:
      'Why we are sourcing now, what we are sourcing, value target, archetype, rigor level.',
    stage: 'strategy',
    family: 'sourcing_strategy',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd02_value_target',
    name: 'Value Target Brief',
    description:
      'Projected value range, levers (labor arbitrage, automation, consolidation), confidence band.',
    stage: 'strategy',
    family: 'sourcing_strategy',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd03_archetype_decision',
    name: 'Archetype Decision Record',
    description:
      'Which archetype (AMS / Cloud / Data / Enterprise SW / Custom) and why; rigor selection rationale.',
    stage: 'strategy',
    family: 'sourcing_strategy',
    requirementLevel: 'recommended',
    gateDefining: false,
    defaultTier: 'stub',
  },
];

// ── Stage 2 · Scope ─────────────────────────────────────────────────────────
const SCOPE: SourceArtifactSpec[] = [
  {
    code: 'd04_app_inv',
    name: 'Application Inventory & Tiering',
    description:
      'In-scope applications classified by tier (1 = mission-critical, 2 = important, 3 = standard).',
    stage: 'scope',
    family: 'minimum_data_request',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd05_scope_memo',
    name: 'Scope Memo with Boundaries',
    description: 'In-scope, out-of-scope, target support tier, transition assumptions.',
    stage: 'scope',
    family: 'scope_document',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd06_excl_log',
    name: 'Exclusion Log',
    description: 'Applications, services, regions, and capabilities explicitly out of scope.',
    stage: 'scope',
    family: 'scope_document',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd07_ticket_synth',
    name: 'Ticket History Synthesis',
    description:
      'L2/L3 ticket volume by tier and time-of-day; basis for sizing the support tier.',
    stage: 'scope',
    family: 'minimum_data_request',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd08_premortem',
    name: 'Pre-mortem on Scope Risk',
    description: 'Top 5 things that could break the scope decision; mitigation per item.',
    stage: 'scope',
    family: 'workshop_output',
    requirementLevel: 'optional',
    gateDefining: false,
    defaultTier: 'stub',
  },
];

// ── Stage 3 · RFP ────────────────────────────────────────────────────────────
const RFP: SourceArtifactSpec[] = [
  {
    code: 'd09_rfp_pack',
    name: 'RFP Package',
    description:
      'Full RFP document with mandatory items, optional items, response checklist, scoring rubric.',
    stage: 'rfp',
    family: 'rfp',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd10_rfi_summary',
    name: 'RFI Summary (if pre-RFI was run)',
    description: 'Vendor landscape, RFI responses, shortlisting rationale.',
    stage: 'rfp',
    family: 'rfi',
    requirementLevel: 'recommended',
    gateDefining: false,
    defaultTier: 'stub',
  },
  {
    code: 'd11_response_checklist',
    name: 'Response Checklist',
    description: 'Vendor-facing list of every required response item with format expectations.',
    stage: 'rfp',
    family: 'response_checklist',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd12_vendor_shortlist',
    name: 'Vendor Shortlist',
    description: 'Approved vendor list with rationale and any disqualified vendors.',
    stage: 'rfp',
    family: 'rfi',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 4 · Responses ─────────────────────────────────────────────────────
const RESPONSES: SourceArtifactSpec[] = [
  {
    code: 'd13_vendor_responses',
    name: 'Vendor Response Pack',
    description: 'All received responses, completeness check, clarification log.',
    stage: 'responses',
    family: 'proposal',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd14_qa_log',
    name: 'Q&A Log',
    description: 'Vendor questions + procurement answers; published to all bidders.',
    stage: 'responses',
    family: 'vendor_qa',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd15_response_completeness',
    name: 'Response Completeness Report',
    description: 'Per-vendor mandatory vs. optional fill rate; deviations flagged.',
    stage: 'responses',
    family: 'response_checklist',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 5 · Evaluate ──────────────────────────────────────────────────────
const EVALUATE: SourceArtifactSpec[] = [
  {
    code: 'd16_scorecard',
    name: 'Evaluation Scorecard',
    description:
      'Vendor × criteria matrix with weights, scores, evidence citations, deviation log.',
    stage: 'evaluation',
    family: 'scorecard',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd17_weight_log',
    name: 'Weight Set Governance Log',
    description: 'Versioned weight sets with EA / sponsor / Steward signatures and rationale.',
    stage: 'evaluation',
    family: 'scorecard',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd18_disqualification_log',
    name: 'Disqualification Rationale',
    description: 'For any vendor scored below threshold or excluded, the documented reason.',
    stage: 'evaluation',
    family: 'scorecard',
    requirementLevel: 'recommended',
    gateDefining: false,
    defaultTier: 'stub',
  },
];

// ── Stage 6 · Pricing ───────────────────────────────────────────────────────
const PRICING: SourceArtifactSpec[] = [
  {
    code: 'd19_pricing_workbook',
    name: 'Pricing Normalization Workbook',
    description:
      'TCO matrix with normalized assumptions, transition costs, egress, risk reserves.',
    stage: 'pricing',
    family: 'pricing_workbook',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd20_trap_log',
    name: 'Pricing Trap Log',
    description: 'P0/P1/P2 traps surfaced; resolution status; agent attribution.',
    stage: 'pricing',
    family: 'pricing_workbook',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd21_assumption_set',
    name: 'Locked Assumption Set',
    description: 'Sponsor-approved horizon, FX, escalators, in-scope assumption set.',
    stage: 'pricing',
    family: 'pricing_workbook',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 7 · BAFO ──────────────────────────────────────────────────────────
const BAFO: SourceArtifactSpec[] = [
  {
    code: 'd22_bafo_question_pack',
    name: 'BAFO Question Pack',
    description: 'Per-vendor questions targeting open traps and value uplift opportunities.',
    stage: 'bafo',
    family: 'bafo',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd23_bafo_round_log',
    name: 'BAFO Round Log',
    description: 'Per-round responses, deltas vs. prior, signed acceptances.',
    stage: 'bafo',
    family: 'bafo',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 8 · Decision ──────────────────────────────────────────────────────
const DECISION: SourceArtifactSpec[] = [
  {
    code: 'd24_decision_brief',
    name: 'Atlas Decision Brief',
    description:
      'Executive summary, finalist comparison, tradeoff card (value/risk/transition posture).',
    stage: 'executive_decision',
    family: 'decision_brief',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd25_risk_attestation',
    name: 'Sentinel Risk Attestation',
    description: 'Aggregated risk register with concentration, security, financial, geopolitical.',
    stage: 'executive_decision',
    family: 'decision_brief',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd26_steward_signoff',
    name: 'Steward Sign-off Record',
    description: 'Confirmation that scorecard governance is complete and weights are locked.',
    stage: 'executive_decision',
    family: 'decision_brief',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 9 · Selection ─────────────────────────────────────────────────────
const SELECTION: SourceArtifactSpec[] = [
  {
    code: 'd27_selection_memo',
    name: 'Selection Memo',
    description:
      'Final selection statement with rationale, sponsor sign-off, next steps for transition.',
    stage: 'selection',
    family: 'selection_memo',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd28_contract_record',
    name: 'Contract Record',
    description: 'Signed contract reference; commercial terms snapshot; effective dates.',
    stage: 'selection',
    family: 'selection_memo',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 10 · Transition ───────────────────────────────────────────────────
const TRANSITION: SourceArtifactSpec[] = [
  {
    code: 'd29_transition_plan',
    name: 'Transition Plan',
    description: 'Migration milestones, knowledge-transfer schedule, parallel-run gates.',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd30_checkpoint_log',
    name: 'Checkpoint Log',
    description: 'Per-checkpoint status (met / missed / deferred) with go/no-go decisions.',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd31_kt_evidence',
    name: 'Knowledge-Transfer Evidence',
    description: 'Sessions held, attendees, sign-offs from receiving team.',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
];

// ── Stage 11 · Value ────────────────────────────────────────────────────────
const VALUE: SourceArtifactSpec[] = [
  {
    code: 'd32_value_ledger',
    name: 'Value Ledger',
    description:
      'Value lines (projected → committed → measuring → realized) with measurement owner + evidence.',
    stage: 'value',
    family: 'value_ledger',
    requirementLevel: 'required',
    gateDefining: true,
    defaultTier: 'stub',
  },
  {
    code: 'd33_governance_review',
    name: 'Governance Review Note',
    description: 'Quarterly review record; re-baselining decisions; committed value adjustments.',
    stage: 'value',
    family: 'value_ledger',
    requirementLevel: 'recommended',
    gateDefining: false,
    defaultTier: 'stub',
  },
];

// ── Combined catalog ─────────────────────────────────────────────────────────

export const SOURCE_ARTIFACT_SPECS: readonly SourceArtifactSpec[] = [
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

export function specsForStage(stage: SourceStageKey): SourceArtifactSpec[] {
  return SOURCE_ARTIFACT_SPECS.filter((s) => s.stage === stage);
}

export function requiredSpecsForStage(stage: SourceStageKey): SourceArtifactSpec[] {
  return SOURCE_ARTIFACT_SPECS.filter(
    (s) => s.stage === stage && s.requirementLevel === 'required',
  );
}

export function gateDefiningSpecsForStage(stage: SourceStageKey): SourceArtifactSpec[] {
  return SOURCE_ARTIFACT_SPECS.filter((s) => s.stage === stage && s.gateDefining);
}

export function specByCode(code: string): SourceArtifactSpec | undefined {
  return SOURCE_ARTIFACT_SPECS.find((s) => s.code === code);
}
