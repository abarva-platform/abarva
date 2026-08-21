// Moves aVa chat hardening — shared types.
//
// Moves aVa must be executive-quality but phase-grounded and workflow-safe:
// narrower than Intelligence, additive to the workflow, never a second path
// that bypasses upload/approval/gate/promotion. See docs/build/moves-design/
// and the phase-workspace slice memory for the product contract this serves.

export type MovesAvaAnswerMode =
  | "phase_guidance"
  | "phase_input_draft"
  | "evidence_gap"
  | "upload_mapping"
  | "draft_final_change"
  | "next_phase_readiness"
  | "gate_blocker"
  | "solution_lane_explanation"
  | "workshop_preparation"
  | "source_implication"
  | "tower_measurement"
  | "risk_control"
  | "out_of_scope_redirect";

export interface MovesAvaChecklistStatus {
  evidenceDone: boolean;
  evidenceLabel: string;
  gateDone: boolean;
  gateLabel: string;
  canAdvance: boolean;
  nextPhaseLabel: string | null;
}

export interface MovesAvaGateCriterion {
  label: string;
  met: boolean;
  severity: "hard" | "soft";
}

export interface MovesAvaFeedForwardSummary {
  headline: string;
  carriesForward: string[];
}

export interface MovesAvaTopicAwareness {
  relevant: boolean;
  matchedKeywords: string[];
  suggestion: string | null;
}

/**
 * Deterministic grounding packet built from real Move state before Moves aVa
 * answers. Fields the caller could not load this turn are recorded in
 * `missingInputs` rather than omitted silently — the answer engine and the
 * quality gate both use that list to require a caveat instead of a guess.
 */
export interface MovesAvaChatPacket {
  tenant: string;
  moveId: string;
  moveTitle: string;
  currentPhase: number;
  currentPhaseClientLabel: string;
  currentPhaseQuestion: string | null;
  selectedBuildingBlocks: string[];
  phaseTemplates: string[];
  recommendedSessions: string[];
  checklistStatus: MovesAvaChecklistStatus | null;
  evidenceNeedPackets: string[];
  currentStateAssessment: string | null;
  uploadedTemplateMappings: string[];
  whatChangedSummary: string | null;
  gateCriteria: MovesAvaGateCriterion[];
  nextPhaseFeedForwardPack: MovesAvaFeedForwardSummary | null;
  approvedInputsPackPresent: boolean;
  sourceImplication: MovesAvaTopicAwareness;
  towerMeasurement: MovesAvaTopicAwareness;
  missingInputs: string[];
  caveats: string[];
  allowedActions: string[];
  disallowedActions: string[];
}

export const MOVES_AVA_ALLOWED_ACTIONS: readonly string[] = [
  "Explain the current phase and what completes it",
  "Summarize evidence gaps and gate criteria from real Move state",
  "Interpret an upload's template mapping",
  "Explain what changed between a draft and a final",
  "Recommend the next practical action",
  "Draft phase-capture inputs only as cited capture-field artifacts that the user must insert and save",
  "Point to Source for vendor/commercial validation when relevant",
  "Point to Tower for the metric contract when relevant",
];

export const MOVES_AVA_DISALLOWED_ACTIONS: readonly string[] = [
  "Upload or approve evidence on the user's behalf",
  "Confirm a template mapping without the user's review",
  "Confirm a What Changed diff without the user's review",
  "Approve a phase or advance a gate through chat alone",
  "Write phase-capture inputs directly from chat",
  "Imply enterprise-context promotion happened automatically",
  "Invent baselines, evidence, readiness, or approvals not present in the packet",
  "Recommend autonomous legal/clinical/financial approval beyond readiness guidance",
];
