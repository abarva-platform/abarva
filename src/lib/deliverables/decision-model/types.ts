// MoveDecisionModel — the single source of truth a Move's deliverables are authored from.
//
// Spec §4 (Deliverable System Transformation): the Intelligence Layer produces ONE decision
// model; every deliverable CONSUMES it and never independently reinterprets evidence. This is
// the convergence point reconciled in docs/build/DELIVERABLE_TRANSFORMATION_RECONCILIATION.md:
//   • governed evidence  → the model's evidence bundle (deepened later by the Intelligence layer)
//   • Workforce Economics estimate → the model's ValueModel.estimateTwice (WE-1/WE-2 output)
//   • the model           → consumed by the Story Director / Visual Director / authors / gate
//
// PR1 establishes the TYPED CONTRACT + a deterministic assembler/validator. The LLM-driven
// enrichment passes (Story Director etc.) plug into this shape in later PRs — they do not
// reshape it.
//
// Design rule: this module REFERENCES the orchestrator's governed-evidence contract; it does
// not fork it. Evidence is cited by `citationNumber` into the shared bundle, so there is exactly
// one evidence identity across the whole engine.

import type {
  GovernedEvidenceItem,
  MissingEvidenceItem,
  ApprovedAssumption,
} from "@/lib/deliverables/orchestrator/types";

export type Confidence = "high" | "medium" | "low";

/** A claim the recommendation rests on, grounded in (and possibly cut against by) evidence. */
export interface DecisionClaim {
  id: string;
  /** A conclusion, not a topic. "L/C examination is the cost driver, not headcount." */
  statement: string;
  /** Citation numbers (into the evidence bundle) that SUPPORT this claim. */
  supportingEvidence: number[];
  /** Citation numbers that CUT AGAINST this claim — surfaced, never hidden (spec §4). */
  contradictingEvidence: number[];
  confidence: Confidence;
}

export interface DecisionRisk {
  id: string;
  statement: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  mitigation?: string;
  /** Evidence citation numbers underpinning the risk. */
  evidence: number[];
}

