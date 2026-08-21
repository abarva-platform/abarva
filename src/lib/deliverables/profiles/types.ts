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
export type MovesDeliverableKey =
  | "charter" // P1
  | "discovery_report" // P2
  | "root_cause_worksheet" // P2
  | "solution_approach_options" // P3a — the decision spine that drives the architecture
  | "target_state_architecture" // P3
  | "solution_design" // P3
  | "operating_model_design" // P3
  | "sourcing_strategy" // P3
  | "execution_roadmap" // P4
  | "business_case" // P4
  | "financial_model" // P4 (workbook companion to business_case)
  | "tower_metrics_plan" // P4 (Tower value model)
  | "readiness_and_change_plan" // P4 (readiness/adoption gate)
  | "handoff_package" // P5
  | "value_measurement_contract"; // P5

/** Source (IT sourcing) artifact keys — profiled distinctly from Moves. */
export type SourceDeliverableKey =
  | "source_strategy_memo"
  | "source_value_target_brief"
  | "source_scope_memo"
  | "source_rfp_package"
  | "source_response_checklist"
  | "source_evaluation_scorecard"
  | "source_pricing_workbook"
  | "source_pricing_trap_log"
  | "source_bafo_question_pack"
  | "source_atlas_decision_brief"
  | "source_sentinel_risk_attestation"
  | "source_selection_memo"
  | "source_transition_plan"
  | "source_value_ledger";

/** Every profiled artifact, across modules. The registry is keyed by this. */
export type DeliverableKey = MovesDeliverableKey | SourceDeliverableKey;

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

/** What the artifact is FOR — drives audience-fit and intent checks. */
export type ArtifactIntent =
  | "decision_memo"
  | "diagnostic_readout"
  | "architecture_brief"
  | "solution_blueprint"
  | "operating_model"
  | "options_paper"
  | "business_case"
  | "financial_model"
  | "roadmap"
  | "value_contract"
  | "executive_readout"
  // Source family
  | "strategy_memo"
  | "value_target_brief"
  | "scope_memo"
  | "rfp_package"
  | "response_checklist"
  | "evaluation_scorecard"
  | "pricing_workbook"
  | "pricing_trap_log"
  | "bafo_question_pack"
  | "risk_attestation"
  | "selection_memo"
  | "transition_plan"
  | "value_ledger";

/** Where traceability lives for this artifact. */
export type AppendixMode =
  | "none"
  | "source_register_appendix"
  | "evidence_binder" // the artifact IS a binder — machinery allowed
  | "audit_metadata";

export type SourceTracePolicy =
  | "appendix"
  | "audit_metadata"
  | "inline_binder"
  | "download";

/**
 * Depth the artifact's PURPOSE permits — the "reader energy" control, NOT a word
 * cap. RFP/pricing/evaluation/transition may be exhaustive; a charter is concise.
 */
export type AllowedDepth = "concise" | "standard" | "deep" | "exhaustive";

export type RendererId =
  | "docx_narrative"
  | "html_architecture"
  | "pptx_storyline"
  | "xlsx_workbook"
  | "html_report"
  | "appendix";

/**
 * Executive visual standard for published artifacts. This is deliberately
 * separate from `requiredExhibits`: exhibits are renderer-addressable ids,
 * while this list names the client-facing visual obligations from the artifact
 * template (diagrams, charts, scorecards, heatmaps, roadmaps, and tables).
 */
export interface ArtifactVisualStandard {
  /** Visual pages/objects the final artifact must show, not merely describe. */
  readonly requiredVisuals: ReadonlyArray<string>;
  /** Chart types expected when quantitative inputs exist. */
  readonly requiredCharts?: ReadonlyArray<string>;
  /** Required styled/native tables beyond the generic source register. */
  readonly requiredTables?: ReadonlyArray<string>;
  /** Client-to-complete checklist required when inputs are missing. */
  readonly clientToCompleteChecklistRequired?: boolean;
  /** Readiness label such as Draft, Executive Review Ready, or Board Ready. */
  readonly readinessLabelRequired?: boolean;
}

