// Deliverable Quality Transformation — Profile contract (W0)
//
// The DeliverableProfile is the CONTRACT between the Moves workflow and the
// renderer. The renderer must NOT decide style ad hoc; it reads the profile.
//
// Design principles (founder-locked 2026-06-21):
//   - Machinery hidden, judgment on top, visuals carry the story, appendices
//     hold the proof.
//   - Length is an OUTPUT, never a target. There is deliberately NO enforced
//     `maxWords`. `lengthGuidance` is advisory prose for the author only. The
//     gates with teeth are: machinery/banned-term, the "so what" filler test,
//     visual-completeness, evidence-placement, and fake-number → mode-downgrade.
//   - Cloud/services in architecture exhibits are NEVER predetermined — they
//     are drawn from the engagement's synthesised ArchitectureModel.
//
// Reuses the canonical repo types instead of introducing parallel ones:
//   - OutputFormat / AudienceRole / SectionGroundingMode from orchestrator/types
//   - DeliverableKey = the PHASE_CANONICAL_KEYS registry keys
//
// References:
//   - docs/build/DELIVERABLE_QUALITY_TRANSFORMATION_BUILD_SEQUENCE.md
//   - ~/Downloads/AbarVa_Deliverable_Quality_Transformation_Prompt_Instructions.docx (§6, §7)

import type {
  AudienceRole,
  OutputFormat,
} from "@/lib/deliverables/orchestrator/types";

/**
 * Canonical client-facing deliverable keys — the PHASE_CANONICAL_KEYS set from
 * `src/lib/programs/deliverable-registry.ts`. Keeping this as an explicit union
 * gives every profile call site compile-time safety.
 */
export type DeliverableKey =
  | "charter" // P1
  | "discovery_report" // P2
  | "root_cause_worksheet" // P2
  | "target_state_architecture" // P3
  | "solution_design" // P3
  | "operating_model_design" // P3
  | "sourcing_strategy" // P3
  | "execution_roadmap" // P4
  | "business_case" // P4
  | "financial_model" // P4 (workbook companion to business_case)
  | "tower_metrics_plan" // P4 (Tower value model)
  | "handoff_package" // P5
  | "value_measurement_contract"; // P5

/**
 * Where the evidence machinery lives relative to the client narrative. Evidence
 * is always preserved and traceable — this controls WHERE, not WHETHER.
 */
export type EvidenceMode =
  | "hidden" // not surfaced at all in this artifact (lives in a sibling binder)
  | "caption_level" // one-line implication under an exhibit; no register
  | "appendix_only" // narrative is clean; register is a closing appendix
  | "speaker_notes" // PPT — traceability in notes, not on slides
  | "working_binder"; // the internal evidence-heavy tier; machinery allowed

export type SourceRegisterPolicy =
  | "none"
  | "appendix_only"
  | "download"
  | "speaker_notes";

export type MissingInputPolicy =
  | "single_open_inputs_table" // consolidate ALL gaps into one table
  | "working_binder_detail"; // internal binder — itemised is fine

export type DeliverableTone =
  | "senior_consultant"
  | "board_grade"
  | "architecture_lead"
  | "delivery_lead";

export type VisualDensity = "low" | "medium" | "high";

/**
 * The exhibit catalogue. `requiredExhibits` references these ids; the visual
 * layer must render each (or emit a gap-honest placeholder). Architecture-family
 * exhibits are drawn from the engagement ArchitectureModel — never a fixed cloud.
 */
export type ExhibitId =
  // decision / executive
  | "decision_box"
  | "decision_headline"
  | "known_unknown_table"
  | "proceed_hold_stop_gate"
  | "open_inputs_required"
  | "value_story"
  | "risks_and_mitigations"
  // diagnostic
  | "issue_tree"
  | "root_cause_tree"
  | "symptom_cause_table"
  | "heatmap"
  | "process_pain_map"
  | "capability_maturity"
  // architecture (engagement-derived; cloud/services NOT predetermined)
  | "current_state_architecture"
  | "target_state_architecture"
  | "data_flow"
  | "ai_decision_flow"
  | "agentic_overlay"
  | "integration_pattern"
  | "control_points"
  | "implementation_waves"
  // solution / operating
  | "experience_flow"
  | "agent_workflow"
  | "exception_handling"
  | "raci"
  | "decision_rights"
  | "operating_cadence"
  | "escalation_path"
  // commercial / plan
  | "options_matrix"
  | "value_tree"
  | "roadmap_lanes"
  | "dependency_map"
  | "decision_calendar"
  | "measurement_table";

/**
 * Business-case honesty: never call it a Business Case without finance-grade
 * inputs. The generator downgrades by available data rather than blocking.
 */
export type BusinessCaseMode =
  | "readiness_memo" // baseline/cost/benefit missing — name the data request
  | "investment_thesis" // value directional, not finance-grade
  | "full_business_case"; // baseline + cost + benefit + sensitivity all present

export interface DeliverableProfile {
  /** Canonical registry key. */
  readonly key: DeliverableKey;
  /** Human-readable artifact name (client-facing, no system labels). */
  readonly title: string;
  readonly clientFacing: boolean;
  /** Primary audience(s), reusing the orchestrator AudienceRole union. */
  readonly audience: ReadonlyArray<AudienceRole>;
  /** The decision this artifact exists to support — stated on its first page. */
  readonly decisionPurpose: string;
  /** The board-final surface for this artifact. */
  readonly defaultFormat: OutputFormat;
  /** Supporting surfaces (HTML exhibit layer, internal binder, workbook). */
  readonly supportingFormats?: ReadonlyArray<OutputFormat>;
  readonly tone: DeliverableTone;
  readonly visualDensity: VisualDensity;
  /** Client-facing artifacts hide P1–P5 phase labels. */
  readonly allowPhaseLabels: boolean;
  readonly evidenceMode: EvidenceMode;
  readonly sourceRegisterPolicy: SourceRegisterPolicy;
  readonly missingInputPolicy: MissingInputPolicy;
  /** Exhibits the visual layer must render for this artifact. */
  readonly requiredExhibits: ReadonlyArray<ExhibitId>;
  /**
   * Advisory length note ONLY (e.g. "4–6 pages"). NOT an enforced cap — length
   * follows the judgment required. Kept for author guidance and golden-sample
   * calibration, never as a gate.
   */
  readonly lengthGuidance?: string;
  /** Business-case artifacts carry mode-downgrade logic; others omit it. */
  readonly supportsModeDowngrade?: boolean;
  /** Profile-specific acceptance checks (in addition to global gates). */
  readonly acceptanceChecks: ReadonlyArray<string>;
}
