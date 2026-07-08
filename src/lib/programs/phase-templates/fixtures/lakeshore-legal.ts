// Moves — Lakeshore Legal Contract Intake demo fixture.
// Deterministic demo data for the phase-template + upload-mapping slice. Real
// facts (baselines) live here; Claude assembles patterns from them, never invents.

import type { BuildingBlockKey } from '../building-blocks';
import { classifyUpload } from '../classification';
import type {
  MovePhaseCode,
  MoveTemplateUploadClassification,
  P3DesignInputsPack,
  P4WorkstreamInputsPack,
  PatternAssemblyPacket,
} from '../types';

export type AssessmentStatus =
  | 'evidence_backed'
  | 'partial'
  | 'missing'
  | 'needs_confirmation'
  | 'accepted';

export interface CurrentStateAssessmentRow {
  dimension: string;
  status: AssessmentStatus;
  note: string;
  block: BuildingBlockKey;
}

export interface SolutionOption {
  id: string;
  label: string;
  description: string;
  recommended: boolean;
}

export interface WorkstreamPreviewRow {
  block: BuildingBlockKey;
  workstream: string;
  owner: string;
  dependency: string;
  risk: string;
  metric: string;
}

export const LAKESHORE_LEGAL_MOVE = {
  moveId: 'lakeshore-legal-contract-intake',
  moveName: 'Legal Contract Intake and Obligation Control',
  industry: 'Diversified holding company / shared services',
  function: 'Legal Operations',
  selectedBuildingBlocks: [
    'process_redesign',
    'data_readiness',
    'workflow_automation',
    'human_in_loop_agent',
    'controls_governance_risk',
    'value_tracking_operating_cadence',
  ] as BuildingBlockKey[],
  optionalBuildingBlocks: [
    'analytics_intelligence_layer',
    'system_platform_implementation',
    'knowledge_retrieval_copilot',
  ] as BuildingBlockKey[],
  notRecommendedYet: [
    {
      what: 'Fully autonomous contract review',
      reason: 'Legal/control readiness does not support autonomous legal decisions.',
    },
    {
      what: 'Auto-approval of non-standard terms',
      reason: 'Attorneys must own judgment on non-standard, indemnity, and termination terms.',
    },
  ],
};

// P2 — current-state assessment map (dimensions, not just files).
export const LAKESHORE_P2_ASSESSMENT: CurrentStateAssessmentRow[] = [
  { dimension: 'Process', status: 'evidence_backed', note: 'Intake, triage, routing, and approval pain points found.', block: 'process_redesign' },
  { dimension: 'Systems', status: 'partial', note: 'CLM, email, and spreadsheets identified; system of record needs confirmation.', block: 'system_platform_implementation' },
  { dimension: 'Data', status: 'missing', note: '81.5% of requests missing a required field; obligation ownership unreliable.', block: 'data_readiness' },
  { dimension: 'People / skills', status: 'partial', note: 'Legal Ops stitches work manually across systems.', block: 'process_redesign' },
  { dimension: 'Controls', status: 'partial', note: 'Non-standard terms require attorney approval; thresholds need confirmation.', block: 'controls_governance_risk' },
  { dimension: 'Business appetite for change', status: 'needs_confirmation', note: 'Phase one should minimize workflow disruption.', block: 'process_redesign' },
  { dimension: 'Baseline metrics', status: 'evidence_backed', note: 'Avg cycle time 31.6 days (P90 52); 320 obligation gaps; 360 policy exceptions.', block: 'value_tracking_operating_cadence' },
  { dimension: 'Root causes', status: 'evidence_backed', note: 'Incomplete intake and inconsistent triage — not attorney capacity.', block: 'process_redesign' },
  { dimension: 'Open questions', status: 'needs_confirmation', note: 'System of record; approval thresholds; data owner.', block: 'data_readiness' },
];

// P3 — options before architecture.
export const LAKESHORE_P3_OPTIONS: SolutionOption[] = [
  { id: 'A', label: 'Process-first intake cleanup', description: 'Standardize intake and triage; no embedded AI in phase one.', recommended: false },
  { id: 'B', label: 'CLM-embedded assisted triage and obligation extraction', description: 'AI assists completeness, triage, and obligation extraction inside the CLM; attorney approves.', recommended: true },
  { id: 'C', label: 'New cross-system legal workflow orchestration layer', description: 'A new orchestration layer across CLM, mailbox, and adjacent systems.', recommended: false },
];

export const LAKESHORE_P3_RECOMMENDATION = {
  recommendedOptionId: 'B',
  reason: 'Balances speed, adoption, control, and measurable value for phase one.',
  notRecommendedYet: 'Fully autonomous contract review or auto-approval of non-standard terms — legal/control readiness does not support autonomous decisions.',
};

// P4 — lanes become workstreams.
export const LAKESHORE_P4_WORKSTREAMS: WorkstreamPreviewRow[] = [
  { block: 'process_redesign', workstream: 'Intake process redesign', owner: 'Legal Operations Lead', dependency: 'Confirmed current-state', risk: 'Requestor adoption', metric: 'Intake completeness' },
  { block: 'data_readiness', workstream: 'Metadata and obligation remediation', owner: 'Data owner', dependency: 'Source-of-truth confirmed', risk: 'Data quality', metric: 'Obligation-owner coverage' },
  { block: 'workflow_automation', workstream: 'CLM routing and status configuration', owner: 'IT / CLM owner', dependency: 'CLM access', risk: 'Integration', metric: 'SLA compliance' },
  { block: 'human_in_loop_agent', workstream: 'AI-assisted triage implementation', owner: 'Legal Operations Lead', dependency: 'Approval checkpoints defined', risk: 'Over-trust of AI', metric: 'Override rate' },
  { block: 'controls_governance_risk', workstream: 'Approval and audit controls', owner: 'Legal / compliance reviewer', dependency: 'Control boundaries', risk: 'Privilege leakage', metric: 'Approval compliance' },
  { block: 'value_tracking_operating_cadence', workstream: 'Tower measurement setup', owner: 'Finance / value owner', dependency: 'Baselines', risk: 'Overclaiming hard savings', metric: 'Realized value' },
];

