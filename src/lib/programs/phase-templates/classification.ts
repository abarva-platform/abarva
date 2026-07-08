// Moves — deterministic upload classification + section→lane mapping.
// Maps a completed template / workshop output / final reviewed doc into
// Move-scoped intelligence. Move-scoped by default; NEVER auto-promotes to
// enterprise context.

import type { BuildingBlockKey } from './building-blocks';
import { buildingBlockLabel } from './building-blocks';
import { TEMPLATE_BY_ID } from './catalog';
import { PHASE_LABELS } from './types';
import type {
  ConfidenceLevel,
  MovePhaseCode,
  MoveTemplateUploadClassification,
  ParsedUploadOutput,
  UploadCategory,
} from './types';

const NEXT_PHASE: Partial<Record<MovePhaseCode, MovePhaseCode>> = {
  P2: 'P3',
  P3: 'P4',
  P4: 'P5',
  P5: 'TOWER',
};

/** Client-friendly label for a next-phase inputs-pack field. */
const INPUT_LABELS: Record<string, string> = {
  currentWorkflowWithPainPoints: 'Current workflow with pain points',
  requiredFieldContract: 'Required-field contract',
  humanApprovalCheckpoints: 'Human approval checkpoints',
  controlBoundaries: 'Control boundaries',
  towerMetricCandidates: 'Tower metric candidates',
  openQuestionsForSolutionDesign: 'Open questions for solution design',
  selectedSolutionApproach: 'Selected solution approach',
  deferredOptions: 'Deferred options',
  architectureConstraints: 'Architecture constraints',
  workstreamCandidates: 'Workstream candidates',
  controlRequirements: 'Control requirements',
  valueAssumptionsToValidate: 'Value assumptions to validate',
  workstreams: 'Workstreams',
  dependencies: 'Dependencies',
  fundingAssumptions: 'Funding assumptions',
  risks: 'Risks',
  towerMetrics: 'Tower metrics',
  launchReadinessItems: 'Launch readiness items',
  measurementContract: 'Measurement contract',
  metricOwners: 'Metric owners',
  reviewCadence: 'Review cadence',
  escalationThresholds: 'Escalation thresholds',
  adoptionTracking: 'Adoption tracking',
};

function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

export interface ClassifyUploadInput {
  uploadId: string;
  moveId: string;
  phase: MovePhaseCode;
  uploadCategory: UploadCategory;
  /** The template AbarVa believes this upload corresponds to (if known). */
  inferredTemplateId?: string | null;
  /** Confidence of the template inference. */
  confidence?: ConfidenceLevel;
  /** Parsed outputs, if the parser already extracted them; otherwise derived from the template. */
  parsedOutputs?: ParsedUploadOutput[];
}

/**
 * Classify a completed upload into Move-scoped intelligence: what was found,
 * which lanes it maps to, what current-phase findings it updates, and which
 * next-phase inputs it prepares.
 */
export function classifyUpload(input: ClassifyUploadInput): MoveTemplateUploadClassification {
  const tmpl = input.inferredTemplateId ? TEMPLATE_BY_ID[input.inferredTemplateId] : undefined;

  const parsedOutputs: ParsedUploadOutput[] =
    input.parsedOutputs ??
    (tmpl
      ? tmpl.requiredSections.map((s) => ({
          type: s.parsedOutputs[0],
          statement: s.section,
          mappedBlocks: s.mappedBlocks,
          confidence: 'medium' as ConfidenceLevel,
        }))
      : []);

  const supportedBuildingBlocks: BuildingBlockKey[] = unique(
    parsedOutputs.flatMap((p) => p.mappedBlocks),
  );

  const isClientFinal =
    input.uploadCategory === 'final_artifact' || input.uploadCategory === 'review_summary';

  const currentPhaseFindingsUpdated = parsedOutputs.map((p) => p.statement);
  const nextInputKeys = tmpl?.nextPhaseInputsCreated ?? [];
  const nextPhaseInputsUpdated = nextInputKeys.map((k) => INPUT_LABELS[k] ?? k);

  const nextPhase = NEXT_PHASE[input.phase];
  const laneList = supportedBuildingBlocks.map(buildingBlockLabel).join(', ');

  return {
    uploadId: input.uploadId,
    moveId: input.moveId,
    phase: input.phase,
    inferredTemplateId: input.inferredTemplateId ?? null,
    confidence: input.confidence ?? (tmpl ? 'medium' : 'low'),
    uploadCategory: input.uploadCategory,
    supportedBuildingBlocks,
    parsedOutputs,
    currentPhaseFindingsUpdated,
    nextPhaseInputsUpdated,
    isClientFinal,
    // Governance: Move-scoped by default; promotion is never automatic.
    moveScopedOnly: true,
    enterprisePromotionEligibility: 'not_eligible',
    needsHumanReview: !isClientFinal || input.confidence === 'low',
    clientFacingSummary: {
      whatWeFound:
        parsedOutputs[0]?.statement ??
        `Completed ${tmpl?.label ?? 'upload'} for ${PHASE_LABELS[input.phase]}.`,
      mappedTo: laneList
        ? `${PHASE_LABELS[input.phase]} — solution lanes: ${laneList}.`
        : `${PHASE_LABELS[input.phase]} intelligence.`,
      usedFor: nextPhase ? PHASE_LABELS[nextPhase] : 'Outcome tracking',
      nextStepPrepared: nextPhaseInputsUpdated.length
        ? nextPhaseInputsUpdated.join('; ')
        : 'No new next-phase inputs.',
      enterpriseContextNote: 'Not added to enterprise context yet.',
    },
  };
}
