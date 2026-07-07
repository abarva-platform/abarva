// Story Director types — spec §5, §6, §9.
//
// The Story Director turns a MoveDecisionModel + an archetype into a STORY: an ordered sequence
// of executive pages, each with a conclusion headline, one hero exhibit, and an explicit
// narrative role + decision relevance. This replaces the orchestrator's topic-ordered section
// list. Storytelling becomes a product capability, not a formatting layer.
//
// PR2 establishes the typed blueprints (the 8 archetype page-sequences, founder-confirmed
// authoritative) + a DETERMINISTIC director that binds MoveDecisionModel content into pages.
// Conclusion-style headline authoring (spec §6) is a later LLM pass that fills the headline slot;
// PR2 provides the structure + the model binding + the validation.

/**
 * Hero exhibit type for a page (spec §7 + the §9 mandatory exhibits). These names map to the
 * existing expert-kernel svg-architecture / svg-charts library in PR3 (Visual Director); PR2 only
 * names them.
 */
export type ExhibitType =
  // architecture family (svg-architecture.ts)
  | "ArchitectureOnPage"
  | "LayeredArchitecture"
  | "WorkflowSwimlane"
  | "ControlOverlay"
  | "IntegrationLandscape"
  | "GovernanceStructure"
  | "BuildBuyBoundary"
  // decision / matrix family
  | "DecisionScorecard"
  | "OptionMatrix"
  | "TradeoffMatrix"
  | "DecisionTree"
  | "CapabilityHeatmap"
  | "MaturityHeatmap"
  | "RiskConcentrationMap"
  | "RACIMap"
  | "OperatingModel"
  | "IssueTree"
  | "RootCauseTree"
  | "EvidenceMatrix"
  | "DependencyGraph"
  // value / economics family (svg-charts.ts) — the Workforce Economics exhibits
  | "ValueBridge"
  | "ValueWaterfall"
  | "ValueTree"
  | "TransformationRoadmap"
  | "ValueTimeline"
  | "MeasurementArchitecture"
  | "ReadinessDashboard"
  | "OwnershipMap"
  | "ConstraintStack"
  // a page whose hero is the message itself (cover / decision snapshot)
  | "KeyMessageCard";

/** The narrative role a page plays — every page exists for a reason (spec §5). */
export type RoleInStory =
  | "decision_snapshot"
  | "problem"
  | "urgency"
  | "value_at_stake"
  | "sponsor_commitment"
  | "recommendation"
  | "executive_finding"
  | "problem_magnitude"
  | "issue_tree"
  | "root_causes"
  | "evidence_confidence"
  | "current_state"
  | "constraints"
  | "target_state"
  | "workflow"
  | "integration"
  | "governance"
  | "alternatives"
  | "migration"
  | "market_landscape"
  | "capability_decomposition"
  | "option_matrix"
  | "vendor_evaluation"
  | "target_org"
  | "decision_rights"
  | "raci"
  | "role_transitions"
  | "journey"
  | "dependencies"
  | "critical_path"
  | "value_realization"
  | "value_thesis"
  | "value_tree"
  | "benefit_decomposition"
  | "measurement"
  | "finance_attestation"
  | "readiness"
  | "ownership_transfer"
  | "open_decisions"
  | "decision";

/** Which part of the MoveDecisionModel feeds a page — binds the page to the single source of truth. */
export type ModelSource =
  | "governingDecision"
  | "answerFirstRecommendation"
  | "claims"
  | "risks"
  | "dependencies"
  | "openQuestions"
  | "architectureModel"
  | "operatingModel"
  | "valueModel"
  | "requiredDecisions"
  | "evidenceBundle"
  | "missingEvidence";

/** A blueprint page: the conclusion intent, the hero exhibit, and the model binding. */
export interface StoryPageBlueprint {
  roleInStory: RoleInStory;
  /** What conclusion this page must land — the authoring prompt for the headline pass. */
  headlineIntent: string;
  exhibitType: ExhibitType;
  /** Which MoveDecisionModel part populates this page. */
  sourceFromModel: ModelSource;
}

/** An archetype's authoritative narrative shape (spec §9). */
export interface ArchetypeBlueprint {
  archetypeKey: ArchetypeKey;
  title: string;
  /** The executive deck pages, in order. Page 1 should be answer-first (spec §6/§17). */
  executivePages: StoryPageBlueprint[];
  /** Technical content that goes to the DOCX appendix, not the deck (spec §10). */
  appendixSections: string[];
  /** Exhibits that MUST appear or the deliverable hard-fails (spec §9/§14). */
  mandatoryExhibits: ExhibitType[];
}

export type ArchetypeKey =
  | "initiative_charter"
  | "discover_and_diagnose"
  | "target_architecture"
  | "sourcing_strategy"
  | "operating_model"
  | "roadmap"
  | "value_model"
  | "handoff";

// ── Realized story (the Story Director output) ────────────────────────────────

/** A realized executive page (spec §5 StoryPage). */
export interface StoryPage {
  pageNo: number;
  /** A conclusion, not a topic. Filled from the model where available, else the headlineIntent slot. */
  headline: string;
  roleInStory: RoleInStory;
  exhibitType: ExhibitType;
  /** Evidence citation numbers (into the model's bundle) this page rests on. */
  supportingEvidence: number[];
  /** The "so what" of this page. */
  implication: string;
  /** Why this page matters to the decision. */
  decisionRelevance: string;
  sourceFromModel: ModelSource;
  /** True when the headline is a model-derived conclusion; false when it is still the intent slot. */
  headlineIsConclusion: boolean;
}

export interface Story {
  moveId: string;
  archetypeKey: ArchetypeKey;
  governingQuestion: string;
  answerFirstRecommendation: string;
  pages: StoryPage[];
  appendixSections: string[];
  /** The ordered set of exhibits the Visual Director must produce (the exhibit plan, spec §5). */
  exhibitPlan: ExhibitType[];
}

export interface StoryValidationIssue {
  code:
    | "unknown_archetype"
    | "missing_mandatory_exhibit"
    | "page_without_model_binding"
    | "no_decision_page"
    | "no_answer_first_in_first_two_pages"
    | "topic_headline";
  severity: "error" | "warning";
  detail: string;
}