// A completed P3 Solution Approach Decision Summary, run through the classifier.
export const LAKESHORE_P3_DECISION_UPLOAD: MoveTemplateUploadClassification = classifyUpload({
  uploadId: 'upload-p3-decision-summary',
  moveId: LAKESHORE_LEGAL_MOVE.moveId,
  phase: 'P3' as MovePhaseCode,
  uploadCategory: 'review_summary',
  inferredTemplateId: 'p3_solution_approach_decision_summary',
  confidence: 'high',
  parsedOutputs: [
    { type: 'selected_approach', statement: 'Selected Option B — CLM-embedded assisted triage and obligation extraction.', mappedBlocks: ['ai_assisted_decision_support', 'workflow_automation'], confidence: 'high' },
    { type: 'solution_option', statement: 'Deferred: Option A (process-only) and Option C (orchestration layer).', mappedBlocks: ['ai_assisted_decision_support'], confidence: 'high' },
    { type: 'control_requirement', statement: 'Attorney approval required for non-standard terms; privilege fence.', mappedBlocks: ['controls_governance_risk'], confidence: 'high' },
    { type: 'human_ai_split', statement: 'AI suggests risk tier and missing info; attorney approves.', mappedBlocks: ['human_in_loop_agent'], confidence: 'high' },
  ],
});

// Next-phase Inputs Packs.
export const LAKESHORE_P3_DESIGN_INPUTS_PACK: P3DesignInputsPack = {
  moveId: LAKESHORE_LEGAL_MOVE.moveId,
  currentWorkflowWithPainPoints: ['Manual triage', 'No routing rules', 'Obligations unowned'],
  requiredFieldContract: ['Contract type', 'Counterparty', 'Effective/renewal dates', 'Obligation owner'],
  humanApprovalCheckpoints: ['Attorney confirms extracted obligations', 'Attorney approves non-standard terms'],
  controlBoundaries: ['Privilege fence', 'Approval matrix', 'Audit trail'],
  towerMetricCandidates: ['Cycle time', 'Intake completeness', 'Aged queue', 'Obligation capture'],
  openQuestionsForSolutionDesign: ['System of record', 'Approval thresholds', 'Data owner'],
};

export const LAKESHORE_P4_WORKSTREAM_INPUTS_PACK: P4WorkstreamInputsPack = {
  moveId: LAKESHORE_LEGAL_MOVE.moveId,
  selectedSolutionApproach: 'CLM-embedded assisted triage and obligation extraction (Option B)',
  deferredOptions: ['Process-only cleanup (A)', 'Cross-system orchestration layer (C)'],
  architectureConstraints: ['Embed in existing CLM', 'No new platform in phase one', 'Preserve privilege/privacy'],
  workstreamCandidates: LAKESHORE_P4_WORKSTREAMS.map((w) => ({ block: w.block, workstream: w.workstream })),
  controlRequirements: ['Attorney approval', 'Audit trail', 'Human confirmation of extracted obligations'],
  valueAssumptionsToValidate: ['8–12% cycle-time improvement is directional until finance attests'],
};

// The governed Pattern Assembly Packet AbarVa builds before calling Claude (P2).
export const LAKESHORE_P2_PACKET: PatternAssemblyPacket = {
  moveId: LAKESHORE_LEGAL_MOVE.moveId,
  moveName: LAKESHORE_LEGAL_MOVE.moveName,
  industry: LAKESHORE_LEGAL_MOVE.industry,
  function: LAKESHORE_LEGAL_MOVE.function,
  phase: 'P2',
  approvedPriorFindings: ['P0/P1: sponsor identified; evidence family selected'],
  currentUploadedEvidence: ['Contract request log', 'Cycle-time baseline', 'Obligation register'],
  selectedBuildingBlocks: LAKESHORE_LEGAL_MOVE.selectedBuildingBlocks,
  readiness: { data: 'medium-low', control: 'medium', evaluation: 'low' },
  readinessGaps: ['Data completeness', 'Approval thresholds undocumented', 'No obligation owner'],
  controlConstraints: ['No autonomous legal approval', 'Attorney approval for non-standard terms', 'Privilege & privacy preserved'],
  valueProofLevel: 'directional',
  missingInputs: ['System-of-record confirmation', 'Data owner'],
  requiredOutputs: ['Current-state diagnosis', 'Root-cause candidates', 'Evidence gaps', 'P3 design inputs'],
};

export const LAKESHORE_LEGAL_DEMO_FIXTURE = {
  move: LAKESHORE_LEGAL_MOVE,
  p2Assessment: LAKESHORE_P2_ASSESSMENT,
  p3Options: LAKESHORE_P3_OPTIONS,
  p3Recommendation: LAKESHORE_P3_RECOMMENDATION,
  p4Workstreams: LAKESHORE_P4_WORKSTREAMS,
  p3DecisionUpload: LAKESHORE_P3_DECISION_UPLOAD,
  p3DesignInputsPack: LAKESHORE_P3_DESIGN_INPUTS_PACK,
  p4WorkstreamInputsPack: LAKESHORE_P4_WORKSTREAM_INPUTS_PACK,
  p2PatternAssemblyPacket: LAKESHORE_P2_PACKET,
};
