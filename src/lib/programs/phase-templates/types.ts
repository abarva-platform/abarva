// Moves — typed phase-template + upload-mapping model.
// Real, typed intelligence — NOT loose UI-only mock data. Mirrors the shape of
// src/lib/source/analytics/types.ts. See docs/build/moves-design/*.

import type { BuildingBlockKey } from './building-blocks';

/** Client-facing phase codes and labels. Never expose internal terms. */
export type MovePhaseCode = 'P2' | 'P3' | 'P4' | 'P5' | 'TOWER';

export const PHASE_LABELS: Record<MovePhaseCode, string> = {
  P2: 'Understand Current State',
  P3: 'Choose the Approach',
  P4: 'Build the Plan',
  P5: 'Prepare to Execute',
  TOWER: 'Track Outcomes',
};

export type FileFormat = 'DOCX' | 'XLSX';

export type SessionType =
  | 'interview'
  | 'workshop'
  | 'working_session'
  | 'sme_review'
  | 'decision_review'
  | 'final_review';

/** A parsed output a template produces once completed and uploaded. */
export type ParsedOutputType =
  | 'current_state_finding'
  | 'process_map'
  | 'systems_inventory'
  | 'data_gap'
  | 'root_cause'
  | 'baseline_metric'
  | 'change_appetite'
  | 'control_requirement'
  | 'solution_option'
  | 'tradeoff'
  | 'selected_approach'
  | 'human_ai_split'
  | 'architecture_constraint'
  | 'workstream'
  | 'value_assumption'
  | 'risk'
  | 'tower_metric'
  | 'owner_assignment'
  | 'launch_readiness_item'
  | 'measurement_contract_term';

/** A required or optional section of a template. */
export interface TemplateSection {
  section: string;
  /** Which building-block lane(s) this section feeds. */
  mappedBlocks: BuildingBlockKey[];
  parsedOutputs: ParsedOutputType[];
}

/** One template definition in the governed catalog. */
export interface MovePhaseTemplateDefinition {
  templateId: string;
  phase: MovePhaseCode;
  label: string;
  clientPurpose: string;
  recommendedAudience: string[];
  recommendedSessionType: SessionType;
  fileFormat: FileFormat;
  supportedBuildingBlocks: BuildingBlockKey[];
  requiredSections: TemplateSection[];
  optionalSections: TemplateSection[];
  /** Convenience: which parsed output types this template can produce. */
  parsedOutputTypes: ParsedOutputType[];
  /** Which next-phase Inputs Pack items this template contributes to. */
  nextPhaseInputsCreated: string[];
  sampleQuestions: string[];
  /** Worked examples by use case (always Lakeshore Legal; healthcare where relevant). */
  examplesByUseCase: Partial<Record<'lakeshore_legal' | 'healthcare_provider', string>>;
}

/** How a completed upload is categorized. */
export type UploadCategory =
  | 'raw_evidence'
  | 'interview_output'
  | 'workshop_output'
  | 'review_summary'
  | 'final_artifact';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** A single parsed output produced from an upload. */
export interface ParsedUploadOutput {
  type: ParsedOutputType;
  statement: string;
  mappedBlocks: BuildingBlockKey[];
  confidence: ConfidenceLevel;
}

/** The result of classifying an uploaded template / workshop output / final doc. */
export interface MoveTemplateUploadClassification {
  uploadId: string;
  moveId: string;
  phase: MovePhaseCode;
  inferredTemplateId: string | null;
  confidence: ConfidenceLevel;
  uploadCategory: UploadCategory;
  supportedBuildingBlocks: BuildingBlockKey[];
  parsedOutputs: ParsedUploadOutput[];
  /** Findings updated in the CURRENT phase intelligence. */
  currentPhaseFindingsUpdated: string[];
  /** Inputs prepared for the NEXT phase. */
  nextPhaseInputsUpdated: string[];
  isClientFinal: boolean;
  /** Uploads are Move-scoped by default. */
  moveScopedOnly: boolean;
  /** Promotion to enterprise context is a future/optional state, never automatic. */
  enterprisePromotionEligibility: 'not_eligible' | 'eligible_pending_review';
  needsHumanReview: boolean;
  /** Plain-English "AbarVa mapped this to…" summary for the UI. */
  clientFacingSummary: {
    whatWeFound: string;
    mappedTo: string;
    usedFor: string;
    nextStepPrepared: string;
    enterpriseContextNote: string;
  };
}

// ---- Next-phase Inputs Packs (the feed-forward the spine carries) ----

export interface P3DesignInputsPack {
  moveId: string;
  currentWorkflowWithPainPoints: string[];
  requiredFieldContract: string[];
  humanApprovalCheckpoints: string[];
  controlBoundaries: string[];
  towerMetricCandidates: string[];
  openQuestionsForSolutionDesign: string[];
}

export interface P4WorkstreamInputsPack {
  moveId: string;
  selectedSolutionApproach: string;
  deferredOptions: string[];
  architectureConstraints: string[];
  workstreamCandidates: Array<{ block: BuildingBlockKey; workstream: string }>;
  controlRequirements: string[];
  valueAssumptionsToValidate: string[];
}

export interface P5MobilizationInputsPack {
  moveId: string;
  workstreams: string[];
  owners: Array<{ workstream: string; owner: string }>;
  dependencies: string[];
  fundingAssumptions: string[];
  risks: string[];
  towerMetrics: string[];
  launchReadinessItems: string[];
}

export interface TowerMeasurementInputsPack {
  moveId: string;
  measurementContract: string[];
  metricOwners: Array<{ metric: string; owner: string }>;
  reviewCadence: string;
  escalationThresholds: string[];
  adoptionTracking: string[];
}

// ---- Dynamic Solution Pattern Assembly (governed loop) ----

export type ReadinessDimension = 'data' | 'control' | 'evaluation';
export type ReadinessLevel = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';

/** AbarVa builds this BEFORE calling Claude. Claude assembles the pattern; AbarVa validates. */
export interface PatternAssemblyPacket {
  moveId: string;
  moveName: string;
  industry: string;
  function: string;
  phase: MovePhaseCode;
  approvedPriorFindings: string[];
  currentUploadedEvidence: string[];
  selectedBuildingBlocks: BuildingBlockKey[];
  readiness: Record<ReadinessDimension, ReadinessLevel>;
  readinessGaps: string[];
  controlConstraints: string[];
  valueProofLevel: 'directional' | 'candidate' | 'committed' | 'realized';
  missingInputs: string[];
  requiredOutputs: string[];
}

/** How AbarVa labels each piece of Claude's assembled response. */
export type ValidationLabel =
  | 'evidence_backed'
  | 'assumption'
  | 'needs_confirmation'
  | 'not_allowed'
  | 'draft_artifact'
  | 'promote_candidate';

export interface ValidatedPatternItem {
  statement: string;
  label: ValidationLabel;
  reason?: string;
}