export interface DecisionDependency {
  id: string;
  statement: string;
  /** Ids of decisions / work this dependency blocks. */
  blocks: string[];
  evidence: number[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  /** Why resolving this changes the decision. */
  whyItMatters: string;
  owner?: string;
}

/** One option under a required decision. */
export interface DecisionOption {
  id: string;
  label: string;
  pros: string[];
  cons: string[];
  /** Optional economics so the option matrix / scorecard exhibit can render. */
  approxCostUsd?: number;
  riskLevel?: "low" | "medium" | "high";
}

/** A decision the reader is being asked to make (spec §9 "Decision page"). */
export interface RequiredDecision {
  id: string;
  decision: string;
  options: DecisionOption[];
  /** Must be one of options[].id — enforced by validateMoveDecisionModel. */
  recommendedOptionId: string;
  rationale: string;
  decisionMaker?: string;
  byWhen?: string;
}

// ── Structured sub-models the Visual Director renders as exhibits ──────────────
// Deliberately lightweight in PR1: enough structure to drive the existing
// expert-kernel svg-architecture / svg-charts exhibits, without over-specifying.

export interface ArchitectureNode {
  id: string;
  label: string;
  /** Layer band, e.g. 'business', 'systems_of_record', 'ai_solution_zone'. */
  layer: string;
  /** True when this node is a gap (no governed evidence) — rendered gap-honest. */
  isGap?: boolean;
  evidence?: number[];
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  kind: "data" | "integration" | "control" | "decision";
  label?: string;
}

export interface ArchitectureControl {
  id: string;
  label: string;
  /** Coverage for the control overlay exhibit. */
  coverage: "native" | "partial" | "missing";
  evidence?: number[];
}

export interface ArchitectureModel {
  layers: string[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  controls: ArchitectureControl[];
  /** Callouts the architecture-on-a-page exhibit annotates. */
  callouts?: string[];
}

export interface OperatingRole {
  id: string;
  label: string;
  accountableFor: string[];
  humanOrAgent: "human" | "agent" | "hybrid";
}

export interface OperatingModel {
  roles: OperatingRole[];
  /** RACI-style decision rights: decision → { responsible, accountable, consulted, informed }. */
  decisionRights: Array<{
    decision: string;
    responsible: string;
    accountable: string;
    consulted: string[];
    informed: string[];
  }>;
  governanceForums: Array<{ name: string; cadence: string; mandate: string }>;
}

/** Economics for ONE scenario (matches the WE-2 estimation-engine output shape). */
export interface ScenarioEconomics {
  /** 'traditional' (people-only) | 'ai_native' (people + agents + platforms). */
  scenario: "traditional" | "ai_native";
  costUsd: number;
  durationMonths: number;
  humanFte: number;
  agentFte?: number;
  productivityMultiplier?: number;
  roiPct?: number;
  paybackMonths?: number;
  npvUsd?: number;
  /** Drivers (rate-card rows / assumptions / pods) — every number must trace. */
  drivers?: string[];
}

/**
 * The estimate-twice block. THE convergence seam for Workforce Economics: WE-2's
 * estimation-engine emits exactly this so it drops onto the ValueModel with no reshaping.
 */
export interface EstimateTwice {
  traditional: ScenarioEconomics;
  aiNative: ScenarioEconomics;
  /** Headline deltas for the value-bridge exhibit. */
  costReductionPct?: number;
  productivityMultiplier?: number;
  /** Free-form provenance handle for the workbook / assumptions version used. */
  substrateVersion?: string;
}

export interface ValueModel {
  valueThesis: string;
  valuePools?: Array<{ lever: string; annualValueUsd: number; evidence: number[] }>;
  /** Populated from the WE estimate; absent when WE is not bound for this Move. */
  estimateTwice?: EstimateTwice;
}

// ── The root object ───────────────────────────────────────────────────────────

export interface MoveDecisionModel {
  /** Stable id for the Move/engagement this model belongs to. */
  moveId: string;
  clientDisplayName: string;
  initiativeDisplayName: string;

  /** The one decision this engagement turns on (spec §5 "governing question"). */
  governingDecision: string;
  /** The answer, stated first (spec §6). A conclusion the reader can act on. */
  answerFirstRecommendation: string;

  /** The full governed evidence set — the single evidence identity all claims cite into. */
  evidenceBundle: GovernedEvidenceItem[];
  /** Evidence the model could not ground — surfaced, not hidden. */
  missingEvidence: MissingEvidenceItem[];
  approvedAssumptions: ApprovedAssumption[];

  claims: DecisionClaim[];
  /** Citation numbers flagged as cutting against the recommendation (the "what's the counter-case" view). */
  contradictoryEvidence: number[];
  risks: DecisionRisk[];
  dependencies: DecisionDependency[];
  openQuestions: OpenQuestion[];

  architectureModel?: ArchitectureModel;
  operatingModel?: OperatingModel;
  valueModel?: ValueModel;

  requiredDecisions: RequiredDecision[];

  /** Build provenance. */
  meta: {
    builtAtIso: string;
    /** 'deterministic_assembly' in PR1; later 'intelligence_pass' when LLM-enriched. */
    source: "deterministic_assembly" | "intelligence_pass";
    /** Whether a Workforce Economics estimate was bound. */
    weEstimateBound: boolean;
  };
}

/** A structural integrity finding from validateMoveDecisionModel. Empty list = valid. */
export interface DecisionModelValidationIssue {
  code:
    | "empty_governing_decision"
    | "empty_recommendation"
    | "claim_cites_unknown_evidence"
    | "contradictory_cites_unknown_evidence"
    | "risk_cites_unknown_evidence"
    | "recommended_option_missing"
    | "required_decision_without_options"
    | "value_model_estimate_inconsistent";
  detail: string;
}