/** The quality dimensions the gate evaluates against the profile's rubric. */
export type QualityDimensionId =
  | "audience_fit"
  | "artifact_intent"
  | "format_fit"
  | "human_consultant_voice"
  | "decision_clarity"
  | "evidence_discipline"
  | "evidence_placement"
  | "missing_input_handling"
  | "exhibit_enforcement"
  | "non_mechanical_writing"
  | "client_specificity"
  | "so_what_quality"
  // Story-Led / Exhibit-Led Standard (v2 redo, §12)
  | "story_spine"
  | "current_state_reasoning"
  | "gap_to_target_reasoning"
  | "architecture_completeness"
  | "visual_exhibit_quality";

/** The default rubric every client-facing artifact is held to (all 12 dimensions). */
export const DEFAULT_QUALITY_RUBRIC: ReadonlyArray<QualityDimensionId> = [
  "audience_fit",
  "artifact_intent",
  "format_fit",
  "human_consultant_voice",
  "decision_clarity",
  "evidence_discipline",
  "evidence_placement",
  "missing_input_handling",
  "exhibit_enforcement",
  "non_mechanical_writing",
  "client_specificity",
  "so_what_quality",
];

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

  // ── Deliverable Quality Contract fields (§0b) ──────────────────────────────
  /** What the artifact is for — drives audience/intent checks. */
  readonly intent?: ArtifactIntent;
  /** Where traceability lives. */
  readonly appendixMode?: AppendixMode;
  /** Tables the artifact must contain (by label/id). */
  readonly requiredTables?: ReadonlyArray<string>;
  /** Published executive visual standard for this artifact type. */
  readonly visualStandard?: ArtifactVisualStandard;
  /** The renderer the pipeline selects for this artifact. */
  readonly renderer?: RendererId;
  /** Which quality dimensions apply (defaults to DEFAULT_QUALITY_RUBRIC). */
  readonly qualityRubric?: ReadonlyArray<QualityDimensionId>;
  /** Profile-specific banned main-body language (beyond the global lexicon). */
  readonly bannedMainBodyLanguage?: ReadonlyArray<string>;
  /** Where the source trace goes. */
  readonly sourceTracePolicy?: SourceTracePolicy;
  /** Depth the purpose permits — reader-energy control, never a word cap. */
  readonly allowedDepth?: AllowedDepth;
  /** Golden-sample references for this profile. */
  readonly examples?: ReadonlyArray<string>;
  /** Known failure modes the gate watches for. */
  readonly failureModes?: ReadonlyArray<string>;

  // ── Story-Led / Exhibit-Led Standard (v2 redo, §13) ────────────────────────
  /** The question the artifact's narrative must answer. */
  readonly narrativeQuestion?: string;
  /** The visible story arc (ordered narrative spine). */
  readonly storyArc?: ReadonlyArray<string>;
  /** The artifact must interpret + draw current state. */
  readonly currentStateRequired?: boolean;
  /** The artifact must reason current → gaps. */
  readonly gapAnalysisRequired?: boolean;
  /** The artifact must define the target state. */
  readonly targetStateRequired?: boolean;
  /** Story beats the artifact must hit. */
  readonly requiredStoryBeats?: ReadonlyArray<string>;
  /** The narrative role each exhibit plays (exhibitId → role). */
  readonly exhibitNarrativeRole?: Readonly<Record<string, string>>;
  /** Exhibits must render as real visuals (not prose) to pass. */
  readonly visualRendererRequired?: boolean;
  /** Architecture artifacts must carry each level. */
  readonly conceptualArchitectureRequired?: boolean;
  readonly logicalArchitectureRequired?: boolean;
  readonly physicalArchitectureRequired?: boolean;
  /** Every exhibit must carry a so-what interpretation. */
  readonly soWhatRequired?: boolean;
  /** The decision the artifact builds toward. */
  readonly decisionMoment?: string;
  /** What the reader should be able to say after reading. */
  readonly readerTakeaway?: string;
  /** Patterns the gate rejects for this artifact. */
  readonly antiPatterns?: ReadonlyArray<string>;
}
