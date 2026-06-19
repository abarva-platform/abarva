// The 8 archetype narrative blueprints — spec §9, founder-confirmed authoritative (2026-06-19).
//
// Each blueprint is the answer-first page sequence + mandatory exhibits for a deliverable family.
// Page headlines here are INTENTS (what conclusion the page must land); the LLM authoring pass
// turns them into conclusion headlines (spec §6). Note: spec §9 has the Initiative Charter open
// problem-first, which is in tension with spec §6/§17 (recommendation within 2 pages) — we keep
// §9's sequence as authoritative and surface the tension as a validateStory WARNING rather than
// silently reordering the founder-confirmed blueprint.

import type { ArchetypeBlueprint, ArchetypeKey, StoryPageBlueprint } from "./types";

const p = (
  roleInStory: StoryPageBlueprint["roleInStory"],
  headlineIntent: string,
  exhibitType: StoryPageBlueprint["exhibitType"],
  sourceFromModel: StoryPageBlueprint["sourceFromModel"],
): StoryPageBlueprint => ({ roleInStory, headlineIntent, exhibitType, sourceFromModel });

const INITIATIVE_CHARTER: ArchetypeBlueprint = {
  archetypeKey: "initiative_charter",
  title: "Initiative Charter",
  executivePages: [
    p("problem", "Name the problem and the decision being requested up front.", "KeyMessageCard", "governingDecision"),
    p("urgency", "Why now — the cost of inaction.", "ConstraintStack", "claims"),
    p("value_at_stake", "Quantify the value at stake.", "ValueBridge", "valueModel"),
    p("sponsor_commitment", "The sponsor and governance committed to this move.", "RACIMap", "operatingModel"),
    p("decision", "The explicit decision and approval requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: [],
  mandatoryExhibits: ["ValueBridge", "DecisionScorecard"],
};

const DISCOVER_AND_DIAGNOSE: ArchetypeBlueprint = {
  archetypeKey: "discover_and_diagnose",
  title: "Discover & Diagnose",
  executivePages: [
    p("executive_finding", "The single most important finding, stated first.", "KeyMessageCard", "answerFirstRecommendation"),
    p("problem_magnitude", "How big the problem is, quantified.", "CapabilityHeatmap", "claims"),
    p("issue_tree", "Decompose the problem into a MECE issue tree.", "IssueTree", "claims"),
    p("root_causes", "The root causes behind the symptoms.", "RootCauseTree", "claims"),
    p("evidence_confidence", "How confident the evidence is, with gaps named.", "EvidenceMatrix", "evidenceBundle"),
    p("recommendation", "What to do about it.", "DecisionScorecard", "answerFirstRecommendation"),
    p("decision", "The gate decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Evidence detail", "Diagnostic method"],
  mandatoryExhibits: ["IssueTree", "RootCauseTree", "CapabilityHeatmap", "EvidenceMatrix"],
};

const TARGET_ARCHITECTURE: ArchetypeBlueprint = {
  archetypeKey: "target_architecture",
  title: "Target State Architecture",
  executivePages: [
    p("recommendation", "The recommended target architecture, stated first.", "DecisionScorecard", "answerFirstRecommendation"),
    p("constraints", "The constraint stack the architecture must satisfy.", "ConstraintStack", "claims"),
    p("target_state", "The target architecture on a page.", "ArchitectureOnPage", "architectureModel"),
    p("workflow", "How humans and AI share the workflow, with checkpoints.", "WorkflowSwimlane", "architectureModel"),
    p("integration", "The integration landscape and its gaps.", "IntegrationLandscape", "architectureModel"),
    p("governance", "The governance and control model overlaid on the architecture.", "ControlOverlay", "architectureModel"),
    p("alternatives", "The architecture alternatives and why this one wins.", "TradeoffMatrix", "requiredDecisions"),
    p("migration", "The migration path and transition posture.", "TransformationRoadmap", "dependencies"),
    p("decision", "The architecture decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: [
    "Conceptual View",
    "Logical View",
    "Physical View",
    "Architecture Decision Record",
    "Security",
    "Integration Contracts",
    "Non-Functional Requirements",
  ],
  mandatoryExhibits: ["ArchitectureOnPage", "WorkflowSwimlane", "IntegrationLandscape", "ControlOverlay", "TradeoffMatrix"],
};

const SOURCING_STRATEGY: ArchetypeBlueprint = {
  archetypeKey: "sourcing_strategy",
  title: "Sourcing Strategy",
  executivePages: [
    p("recommendation", "The recommended sourcing posture, stated first.", "DecisionScorecard", "answerFirstRecommendation"),
    p("market_landscape", "The market landscape and where leverage sits.", "CapabilityHeatmap", "claims"),
    p("capability_decomposition", "Capabilities decomposed into build/buy/partner units.", "CapabilityHeatmap", "claims"),
    p("option_matrix", "The sourcing options scored against weighted criteria.", "OptionMatrix", "requiredDecisions"),
    p("alternatives", "The decision rationale and the tradeoffs taken.", "TradeoffMatrix", "requiredDecisions"),
    p("vendor_evaluation", "How the vendors evaluate against the criteria.", "DecisionScorecard", "claims"),
    p("decision", "The sourcing decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Vendor detail", "Evaluation method"],
  mandatoryExhibits: ["OptionMatrix", "CapabilityHeatmap", "DecisionScorecard"],
};

const OPERATING_MODEL: ArchetypeBlueprint = {
  archetypeKey: "operating_model",
  title: "Operating Model",
  executivePages: [
    p("recommendation", "The recommended operating model, stated first.", "DecisionScorecard", "answerFirstRecommendation"),
    p("target_org", "The target organization shape.", "OperatingModel", "operatingModel"),
    p("governance", "The governance forums and their mandates.", "GovernanceStructure", "operatingModel"),
    p("decision_rights", "Where decision rights sit (human and agent).", "RACIMap", "operatingModel"),
    p("raci", "The RACI across the key decisions.", "RACIMap", "operatingModel"),
    p("role_transitions", "How roles transition to the target.", "OperatingModel", "operatingModel"),
    p("decision", "The operating-model decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Role detail", "Transition plan"],
  mandatoryExhibits: ["RACIMap", "OperatingModel", "GovernanceStructure"],
};

const ROADMAP: ArchetypeBlueprint = {
  archetypeKey: "roadmap",
  title: "Execution Roadmap",
  executivePages: [
    p("recommendation", "The recommended sequence, stated first.", "DecisionScorecard", "answerFirstRecommendation"),
    p("journey", "The transformation journey across phases.", "TransformationRoadmap", "valueModel"),
    p("dependencies", "The dependency map across workstreams.", "DependencyGraph", "dependencies"),
    p("critical_path", "The critical path and where slippage hurts.", "TransformationRoadmap", "dependencies"),
    p("value_realization", "When value lands across the timeline.", "ValueTimeline", "valueModel"),
    p("decision", "The roadmap decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Work package detail", "Estimate basis"],
  mandatoryExhibits: ["TransformationRoadmap", "DependencyGraph", "ValueTimeline"],
};

const VALUE_MODEL: ArchetypeBlueprint = {
  archetypeKey: "value_model",
  title: "Value Model / Business Case",
  executivePages: [
    p("value_thesis", "The value thesis, stated first.", "KeyMessageCard", "valueModel"),
    p("value_tree", "The value decomposed into a value tree.", "ValueTree", "valueModel"),
    // The Workforce Economics estimate-twice convergence renders here (ValueWaterfall / ValueBridge).
    p("benefit_decomposition", "Benefits gross-to-net, Traditional vs AI-Native.", "ValueWaterfall", "valueModel"),
    p("measurement", "How the value is measured and owned.", "MeasurementArchitecture", "valueModel"),
    p("finance_attestation", "The finance attestation model.", "MeasurementArchitecture", "operatingModel"),
    p("decision", "The investment decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Estimate detail", "Assumption register", "Sensitivity"],
  mandatoryExhibits: ["ValueTree", "ValueWaterfall", "MeasurementArchitecture"],
};

const HANDOFF: ArchetypeBlueprint = {
  archetypeKey: "handoff",
  title: "Handoff Package",
  executivePages: [
    p("recommendation", "The transition recommendation, stated first.", "DecisionScorecard", "answerFirstRecommendation"),
    p("readiness", "Readiness status across the dimensions.", "ReadinessDashboard", "claims"),
    p("ownership_transfer", "Who owns what after handoff.", "OwnershipMap", "operatingModel"),
    p("open_decisions", "The decisions still open before go-live.", "DecisionScorecard", "openQuestions"),
    p("decision", "The transition decision requested.", "DecisionScorecard", "requiredDecisions"),
  ],
  appendixSections: ["Runbook", "Open action log"],
  mandatoryExhibits: ["ReadinessDashboard", "OwnershipMap"],
};

export const ARCHETYPE_BLUEPRINTS: Record<ArchetypeKey, ArchetypeBlueprint> = {
  initiative_charter: INITIATIVE_CHARTER,
  discover_and_diagnose: DISCOVER_AND_DIAGNOSE,
  target_architecture: TARGET_ARCHITECTURE,
  sourcing_strategy: SOURCING_STRATEGY,
  operating_model: OPERATING_MODEL,
  roadmap: ROADMAP,
  value_model: VALUE_MODEL,
  handoff: HANDOFF,
};

/** Map a deliverable-registry key (PHASE_CANONICAL_KEYS) to its narrative archetype. */
const REGISTRY_TO_ARCHETYPE: Readonly<Record<string, ArchetypeKey>> = {
  charter: "initiative_charter",
  discovery_report: "discover_and_diagnose",
  root_cause_worksheet: "discover_and_diagnose",
  target_state_architecture: "target_architecture",
  solution_design: "target_architecture",
  sourcing_strategy: "sourcing_strategy",
  operating_model_design: "operating_model",
  execution_roadmap: "roadmap",
  business_case: "value_model",
  financial_model: "value_model",
  tower_metrics_plan: "value_model",
  value_measurement_contract: "value_model",
  handoff_package: "handoff",
};

export function archetypeForDeliverableKey(registryKey: string): ArchetypeKey | undefined {
  return REGISTRY_TO_ARCHETYPE[registryKey];
}

/**
 * Map an ORCHESTRATOR deliverable type (the brief's `deliverableType`, e.g. 'target_architecture',
 * 'estimate_model') to its narrative archetype — distinct from the registry keys above (which are
 * the PHASE_CANONICAL_KEYS). Used by the live bridge from a generated RenderableDeliverable.
 */
const ORCHESTRATOR_TYPE_TO_ARCHETYPE: Readonly<Record<string, ArchetypeKey>> = {
  charter: "initiative_charter",
  discovery_report: "discover_and_diagnose",
  target_architecture: "target_architecture",
  operating_model: "operating_model",
  sourcing_strategy: "sourcing_strategy",
  roadmap: "roadmap",
  business_case: "value_model",
  estimate_model: "value_model",
  value_model: "value_model",
  handoff_pack: "handoff",
};

export function archetypeForOrchestratorType(orchestratorType: string): ArchetypeKey | undefined {
  return (
    ORCHESTRATOR_TYPE_TO_ARCHETYPE[orchestratorType] ??
    REGISTRY_TO_ARCHETYPE[orchestratorType]
  );
}

export function getArchetypeBlueprint(key: ArchetypeKey): ArchetypeBlueprint | undefined {
  return ARCHETYPE_BLUEPRINTS[key];
}
