export type AssessmentRequirement =
  | "required"
  | "recommended"
  | "light_touch"
  | "triggered"
  | "not_applicable";

export type QuestionState =
  | "prefilled_confirmed"
  | "prefilled_needs_confirmation"
  | "needs_answer"
  | "insufficient_evidence"
  | "not_applicable";

export type EvidenceSourceClass =
  | "client_fact"
  | "client_metric"
  | "stakeholder_observation"
  | "external_benchmark"
  | "abarva_reference_pattern"
  | "analyst_interpretation"
  | "evidence_gap";

export type WorkbookResponseType =
  | "text"
  | "yes_no_partial"
  | "number"
  | "date"
  | "select";

export interface AssessmentDimensionPlan {
  moveId: string;
  phase: number;
  nextPhase: number;
  archetype: string;
  dimensions: AssessmentDimensionPlanEntry[];
}

export interface AssessmentDimensionPlanEntry {
  dimensionId: string;
  label: string;
  requirement: AssessmentRequirement;
  rationale: string;
  requiredEvidenceFamilies: string[];
  source: "contract" | "archetype" | "industry" | "regulatory_trigger";
  status: QuestionState;
  evidenceSourceClass: EvidenceSourceClass;
}

export interface StageReadinessWorkbookQuestion {
  questionId: string;
  dimensionId: string;
  question: string;
  whyItMatters: string;
  responseType: WorkbookResponseType;
  suggestedEvidence: string[];
  likelyOwnerRole: string;
  required: boolean;
  state: QuestionState;
  prefilledResponse: string | null;
  evidenceRefs: string[];
  sourceClass: EvidenceSourceClass;
}

export interface StageReadinessWorkbookTab {
  tabId: string;
  title: string;
  requirementSummary: string;
  questions: StageReadinessWorkbookQuestion[];
}

export interface StageReadinessWorkbookOpenItem {
  questionId: string;
  dimensionId: string;
  title: string;
  owner: string;
  status: QuestionState;
  nextAction: string;
  blocksNextPhase: boolean;
}

export interface StageReadinessWorkbookSpec {
  workbookId: string;
  workbookVersion: string;
  contractVersion: string;
  moveId: string;
  moveName: string;
  phase: number;
  nextPhase: number;
  artifactName: string;
  archetype: string;
  generatedAt: string;
  dimensionPlan: AssessmentDimensionPlan;
  startHere: {
    purpose: string;
    alreadyPrefilled: number;
    needsInput: number;
    requiredAreas: number;
    recommendedAreas: number;
    suggestedSessions: Array<{
      session: string;
      participants: string;
      tabs: string[];
      typicalTime: string;
    }>;
  };
  tabs: StageReadinessWorkbookTab[];
  evidenceAndOpenItems: StageReadinessWorkbookOpenItem[];
  metadata: {
    workbookContentHash: string;
    artifactVersion?: string;
    dimensionPlanVersion: string;
    source: "deterministic_stage_readiness_resolver";
  };
}
